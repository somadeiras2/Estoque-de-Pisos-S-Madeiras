import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wlnpsaudwbpnvuyirpnl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV'

export async function POST(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do piso não informado.' }, { status: 400 })
    }

    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Try deleting related movements first
    try {
      await supabase.from('movimentacoes_estoque').delete().eq('piso_id', id)
    } catch (e) {
      console.warn('Não foi possível excluir movimentações vinculadas:', e)
    }

    // Try hard delete first
    let { error } = await supabase.from('pisos').delete().eq('id', id)

    // If hard delete fails due to foreign key constraint (23503) or RLS, apply soft delete (ativo = false)
    if (error) {
      console.warn('Hard delete falhou, aplicando soft delete (ativo = false):', error.message)
      const softRes = await supabase.from('pisos').update({ ativo: false }).eq('id', id)
      error = softRes.error
    }

    if (error) {
      console.error('API /api/pisos/delete error final:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API /api/pisos/delete exception:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno ao excluir.' }, { status: 500 })
  }
}
