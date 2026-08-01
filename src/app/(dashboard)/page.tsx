'use client'

import React, { useState, useEffect } from 'react';
import { LayoutGrid, Boxes, Ruler, AlertTriangle, ArrowDownCircle, Trophy } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { formatNumber, formatArea, formatDate } from '@/lib/utils/formatters';
import { getDashboardStats, getSalesChart, getTopPisos, getRecentMovements } from '@/lib/services/dashboard';

export default function DashboardPage() {
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const stats = await getDashboardStats(period);
        const salesChart = await getSalesChart(period);
        const topPisos = await getTopPisos(period);
        const recentMovements = await getRecentMovements();
        
        setData({ stats, salesChart, topPisos, recentMovements });
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [period]);

  const periods = [
    { value: 'hoje', label: 'Hoje' },
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: 'personalizado', label: 'Personalizado' },
  ];

  return (
    <div className="flex flex-col gap-6 min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <Header title="Dashboard" />
      
      <div className="flex flex-wrap gap-2 mb-4">
        {periods.map(p => (
          <Button 
            key={p.value} 
            variant={period === p.value ? 'primary' : 'outline'}
            onClick={() => setPeriod(p.value)}
            size="sm"
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total de modelos cadastrados" value={data?.stats?.totalModelos} icon={LayoutGrid} color="text-teal-600" loading={loading} />
        <StatCard title="Total de caixas em estoque" value={data?.stats?.totalCaixas} icon={Boxes} color="text-blue-600" loading={loading} />
        <StatCard title="Total de m² disponíveis" value={data?.stats?.totalArea ? formatArea(data.stats.totalArea) : undefined} icon={Ruler} color="text-indigo-600" loading={loading} />
        <StatCard title="Pisos com estoque baixo" value={data?.stats?.estoqueBaixo} icon={AlertTriangle} color="text-amber-600" loading={loading} />
        <StatCard title="Baixas realizadas hoje" value={data?.stats?.baixasHoje} icon={ArrowDownCircle} color="text-green-600" loading={loading} />
        <StatCard title="Piso mais vendido" value={data?.stats?.maisVendido} icon={Trophy} color="text-yellow-600" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Período</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.salesChart || []}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(val) => formatDate(val, 'short')} />
                  <YAxis />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="quantidade" stroke="#0F766E" fillOpacity={1} fill="url(#colorVendas)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pisos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.topPisos || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="nome" type="category" width={100} />
                  <RechartsTooltip />
                  <Bar dataKey="quantidade" fill="#0F766E" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Últimas Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-1">
              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-4">
                {data?.recentMovements?.map((mov: any) => (
                  <Card key={mov.id} className="p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-slate-500">{formatDate(mov.data)}</span>
                      <MovimentacaoBadge tipo={mov.tipo} />
                    </div>
                    <p className="font-medium text-slate-800">{mov.pisoNome}</p>
                    <div className="flex justify-between mt-2 text-sm text-slate-500">
                      <span>{mov.quantidade} caixas</span>
                      <span>Por: {mov.usuario}</span>
                    </div>
                  </Card>
                ))}
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-800">
                  <thead className="text-xs uppercase bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-3 rounded-tl-xl">Data</th>
                      <th className="px-6 py-3">Tipo</th>
                      <th className="px-6 py-3">Piso</th>
                      <th className="px-6 py-3">Quantidade</th>
                      <th className="px-6 py-3 rounded-tr-xl">Usuário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentMovements?.map((mov: any) => (
                      <tr key={mov.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-6 py-4">{formatDate(mov.data)}</td>
                        <td className="px-6 py-4"><MovimentacaoBadge tipo={mov.tipo} /></td>
                        <td className="px-6 py-4 font-medium">{mov.pisoNome}</td>
                        <td className="px-6 py-4">{mov.quantidade} cx</td>
                        <td className="px-6 py-4">{mov.usuario}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, loading }: any) {
  return (
    <Card className="shadow-sm transition-all duration-200 overflow-hidden">
      <CardContent className="p-4 sm:p-6 flex flex-col justify-between h-full min-h-[110px]">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-xs sm:text-sm font-medium text-slate-500 line-clamp-2 leading-snug">
            {title}
          </span>
          <div className={`p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100 ${color} shrink-0`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-7 sm:h-8 w-16 sm:w-24 mt-1" />
          ) : (
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              {value !== undefined && value !== null ? value : '-'}
            </h3>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MovimentacaoBadge({ tipo }: { tipo: string }) {
  switch(tipo) {
    case 'Entrada': return <Badge variant="success">Entrada</Badge>;
    case 'Baixa': return <Badge variant="danger">Baixa</Badge>;
    case 'Ajuste': return <Badge variant="warning">Ajuste</Badge>;
    default: return <Badge>{tipo}</Badge>;
  }
}
