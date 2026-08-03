import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wlnpsaudwbpnvuyirpnl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV'

export async function GET() {
  try {
    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // 1. Fetch only active pisos (ativo = true)
    const { data: pisosList, count: totalModelos } = await supabase
      .from('pisos')
      .select('*', { count: 'exact' })
      .eq('ativo', true)

    let totalCaixas = 0
    let totalArea = 0
    let estoqueBaixo = 0

    if (pisosList) {
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
    }

    // 2. Fetch baixas hoje
    const hojeStr = new Date().toISOString().split('T')[0]
    const { count: baixasHoje } = await supabase
      .from('movimentacoes_estoque')
      .select('*', { count: 'exact', head: true })
      .eq('tipo_movimentacao', 'baixa')
      .gte('created_at', `${hojeStr}T00:00:00Z`)

    // 3. Fetch mais vendido
    const { data: baixasAll } = await supabase
      .from('movimentacoes_estoque')
      .select('piso_id, quantidade_caixas, pisos(nome)')
      .eq('tipo_movimentacao', 'baixa')

    let maisVendidoNome = 'Nenhum'
    if (baixasAll && baixasAll.length > 0) {
      const mapCounts = new Map<string, { nome: string; total: number }>()
      for (const b of baixasAll) {
        const pId = b.piso_id
        const pName = (b.pisos as any)?.nome || 'Piso'
        const existing = mapCounts.get(pId) || { nome: pName, total: 0 }
        existing.total += b.quantidade_caixas || 0
        mapCounts.set(pId, existing)
      }
      let maxCount = -1
      for (const val of mapCounts.values()) {
        if (val.total > maxCount) {
          maxCount = val.total
          maisVendidoNome = val.nome
        }
      }
    }

    // 4. Fetch últimas movimentações with joined piso & profile info
    const { data: rawMovs } = await supabase
      .from('movimentacoes_estoque')
      .select('*, pisos(nome), profiles!vendedor_id(nome)')
      .order('created_at', { ascending: false })
      .limit(10)

    const recentMovements = (rawMovs || []).map((m: any) => ({
      id: m.id,
      data: m.created_at,
      created_at: m.created_at,
      tipo: capitalize(m.tipo_movimentacao),
      tipo_movimentacao: m.tipo_movimentacao,
      pisoNome: m.pisos?.nome || 'Piso',
      quantidade: m.quantidade_caixas,
      quantidade_caixas: m.quantidade_caixas,
      usuario: m.profiles?.nome || 'Sistema'
    }))

    // 5. Sales chart & top pisos
    const salesChartMap = new Map<string, number>()
    const topPisosMap = new Map<string, { nome: string; quantidade: number }>()

    if (baixasAll) {
      for (const b of baixasAll) {
        const pName = (b.pisos as any)?.nome || 'Piso'
        const existingTop = topPisosMap.get(pName) || { nome: pName, quantidade: 0 }
        existingTop.quantidade += b.quantidade_caixas || 0
        topPisosMap.set(pName, existingTop)
      }
    }

    const topPisos = Array.from(topPisosMap.values())
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5)

    return NextResponse.json({
      success: true,
      stats: {
        totalModelos: totalModelos || 0,
        totalCaixas,
        totalArea,
        estoqueBaixo,
        baixasHoje: baixasHoje || 0,
        maisVendido: maisVendidoNome
      },
      recentMovements,
      salesChart: [],
      topPisos
    })
  } catch (err: any) {
    console.error('API /api/dashboard/stats exception:', err)
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 })
  }
}

function capitalize(str?: string) {
  if (!str) return 'Entrada'
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
