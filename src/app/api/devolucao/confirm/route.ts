import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wlnpsaudwbpnvuyirpnl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV'

export async function POST(request: Request) {
  try {
    const { piso_id, quantidade_caixas, numero_pedido, vendedor_id, observacao } = await request.json()

    if (!piso_id || !quantidade_caixas || quantidade_caixas <= 0) {
      return NextResponse.json({ success: false, error: 'Dados da devolução inválidos.' }, { status: 400 })
    }

    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // 1. Fetch current piso details
    const { data: piso, error: fetchErr } = await supabase
      .from('pisos')
      .select('quantidade_caixas, metros_por_caixa')
      .eq('id', piso_id)
      .single()

    if (fetchErr || !piso) {
      return NextResponse.json({ success: false, error: 'Piso não encontrado.' }, { status: 404 })
    }

    const estoqueAnterior = piso.quantidade_caixas || 0
    const estoquePosterior = estoqueAnterior + Number(quantidade_caixas)
    const m2PorCaixa = piso.metros_por_caixa || 1
    const metrosQuadrados = Number(quantidade_caixas) * m2PorCaixa

    // 2. Restore stock in pisos table
    const { error: updateErr } = await supabase
      .from('pisos')
      .update({ quantidade_caixas: estoquePosterior, ativo: true })
      .eq('id', piso_id)

    if (updateErr) {
      console.error('API /api/devolucao/confirm update error:', updateErr)
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
    }

    // 3. Register return movement (entrada)
    const { error: movErr } = await supabase
      .from('movimentacoes_estoque')
      .insert({
        piso_id,
        tipo_movimentacao: 'entrada',
        quantidade_caixas: Number(quantidade_caixas),
        metros_quadrados: metrosQuadrados,
        estoque_anterior: estoqueAnterior,
        estoque_posterior: estoquePosterior,
        vendedor_id: vendedor_id || null,
        numero_pedido: numero_pedido || null,
        motivo: 'Devolução de Pedido',
        observacao: observacao || `Devolução de ${quantidade_caixas} caixas referente ao Pedido ${numero_pedido}`
      })

    if (movErr) {
      console.warn('Registro de movimentação de devolução falhou, mas estoque foi restaurado:', movErr)
    }

    return NextResponse.json({
      success: true,
      estoqueAnterior,
      estoquePosterior,
      caixasDevolvidas: Number(quantidade_caixas)
    })
  } catch (err: any) {
    console.error('API /api/devolucao/confirm exception:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno ao processar devolução.' }, { status: 500 })
  }
}
