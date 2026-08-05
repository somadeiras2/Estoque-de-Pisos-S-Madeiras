'use client'

import React, { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Search, RotateCcw, Boxes, Calendar, User, PackageCheck } from 'lucide-react'
import { formatArea, formatDate } from '@/lib/utils/formatters'

export default function DevolucaoPage() {
  const { toast } = useToast()
  const [pedidoQuery, setPedidoQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [items, setItems] = useState<any[]>([])

  // Modal confirm state
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [qtdDevolver, setQtdDevolver] = useState<number>(1)
  const [observacao, setObservacao] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!pedidoQuery.trim()) {
      toast({ title: 'Atenção', description: 'Informe o número do pedido para buscar.', variant: 'warning' })
      return
    }

    setLoading(true)
    setHasSearched(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      const res = await fetch(`/api/devolucao/search?pedido=${encodeURIComponent(pedidoQuery.trim())}`, { headers })
      const json = await res.json()
      if (res.ok && json.success) {
        setItems(json.data || [])
      } else {
        toast({ title: 'Erro', description: json.error || 'Erro ao buscar pedido.', variant: 'danger' })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro', description: 'Falha na comunicação com o servidor.', variant: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  const openReturnModal = (item: any) => {
    setSelectedItem(item)
    setQtdDevolver(item.quantidadeBaixada)
    setObservacao('')
  }

  const handleConfirmReturn = async () => {
    if (!selectedItem) return
    if (qtdDevolver <= 0 || qtdDevolver > selectedItem.quantidadeBaixada) {
      toast({ title: 'Quantidade Inválida', description: `Digite entre 1 e ${selectedItem.quantidadeBaixada} caixas.`, variant: 'danger' })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/devolucao/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          piso_id: selectedItem.piso_id,
          quantidade_caixas: qtdDevolver,
          numero_pedido: selectedItem.numeroPedido,
          observacao: observacao || `Devolução de ${qtdDevolver} caixas do Pedido ${selectedItem.numeroPedido}`
        })
      })

      const json = await res.json()
      if (res.ok && json.success) {
        toast({
          title: 'Devolução Realizada!',
          description: `${qtdDevolver} caixas do piso ${selectedItem.pisoNome} retornaram ao estoque com sucesso.`,
          variant: 'success'
        })
        setSelectedItem(null)
        // Refresh search results
        handleSearch()
      } else {
        toast({ title: 'Erro', description: json.error || 'Não foi possível processar a devolução.', variant: 'danger' })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro', description: 'Erro ao processar devolução.', variant: 'danger' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 pb-24">
      <Header title="Devolução de Piso" subtitle="Digite o número do pedido para devolver caixas ao estoque" />

      {/* Search Bar Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Input
                value={pedidoQuery}
                onChange={(e: any) => setPedidoQuery(e.target.value)}
                placeholder="Digite o número do pedido (Ex: 1042)..."
                className="pl-10 text-base"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white min-w-[140px]" loading={loading}>
              <RotateCcw className="w-4 h-4 mr-2" /> Buscar Pedido
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Section */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : hasSearched && items.length === 0 ? (
        <EmptyState
          title="Nenhum item encontrado para este pedido"
          description="Verifique se o número do pedido foi digitado corretamente."
          icon={Search}
        />
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <Card key={item.id} className="overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                    {item.imagemUrl ? (
                      <img src={item.imagemUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Boxes className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                      Pedido #{item.numeroPedido}
                    </span>
                    <h3 className="font-semibold text-slate-800 text-base">{item.pisoNome}</h3>
                    <p className="text-xs text-slate-500">{item.marca} • Cod: {item.codigo || 'N/A'}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1"><Boxes className="w-3.5 h-3.5 text-slate-400" /> Baixa: <b>{item.quantidadeBaixada} caixas</b> ({formatArea(item.quantidadeBaixada * item.metrosPorCaixa)})</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(item.dataBaixa)}</span>
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> {item.vendedorNome}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-slate-500">Estoque atual</p>
                    <p className="font-bold text-slate-800 text-base">{item.estoqueAtual} cx</p>
                  </div>
                  <Button
                    onClick={() => openReturnModal(item)}
                    className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Devolver ao Estoque
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Return Modal */}
      {selectedItem && (
        <ConfirmDialog
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onConfirm={handleConfirmReturn}
          title={`Devolver Piso ao Estoque`}
          description={
            <div className="space-y-4 text-left text-slate-700">
              <p>
                Você está devolvendo caixas do piso <b>{selectedItem.pisoNome}</b> referentes ao <b>Pedido #{selectedItem.numeroPedido}</b>.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Quantidade de caixas a devolver (máx: {selectedItem.quantidadeBaixada}):</label>
                <Input
                  type="number"
                  min={1}
                  max={selectedItem.quantidadeBaixada}
                  value={qtdDevolver}
                  onChange={(e: any) => setQtdDevolver(Number(e.target.value))}
                  className="font-bold text-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Observação (opcional):</label>
                <textarea
                  value={observacao}
                  onChange={(e: any) => setObservacao(e.target.value)}
                  placeholder="Motivo da desistência ou observações adicionais..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={2}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 shrink-0 text-amber-600" />
                <span>
                  O estoque atual ({selectedItem.estoqueAtual} caixas) passará a ser <b>{selectedItem.estoqueAtual + (Number(qtdDevolver) || 0)} caixas</b>.
                </span>
              </div>
            </div>
          }
          confirmText="Confirmar Devolução"
          cancelText="Cancelar"
          variant="warning"
          loading={isSubmitting}
        />
      )}
    </div>
  )
}
