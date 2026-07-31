'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { Search, Filter, History, ChevronDown, ChevronUp } from 'lucide-react';
import { getMovimentacoes } from '@/lib/services/movimentacoes';
import { getVendedores } from '@/lib/services/vendedores';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatDateTime, formatArea } from '@/lib/utils/formatters';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { Movimentacao } from '@/lib/types';

export default function HistoricoPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [data, setData] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendedores, setVendedores] = useState<{label: string, value: string}[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    tipo: '',
    vendedor_id: '',
    pedido: '',
    data_inicio: '',
    data_fim: ''
  });
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getMovimentacoes({ ...filters, page, limit: 20 });
      setData(res?.data || []);
      setTotalPages(res?.totalPages || 1);
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar histórico', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      getVendedores().then(res => {
        const list = Array.isArray(res) ? res : (res as any)?.data || [];
        setVendedores(list.map((vd: any) => ({ label: vd.nome_exibicao || vd.nome, value: vd.id })));
      }).catch(() => {});
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [page]); // Re-fetch on page change

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const clearFilters = () => {
    setFilters({ tipo: '', vendedor_id: '', pedido: '', data_inicio: '', data_fim: '' });
    setPage(1);
    // Needs immediate timeout or effect to load with cleared filters, but state updates are batched.
    setTimeout(loadData, 0); 
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA': return <Badge variant="success">Entrada</Badge>;
      case 'BAIXA': return <Badge variant="destructive">Baixa</Badge>;
      case 'AJUSTE': return <Badge variant="warning">Ajuste</Badge>;
      default: return <Badge>{tipo}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-10">
      <Header title="Histórico de Movimentações" />
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <Card className="p-4">
          <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="lg:col-span-1">
              <label className="text-xs text-slate-500 mb-1 block">Tipo</label>
              <Select 
                value={filters.tipo} 
                onChange={(e) => setFilters({...filters, tipo: e.target.value})}
                options={[
                  { label: 'Todos', value: '' },
                  { label: 'Entrada', value: 'ENTRADA' },
                  { label: 'Baixa (Venda)', value: 'BAIXA' },
                  { label: 'Ajuste', value: 'AJUSTE' }
                ]}
              />
            </div>
            
            {isAdmin && (
              <div className="lg:col-span-1">
                <label className="text-xs text-slate-500 mb-1 block">Vendedor</label>
                <Select 
                  value={filters.vendedor_id} 
                  onChange={(e) => setFilters({...filters, vendedor_id: e.target.value})}
                  options={[{ label: 'Todos', value: '' }, ...vendedores]}
                />
              </div>
            )}
            
            <div className="lg:col-span-1">
              <label className="text-xs text-slate-500 mb-1 block">Nº Pedido</label>
              <Input 
                placeholder="Busca..." 
                value={filters.pedido}
                onChange={(e) => setFilters({...filters, pedido: e.target.value})}
              />
            </div>
            
            <div className="lg:col-span-1">
              <label className="text-xs text-slate-500 mb-1 block">Data Inicial</label>
              <Input 
                type="date"
                value={filters.data_inicio}
                onChange={(e) => setFilters({...filters, data_inicio: e.target.value})}
              />
            </div>
            
            <div className="lg:col-span-1">
              <label className="text-xs text-slate-500 mb-1 block">Data Final</label>
              <Input 
                type="date"
                value={filters.data_fim}
                onChange={(e) => setFilters({...filters, data_fim: e.target.value})}
              />
            </div>
            
            <div className="lg:col-span-1 flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={clearFilters}>Limpar</Button>
              <Button type="submit" className="flex-1"><Search className="w-4 h-4" /></Button>
            </div>
          </form>
        </Card>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : data.length === 0 ? (
          <EmptyState 
            icon={History}
            title="Nenhuma movimentação"
            description="Não encontramos registros com os filtros atuais."
          />
        ) : (
          <div className="space-y-3">
            {isMobile ? (
              // Mobile Cards
              data.map((item: any) => {
                const tipo = item.tipo_movimentacao || item.tipo || 'baixa';
                const qtd = item.quantidade_caixas ?? item.quantidade ?? 0;
                const m2 = item.metros_quadrados ?? (qtd * (item.pisos?.metros_por_caixa || 0));
                const sAnt = item.estoque_anterior ?? item.saldo_anterior ?? 0;
                const sPos = item.estoque_posterior ?? item.saldo_atual ?? 0;
                const vend = item.vendedor?.nome || item.profiles?.nome || item.vendedores?.nome || '-';

                return (
                  <Card key={item.id} className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-slate-500">{formatDateTime(item.created_at)}</p>
                        <p className="font-medium text-slate-800 line-clamp-1">{item.pisos?.nome || 'Piso'}</p>
                      </div>
                      {getTipoBadge(tipo)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-2 rounded">
                      <div>
                        <span className="text-slate-500 block text-xs">Quantidade</span>
                        <span className="font-medium">{qtd} cx</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs">Área</span>
                        <span className="font-medium">{formatArea(m2)}</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-xs" 
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      {expandedId === item.id ? 'Ocultar detalhes' : 'Ver detalhes'}
                    </Button>
                    
                    {expandedId === item.id && (
                      <div className="text-xs space-y-2 border-t pt-2 mt-2">
                        <p><strong>Estoque:</strong> {sAnt} → {sPos} cx</p>
                        {item.numero_pedido && <p><strong>Pedido:</strong> {item.numero_pedido}</p>}
                        {vend !== '-' && <p><strong>Vendedor:</strong> {vend}</p>}
                        {item.motivo && <p><strong>Motivo:</strong> {item.motivo}</p>}
                        {item.observacao && <p><strong>Obs:</strong> {item.observacao}</p>}
                      </div>
                    )}
                  </Card>
                );
              })
            ) : (
              // Desktop Table
              <Card className="overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium">Data/Hora</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Produto</th>
                      <th className="px-4 py-3 font-medium text-right">Qtd (cx)</th>
                      <th className="px-4 py-3 font-medium text-right">Área (m²)</th>
                      <th className="px-4 py-3 font-medium text-center">Pedido</th>
                      <th className="px-4 py-3 font-medium text-center">Vendedor</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((item: any) => {
                      const tipo = item.tipo_movimentacao || item.tipo || 'baixa';
                      const qtd = item.quantidade_caixas ?? item.quantidade ?? 0;
                      const m2 = item.metros_quadrados ?? (qtd * (item.pisos?.metros_por_caixa || 0));
                      const sAnt = item.estoque_anterior ?? item.saldo_anterior ?? 0;
                      const sPos = item.estoque_posterior ?? item.saldo_atual ?? 0;
                      const vend = item.vendedor?.nome || item.profiles?.nome || item.vendedores?.nome || '-';

                      return (
                        <React.Fragment key={item.id}>
                          <tr className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-600">{formatDateTime(item.created_at)}</td>
                            <td className="px-4 py-3">{getTipoBadge(tipo)}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{item.pisos?.nome || 'Piso'}</td>
                            <td className="px-4 py-3 text-right font-medium">{qtd}</td>
                            <td className="px-4 py-3 text-right text-slate-600">
                              {formatArea(m2)}
                            </td>
                            <td className="px-4 py-3 text-center">{item.numero_pedido || '-'}</td>
                            <td className="px-4 py-3 text-center">{vend}</td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                                {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                            </td>
                          </tr>
                          {expandedId === item.id && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={8} className="px-4 py-3 border-l-2 border-teal-500">
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                  <div><span className="font-medium text-slate-500">Estoque (cx):</span> {sAnt} → {sPos}</div>
                                  {item.motivo && <div><span className="font-medium text-slate-500">Motivo:</span> {item.motivo}</div>}
                                  {item.observacao && <div className="col-span-3"><span className="font-medium text-slate-500">Observação:</span> {item.observacao}</div>}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            )}
            
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
