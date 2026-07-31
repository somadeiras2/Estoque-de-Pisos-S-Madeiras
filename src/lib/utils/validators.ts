import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

export const pisoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  marca: z.string().optional().default(''),
  codigo: z.string().optional().default(''),
  modelo: z.string().optional().default(''),
  linha: z.string().optional().default(''),
  cor: z.string().optional().default(''),
  dimensao: z.string().optional().default(''),
  tipo: z.string().default('ceramica'),
  quantidade_caixas: z.coerce.number().min(0, 'Quantidade não pode ser negativa').default(0),
  metros_por_caixa: z.coerce.number().min(0.01, 'Metros por caixa deve ser maior que zero').default(1),
  estoque_minimo: z.coerce.number().min(0, 'Estoque mínimo não pode ser negativo').default(0),
  caixas: z.coerce.number().min(0).optional(),
  m2PorCaixa: z.coerce.number().min(0.01).optional(),
  estoqueMinimo: z.coerce.number().min(0).optional(),
  localizacao: z.string().optional().default(''),
  observacoes: z.string().optional().default(''),
  ativo: z.boolean().default(true),
  imagem_url: z.string().optional(),
})

export const baixaSchema = z.object({
  piso_id: z.string().min(1, 'Piso é obrigatório'),
  quantidade_caixas: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  vendedor_id: z.string().min(1, 'Vendedor obrigatório'),
  numero_pedido: z.string().min(1, 'Número do pedido é obrigatório'),
  observacao: z.string().optional(),
})

export const entradaSchema = z.object({
  piso_id: z.string().min(1, 'Piso é obrigatório'),
  quantidade_caixas: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  numero_referencia: z.string().optional(),
  observacao: z.string().optional(),
})

export const ajusteSchema = z.object({
  piso_id: z.string().min(1, 'Piso é obrigatório'),
  quantidade_nova: z.coerce.number().min(0, 'Quantidade não pode ser negativa'),
  motivo: z.string().min(1, 'Motivo é obrigatório'),
  observacao: z.string().optional(),
})

export const vendedorSchema = z.object({
  nome: z.string().optional().default(''),
  nome_completo: z.string().optional().default(''),
  nome_exibicao: z.string().optional().default(''),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional().default(''),
  ativo: z.boolean().default(true),
})

export type LoginData = z.infer<typeof loginSchema>
export type PisoData = z.infer<typeof pisoSchema>
export type BaixaData = z.infer<typeof baixaSchema>
export type EntradaData = z.infer<typeof entradaSchema>
export type AjusteData = z.infer<typeof ajusteSchema>
export type VendedorData = z.infer<typeof vendedorSchema>
