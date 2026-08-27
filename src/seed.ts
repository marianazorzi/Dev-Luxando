import { conectar } from './db.js';
import { AuthService } from './services/authService.js';
import { FinanceService } from './services/financeService.js';
import type { TipoCategoria, Usuario } from './types.js';

const banco = conectar();
const auth = new AuthService(banco);
const finance = new FinanceService(banco);

function garantirUsuario(nome: string, login: string, senha: string): { usuario: Usuario; novo: boolean } {
  try {
    return { usuario: auth.registrar({ nome, login, senha }), novo: true };
  } catch {
    return { usuario: auth.obterUsuarioObrigatorio(login), novo: false };
  }
}

function garantirCategoria(usuarioId: number, nome: string, tipo: TipoCategoria) {
  try {
    finance.criarCategoria(usuarioId, nome, tipo);
  } catch {
    // categoria já existe, nada a fazer
  }
}

const { usuario: demo, novo } = garantirUsuario('Usuário Demo', 'demo', '123456');

garantirCategoria(demo.id, 'Salario', 'RECEITA');
garantirCategoria(demo.id, 'Freelance', 'RECEITA');
garantirCategoria(demo.id, 'Alimentacao', 'DESPESA');
garantirCategoria(demo.id, 'Transporte', 'DESPESA');
garantirCategoria(demo.id, 'Lazer', 'DESPESA');

if (novo) {
  finance.registrarLancamento(demo.id, 'Salario', 3500, '2026-08-05');
  finance.registrarLancamento(demo.id, 'Freelance', 800, '2026-08-12', 'Projeto extra');
  finance.registrarLancamento(demo.id, 'Alimentacao', 45.9, '2026-08-03', 'Mercado');
  finance.registrarLancamento(demo.id, 'Alimentacao', 32.5, '2026-08-15', 'Restaurante');
  finance.registrarLancamento(demo.id, 'Transporte', 120, '2026-08-01', 'Combustível');
  finance.registrarLancamento(demo.id, 'Lazer', 60, '2026-08-20', 'Cinema');
  console.log('Dados de exemplo inseridos para o usuário "demo".');
} else {
  console.log('Usuário "demo" já existia; categorias garantidas, lançamentos não duplicados.');
}

console.log('\nCredenciais de teste:');
console.log('  login: demo');
console.log('  senha: 123456');
