import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wlnpsaudwbpnvuyirpnl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const pisoId = body.id || body.piso_id

    if (!pisoId) {
      return NextResponse.json({ success: false, error: 'ID do piso é obrigatório.' }, { status: 400 })
    }

    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const cleanStr = (v: any) => (v && typeof v === 'string' && v.trim() ? v.trim() : null)
    const parseNum = (v: any, fallback = 0) => {
      if (v === null || v === undefined || v === '') return fallback
      if (typeof v === 'number') return isNaN(v) ? fallback : v
      const n = parseFloat(String(v).replace(',', '.'))
      return isNaN(n) ? fallback : n
    }

    // 1. Fetch current piso details to get previous quantity
    const { data: currentPiso, error: fetchErr } = await supabase
      .from('pisos')
      .select('*')
      .eq('id', pisoId)
      .single()

    if (fetchErr || !currentPiso) {
      return NextResponse.json({ success: false, error: 'Piso não encontrado.' }, { status: 404 })
    }

    const oldCaixas = Number(currentPiso.quantidade_caixas ?? 0)
    const newCaixas = parseNum(body.caixas ?? body.quantidade_caixas, oldCaixas)
    const m2PorCaixa = parseNum(body.m2PorCaixa ?? body.metros_por_caixa, Number(currentPiso.metros_por_caixa || 1))

    const payload: Record<string, any> = {
      nome: String(body.nome || currentPiso.nome || '').trim(),
      marca: cleanStr(body.marca) ?? currentPiso.marca,
      codigo: cleanStr(body.codigo) ?? currentPiso.codigo,
      modelo: cleanStr(body.modelo) ?? currentPiso.modelo,
      linha: cleanStr(body.linha) ?? currentPiso.linha,
      cor: cleanStr(body.cor) ?? currentPiso.cor,
      dimensao: cleanStr(body.dimensao) ?? currentPiso.dimensao,
      tipo: cleanStr(body.tipo) || currentPiso.tipo || 'porcelanato',
      quantidade_caixas: newCaixas,
      metros_por_caixa: m2PorCaixa,
      estoque_minimo: parseNum(body.estoqueMinimo ?? body.estoque_minimo, Number(currentPiso.estoque_minimo || 0)),
      localizacao: cleanStr(body.localizacao) ?? currentPiso.localizacao,
      observacoes: cleanStr(body.observacoes) ?? currentPiso.observacoes,
      ativo: body.ativo !== undefined ? Boolean(body.ativo) : currentPiso.ativo
    }

    if (body.imagem_url !== undefined) {
      payload.imagem_url = body.imagem_url
    }

    // 2. Update floor in database
    const { data: updatedData, error: updateErr } = await supabase
      .from('pisos')
      .update(payload)
      .eq('id', pisoId)
      .select()
      .single()

    if (updateErr) {
      console.error('API /api/pisos/update database error:', updateErr)
      return NextResponse.json({ success: false, error: updateErr.message || 'Erro ao atualizar piso.' }, { status: 500 })
    }

    // 3. Check if stock quantity changed and register movement in movimentacoes_estoque
    let movimentacaoCriada = false
    if (oldCaixas !== newCaixas) {
      const diff = newCaixas - oldCaixas
      const quantidade = Math.abs(diff)
      const metrosQuadrados = quantidade * m2PorCaixa
      const tipo = body.tipo_movimentacao || (diff < 0 ? 'baixa' : 'entrada')

      // Get profile for usuario_responsavel_id if available
      let usuarioId = body.usuario_id || body.usuario_responsavel_id
      if (!usuarioId) {
        const { data: profiles } = await supabase.from('profiles').select('id').limit(1)
        if (profiles && profiles.length > 0) {
          usuarioId = profiles[0].id
        }
      }

      const movPayload: Record<string, any> = {
        piso_id: pisoId,
        tipo_movimentacao: tipo,
        quantidade_caixas: quantidade,
        metros_quadrados: metrosQuadrados,
        estoque_anterior: oldCaixas,
        estoque_posterior: newCaixas,
        observacao: cleanStr(body.observacao) || cleanStr(body.observacoes) || (diff < 0 ? 'Baixa por atualização direta de estoque' : 'Entrada por atualização direta de estoque'),
        vendedor_id: body.vendedor_id || null,
        numero_pedido: body.numero_pedido || null,
        motivo: body.motivo || (diff < 0 ? 'Ajuste de estoque (Baixa)' : 'Ajuste de estoque (Entrada)')
      }

      if (usuarioId) {
        movPayload.usuario_responsavel_id = usuarioId
      }

      const { error: movErr } = await supabase
        .from('movimentacoes_estoque')
        .insert(movPayload)

      if (movErr) {
        console.warn('Registro de movimentação de estoque falhou na API /api/pisos/update:', movErr)
      } else {
        movimentacaoCriada = true
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedData,
      movimentacaoCriada
    })
  } catch (err: any) {
    console.error('API /api/pisos/update exception:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno no servidor.' }, { status: 500 })
  }
}
