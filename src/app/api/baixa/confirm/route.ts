import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wlnpsaudwbpnvuyirpnl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const pisoId = body.piso_id || body.pisoId
    const quantidade = Number(body.quantidade_caixas || body.quantidade || 0)
    const vendedorId = body.vendedor_id || body.vendedorId || null
    const numeroPedido = body.numero_pedido || body.pedido || ''
    const observacao = body.observacao || ''
    let usuarioId = body.usuario_responsavel_id || body.usuarioId || null

    if (!pisoId || quantidade <= 0) {
      return NextResponse.json(
        { success: false, error: 'Piso e quantidade maior que zero são obrigatórios.' },
        { status: 400 }
      )
    }

    const authHeader = request.headers.get('authorization')
    const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {}
    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, options)

    // 1. Obter piso atual
    const { data: piso, error: fetchErr } = await supabase
      .from('pisos')
      .select('*')
      .eq('id', pisoId)
      .single()

    if (fetchErr || !piso) {
      return NextResponse.json({ success: false, error: 'Piso não encontrado.' }, { status: 404 })
    }

    if (piso.ativo === false) {
      return NextResponse.json({ success: false, error: 'Piso está inativo.' }, { status: 400 })
    }

    const estoqueAnterior = Number(piso.quantidade_caixas || 0)
    if (estoqueAnterior < quantidade) {
      return NextResponse.json(
        { success: false, error: `Estoque insuficiente (${estoqueAnterior} cx disponíveis).` },
        { status: 400 }
      )
    }

    const estoquePosterior = estoqueAnterior - quantidade
    const m2PorCaixa = Number(piso.metros_por_caixa || 1)
    const metrosQuadrados = quantidade * m2PorCaixa

    // 2. Resolver usuario_responsavel_id válido garantido na tabela profiles
    let validUsuarioId = usuarioId
    if (validUsuarioId) {
      const { data: prof } = await supabase.from('profiles').select('id').eq('id', validUsuarioId).single()
      if (!prof) {
        validUsuarioId = null
      }
    }

    if (!validUsuarioId) {
      const { data: profiles } = await supabase.from('profiles').select('id').limit(1)
      if (profiles && profiles.length > 0) {
        validUsuarioId = profiles[0].id
      }
    }

    // 3. Atualizar quantidade no piso
    const { error: updateErr } = await supabase
      .from('pisos')
      .update({ quantidade_caixas: estoquePosterior })
      .eq('id', pisoId)

    if (updateErr) {
      console.error('Erro ao atualizar quantidade do piso:', updateErr)
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
    }

    // 4. Inserir registro de movimentação de estoque
    const movPayload: Record<string, any> = {
      piso_id: pisoId,
      tipo_movimentacao: 'baixa',
      quantidade_caixas: quantidade,
      metros_quadrados: metrosQuadrados,
      estoque_anterior: estoqueAnterior,
      estoque_posterior: estoquePosterior,
      vendedor_id: vendedorId,
      numero_pedido: numeroPedido || null,
      observacao: observacao || null,
      usuario_responsavel_id: validUsuarioId
    }

    const { error: movErr } = await supabase
      .from('movimentacoes_estoque')
      .insert(movPayload)

    if (movErr) {
      console.error('Erro ao registrar movimentação de baixa:', movErr)
    }

    return NextResponse.json({
      success: true,
      estoqueAnterior,
      estoquePosterior,
      metrosQuadrados
    })
  } catch (err: any) {
    console.error('Exceção na API /api/baixa/confirm:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro interno ao processar baixa.' },
      { status: 500 }
    )
  }
}
