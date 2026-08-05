'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Trophy, Printer, Users, Boxes, TrendingUp, BarChart2, Lightbulb, Package, Layers } from 'lucide-react'
import { formatNumber, formatArea } from '@/lib/utils/formatters'
import { useIsMobile } from '@/lib/hooks/useMediaQuery'

import { useAuth } from '@/lib/hooks/useAuth'

type SortMode = 'volume' | 'pedidos' | 'media'

export default function MaisVendidosPage() {
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState<SortMode>('volume')
  const isMobile = useIsMobile()

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const headers: Record<string, string> = {}
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
        const res = await fetch('/api/reports/strategic', { headers })
        const json = await res.json()
        if (res.ok && json.success) {
          setData(json.data || [])
          setSummary(json.summary || null)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  // Sort data based on strategic metric
  const sortedData = [...data].sort((a, b) => {
    if (sortMode === 'pedidos') {
      if (b.pedidosCount !== a.pedidosCount) return b.pedidosCount - a.pedidosCount
      return b.totalCaixas - a.totalCaixas
    }
    if (sortMode === 'media') {
      if (b.mediaCaixasPorPedido !== a.mediaCaixasPorPedido) return b.mediaCaixasPorPedido - a.mediaCaixasPorPedido
      return b.totalCaixas - a.totalCaixas
    }
    // Default: volume (totalCaixas)
    return b.totalCaixas - a.totalCaixas
  })

  // Insights computation
  const liderVolume = data.length > 0 ? [...data].sort((a, b) => b.totalCaixas - a.totalCaixas)[0] : null
  const maisPopular = data.length > 0 ? [...data].sort((a, b) => b.pedidosCount - a.pedidosCount)[0] : null
  const maiorMedia = data.length > 0 ? [...data].sort((a, b) => b.mediaCaixasPorPedido - a.mediaCaixasPorPedido)[0] : null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 pb-24 print:bg-white print:p-0 print:pb-0">
      
      {/* Header hidden on print */}
      <div className="print:hidden">
        <Header 
          title="Relatório Estratégico de Vendas" 
          subtitle="Análise de volume, frequência de clientes e recorrência de pedidos"
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

      {/* Official Printable Document Header (Only visible on print) */}
      <div className="hidden print:block mb-6 text-center border-b border-slate-300 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-teal-700" />
            <h1 className="text-xl font-bold text-slate-900">ESTOQUE PISOS SÓ MADEIRAS</h1>
          </div>
          <span className="text-xs text-slate-500">
            Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </span>
        </div>
        <h2 className="text-lg font-semibold text-slate-700 uppercase tracking-wide">
          RELATÓRIO ESTRATÉGICO DE DESEMPENHO E RECORRÊNCIA DE VENDAS
        </h2>
      </div>

      <main className="space-y-6 max-w-7xl mx-auto w-full">

        {/* Strategic Cards - Volume vs Popularity */}
        {!loading && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
            
            {/* Lider Volume */}
            <Card className="border-l-4 border-l-teal-600 bg-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-teal-50 rounded-xl text-teal-700 shrink-0">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Maior Volume (Caixas)</p>
                  <h3 className="font-bold text-slate-800 text-base truncate">{liderVolume?.nome || '-'}</h3>
                  <p className="text-sm text-teal-700 font-semibold">{formatNumber(liderVolume?.totalCaixas || 0)} caixas ({formatArea(liderVolume?.totalArea || 0)})</p>
                  <p className="text-xs text-slate-400">Vendido em {liderVolume?.pedidosCount} pedido(s)</p>
                </div>
              </CardContent>
            </Card>

            {/* Mais Popular */}
            <Card className="border-l-4 border-l-amber-500 bg-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Mais Popular (Mais Clientes)</p>
                  <h3 className="font-bold text-slate-800 text-base truncate">{maisPopular?.nome || '-'}</h3>
                  <p className="text-sm text-amber-600 font-semibold">Vendido para {maisPopular?.pedidosCount} pedido(s) distintos!</p>
                  <p className="text-xs text-slate-400">Total de {formatNumber(maisPopular?.totalCaixas || 0)} caixas</p>
                </div>
              </CardContent>
            </Card>

            {/* Maior Média */}
            <Card className="border-l-4 border-l-indigo-500 bg-white shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Maior Média por Pedido</p>
                  <h3 className="font-bold text-slate-800 text-base truncate">{maiorMedia?.nome || '-'}</h3>
                  <p className="text-sm text-indigo-600 font-semibold">~{maiorMedia?.mediaCaixasPorPedido} cx / pedido</p>
                  <p className="text-xs text-slate-400">{maiorMedia?.pedidosCount} pedido(s) no total</p>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Filter Controls (Hidden on print) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
          <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <span>Ordenar relatório por:</span>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSortMode('volume')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortMode === 'volume' 
                  ? 'bg-teal-700 text-white shadow' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📦 Volume (Caixas)
            </button>
            <button
              onClick={() => setSortMode('pedidos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortMode === 'pedidos' 
                  ? 'bg-amber-600 text-white shadow' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              👥 Frequência (Nº de Pedidos/Clientes)
            </button>
            <button
              onClick={() => setSortMode('media')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortMode === 'media' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📊 Média (Caixas/Pedido)
            </button>
          </div>
        </div>

        {/* Table & List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : sortedData.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Nenhuma saída registrada"
            description="Não foram encontradas baixas registradas para compor o relatório."
          />
        ) : (
          <Card className="overflow-hidden border border-slate-200 shadow-sm print:border-none print:shadow-none">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 print:bg-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold text-center w-12">#</th>
                  <th className="px-4 py-3 font-bold">Piso / Marca</th>
                  <th className="px-4 py-3 font-bold text-right">Volume (Caixas)</th>
                  <th className="px-4 py-3 font-bold text-right">Área Total</th>
                  <th className="px-4 py-3 font-bold text-center">Nº Pedidos / Clientes</th>
                  <th className="px-4 py-3 font-bold text-right">Média p/ Pedido</th>
                  <th className="px-4 py-3 font-bold text-center print:table-cell">Diagnóstico Estratégico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {sortedData.map((item, index) => {
                  const isMultiCliente = item.pedidosCount > 1
                  const isHighVolume = item.totalCaixas >= 40

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors print:hover:bg-white">
                      <td className="px-4 py-3 text-center font-bold text-slate-500">
                        {index + 1}º
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{item.nome}</p>
                        <p className="text-xs text-slate-500">{item.marca} • Dim: {item.dimensao || 'N/A'} • Cód: {item.codigo || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-teal-700">
                        {formatNumber(item.totalCaixas)} cx
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 font-medium">
                        {formatArea(item.totalArea)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isMultiCliente 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.pedidosCount} pedido(s)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-indigo-700">
                        ~{item.mediaCaixasPorPedido} cx/ped
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {isMultiCliente && isHighVolume ? (
                          <span className="text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                            🔥 Alta Demanda & Recorrência
                          </span>
                        ) : isMultiCliente ? (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                            ⭐ Popular ({item.pedidosCount} clientes)
                          </span>
                        ) : (
                          <span className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            📦 Venda Pontual (1 cliente)
                          </span>
                        )}
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
        <p>Relatório Interno Estratégico de Desempenho de Vendas - Estoque Pisos Só Madeiras</p>
      </div>

    </div>
  )
}
