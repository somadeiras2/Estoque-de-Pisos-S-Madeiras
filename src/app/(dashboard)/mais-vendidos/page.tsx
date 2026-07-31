'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getMaisVendidos } from '@/lib/services/dashboard';
import { formatNumber, formatArea } from '@/lib/utils/formatters';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

const PERIOD_OPTIONS = [
  { label: 'Hoje', value: 'hoje' },
  { label: 'Últimos 7 dias', value: '7dias' },
  { label: 'Últimos 30 dias', value: '30dias' },
  { label: 'Últimos 90 dias', value: '90dias' },
  { label: 'Este Ano', value: 'ano' },
];

export default function MaisVendidosPage() {
  const [periodo, setPeriodo] = useState('30dias');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getMaisVendidos(periodo);
        setData(result || []);
      } catch (error) {
        toast({ title: 'Erro', description: 'Não foi possível carregar os dados.', variant: 'danger' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [periodo, toast]);

  const getPositionStyle = (index: number) => {
    switch(index) {
      case 0: return 'bg-amber-100 text-amber-600 border-amber-200';
      case 1: return 'bg-slate-200 text-slate-600 border-slate-300';
      case 2: return 'bg-amber-700/20 text-amber-800 border-amber-800/30';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-10">
      <Header 
        title="Mais Vendidos" 
        actions={
          <div className="w-40">
            <Select 
              value={periodo} 
              onChange={(e) => setPeriodo(e.target.value)}
              options={PERIOD_OPTIONS}
            />
          </div>
        }
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : data.length === 0 ? (
          <EmptyState 
            icon={Trophy}
            title="Nenhuma venda registrada"
            description="Não houve movimentações de saída no período selecionado."
          />
        ) : (
          <>
            <Card className="p-4 md:p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Top 10 Produtos (Caixas)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="nome" type="category" width={isMobile ? 80 : 150} tick={{fontSize: 12}} />
                    <Tooltip 
                      formatter={(value) => [`${value} caixas`, 'Vendas']}
                      contentStyle={{ borderRadius: '8px' }}
                    />
                    <Bar dataKey="total_caixas" radius={[0, 4, 4, 0]}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index < 3 ? '#0F766E' : '#94A3B8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800 px-1">Ranking Detalhado</h3>
              
              {isMobile ? (
                <div className="flex flex-col gap-3">
                  {data.map((item, index) => (
                    <Card key={item.id} className="p-4 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${getPositionStyle(index)}`}>
                        {index + 1}º
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{item.nome}</p>
                        <p className="text-xs text-slate-500">Cód: {item.codigo}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm">
                          <span className="font-medium text-teal-700">{formatNumber(item.total_caixas)} cx</span>
                          <span className="text-slate-500">{formatArea(item.total_area)} m²</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 flex flex-col items-end">
                        <span>{item.pedidos_count}</span>
                        <span>pedidos</span>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 font-medium">Posição</th>
                        <th className="px-6 py-3 font-medium">Produto</th>
                        <th className="px-6 py-3 font-medium text-right">Caixas Vendidas</th>
                        <th className="px-6 py-3 font-medium text-right">Área Total (m²)</th>
                        <th className="px-6 py-3 font-medium text-right">Nº de Pedidos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs border ${getPositionStyle(index)}`}>
                              {index + 1}º
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-800">{item.nome}</p>
                            <p className="text-xs text-slate-500">Cód: {item.codigo}</p>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-teal-700">
                            {formatNumber(item.total_caixas)} cx
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">
                            {formatArea(item.total_area)} m²
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">
                            {item.pedidos_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
