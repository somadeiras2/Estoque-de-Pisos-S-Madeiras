export type TipoMovimentacao = 'entrada' | 'baixa' | 'ajuste'
export type TipoPiso = 'ceramica' | 'porcelanato' | 'acetinado' | 'polido' | 'outros'
export type TipoUsuario = 'admin' | 'vendedor'
export type StockStatus = 'normal' | 'baixo' | 'critico' | 'sem_estoque'

export interface ProfileRow {
  id: string
  nome: string
  nome_exibicao: string | null
  email: string
  telefone: string | null
  tipo_usuario: TipoUsuario
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface PisoRow {
  id: string
  nome: string
  marca: string | null
  codigo: string | null
  modelo: string | null
  linha: string | null
  cor: string | null
  dimensao: string | null
  tipo: TipoPiso | string
  quantidade_caixas: number
  metros_por_caixa: number
  estoque_minimo: number
  localizacao: string | null
  imagem_url: string | null
  observacoes: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface MovimentacaoRow {
  id: string
  piso_id: string
  tipo_movimentacao: TipoMovimentacao
  quantidade_caixas: number
  metros_quadrados: number
  estoque_anterior: number
  estoque_posterior: number
  vendedor_id: string | null
  numero_pedido: string | null
  numero_referencia: string | null
  motivo: string | null
  observacao: string | null
  usuario_responsavel_id: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Partial<ProfileRow>
        Update: Partial<ProfileRow>
      }
      pisos: {
        Row: PisoRow
        Insert: Partial<PisoRow>
        Update: Partial<PisoRow>
      }
      movimentacoes_estoque: {
        Row: MovimentacaoRow
        Insert: Partial<MovimentacaoRow>
        Update: Partial<MovimentacaoRow>
      }
    }
    Functions: {
      realizar_baixa_estoque: {
        Args: Record<string, any>
        Returns: any
      }
      realizar_entrada_estoque: {
        Args: Record<string, any>
        Returns: any
      }
      realizar_ajuste_estoque: {
        Args: Record<string, any>
        Returns: any
      }
    }
  }
}

export type Profile = ProfileRow
export type Piso = PisoRow & {
  caixas?: number
  m2PorCaixa?: number
  estoqueMinimo?: number
  imagemUrl?: string
}
export type Movimentacao = MovimentacaoRow & {
  pisos?: { nome?: string; marca?: string } | null
  profiles?: { nome?: string } | null
  vendedor?: { nome?: string } | null
  usuario?: { nome?: string } | null
}
