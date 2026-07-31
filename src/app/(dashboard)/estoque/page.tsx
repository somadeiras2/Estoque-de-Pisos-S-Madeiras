'use client'

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Filter, LayoutList, LayoutGrid as GridIcon, Search, X } from 'lucide-react';
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
import { useAuth } from '@/lib/hooks/useAuth';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { getPisos } from '@/lib/services/pisos';
import { getStockStatus } from '@/lib/utils/calculations';
import { formatArea } from '@/lib/utils/formatters';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function EstoquePage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pisos, setPisos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
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
      setLoading(true);
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

  const StatusBadge = ({ caixas, minimo }: { caixas: number, minimo: number }) => {
    const status = getStockStatus(caixas, minimo);
    return <StockBadge status={status} />;
  };

  return (
    <div className="flex flex-col gap-6 min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center">
        <Header title="Estoque" />
        {isAdmin && (
          <Button onClick={() => router.push('/cadastro')} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="w-4 h-4" /> Novo Piso
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
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
                {piso.imagemUrl ? (
                  <Image src={piso.imagemUrl} alt={piso.nome} fill className="object-cover" />
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
                <div className="flex gap-2 mt-2">
                  <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => router.push(`/baixa?piso=${piso.id}`)}>
                    Dar Baixa
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => router.push(isAdmin ? `/cadastro/${piso.id}` : `/estoque/${piso.id}`)}>
                    Detalhes
                  </Button>
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
                      {piso.imagemUrl ? <Image src={piso.imagemUrl} width={40} height={40} alt="" /> : <Layers className="w-5 h-5 text-slate-300" />}
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
  );
}
