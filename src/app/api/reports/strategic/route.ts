import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wlnpsaudwbpnvuyirpnl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {}
    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, options)

    // Fetch all stock reductions (baixas) with joined piso details
    const { data: rawBaixas, error } = await supabase
      .from('movimentacoes_estoque')
      .select('*, pisos(id, nome, marca, codigo, dimensao, tipo, metros_por_caixa)')
      .eq('tipo_movimentacao', 'baixa')

    if (error) {
      console.error('API /api/reports/strategic error:', error)
      return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 500 })
    }

    const reportMap = new Map<string, {
      id: string
      nome: string
      marca: string
      codigo: string
      dimensao: string
      totalCaixas: number
      metrosPorCaixa: number
      totalArea: number
      pedidosSet: Set<string>
      vendedoresSet: Set<string>
    }>()

    let totalGlobalCaixas = 0
    let totalGlobalPedidosSet = new Set<string>()

    for (const b of (rawBaixas || [])) {
      const pId = b.piso_id
      if (!pId) continue
      const piso = b.pisos || {}
      const pName = piso.nome || 'Piso Sem Nome'
      const pMarca = piso.marca || ''
      const pCodigo = piso.codigo || ''
      const pDimensao = piso.dimensao || ''
      const m2PorCx = piso.metros_por_caixa || 1
      const cx = b.quantidade_caixas || 0
      const pedidoNum = b.numero_pedido || `single_${b.id}`
      const vendedorId = b.vendedor_id || 'indefinido'

      totalGlobalCaixas += cx
      totalGlobalPedidosSet.add(pedidoNum)

      const existing = reportMap.get(pId) || {
        id: pId,
        nome: pName,
        marca: pMarca,
        codigo: pCodigo,
        dimensao: pDimensao,
        totalCaixas: 0,
        metrosPorCaixa: m2PorCx,
        totalArea: 0,
        pedidosSet: new Set<string>(),
        vendedoresSet: new Set<string>()
      }

      existing.totalCaixas += cx
      existing.totalArea += cx * m2PorCx
      existing.pedidosSet.add(pedidoNum)
      existing.vendedoresSet.add(vendedorId)

      reportMap.set(pId, existing)
    }

    const items = Array.from(reportMap.values()).map(item => {
      const pedidosCount = item.pedidosSet.size || 1
      return {
        id: item.id,
        nome: item.nome,
        marca: item.marca,
        codigo: item.codigo,
        dimensao: item.dimensao,
        totalCaixas: item.totalCaixas,
        totalArea: Number(item.totalArea.toFixed(2)),
        pedidosCount,
        vendedoresCount: item.vendedoresSet.size,
        mediaCaixasPorPedido: Number((item.totalCaixas / pedidosCount).toFixed(1))
      }
    })

    // Sort by default: total volume (caixas)
    items.sort((a, b) => b.totalCaixas - a.totalCaixas)

    return NextResponse.json({
      success: true,
      data: items,
      summary: {
        totalItens: items.length,
        totalCaixasVendidas: totalGlobalCaixas,
        totalPedidosDistintos: totalGlobalPedidosSet.size
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59'
      }
    })
  } catch (err: any) {
    console.error('API /api/reports/strategic exception:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno', data: [] }, { status: 500 })
  }
}
