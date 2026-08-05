'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { 
  Trophy, 
  Award, 
  Medal, 
  Printer, 
  Users, 
  Boxes, 
  TrendingUp, 
  UserX, 
  Calendar, 
  Layers,
  Sparkles,
  ShoppingBag
} from 'lucide-react'
import { formatNumber, formatArea } from '@/lib/utils/formatters'
import { useAuth } from '@/lib/hooks/useAuth'

type PeriodoMode = 'mes' | 'ano' | 'acumulado'

const MESES = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

export default function RankingVendedoresPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  
  const now = new Date()
  const [periodo, setPeriodo] = useState<PeriodoMode>('mes')
  const [mes, setMes] = useState<string>(String(now.getMonth() + 1))
  const [ano, setAno] = useState<string>(String(now.getFullYear()))
  
  const [ranking, setRanking] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadRanking = async () => {
    setLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: Record<string, string> = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const params = new URLSearchParams({
        periodo,
        mes,
        ano
      })

      const res = await fetch(`/api/reports/sellers-ranking?${params.toString()}`, { headers })
      const json = await res.json()
      if (res.ok && json.success) {
        setRanking(json.data || [])
        setSummary(json.summary || null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadRanking()
    }
  }, [isAdmin, authLoading, periodo, mes, ano])

  if (authLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <EmptyState 
          icon={UserX}
          title="Acesso Restrito"
          description="Apenas administradores podem visualizar o ranking de vendas dos vendedores."
        />
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  const primeirLugar = ranking[0] || null
  const segundoLugar = ranking[1] || null
  const terceiroLugar = ranking[2] || null

  const getPeriodoLabel = () => {
    if (periodo === 'mes') {
      const nomeMes = MESES.find(m => m.value === mes)?.label || ''
      return `${nomeMes} de ${ano}`
    }
    if (periodo === 'ano') {
      return `Ano de ${ano}`
    }
    return 'Acumulado Geral'
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 pb-24 print:bg-white print:p-0 print:pb-0">
      
      {/* Header hidden on print */}
      <div className="print:hidden">
        <Header 
          title="Ranking de Vendedores" 
          subtitle="Desempenho e volume de vendas de pisos por vendedor"
          actions={
            <Button 
              onClick={handlePrint}
              className="bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Imprimir Relatório
            </Button>
          }
        />
      </div>

      {/* Official Printable Header */}
      <div className="hidden print:block mb-6 text-center border-b border-slate-300 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold text-slate-900">ESTOQUE PISOS SÓ MADEIRAS</h1>
          </div>
          <span className="text-xs text-slate-500">
            Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </span>
        </div>
        <h2 className="text-lg font-semibold text-slate-700 uppercase tracking-wide">
          RANKING ESTRATÉGICO DE VENDEDORES — {getPeriodoLabel().toUpperCase()}
        </h2>
      </div>

      <main className="space-y-6 max-w-7xl mx-auto w-full">

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm w-full md:w-auto">
            <Calendar className="w-5 h-5 text-teal-700" />
            <span>Período do Ranking:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Mode selector tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setPeriodo('mes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-none ${
                  periodo === 'mes'
                    ? 'bg-teal-700 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📅 Por Mês
              </button>
              <button
                onClick={() => setPeriodo('ano')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-none ${
                  periodo === 'ano'
                    ? 'bg-teal-700 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🗓️ Por Ano
              </button>
              <button
                onClick={() => setPeriodo('acumulado')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-none ${
                  periodo === 'acumulado'
                    ? 'bg-teal-700 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏆 Acumulado
              </button>
            </div>

            {/* Month & Year Dropdowns */}
            {periodo === 'mes' && (
              <div className="w-32">
                <Select
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  options={MESES}
                />
              </div>
            )}

            {(periodo === 'mes' || periodo === 'ano') && (
              <div className="w-28">
                <Select
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  options={[
                    { value: '2024', label: '2024' },
                    { value: '2025', label: '2025' },
                    { value: '2026', label: '2026' },
                    { value: '2027', label: '2027' },
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        {/* Global Summary Statistics */}
        {!loading && summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Total Vendido no Período</p>
                  <p className="text-lg font-bold text-slate-800">
                    {formatNumber(summary.totalCaixasVendidas)} caixas
                  </p>
                  <p className="text-xs text-slate-400">Total de {formatArea(summary.totalAreaVendida)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Vendedor Líder</p>
                  <p className="text-lg font-bold text-slate-800 truncate">
                    {summary.lider?.nome || 'Nenhum'}
                  </p>
                  <p className="text-xs text-amber-600 font-semibold">
                    {summary.lider ? `${formatNumber(summary.lider.totalCaixas)} caixas (${summary.lider.pctTotal}%)` : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Total de Pedidos Retirados</p>
                  <p className="text-lg font-bold text-slate-800">
                    {summary.totalPedidos} pedido(s)
                  </p>
                  <p className="text-xs text-slate-400">{summary.totalVendedores} vendedor(es) ativos</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Podium for Top 3 (Only visible on screen) */}
        {!loading && ranking.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 print:hidden">
            
            {/* 2nd Place */}
            {segundoLugar ? (
              <Card className="border-t-4 border-t-slate-400 bg-white shadow-sm order-2 md:order-1 flex flex-col justify-between">
                <CardContent className="p-5 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-extrabold text-lg mb-2 shadow-inner">
                    🥈 2º
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">{segundoLugar.nome}</h3>
                  <p className="text-xs text-slate-500 mb-3">{segundoLugar.nomeExibicao}</p>

                  <div className="bg-slate-50 w-full rounded-lg p-3 text-sm border border-slate-100 space-y-1">
                    <p className="text-teal-700 font-bold text-base">{formatNumber(segundoLugar.totalCaixas)} caixas</p>
                    <p className="text-xs text-slate-500">{formatArea(segundoLugar.totalArea)}</p>
                    <p className="text-xs text-slate-400">{segundoLugar.totalPedidos} pedido(s) • ~{segundoLugar.mediaCaixasPorPedido} cx/ped</p>
                  </div>
                </CardContent>
              </Card>
            ) : <div className="order-2 md:order-1" />}

            {/* 1st Place */}
            {primeirLugar ? (
              <Card className="border-t-4 border-t-amber-500 bg-amber-50/40 shadow-md order-1 md:order-2 flex flex-col justify-between transform md:-translate-y-2">
                <CardContent className="p-6 text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xl mb-2 shadow-md">
                    🏆 1º
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg">{primeirLugar.nome}</h3>
                  <p className="text-xs text-amber-700 font-semibold mb-4">Campeão de Vendas!</p>

                  <div className="bg-white w-full rounded-xl p-4 text-sm border border-amber-200 shadow-sm space-y-1">
                    <p className="text-amber-600 font-extrabold text-xl">{formatNumber(primeirLugar.totalCaixas)} caixas</p>
                    <p className="text-xs text-slate-600 font-medium">{formatArea(primeirLugar.totalArea)}</p>
                    <p className="text-xs text-slate-500">{primeirLugar.totalPedidos} pedido(s) • ~{primeirLugar.mediaCaixasPorPedido} cx/ped</p>
                    <div className="pt-2 border-t border-amber-100 text-xs text-slate-500">
                      🏆 Piso Mais Vendido: <span className="font-semibold text-slate-800 block truncate">{primeirLugar.pisoMaisVendido}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : <div className="order-1 md:order-2" />}

            {/* 3rd Place */}
            {terceiroLugar ? (
              <Card className="border-t-4 border-t-amber-700 bg-white shadow-sm order-3 flex flex-col justify-between">
                <CardContent className="p-5 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100/60 text-amber-800 flex items-center justify-center font-extrabold text-lg mb-2 shadow-inner">
                    🥉 3º
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">{terceiroLugar.nome}</h3>
                  <p className="text-xs text-slate-500 mb-3">{terceiroLugar.nomeExibicao}</p>

                  <div className="bg-slate-50 w-full rounded-lg p-3 text-sm border border-slate-100 space-y-1">
                    <p className="text-teal-700 font-bold text-base">{formatNumber(terceiroLugar.totalCaixas)} caixas</p>
                    <p className="text-xs text-slate-500">{formatArea(terceiroLugar.totalArea)}</p>
                    <p className="text-xs text-slate-400">{terceiroLugar.totalPedidos} pedido(s) • ~{terceiroLugar.mediaCaixasPorPedido} cx/ped</p>
                  </div>
                </CardContent>
              </Card>
            ) : <div className="order-3" />}

          </div>
        )}

        {/* Main Ranking Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : ranking.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Nenhuma venda registrada no período"
            description={`Não foram encontradas baixas registradas para o período ${getPeriodoLabel()}.`}
          />
        ) : (
          <Card className="overflow-hidden border border-slate-200 shadow-sm print:border-none print:shadow-none">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 print:bg-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold text-center w-12">#</th>
                  <th className="px-4 py-3 font-bold">Vendedor</th>
                  <th className="px-4 py-3 font-bold text-right">Volume (Caixas)</th>
                  <th className="px-4 py-3 font-bold text-right">Área Total (m²)</th>
                  <th className="px-4 py-3 font-bold text-center">Nº Pedidos</th>
                  <th className="px-4 py-3 font-bold text-right">Média / Pedido</th>
                  <th className="px-4 py-3 font-bold">Piso Mais Vendido</th>
                  <th className="px-4 py-3 font-bold text-center w-36 print:hidden">Participação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {ranking.map((item, index) => {
                  const maxCaixas = ranking[0]?.totalCaixas || 1
                  const pctBar = Math.round((item.totalCaixas / maxCaixas) * 100)

                  return (
                    <tr key={item.vendedorId} className="hover:bg-slate-50/80 transition-colors print:hover:bg-white">
                      <td className="px-4 py-3 text-center font-bold text-slate-600">
                        {index === 0 ? '🏆 1º' : index === 1 ? '🥈 2º' : index === 2 ? '🥉 3º' : `${index + 1}º`}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{item.nome}</p>
                        {item.nomeExibicao && item.nomeExibicao !== item.nome && (
                          <p className="text-xs text-slate-500">Apelido: {item.nomeExibicao}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-teal-700">
                        {formatNumber(item.totalCaixas)} cx
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 font-medium">
                        {formatArea(item.totalArea)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {item.totalPedidos} pedido(s)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-indigo-700">
                        ~{item.mediaCaixasPorPedido} cx/ped
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium truncate max-w-xs">
                        {item.pisoMaisVendido}
                      </td>
                      <td className="px-4 py-3 text-center print:hidden">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1">
                          <div 
                            className="bg-teal-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${pctBar}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">{item.pctTotal}% do total</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        )}
      </main>

      {/* Printable Footer */}
      <div className="hidden print:block mt-8 text-xs text-slate-500 text-center border-t border-slate-300 pt-3">
        <p>Relatório Interno Estratégico de Ranking de Vendedores - Estoque Pisos Só Madeiras</p>
      </div>

    </div>
  )
}
