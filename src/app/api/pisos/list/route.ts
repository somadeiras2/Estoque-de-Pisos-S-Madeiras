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
    } else if (status === 'ativo') {
      query = query.eq('ativo', true)
    }

    const { data, error, count } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('API /api/pisos/list error:', error)
      return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [], count: count || 0 })
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
