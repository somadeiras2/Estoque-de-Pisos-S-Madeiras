import { createClient } from '@/lib/supabase/client'

export async function getDashboardStats(periodo?: { inicio?: string; fim?: string } | string) {
  const supabase = createClient()
  
  // Total modelos
  const { count: totalModelos } = await supabase
    .from('pisos')
    .select('*', { count: 'exact', head: true })
    .eq('ativo', true)
    
  // Total caixas & metros
  const resPisos = await (supabase as any).from('pisos').select('quantidade_caixas, metros_por_caixa').eq('ativo', true)
  const listPisos: any[] = resPisos.data || []
  
  let totalCaixas = 0
  let totalMetros = 0
  
  for (const p of listPisos) {
    totalCaixas += p.quantidade_caixas || 0
    totalMetros += (p.quantidade_caixas || 0) * (p.metros_por_caixa || 0)
  }
  
  // Pisos estoque baixo
  const { data: pisosBaixo } = await (supabase as any).from('pisos').select('id, quantidade_caixas, estoque_minimo')
    .eq('ativo', true)
  
  const pisosEstoqueBaixo = (pisosBaixo as any[])?.filter(p => p.quantidade_caixas <= p.estoque_minimo).length || 0

  // Baixas hoje
  const hojeStr = new Date().toISOString().split('T')[0]
  const { count: baixasHoje } = await supabase
    .from('movimentacoes_estoque')
    .select('*', { count: 'exact', head: true })
    .eq('tipo_movimentacao', 'baixa')
    .gte('created_at', `${hojeStr}T00:00:00Z`)
    
  // Últimas movimentações
  const { data: ultimasMovimentacoes } = await supabase
    .from('movimentacoes_estoque')
    .select('*, pisos(nome), profiles!vendedor_id(nome)')
    .order('created_at', { ascending: false })
    .limit(10)

  const resBaixas = await (supabase as any)
    .from('movimentacoes_estoque')
    .select('piso_id, quantidade_caixas, pisos(nome)')
    .eq('tipo_movimentacao', 'baixa')
  
  const baixasList: any[] = resBaixas.data || []
  let maisVendido = null
  
  if (baixasList.length > 0) {
    const mapCounts = new Map<string, { nome: string; total: number }>()
    for (const b of baixasList) {
      const pId = b.piso_id
      const pName = b.pisos?.nome || 'Desconhecido'
      const existing = mapCounts.get(pId) || { nome: pName, total: 0 }
      existing.total += b.quantidade_caixas || 0
      mapCounts.set(pId, existing)
    }
    
    let maxTotal = -1
    for (const item of mapCounts.values()) {
      if (item.total > maxTotal) {
        maxTotal = item.total
        maisVendido = item
      }
    }
  }

  return {
    totalModelos: totalModelos || 0,
    totalCaixas,
    totalArea: totalMetros,
    totalMetros,
    estoqueBaixo: pisosEstoqueBaixo,
    pisosEstoqueBaixo,
    baixasHoje: baixasHoje || 0,
    maisVendido: maisVendido ? maisVendido.nome : null,
    pisoMaisVendido: maisVendido ? maisVendido.nome : null,
    ultimasMovimentacoes: ultimasMovimentacoes || [],
  }
}

export async function getVendasPorPeriodo(inicio: string, fim: string) {
  const supabase = createClient()
  const res = await (supabase as any)
    .from('movimentacoes_estoque')
    .select('created_at, quantidade_caixas, metros_quadrados')
    .eq('tipo_movimentacao', 'baixa')
    .gte('created_at', inicio)
    .lte('created_at', fim)
    
  return (res.data || []) as any[]
}

export async function getSalesChart(periodoStr?: string) {
  const data = await getVendasPorPeriodo('1970-01-01', '2099-12-31')
  return (data as any[]).map(item => ({
    data: new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    caixas: item.quantidade_caixas,
    m2: item.metros_quadrados
  }))
}

export async function getMaisVendidos(periodo?: { inicio: string; fim: string } | string) {
  const supabase = createClient()
  const res = await (supabase as any)
    .from('movimentacoes_estoque')
    .select('piso_id, quantidade_caixas, metros_quadrados, numero_pedido, pisos(nome)')
    .eq('tipo_movimentacao', 'baixa')
  
  const data: any[] = res.data || []
  if (data.length === 0) return []
  
  const aggregated: Record<string, { id: string, nome: string, totalCaixas: number, totalMetros: number, pedidos: Set<string> }> = {}
  
  data.forEach(m => {
    if (!aggregated[m.piso_id]) {
      aggregated[m.piso_id] = {
        id: m.piso_id,
        nome: (m.pisos as any)?.nome || 'Desconhecido',
        totalCaixas: 0,
        totalMetros: 0,
        pedidos: new Set(),
      }
    }
    aggregated[m.piso_id].totalCaixas += m.quantidade_caixas
    aggregated[m.piso_id].totalMetros += m.metros_quadrados || 0
    if (m.numero_pedido) {
      aggregated[m.piso_id].pedidos.add(m.numero_pedido)
    }
  })
  
  return Object.values(aggregated).map(item => ({
    ...item,
    caixas: item.totalCaixas,
    m2: item.totalMetros,
    pedidosCount: item.pedidos.size,
  })).sort((a, b) => b.totalCaixas - a.totalCaixas)
}

export const getTopPisos = getMaisVendidos

export async function getRecentMovements() {
  const stats = await getDashboardStats()
  return stats.ultimasMovimentacoes
}
