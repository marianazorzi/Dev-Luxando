import type { DatabaseSync } from 'node:sqlite';
import { CategoriaRepository } from '../repositories/categoriaRepository.js';
import { LancamentoRepository } from '../repositories/lancamentoRepository.js';
import type { Categoria, Lancamento, ResumoMensal, TipoCategoria } from '../types.js';

export class FinanceService {
  private categorias: CategoriaRepository;
  private lancamentos: LancamentoRepository;

  constructor(banco: DatabaseSync) {
    this.categorias = new CategoriaRepository(banco);
    this.lancamentos = new LancamentoRepository(banco);
  }

  criarCategoria(usuarioId: number, nome: string, tipo: TipoCategoria): Categoria {
    const existente = this.categorias.buscarPorNome(usuarioId, nome);
    if (existente) {
      throw new Error(`Categoria "${nome}" já cadastrada.`);
    }
    return this.categorias.criar({ usuarioId, nome, tipo });
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
