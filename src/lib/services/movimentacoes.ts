import { createClient } from '@/lib/supabase/client'

export async function getMovimentacoes(filters?: {
  piso_id?: string
  vendedor_id?: string
  tipo?: string
  periodo?: { inicio: string; fim: string }
  numero_pedido?: string
  page?: number
  limit?: number
}) {
  const supabase = createClient()
  let query = supabase.from('movimentacoes_estoque').select('*, pisos(nome), profiles(nome)', { count: 'exact' })

  if (filters?.piso_id) {
    query = query.eq('piso_id', filters.piso_id)
  }
  if (filters?.vendedor_id) {
    query = query.eq('vendedor_id', filters.vendedor_id)
  }
  if (filters?.tipo) {
    query = query.eq('tipo_movimentacao', filters.tipo)
  }
  if (filters?.numero_pedido) {
    query = query.ilike('numero_pedido', `%${filters.numero_pedido}%`)
  }
  if (filters?.periodo) {
    query = query
      .gte('created_at', filters.periodo.inicio)
      .lte('created_at', filters.periodo.fim)
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
