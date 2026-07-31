import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatArea(value: number): string {
  return `${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`
}

export function formatNumber(value: number): string {
  return (value || 0).toLocaleString('pt-BR')
}

export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy'): string {
  if (!date) return ''
  try {
    const fmt = pattern === 'short' ? 'dd/MM' : pattern
    return format(new Date(date), fmt, { locale: ptBR })
  } catch {
    return String(date)
  }
}

export function formatDateTime(date: string | Date): string {
  if (!date) return ''
  try {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  } catch {
    return String(date)
  }
}

export function formatRelativeDate(date: string | Date): string {
  if (!date) return ''
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
  } catch {
    return String(date)
  }
}
