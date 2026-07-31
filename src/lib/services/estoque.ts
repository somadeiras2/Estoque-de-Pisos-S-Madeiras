import { createClient } from '@/lib/supabase/client'
import { getPisoById } from './pisos'

export async function realizarBaixa(params: {
  piso_id?: string
  pisoId?: string
  quantidade_caixas?: number
  quantidade?: number
  vendedor_id?: string
  vendedorId?: string
  numero_pedido?: string
  pedido?: string
  observacao?: string
  usuario_responsavel_id?: string
  usuarioId?: string
}) {
  const supabase = createClient()
  const res = await (supabase as any).rpc('realizar_baixa_estoque', {
    p_piso_id: params.piso_id || params.pisoId,
    p_quantidade: params.quantidade_caixas || params.quantidade || 0,
    p_vendedor_id: params.vendedor_id || params.vendedorId,
    p_numero_pedido: params.numero_pedido || params.pedido || '',
    p_observacao: params.observacao || '',
    p_usuario_id: params.usuario_responsavel_id || params.usuarioId || '',
  })

  if (res.error) throw res.error
  return res.data
}

export async function realizarEntrada(params: {
  piso_id?: string
  pisoId?: string
  quantidade_caixas?: number
  quantidade?: number
  numero_referencia?: string
  referencia?: string
  observacao?: string
  usuario_responsavel_id?: string
  usuarioId?: string
}) {
  const supabase = createClient()
  const res = await (supabase as any).rpc('realizar_entrada_estoque', {
    p_piso_id: params.piso_id || params.pisoId,
    p_quantidade: params.quantidade_caixas || params.quantidade || 0,
    p_numero_referencia: params.numero_referencia || params.referencia || '',
    p_observacao: params.observacao || '',
    p_usuario_id: params.usuario_responsavel_id || params.usuarioId || '',
  })

  if (res.error) throw res.error
  return res.data
}

export async function realizarAjuste(params: {
  piso_id?: string
  pisoId?: string
  quantidade_caixas?: number
  quantidade_nova?: number
  quantidade?: number
  motivo: string
  observacao?: string
  usuario_responsavel_id?: string
  usuarioId?: string
}) {
  const supabase = createClient()
  const res = await (supabase as any).rpc('realizar_ajuste_estoque', {
    p_piso_id: params.piso_id || params.pisoId,
    p_quantidade_nova: params.quantidade_nova ?? params.quantidade_caixas ?? params.quantidade ?? 0,
    p_motivo: params.motivo,
    p_observacao: params.observacao || '',
    p_usuario_id: params.usuario_responsavel_id || params.usuarioId || '',
  })

  if (res.error) throw res.error
  return res.data
}

// Aliases for alternate naming conventions used across components
export const registrarBaixa = realizarBaixa
export const registrarEntrada = realizarEntrada
export const registrarAjuste = realizarAjuste
export const getPiso = getPisoById
