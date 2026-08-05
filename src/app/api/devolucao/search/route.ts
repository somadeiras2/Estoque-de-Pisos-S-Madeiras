import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wlnpsaudwbpnvuyirpnl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pedido = searchParams.get('pedido') || ''

    if (!pedido.trim()) {
      return NextResponse.json({ success: true, data: [] })
    }

    const authHeader = request.headers.get('authorization')
    const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {}
    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, options)

    const { data, error } = await supabase
      .from('movimentacoes_estoque')
      .select('*, pisos(*), vendedor:profiles!vendedor_id(nome), usuario:profiles!usuario_responsavel_id(nome)')
      .eq('tipo_movimentacao', 'baixa')
      .ilike('numero_pedido', `%${pedido.trim()}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('API /api/devolucao/search error:', error)
      return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 500 })
    }

    const items = (data || []).map((m: any) => ({
      id: m.id,
      piso_id: m.piso_id,
      pisoNome: m.pisos?.nome || 'Piso',
      marca: m.pisos?.marca || '',
      codigo: m.pisos?.codigo || '',
      imagemUrl: m.pisos?.imagem_url || null,
      quantidadeBaixada: m.quantidade_caixas,
      metrosPorCaixa: m.pisos?.metros_por_caixa || 1,
      estoqueAtual: m.pisos?.quantidade_caixas || 0,
      numeroPedido: m.numero_pedido,
      vendedorNome: m.vendedor?.nome || m.usuario?.nome || 'Vendedor',
      dataBaixa: m.created_at
    }))

    return NextResponse.json({ success: true, data: items })
  } catch (err: any) {
    console.error('API /api/devolucao/search exception:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno', data: [] }, { status: 500 })
  }
}
