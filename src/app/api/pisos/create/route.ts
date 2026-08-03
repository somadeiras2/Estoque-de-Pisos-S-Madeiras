import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wlnpsaudwbpnvuyirpnl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('API /api/pisos/create received payload:', body)

    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const nome = String(body.nome || '').trim()
    if (!nome) {
      return NextResponse.json({ success: false, error: 'O Nome do Piso é obrigatório.' }, { status: 400 })
    }

    const cleanStr = (v: any) => (v && typeof v === 'string' && v.trim() ? v.trim() : null)
    const parseNum = (v: any, fallback = 0) => {
      if (v === null || v === undefined || v === '') return fallback
      if (typeof v === 'number') return isNaN(v) ? fallback : v
      const n = parseFloat(String(v).replace(',', '.'))
      return isNaN(n) ? fallback : n
    }

    let codigo = cleanStr(body.codigo)

    const payload = {
      nome: nome,
      marca: cleanStr(body.marca),
      codigo: codigo,
      modelo: cleanStr(body.modelo),
      linha: cleanStr(body.linha),
      cor: cleanStr(body.cor),
      dimensao: cleanStr(body.dimensao),
      tipo: cleanStr(body.tipo) || 'porcelanato',
      quantidade_caixas: parseNum(body.caixas ?? body.quantidade_caixas, 0),
      metros_por_caixa: parseNum(body.m2PorCaixa ?? body.metros_por_caixa, 1),
      estoque_minimo: parseNum(body.estoqueMinimo ?? body.estoque_minimo, 0),
      localizacao: cleanStr(body.localizacao),
      observacoes: cleanStr(body.observacoes),
      imagem_url: body.imagem_url || null,
      ativo: body.ativo !== false
    }

    let { data, error } = await supabase.from('pisos').insert(payload).select()

    if (error) {
      // If code constraint 23505 (duplicate code), auto-generate suffix
      if (error.code === '23505' || (error.message && error.message.includes('pisos_codigo_key'))) {
        payload.codigo = `${codigo || 'PISO'}-${Math.floor(1000 + Math.random() * 9000)}`
        const retry = await supabase.from('pisos').insert(payload).select()
        data = retry.data
        error = retry.error
      }
    }

    if (error) {
      console.error('Database insert error:', error)
      return NextResponse.json({ success: false, error: error.message || 'Erro ao inserir no banco.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data?.[0] || payload })
  } catch (err: any) {
    console.error('API /api/pisos/create exception:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno no servidor.' }, { status: 500 })
  }
}
