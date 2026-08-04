import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wlnpsaudwbpnvuyirpnl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const marca = searchParams.get('marca') || ''
    const tipo = searchParams.get('tipo') || ''
    const cor = searchParams.get('cor') || ''
    const dimensao = searchParams.get('dimensao') || ''
    const status = searchParams.get('status') || ''
    const id = searchParams.get('id') || ''

    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    let query = supabase.from('pisos').select('*', { count: 'exact' })

    if (id) {
      query = query.eq('id', id)
    }

    if (search.trim()) {
      const s = search.trim()
      query = query.or(`nome.ilike.%${s}%,marca.ilike.%${s}%,codigo.ilike.%${s}%,cor.ilike.%${s}%,modelo.ilike.%${s}%`)
    }

    if (marca) {
      query = query.ilike('marca', `%${marca}%`)
    }

    if (cor) {
      query = query.ilike('cor', `%${cor}%`)
    }

    if (dimensao) {
      query = query.ilike('dimensao', `%${dimensao}%`)
    }

    if (tipo) {
      const normalizedTipo = normalizeTipo(tipo)
      query = query.eq('tipo', normalizedTipo)
    }

    if (status === 'inativo') {
      query = query.eq('ativo', false)
    } else {
      query = query.eq('ativo', true)
    }

    const { data, error, count } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('API /api/pisos/list error:', error)
      return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 500 })
    }

    const formattedData = (data || []).map((item: any) => ({
      ...item,
      caixas: item.quantidade_caixas ?? item.caixas ?? 0,
      m2PorCaixa: item.metros_por_caixa ?? item.m2PorCaixa ?? 1,
      estoqueMinimo: item.estoque_minimo ?? item.estoqueMinimo ?? 0,
      imagemUrl: item.imagem_url || item.imagemUrl || null,
      quantidade_caixas: item.quantidade_caixas ?? item.caixas ?? 0,
      metros_por_caixa: item.metros_por_caixa ?? item.m2PorCaixa ?? 1,
      estoque_minimo: item.estoque_minimo ?? item.estoqueMinimo ?? 0,
      imagem_url: item.imagem_url || item.imagemUrl || null,
    }))

    return NextResponse.json(
      { success: true, data: formattedData, count: count || 0 },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=29'
        }
      }
    )
  } catch (err: any) {
    console.error('API /api/pisos/list exception:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno', data: [] }, { status: 500 })
  }
}

function normalizeTipo(tipo?: string): string {
  if (!tipo) return 'ceramica'
  const norm = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  if (norm.includes('porcelanato')) return 'porcelanato'
  if (norm.includes('ceramica')) return 'ceramica'
  if (norm.includes('acetinado')) return 'acetinado'
  if (norm.includes('polido')) return 'polido'
  return 'outros'
}
