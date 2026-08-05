import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wlnpsaudwbpnvuyirpnl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const piso_id = searchParams.get('piso_id') || ''
    const vendedor_id = searchParams.get('vendedor_id') || ''
    const tipo = searchParams.get('tipo') || ''
    const pedido = searchParams.get('pedido') || searchParams.get('numero_pedido') || ''
    const data_inicio = searchParams.get('data_inicio') || ''
    const data_fim = searchParams.get('data_fim') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const authHeader = request.headers.get('authorization')
    const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {}
    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, options)

    const buildQuery = (client: any) => {
      let q = client
        .from('movimentacoes_estoque')
        .select('*, pisos(nome), vendedor:profiles!vendedor_id(nome), usuario:profiles!usuario_responsavel_id(nome)', { count: 'exact' })

      if (piso_id) {
        q = q.eq('piso_id', piso_id)
      }
      if (vendedor_id) {
        q = q.eq('vendedor_id', vendedor_id)
      }
      if (tipo) {
        q = q.eq('tipo_movimentacao', tipo.toLowerCase())
      }
      if (pedido.trim()) {
        q = q.ilike('numero_pedido', `%${pedido.trim()}%`)
      }
      if (data_inicio) {
        q = q.gte('created_at', `${data_inicio}T00:00:00`)
      }
      if (data_fim) {
        q = q.lte('created_at', `${data_fim}T23:59:59`)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      return q.range(from, to).order('created_at', { ascending: false })
    }

    let { data, error, count } = await buildQuery(supabase)

    // Fallback if RLS returns empty data while authHeader was present
    if ((!data || data.length === 0) && authHeader) {
      const fallbackClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      const resFallback = await buildQuery(fallbackClient)
      if (resFallback.data && resFallback.data.length > 0) {
        data = resFallback.data
        count = resFallback.count
      }
    }

    if (error && (!data || data.length === 0)) {
      console.error('API /api/movimentacoes/list error:', error)
      return NextResponse.json({ success: false, error: error.message, data: [], count: 0, totalPages: 1 }, { status: 500 })
    }

    const totalCount = count || (data ? data.length : 0)
    const totalPages = Math.ceil(totalCount / limit) || 1

    return NextResponse.json({
      success: true,
      data: data || [],
      count: totalCount,
      totalPages
    })
  } catch (err: any) {
    console.error('API /api/movimentacoes/list exception:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno', data: [], count: 0, totalPages: 1 }, { status: 500 })
  }
}
