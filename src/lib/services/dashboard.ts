import { createClient } from '@/lib/supabase/client'

export async function getDashboardStats(periodo?: { inicio?: string; fim?: string } | string) {
  try {
    const res = await fetch('/api/dashboard/stats')
    const json = await res.json()
    if (json.success) {
      return {
        ...json.stats,
        ultimasMovimentacoes: json.recentMovements || []
      }
    }
  } catch (err) {
    console.warn('Fetch /api/dashboard/stats falhou, tentando Supabase client:', err)
  }

  const supabase = createClient()
  
  const { count: totalModelos } = await supabase
    .from('pisos')
    .select('*', { count: 'exact', head: true })
    .eq('ativo', true)
    
  const resPisos = await (supabase as any).from('pisos').select('quantidade_caixas, metros_por_caixa').eq('ativo', true)
  const listPisos: any[] = resPisos.data || []
  
  let totalCaixas = 0
  let totalMetros = 0
  
  for (const p of listPisos) {
    totalCaixas += p.quantidade_caixas || 0
    totalMetros += (p.quantidade_caixas || 0) * (p.metros_por_caixa || 0)
  }
  
  const { data: pisosBaixo } = await (supabase as any).from('pisos').select('id, quantidade_caixas, estoque_minimo').eq('ativo', true)
  const pisosEstoqueBaixo = (pisosBaixo as any[])?.filter(p => p.quantidade_caixas <= p.estoque_minimo).length || 0

  const hojeStr = new Date().toISOString().split('T')[0]
  const { count: baixasHoje } = await supabase
    .from('movimentacoes_estoque')
    .select('*', { count: 'exact', head: true })
    .eq('tipo_movimentacao', 'baixa')
    .gte('created_at', `${hojeStr}T00:00:00Z`)
    
  const { data: rawMovs } = await (supabase as any)
    .from('movimentacoes_estoque')
    .select('*, pisos(nome), profiles!vendedor_id(nome)')
    .order('created_at', { ascending: false })
    .limit(10)

  const ultimasMovimentacoes = (rawMovs || []).map((m: any) => ({
    id: m.id,
    data: m.created_at,
    created_at: m.created_at,
    tipo: m.tipo_movimentacao ? m.tipo_movimentacao.charAt(0).toUpperCase() + m.tipo_movimentacao.slice(1) : 'Entrada',
    pisoNome: m.pisos?.nome || 'Piso',
    quantidade: m.quantidade_caixas,
    usuario: m.profiles?.nome || 'Sistema'
  }))

  return {
    totalModelos: totalModelos || 0,
    totalCaixas,
    totalArea: totalMetros,
    totalMetros,
    estoqueBaixo: pisosEstoqueBaixo,
    pisosEstoqueBaixo,
    baixasHoje: baixasHoje || 0,
    maisVendido: 'Nenhum',
    pisoMaisVendido: 'Nenhum',
    ultimasMovimentacoes
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
  try {
    const res = await fetch('/api/dashboard/stats')
    const json = await res.json()
    if (json.success && json.salesChart) {
      return json.salesChart
    }
  } catch (err) {
    console.warn(err)
  }
  return []
}

export async function getMaisVendidos(periodo?: { inicio: string; fim: string } | string) {
  try {
    const res = await fetch('/api/dashboard/stats')
    const json = await res.json()
    if (json.success && json.topPisos) {
      return json.topPisos
    }
  } catch (err) {
    console.warn(err)
  }
  return []
}

export const getTopPisos = getMaisVendidos

export async function getRecentMovements() {
  const stats = await getDashboardStats()
  return stats.ultimasMovimentacoes
}
