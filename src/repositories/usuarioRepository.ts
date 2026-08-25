import type { DatabaseSync } from 'node:sqlite';
import type { NovoUsuario, Usuario } from '../types.js';

function mapUsuario(row: any): Usuario {
  return {
    id: row.USUA_CD_USUARIO,
    nome: row.USUA_NM_USUARIO,
    login: row.USUA_NR_LOGIN,
    senhaHash: row.USUA_DS_SENHA,
    criadoEm: row.USUA_DH_CADASTRO,
  };
}

export class UsuarioRepository {
  constructor(private banco: DatabaseSync) {}

  criar(usuario: NovoUsuario & { senhaHash: string }): Usuario {
    const stmt = this.banco.prepare(`
      INSERT INTO USUARIO (USUA_NM_USUARIO, USUA_NR_LOGIN, USUA_DS_SENHA)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(usuario.nome, usuario.login, usuario.senhaHash);
    return this.buscarPorId(Number(info.lastInsertRowid))!;
  }

  buscarPorLogin(login: string): Usuario | undefined {
    const stmt = this.banco.prepare(`SELECT * FROM USUARIO WHERE USUA_NR_LOGIN = ?`);
    const row = stmt.get(login);
    return row ? mapUsuario(row) : undefined;
  }

  buscarPorId(id: number): Usuario | undefined {
    const stmt = this.banco.prepare(`SELECT * FROM USUARIO WHERE USUA_CD_USUARIO = ?`);
    const row = stmt.get(id);
    return row ? mapUsuario(row) : undefined;
  }
}
