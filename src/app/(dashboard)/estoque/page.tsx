'use client'

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Filter, LayoutList, LayoutGrid as GridIcon, Search, X, Trash2, Printer, Package } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge, StockBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { getPisos, deletePiso } from '@/lib/services/pisos';
import { getStockStatus } from '@/lib/utils/calculations';
import { formatArea, formatNumber } from '@/lib/utils/formatters';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function EstoquePage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pisos, setPisos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [pisoToDelete, setPisoToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [filters, setFilters] = useState({
    marca: '',
    tipo: '',
    cor: '',
    dimensao: '',
    status: ''
  });

  useEffect(() => {
    if (!isDesktop) setViewMode('grid');
  }, [isDesktop]);

  useEffect(() => {
    const fetchPisos = async () => {
      if (pisos.length === 0) setLoading(true);
      try {
        const data = await getPisos({ search: debouncedSearch, ...filters });
        setPisos(data || []);
      } catch (error) {
        console.error('Erro ao buscar pisos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPisos();
  }, [debouncedSearch, filters]);

  const clearFilters = () => {
    setFilters({ marca: '', tipo: '', cor: '', dimensao: '', status: '' });
    setSearchTerm('');
  };

  const handlePrint = () => {
    window.print();
  };

  const StatusBadge = ({ caixas, minimo }: { caixas: number, minimo: number }) => {
    const status = getStockStatus(caixas, minimo);
    return <StockBadge status={status} />;
  };

  const handleConfirmDelete = async () => {
    if (!pisoToDelete) return;
    setIsDeleting(true);
    try {
      await deletePiso(pisoToDelete.id);
      toast({ title: 'Excluído', description: `Piso ${pisoToDelete.nome} excluído com sucesso.`, variant: 'success' });
      setPisos(prev => prev.filter(p => p.id !== pisoToDelete.id));
    } catch (error: any) {
      toast({ title: 'Erro', description: error?.message || 'Erro ao excluir piso.', variant: 'danger' });
    } finally {
      setIsDeleting(false);
      setPisoToDelete(null);
    }
  };

  const totalGlobalCaixas = pisos.reduce((acc, p) => acc + (p.caixas || 0), 0);
  const totalGlobalArea = pisos.reduce((acc, p) => acc + ((p.caixas || 0) * (p.m2PorCaixa || 0)), 0);

  return (
    <div className="flex flex-col gap-6 min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 pb-24 print:bg-white print:p-0 print:pb-0">
      
      {/* Header (Hidden on print) */}
      <div className="print:hidden flex justify-between items-center">
        <Header title="Estoque" />
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2 text-teal-700 border-teal-700 hover:bg-teal-50 shadow-sm">
            <Printer className="w-4 h-4" /> Imprimir Relatório de Estoque
          </Button>
          <Button onClick={() => router.push('/cadastro')} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
            <Plus className="w-4 h-4" /> Novo Piso
          </Button>
        </div>
      </div>

      {/* Official Printable Header (Visible only on print) */}
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
          RELATÓRIO OFICIAL DE ESTOQUE DE PISOS DISPONÍVEIS
        </h2>
        <div className="mt-2 text-xs text-slate-600 flex justify-center gap-6">
          <span>Total de Modelos: <strong>{pisos.length}</strong></span>
          <span>Total de Caixas em Estoque: <strong>{formatNumber(totalGlobalCaixas)} cx</strong></span>
          <span>Área Total Disponível: <strong>{formatArea(totalGlobalArea)}</strong></span>
        </div>
      </div>

      {/* Filter and Search Bar (Hidden on print) */}
      <div className="flex flex-col md:flex-row gap-4 items-center print:hidden">
        <div className="flex-1 w-full">
          <SearchInput 
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, marca ou código (use % para busca avançada)"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex-1 md:flex-none flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filtros
          </Button>
          {isDesktop && (
            <div className="flex bg-white rounded-xl border border-slate-200 p-1">
              <Button variant={viewMode === 'grid' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="px-2">
                <GridIcon className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="px-2">
                <LayoutList className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {showFilters && (
        <Card className="shadow-sm">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Marca</label>
              <Input value={filters.marca} onChange={(e: any) => setFilters({...filters, marca: e.target.value})} placeholder="Ex: Eliane" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Tipo</label>
              <Select value={filters.tipo} onChange={(e: any) => setFilters({...filters, tipo: e.target.value})} options={[{value:'', label:'Todos'}, {value:'Porcelanato', label:'Porcelanato'}, {value:'Cerâmica', label:'Cerâmica'}]} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Cor</label>
              <Input value={filters.cor} onChange={(e: any) => setFilters({...filters, cor: e.target.value})} placeholder="Ex: Branco" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Dimensão</label>
              <Input value={filters.dimensao} onChange={(e: any) => setFilters({...filters, dimensao: e.target.value})} placeholder="Ex: 60x60" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
              <Select value={filters.status} onChange={(e: any) => setFilters({...filters, status: e.target.value})} options={[{value:'', label:'Todos'}, {value:'Normal', label:'Normal'}, {value:'Baixo', label:'Baixo'}, {value:'Crítico', label:'Crítico'}, {value:'Sem Estoque', label:'Sem Estoque'}]} />
            </div>
            <div className="md:col-span-3 lg:col-span-5 flex justify-end">
              <Button variant="ghost" onClick={clearFilters} className="text-slate-500">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Web View (Grid/List) - Hidden on print */}
      <div className="print:hidden">
        {loading ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className={viewMode === 'grid' ? "h-80 w-full" : "h-20 w-full"} />)}
          </div>
        ) : pisos.length === 0 ? (
          <EmptyState title="Nenhum piso encontrado" description="Tente ajustar os filtros ou termo de busca." icon={Search} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pisos.map(piso => (
              <Card key={piso.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-slate-100 relative flex items-center justify-center border-b border-slate-200">
                  {(piso.imagemUrl || piso.imagem_url) ? (
                    <img 
                      src={piso.imagemUrl || piso.imagem_url} 
                      alt={piso.nome} 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>';
                      }}
                    />
                  ) : (
                    <Layers className="w-12 h-12 text-slate-300" />
                  )}
                  <div className="absolute top-2 right-2">
                    <StatusBadge caixas={piso.caixas} minimo={piso.estoqueMinimo} />
                  </div>
                </div>
                <CardContent className="p-4 flex flex-col gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-800 line-clamp-1">{piso.nome}</h3>
                    <p className="text-sm text-slate-500">{piso.marca} • Cod: {piso.codigo}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between font-medium mb-1">
                      <span className="text-slate-600">Estoque:</span>
                      <span className="text-slate-800">{piso.caixas} caixas</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-xs">
                      <span>{formatArea(piso.m2PorCaixa)}/cx</span>
                      <span>Total: {formatArea(piso.caixas * piso.m2PorCaixa)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold whitespace-nowrap h-9" 
                      onClick={() => router.push(`/baixa?piso=${piso.id}`)}
                    >
                      Dar Baixa
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-slate-700 border-slate-300 hover:bg-slate-50 text-xs font-semibold whitespace-nowrap h-9" 
                      onClick={() => router.push(isAdmin ? `/cadastro/${piso.id}` : `/estoque/${piso.id}`)}
                    >
                      Detalhes
                    </Button>
                    {isAdmin && (
                      <Button 
                        size="sm" 
                        variant="danger" 
                        className="w-9 h-9 p-0 shrink-0 flex items-center justify-center rounded-lg" 
                        title="Excluir Piso" 
                        onClick={() => setPisoToDelete(piso)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4">Foto</th>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Caixas</th>
                  <th className="px-6 py-4">m²/cx</th>
                  <th className="px-6 py-4">Total m²</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pisos.map(piso => (
                  <tr key={piso.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <div className="w-10 h-10 bg-slate-100 rounded overflow-hidden flex items-center justify-center">
                        {(piso.imagemUrl || piso.imagem_url) ? (
                          <img 
                            src={piso.imagemUrl || piso.imagem_url} 
                            alt={piso.nome} 
                            className="w-10 h-10 object-cover rounded" 
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Layers className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 font-medium">{piso.nome}</td>
                    <td className="px-6 py-3 text-slate-500">{piso.codigo}</td>
                    <td className="px-6 py-3 font-semibold">{piso.caixas}</td>
                    <td className="px-6 py-3 text-slate-500">{formatArea(piso.m2PorCaixa)}</td>
                    <td className="px-6 py-3">{formatArea(piso.caixas * piso.m2PorCaixa)}</td>
                    <td className="px-6 py-3"><StatusBadge caixas={piso.caixas} minimo={piso.estoqueMinimo} /></td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(isAdmin ? `/cadastro/${piso.id}` : `/estoque/${piso.id}`)}>Ver</Button>
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => router.push(`/baixa?piso=${piso.id}`)}>Baixa</Button>
                        <Button variant="danger" size="sm" onClick={() => setPisoToDelete(piso)} title="Excluir"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pisos.length > 0 && <Pagination className="mt-4" />}
      </div>

      {/* Official Printable Table (Visible only on print) */}
      {!loading && pisos.length > 0 && (
        <div className="hidden print:block border border-slate-300 rounded-lg overflow-hidden">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
              <tr>
                <th className="px-3 py-2 text-center w-8">#</th>
                <th className="px-3 py-2">Piso / Marca</th>
                <th className="px-3 py-2">Código / Dimensão</th>
                <th className="px-3 py-2 text-right">Caixas em Estoque</th>
                <th className="px-3 py-2 text-right">Rendimento (m²/cx)</th>
                <th className="px-3 py-2 text-right">Total m² Disponíveis</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pisos.map((piso, idx) => (
                <tr key={piso.id}>
                  <td className="px-3 py-2 text-center font-semibold text-slate-500">{idx + 1}</td>
                  <td className="px-3 py-2 font-bold text-slate-900">
                    {piso.nome}
                    <span className="block text-[10px] text-slate-500 font-normal">{piso.marca || 'Marca N/A'}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {piso.codigo || '-'} • {piso.dimensao || '-'}
                  </td>
                  <td className="px-3 py-2 text-right font-extrabold text-teal-800">
                    {formatNumber(piso.caixas)} cx
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {formatArea(piso.m2PorCaixa)}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">
                    {formatArea(piso.caixas * piso.m2PorCaixa)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <StatusBadge caixas={piso.caixas} minimo={piso.estoqueMinimo} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Printable Footer */}
      <div className="hidden print:block mt-8 text-xs text-slate-500 text-center border-t border-slate-300 pt-3">
        <p>Relatório Interno Oficial de Estoque Atual - Estoque Pisos Só Madeiras</p>
      </div>

      <ConfirmDialog
        isOpen={!!pisoToDelete}
        onClose={() => setPisoToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Piso"
        description={`Tem certeza que deseja excluir o piso "${pisoToDelete?.nome}"? Esta ação removerá o piso do estoque.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
