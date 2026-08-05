import { createClient } from '@/lib/supabase/client'

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` }
    }
  } catch (e) {
    console.warn('Erro ao obter sessão auth:', e)
  }
  return {}
}

export async function fetchDashboardAll() {
  try {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/dashboard/stats', { headers })
    const json = await res.json()
    if (json.success) {
      return {
        stats: json.stats,
        recentMovements: json.recentMovements || [],
        salesChart: json.salesChart || [],
        topPisos: json.topPisos || []
      }
    }
  } catch (err) {
    console.warn('Fetch /api/dashboard/stats falhou, tentando Supabase client:', err)
  }

  // Fallback
  const stats = await getDashboardStats()
  return {
    stats,
    recentMovements: stats.ultimasMovimentacoes || [],
    salesChart: [],
    topPisos: []
  }
}

export async function getDashboardStats(periodo?: { inicio?: string; fim?: string } | string) {
  try {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/dashboard/stats', { headers })
    const json = await res.json()
    if (json.success) {
      return {
        ...json.stats,
        ultimasMovimentacoes: json.recentMovements || []
      }
    }
  } catch (err) {
    console.warn(err)
  }

  const supabase = createClient()
  const { count: totalModelos } = await supabase.from('pisos').select('*', { count: 'exact', head: true }).eq('ativo', true)
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

  return {
    totalModelos: totalModelos || 0,
    totalCaixas,
    totalArea: totalMetros,
    totalMetros,
    estoqueBaixo: pisosEstoqueBaixo,
    baixasHoje: 0,
    maisVendido: 'Nenhum',
    ultimasMovimentacoes: []
  }
}

export async function getVendasPorPeriodo(inicio: string, fim: string) {
  return []
}

export async function getSalesChart(periodoStr?: string) {
  const all = await fetchDashboardAll()
  return all.salesChart
}

export async function getMaisVendidos(periodo?: { inicio: string; fim: string } | string) {
  const all = await fetchDashboardAll()
  return all.topPisos
}

export const getTopPisos = getMaisVendidos

export async function getRecentMovements() {
  const all = await fetchDashboardAll()
  return all.recentMovements
}
