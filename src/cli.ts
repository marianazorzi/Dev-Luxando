import { Command } from 'commander';
import { conectar } from './db.js';
import { AuthService } from './services/authService.js';
import { FinanceService } from './services/financeService.js';
import type { TipoCategoria } from './types.js';

const banco = conectar();
const auth = new AuthService(banco);
const finance = new FinanceService(banco);

const program = new Command();
program.name('financas').description('Sistema de gestão de finanças pessoais');

program
  .command('registrar')
  .requiredOption('--login <login>')
  .requiredOption('--senha <senha>')
  .requiredOption('--nome <nome>')
  .action((opts) => {
    const usuario = auth.registrar({ login: opts.login, senha: opts.senha, nome: opts.nome });
    console.log(`Usuário "${usuario.nome}" cadastrado com id ${usuario.id}.`);
  });

program
  .command('login')
  .requiredOption('--login <login>')
  .requiredOption('--senha <senha>')
  .action((opts) => {
    const usuario = auth.autenticar(opts.login, opts.senha);
    console.log(`Bem-vindo(a), ${usuario.nome}!`);
  });

const categoria = program.command('categoria');

categoria
  .command('criar')
  .requiredOption('--login <login>')
  .requiredOption('--nome <nome>')
  .requiredOption('--tipo <tipo>', 'RECEITA ou DESPESA')
  .action((opts) => {
    const usuario = auth.obterUsuarioObrigatorio(opts.login);
    const tipo = opts.tipo.toUpperCase() as TipoCategoria;
    if (tipo !== 'RECEITA' && tipo !== 'DESPESA') {
      throw new Error('Tipo deve ser RECEITA ou DESPESA.');
    }
    const cat = finance.criarCategoria(usuario.id, opts.nome, tipo);
    console.log(`Categoria "${cat.nome}" (${cat.tipo}) cadastrada.`);
  });

categoria
  .command('listar')
  .requiredOption('--login <login>')
  .action((opts) => {
    const usuario = auth.obterUsuarioObrigatorio(opts.login);
    const categorias = finance.listarCategorias(usuario.id);
    if (categorias.length === 0) {
      console.log('Nenhuma categoria cadastrada.');
    }
    categorias.forEach((c) => console.log(`- ${c.nome} (${c.tipo})`));
  });

program
  .command('lancar')
  .requiredOption('--login <login>')
  .requiredOption('--categoria <categoria>')
  .requiredOption('--valor <valor>')
  .requiredOption('--data <data>', 'formato AAAA-MM-DD')
  .option('--descricao <descricao>')
  .action((opts) => {
    const usuario = auth.obterUsuarioObrigatorio(opts.login);
    const lancamento = finance.registrarLancamento(
      usuario.id,
      opts.categoria,
      Number(opts.valor),
      opts.data,
      opts.descricao
    );
    console.log(`Lançamento #${lancamento.id} registrado: ${lancamento.valor.toFixed(2)} em ${lancamento.data}`);
  });

program
  .command('resumo')
  .requiredOption('--login <login>')
  .requiredOption('--mes <mes>', 'formato AAAA-MM')
  .action((opts) => {
    const usuario = auth.obterUsuarioObrigatorio(opts.login);
    const resumo = finance.resumoMensal(usuario.id, opts.mes);
    console.log(`Resumo de ${resumo.mes}`);
    resumo.porCategoria.forEach((c) => console.log(`  ${c.tipo.padEnd(8)} ${c.categoria}: ${c.total.toFixed(2)}`));
    console.log(`Receitas: ${resumo.totalReceitas.toFixed(2)}`);
    console.log(`Despesas: ${resumo.totalDespesas.toFixed(2)}`);
    console.log(`Saldo:    ${resumo.saldo.toFixed(2)}`);
  });

program.parseAsync(process.argv).catch((erro: Error) => {
  console.error(erro.message);
  process.exit(1);
});
