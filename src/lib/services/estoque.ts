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
  const payload = {
    piso_id: params.piso_id || params.pisoId,
    quantidade_caixas: params.quantidade_caixas || params.quantidade || 0,
    vendedor_id: params.vendedor_id || params.vendedorId || null,
    numero_pedido: params.numero_pedido || params.pedido || '',
    observacao: params.observacao || '',
    usuario_responsavel_id: params.usuario_responsavel_id || params.usuarioId || null,
  }

  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const res = await fetch('/api/baixa/confirm', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    if (res.ok && json.success) {
      return json
    }
    if (json?.error) {
      throw new Error(json.error)
    }
  } catch (err: any) {
    console.warn('Fetch /api/baixa/confirm falhou, tentando Supabase RPC:', err)
  }

  const supabase = createClient()
  const res = await (supabase as any).rpc('realizar_baixa_estoque', {
    p_piso_id: payload.piso_id,
    p_quantidade: payload.quantidade_caixas,
    p_vendedor_id: payload.vendedor_id,
    p_numero_pedido: payload.numero_pedido,
    p_observacao: payload.observacao,
    p_usuario_id: payload.usuario_responsavel_id,
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
    p_usuario_id: params.usuario_responsavel_id || params.usuarioId || null,
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
    p_usuario_id: params.usuario_responsavel_id || params.usuarioId || null,
  })

  if (res.error) throw res.error
  return res.data
}

// Aliases for alternate naming conventions used across components
export const registrarBaixa = realizarBaixa
export const registrarEntrada = realizarEntrada
export const registrarAjuste = realizarAjuste
export const getPiso = getPisoById
