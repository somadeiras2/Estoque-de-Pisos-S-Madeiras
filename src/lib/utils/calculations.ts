import { StockStatus } from '@/lib/types'

export function calculateTotalArea(caixas: number, metrosPorCaixa: number): number {
  return caixas * metrosPorCaixa
}

export function getStockStatus(atual: number, minimo: number): StockStatus {
  if (atual === 0) return 'sem_estoque'
  if (atual > 0 && atual <= Math.ceil(minimo * 0.3)) return 'critico'
  if (atual <= minimo) return 'baixo'
  return 'normal'
}

export function calculateStockPercentage(atual: number, minimo: number): number {
  if (minimo === 0) return atual > 0 ? 100 : 0
  const percentage = (atual / minimo) * 100
  return Math.min(percentage, 100)
}
