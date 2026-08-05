import { createClient } from '@/lib/supabase/client'

export async function getMovimentacoes(filters?: {
  piso_id?: string
  vendedor_id?: string
  tipo?: string
  periodo?: { inicio: string; fim: string }
  numero_pedido?: string
  pedido?: string
  data_inicio?: string
  data_fim?: string
  page?: number
  limit?: number
}) {
  const supabase = createClient()
  let query = supabase
    .from('movimentacoes_estoque')
    .select('*, pisos(nome), vendedor:profiles!vendedor_id(nome), usuario:profiles!usuario_responsavel_id(nome)', { count: 'exact' })

  if (filters?.piso_id) {
    query = query.eq('piso_id', filters.piso_id)
  }
  if (filters?.vendedor_id) {
    query = query.eq('vendedor_id', filters.vendedor_id)
  }
  if (filters?.tipo) {
    const tipoNorm = filters.tipo.toLowerCase()
    query = query.eq('tipo_movimentacao', tipoNorm)
  }
  const pedidoQuery = filters?.numero_pedido || (filters as any)?.pedido
  if (pedidoQuery) {
    query = query.ilike('numero_pedido', `%${pedidoQuery}%`)
  }

  const inicio = filters?.periodo?.inicio || (filters as any)?.data_inicio
  const fim = filters?.periodo?.fim || (filters as any)?.data_fim

  if (inicio) {
    query = query.gte('created_at', `${inicio}T00:00:00`)
  }
  if (fim) {
    query = query.lte('created_at', `${fim}T23:59:59`)
  }

  const limit = filters?.limit || 20
  if (filters?.page !== undefined) {
    const from = (filters.page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)
  }

  const res = await query.order('created_at', { ascending: false })
  const count = res.count || 0
  const totalPages = Math.ceil(count / limit) || 1

  return {
    data: (res.data || []) as any[],
    count,
    totalPages,
    error: res.error
  }
}

export async function getMovimentacaoById(id: string) {
  const supabase = createClient()
  const res = await supabase
    .from('movimentacoes_estoque')
    .select('*, pisos(*), vendedor:profiles!vendedor_id(*), usuario:profiles!usuario_responsavel_id(*)')
    .eq('id', id)
    .single()

  return res.data as any
}
