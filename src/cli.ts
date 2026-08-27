import { createInterface } from 'node:readline/promises';
import { conectar } from './db.js';
import { AuthService } from './services/authService.js';
import { FinanceService } from './services/financeService.js';
import type { TipoCategoria, Usuario } from './types.js';

const banco = conectar();
const auth = new AuthService(banco);
const finance = new FinanceService(banco);

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function perguntar(pergunta: string): Promise<string> {
  const resposta = await rl.question(pergunta);
  return resposta.trim();
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

function mesAtual(): string {
  return new Date().toISOString().slice(0, 7);
}

async function registrarUsuario(): Promise<Usuario> {
  const nome = await perguntar('Nome: ');
  const login = await perguntar('Login: ');
  const senha = await perguntar('Senha: ');
  const usuario = auth.registrar({ nome, login, senha });
  console.log(`Usuário "${usuario.nome}" cadastrado com sucesso!\n`);
  return usuario;
}

async function fazerLogin(): Promise<Usuario> {
  const login = await perguntar('Login: ');
  const senha = await perguntar('Senha: ');
  const usuario = auth.autenticar(login, senha);
  console.log(`Bem-vindo(a), ${usuario.nome}!\n`);
  return usuario;
}

async function criarCategoria(usuario: Usuario): Promise<void> {
  const nome = await perguntar('Nome da categoria: ');
  let tipoResp = '';
  while (tipoResp !== '1' && tipoResp !== '2') {
    tipoResp = await perguntar('Tipo (1-Receita / 2-Despesa): ');
  }
  const tipo: TipoCategoria = tipoResp === '1' ? 'RECEITA' : 'DESPESA';
  const categoria = finance.criarCategoria(usuario.id, nome, tipo);
  console.log(`Categoria "${categoria.nome}" (${categoria.tipo}) cadastrada.\n`);
}

async function listarCategorias(usuario: Usuario): Promise<void> {
  const categorias = finance.listarCategorias(usuario.id);
  if (categorias.length === 0) {
    console.log('Nenhuma categoria cadastrada.\n');
    return;
  }
  categorias.forEach((c) => console.log(`- ${c.nome} (${c.tipo})`));
  console.log('');
}

async function registrarLancamento(usuario: Usuario): Promise<void> {
  await listarCategorias(usuario);
  const categoria = await perguntar('Categoria: ');
  const valorTexto = await perguntar('Valor: ');
  const data = (await perguntar(`Data (AAAA-MM-DD) [${hoje()}]: `)) || hoje();
  const descricao = await perguntar('Descrição (opcional): ');
  const lancamento = finance.registrarLancamento(
    usuario.id,
    categoria,
    Number(valorTexto),
    data,
    descricao || undefined
  );
  console.log(`Lançamento #${lancamento.id} registrado: ${lancamento.valor.toFixed(2)} em ${lancamento.data}\n`);
}

async function mostrarResumo(usuario: Usuario): Promise<void> {
  const mes = (await perguntar(`Mês (AAAA-MM) [${mesAtual()}]: `)) || mesAtual();
  const resumo = finance.resumoMensal(usuario.id, mes);
  console.log(`\nResumo de ${resumo.mes}`);
  resumo.porCategoria.forEach((c) => console.log(`  ${c.tipo.padEnd(8)} ${c.categoria}: ${c.total.toFixed(2)}`));
  console.log(`Receitas: ${resumo.totalReceitas.toFixed(2)}`);
  console.log(`Despesas: ${resumo.totalDespesas.toFixed(2)}`);
  console.log(`Saldo:    ${resumo.saldo.toFixed(2)}\n`);
}

async function menuAutenticado(usuario: Usuario): Promise<void> {
  let logado = true;
  while (logado) {
    console.log(`--- Menu (${usuario.nome}) ---`);
    console.log('1. Criar categoria');
    console.log('2. Listar categorias');
    console.log('3. Registrar lançamento');
    console.log('4. Resumo mensal');
    console.log('5. Sair da conta');
    console.log('0. Encerrar programa');
    const opcao = await perguntar('Escolha uma opção: ');
    try {
      switch (opcao) {
        case '1':
          await criarCategoria(usuario);
          break;
        case '2':
          await listarCategorias(usuario);
          break;
        case '3':
          await registrarLancamento(usuario);
          break;
        case '4':
          await mostrarResumo(usuario);
          break;
        case '5':
          logado = false;
          break;
        case '0':
          rl.close();
          process.exit(0);
        default:
          console.log('Opção inválida.\n');
      }
    } catch (erro) {
      console.error(`Erro: ${(erro as Error).message}\n`);
    }
  }
}

async function menuPrincipal(): Promise<void> {
  for (;;) {
    console.log('=== Sistema de Gestão de Finanças Pessoais ===');
    const resposta = (await perguntar('Você já possui uma conta? (S/N, ou 0 para sair): ')).trim().toUpperCase();
    if (resposta === '0' || resposta === 'SAIR') {
      break;
    }
    if (resposta !== 'S' && resposta !== 'N') {
      console.log('Responda com S ou N.\n');
      continue;
    }
    try {
      const usuario = resposta === 'S' ? await fazerLogin() : await registrarUsuario();
      await menuAutenticado(usuario);
    } catch (erro) {
      console.error(`Erro: ${(erro as Error).message}\n`);
    }
  }
  rl.close();
}

menuPrincipal().catch((erro: Error) => {
  console.error(erro.message);
  rl.close();
  process.exit(1);
});
