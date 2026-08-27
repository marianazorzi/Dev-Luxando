import type { DatabaseSync } from 'node:sqlite';
import { CategoriaRepository } from '../repositories/categoriaRepository.js';
import { LancamentoRepository } from '../repositories/lancamentoRepository.js';
import type { Categoria, Lancamento, ResumoMensal, TipoCategoria } from '../types.js';

function dataValida(data: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!match) {
    return false;
  }
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31;
}

export class FinanceService {
  private categorias: CategoriaRepository;
  private lancamentos: LancamentoRepository;

  constructor(banco: DatabaseSync) {
    this.categorias = new CategoriaRepository(banco);
    this.lancamentos = new LancamentoRepository(banco);
  }

  criarCategoria(usuarioId: number, nome: string, tipo: TipoCategoria): Categoria {
    const nomeNormalizado = nome.trim();
    if (!nomeNormalizado) {
      throw new Error('Nome da categoria não pode ser vazio.');
    }
    const existente = this.categorias.buscarPorNome(usuarioId, nomeNormalizado);
    if (existente) {
      throw new Error(`Categoria "${nomeNormalizado}" já cadastrada.`);
    }
    return this.categorias.criar({ usuarioId, nome: nomeNormalizado, tipo });
  }

  listarCategorias(usuarioId: number): Categoria[] {
    return this.categorias.listarPorUsuario(usuarioId);
  }

  registrarLancamento(
    usuarioId: number,
    nomeCategoria: string,
    valor: number,
    data: string,
    descricao?: string
  ): Lancamento {
    if (!Number.isFinite(valor) || valor <= 0) {
      throw new Error('Valor do lançamento deve ser um número maior que zero.');
    }
    if (!dataValida(data)) {
      throw new Error('Data inválida. Use o formato AAAA-MM-DD.');
    }
    const categoria = this.categorias.buscarPorNome(usuarioId, nomeCategoria);
    if (!categoria) {
      throw new Error(`Categoria "${nomeCategoria}" não encontrada. Cadastre-a antes de lançar.`);
    }
    return this.lancamentos.criar({ usuarioId, categoriaId: categoria.id, valor, data, descricao });
  }

  resumoMensal(usuarioId: number, mes: string): ResumoMensal {
    const porCategoria = this.lancamentos.resumoPorCategoria(usuarioId, mes);
    const totalReceitas = porCategoria.filter((c) => c.tipo === 'RECEITA').reduce((s, c) => s + c.total, 0);
    const totalDespesas = porCategoria.filter((c) => c.tipo === 'DESPESA').reduce((s, c) => s + c.total, 0);
    return {
      mes,
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      porCategoria,
    };
  }
}
