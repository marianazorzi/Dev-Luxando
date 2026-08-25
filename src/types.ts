export type TipoCategoria = 'RECEITA' | 'DESPESA';

export interface Usuario {
  id: number;
  nome: string;
  login: string;
  senhaHash: string;
  criadoEm: string;
}

export interface NovoUsuario {
  nome: string;
  login: string;
  senha: string;
}

export interface Categoria {
  id: number;
  usuarioId: number;
  nome: string;
  tipo: TipoCategoria;
}

export interface NovaCategoria {
  usuarioId: number;
  nome: string;
  tipo: TipoCategoria;
}

export interface Lancamento {
  id: number;
  usuarioId: number;
  categoriaId: number;
  descricao: string | null;
  valor: number;
  data: string;
  criadoEm: string;
}

export interface NovoLancamento {
  usuarioId: number;
  categoriaId: number;
  descricao?: string;
  valor: number;
  data: string;
}

export interface ResumoCategoria {
  categoria: string;
  tipo: TipoCategoria;
  total: number;
}

export interface ResumoMensal {
  mes: string;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  porCategoria: ResumoCategoria[];
}
