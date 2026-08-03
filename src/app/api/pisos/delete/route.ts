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

    // Delete related movements first to avoid foreign key constraints
    await supabase.from('movimentacoes_estoque').delete().eq('piso_id', id)

    // Delete the piso
    const { error } = await supabase.from('pisos').delete().eq('id', id)

    if (error) {
      console.error('API /api/pisos/delete error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API /api/pisos/delete exception:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno ao excluir.' }, { status: 500 })
  }
}
