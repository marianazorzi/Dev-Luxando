import type { DatabaseSync } from 'node:sqlite';
import type { Lancamento, NovoLancamento, ResumoCategoria } from '../types.js';

function mapLancamento(row: any): Lancamento {
  return {
    id: row.LANC_CD_LANCAMENTO,
    usuarioId: row.LANC_CD_USUARIO,
    categoriaId: row.LANC_CD_CATEGORIA,
    descricao: row.LANC_DS_DESCRICAO,
    valor: row.LANC_VL_VALOR,
    data: row.LANC_DT_LANCAMENTO,
    criadoEm: row.LANC_DH_CADASTRO,
  };
}

export class LancamentoRepository {
  constructor(private banco: DatabaseSync) {}

  criar(lancamento: NovoLancamento): Lancamento {
    const stmt = this.banco.prepare(`
      INSERT INTO LANCAMENTO (LANC_CD_USUARIO, LANC_CD_CATEGORIA, LANC_DS_DESCRICAO, LANC_VL_VALOR, LANC_DT_LANCAMENTO)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      lancamento.usuarioId,
      lancamento.categoriaId,
      lancamento.descricao ?? null,
      lancamento.valor,
      lancamento.data
    );
    return this.buscarPorId(Number(info.lastInsertRowid))!;
  }

  buscarPorId(id: number): Lancamento | undefined {
    const stmt = this.banco.prepare(`SELECT * FROM LANCAMENTO WHERE LANC_CD_LANCAMENTO = ?`);
    const row = stmt.get(id);
    return row ? mapLancamento(row) : undefined;
  }

  listarPorMes(usuarioId: number, mes: string): Lancamento[] {
    const stmt = this.banco.prepare(`
      SELECT * FROM LANCAMENTO
      WHERE LANC_CD_USUARIO = ? AND substr(LANC_DT_LANCAMENTO, 1, 7) = ?
      ORDER BY LANC_DT_LANCAMENTO
    `);
    return stmt.all(usuarioId, mes).map(mapLancamento);
  }

  resumoPorCategoria(usuarioId: number, mes: string): ResumoCategoria[] {
    const stmt = this.banco.prepare(`
      SELECT CATE_NM_CATEGORIA AS categoria, CATE_TP_CATEGORIA AS tipo, SUM(LANC_VL_VALOR) AS total
      FROM LANCAMENTO
      JOIN CATEGORIA ON CATEGORIA.CATE_CD_CATEGORIA = LANCAMENTO.LANC_CD_CATEGORIA
      WHERE LANC_CD_USUARIO = ? AND substr(LANC_DT_LANCAMENTO, 1, 7) = ?
      GROUP BY CATE_NM_CATEGORIA, CATE_TP_CATEGORIA
      ORDER BY total DESC
    `);
    return stmt.all(usuarioId, mes) as unknown as ResumoCategoria[];
  }
}
