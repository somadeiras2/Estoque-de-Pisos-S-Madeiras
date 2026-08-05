import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wlnpsaudwbpnvuyirpnl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {}
    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, options)
    const now = new Date()
    const brtDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now)
    const inicioHojeBrt = `${brtDateStr}T00:00:00-03:00`

    // Execute queries in parallel for maximum speed
    const [pisosRes, baixasHojeRes, baixasAllRes, rawMovsRes] = await Promise.all([
      supabase.from('pisos').select('*', { count: 'exact' }).eq('ativo', true),
      supabase.from('movimentacoes_estoque').select('*', { count: 'exact', head: true }).eq('tipo_movimentacao', 'baixa').gte('created_at', inicioHojeBrt),
      supabase.from('movimentacoes_estoque').select('piso_id, quantidade_caixas, created_at, pisos(nome)').eq('tipo_movimentacao', 'baixa'),
      supabase.from('movimentacoes_estoque').select('*, pisos(nome), vendedor:profiles!vendedor_id(nome), usuario:profiles!usuario_responsavel_id(nome)').order('created_at', { ascending: false }).limit(10)
    ])

    const pisosList = pisosRes.data || []
    const totalModelos = pisosRes.count || 0

    let totalCaixas = 0
    let totalArea = 0
    let estoqueBaixo = 0

    for (const p of pisosList) {
      const cx = p.quantidade_caixas || 0
      const m2cx = p.metros_por_caixa || 0
      const min = p.estoque_minimo || 0
      totalCaixas += cx
      totalArea += cx * m2cx
      if (cx <= min) {
        estoqueBaixo++
      }
    }

    const baixasHoje = baixasHojeRes.count || 0
    const baixasAll = baixasAllRes.data || []

    let maisVendidoNome = 'Nenhum'
    const topPisosMap = new Map<string, { nome: string; quantidade: number }>()

    if (baixasAll.length > 0) {
      const mapCounts = new Map<string, { nome: string; total: number }>()
      for (const b of baixasAll) {
        const pId = b.piso_id
        const pName = (b.pisos as any)?.nome || 'Piso'
        
        const existing = mapCounts.get(pId) || { nome: pName, total: 0 }
        existing.total += b.quantidade_caixas || 0
        mapCounts.set(pId, existing)

        const existingTop = topPisosMap.get(pName) || { nome: pName, quantidade: 0 }
        existingTop.quantidade += b.quantidade_caixas || 0
        topPisosMap.set(pName, existingTop)
      }

      let maxCount = -1
      for (const val of mapCounts.values()) {
        if (val.total > maxCount) {
          maxCount = val.total
          maisVendidoNome = val.nome
        }
      }
    }

    const topPisos = Array.from(topPisosMap.values())
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5)

    const recentMovements = (rawMovsRes.data || []).map((m: any) => ({
      id: m.id,
      data: m.created_at,
      created_at: m.created_at,
      tipo: capitalize(m.tipo_movimentacao),
      tipo_movimentacao: m.tipo_movimentacao,
      pisoNome: m.pisos?.nome || 'Piso',
      quantidade: m.quantidade_caixas,
      quantidade_caixas: m.quantidade_caixas,
      usuario: m.vendedor?.nome || m.usuario?.nome || 'Sistema'
    }))

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalModelos,
          totalCaixas,
          totalArea,
          estoqueBaixo,
          baixasHoje,
          maisVendido: maisVendidoNome
        },
        recentMovements,
        salesChart: [],
        topPisos
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59'
        }
      }
    )
  } catch (err: any) {
    console.error('API /api/dashboard/stats exception:', err)
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 })
  }
}

function capitalize(str?: string) {
  if (!str) return 'Entrada'
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
