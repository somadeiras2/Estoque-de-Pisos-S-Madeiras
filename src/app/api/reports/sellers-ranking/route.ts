import { NextResponse } from 'next/server'
import { getSystemSupabaseClient } from '@/lib/supabase/server-admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || 'mes' // 'mes' | 'ano' | 'acumulado'
    const mesParam = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1), 10)
    const anoParam = parseInt(searchParams.get('ano') || String(new Date().getFullYear()), 10)

    const supabase = await getSystemSupabaseClient()

    // Build query for baixas
    let query = supabase
      .from('movimentacoes_estoque')
      .select('*, pisos(id, nome, marca, metros_por_caixa), vendedor:profiles!vendedor_id(id, nome, nome_exibicao)')
      .eq('tipo_movimentacao', 'baixa')

    let { data: rawBaixas, error } = await query

    if (error && (!rawBaixas || rawBaixas.length === 0)) {
      console.error('API /api/reports/sellers-ranking error:', error)
      return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 500 })
    }

    // Filter by date range according to period
    const filteredBaixas = (rawBaixas || []).filter((item: any) => {
      if (!item.created_at) return false
      const itemDate = new Date(item.created_at)
      const itemMonth = itemDate.getMonth() + 1
      const itemYear = itemDate.getFullYear()

      if (periodo === 'mes') {
        return itemMonth === mesParam && itemYear === anoParam
      } else if (periodo === 'ano') {
        return itemYear === anoParam
      }
      // 'acumulado' returns all
      return true
    })

    // Group sales by seller
    const sellerMap = new Map<string, {
      vendedorId: string
      nome: string
      nomeExibicao: string
      totalCaixas: number
      totalArea: number
      pedidosSet: Set<string>
      pisosVendidosMap: Map<string, { nome: string; caixas: number }>
    }>()

    let globalTotalCaixas = 0
    let globalTotalArea = 0
    const globalPedidosSet = new Set<string>()

    for (const b of filteredBaixas) {
      const vendedor = b.vendedor || {}
      const vId = b.vendedor_id || 'vendedor_desconhecido'
      const vNome = vendedor.nome || vendedor.nome_exibicao || 'Vendedor Não Cadastrado'
      const vExib = vendedor.nome_exibicao || vendedor.nome || 'Vendedor'
      const piso = b.pisos || {}
      const pNome = piso.nome || 'Piso'
      const m2PorCx = piso.metros_por_caixa || 1
      const cx = b.quantidade_caixas || 0
      const area = b.metros_quadrados || (cx * m2PorCx)
      const pedidoNum = b.numero_pedido || `single_${b.id}`

      globalTotalCaixas += cx
      globalTotalArea += area
      globalPedidosSet.add(pedidoNum)

      const existing = sellerMap.get(vId) || {
        vendedorId: vId,
        nome: vNome,
        nomeExibicao: vExib,
        totalCaixas: 0,
        totalArea: 0,
        pedidosSet: new Set<string>(),
        pisosVendidosMap: new Map<string, { nome: string; caixas: number }>()
      }

      existing.totalCaixas += cx
      existing.totalArea += area
      existing.pedidosSet.add(pedidoNum)

      const currentPisoCount = existing.pisosVendidosMap.get(pNome) || { nome: pNome, caixas: 0 }
      currentPisoCount.caixas += cx
      existing.pisosVendidosMap.set(pNome, currentPisoCount)

      sellerMap.set(vId, existing)
    }

    // Convert map to array and compute top piso for each seller
    const ranking = Array.from(sellerMap.values()).map((s) => {
      const totalPedidos = s.pedidosSet.size || 1
      
      // Find top selling floor for this seller
      let topPisoNome = '-'
      let topPisoCaixas = 0
      for (const p of s.pisosVendidosMap.values()) {
        if (p.caixas > topPisoCaixas) {
          topPisoCaixas = p.caixas
          topPisoNome = p.nome
        }
      }

      return {
        vendedorId: s.vendedorId,
        nome: s.nome,
        nomeExibicao: s.nomeExibicao,
        totalCaixas: s.totalCaixas,
        totalArea: Number(s.totalArea.toFixed(2)),
        totalPedidos,
        mediaCaixasPorPedido: Number((s.totalCaixas / totalPedidos).toFixed(1)),
        pisoMaisVendido: topPisoNome,
        pctTotal: globalTotalCaixas > 0 ? Number(((s.totalCaixas / globalTotalCaixas) * 100).toFixed(1)) : 0
      }
    })

    // Sort sellers descending by total volume in boxes
    ranking.sort((a, b) => b.totalCaixas - a.totalCaixas)

    return NextResponse.json({
      success: true,
      data: ranking,
      summary: {
        totalVendedores: ranking.length,
        totalCaixasVendidas: globalTotalCaixas,
        totalAreaVendida: Number(globalTotalArea.toFixed(2)),
        totalPedidos: globalPedidosSet.size,
        lider: ranking.length > 0 ? ranking[0] : null
      }
    })
  } catch (err: any) {
    console.error('API /api/reports/sellers-ranking exception:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno', data: [] }, { status: 500 })
  }
}
