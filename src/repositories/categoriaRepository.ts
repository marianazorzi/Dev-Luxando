import type { DatabaseSync } from 'node:sqlite';
import type { Categoria, NovaCategoria, TipoCategoria } from '../types.js';

function mapCategoria(row: any): Categoria {
  return {
    id: row.CATE_CD_CATEGORIA,
    usuarioId: row.CATE_CD_USUARIO,
    nome: row.CATE_NM_CATEGORIA,
    tipo: row.CATE_TP_CATEGORIA as TipoCategoria,
  };
}

export class CategoriaRepository {
  constructor(private banco: DatabaseSync) {}

  criar(categoria: NovaCategoria): Categoria {
    const stmt = this.banco.prepare(`
      INSERT INTO CATEGORIA (CATE_CD_USUARIO, CATE_NM_CATEGORIA, CATE_TP_CATEGORIA)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(categoria.usuarioId, categoria.nome, categoria.tipo);
    return this.buscarPorId(Number(info.lastInsertRowid))!;
  }

  buscarPorId(id: number): Categoria | undefined {
    const stmt = this.banco.prepare(`SELECT * FROM CATEGORIA WHERE CATE_CD_CATEGORIA = ?`);
    const row = stmt.get(id);
    return row ? mapCategoria(row) : undefined;
  }

  buscarPorNome(usuarioId: number, nome: string): Categoria | undefined {
    const stmt = this.banco.prepare(`
      SELECT * FROM CATEGORIA WHERE CATE_CD_USUARIO = ? AND CATE_NM_CATEGORIA = ?
    `);
    const row = stmt.get(usuarioId, nome);
    return row ? mapCategoria(row) : undefined;
  }

  listarPorUsuario(usuarioId: number): Categoria[] {
    const stmt = this.banco.prepare(`
      SELECT * FROM CATEGORIA WHERE CATE_CD_USUARIO = ? ORDER BY CATE_NM_CATEGORIA
    `);
    return stmt.all(usuarioId).map(mapCategoria);
  }
}
