import bcrypt from 'bcryptjs';
import type { DatabaseSync } from 'node:sqlite';
import { UsuarioRepository } from '../repositories/usuarioRepository.js';
import type { NovoUsuario, Usuario } from '../types.js';

export class AuthService {
  private usuarios: UsuarioRepository;

  constructor(banco: DatabaseSync) {
    this.usuarios = new UsuarioRepository(banco);
  }

  registrar(dados: NovoUsuario): Usuario {
    const existente = this.usuarios.buscarPorLogin(dados.login);
    if (existente) {
      throw new Error(`Login "${dados.login}" já está em uso.`);
    }
    const senhaHash = bcrypt.hashSync(dados.senha, 10);
    return this.usuarios.criar({ ...dados, senhaHash });
  }

  autenticar(login: string, senha: string): Usuario {
    const usuario = this.usuarios.buscarPorLogin(login);
    if (!usuario || !bcrypt.compareSync(senha, usuario.senhaHash)) {
      throw new Error('Login ou senha inválidos.');
    }
    return usuario;
  }

  obterUsuarioObrigatorio(login: string): Usuario {
    const usuario = this.usuarios.buscarPorLogin(login);
    if (!usuario) {
      throw new Error(`Usuário "${login}" não encontrado. Registre-se primeiro.`);
    }
    return usuario;
  }
}
