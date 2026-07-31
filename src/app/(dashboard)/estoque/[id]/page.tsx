'use client';

import React, { useState, useEffect, use } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StockBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, Edit, Plus, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getPiso, registrarEntrada, registrarAjuste } from '@/lib/services/estoque';
import { formatNumber, formatArea, formatDateTime } from '@/lib/utils/formatters';
import { getStockStatus } from '@/lib/utils/calculations';
import { getMovimentacoes } from '@/lib/services/movimentacoes';
import { Piso, Movimentacao } from '@/lib/types';
import Link from 'next/link';

export default function PisoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [piso, setPiso] = useState<Piso | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEntradaModalOpen, setIsEntradaModalOpen] = useState(false);
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  const [entradaForm, setEntradaForm] = useState({ qtd_caixas: '', nota_referencia: '', observacao: '' });
  const [ajusteForm, setAjusteForm] = useState({ nova_quantidade: '', motivo: '', observacao: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getPiso(id);
      if (!data) {
        toast({ title: 'Erro', description: 'Piso não encontrado.', variant: 'danger' });
        router.push('/dashboard');
        return;
      }
      setPiso(data);
      
      const movRes = await getMovimentacoes({ piso_id: id, limit: 10 });
      setMovimentacoes(movRes?.data || []);
      
      setAjusteForm(prev => ({ ...prev, nova_quantidade: String(data.quantidade) }));
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao carregar detalhes.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleEntradaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!piso) return;
    
    setFormLoading(true);
    try {
      await registrarEntrada({
        piso_id: piso.id,
        quantidade: Number(entradaForm.qtd_caixas),
        observacao: entradaForm.observacao,
        numero_referencia: entradaForm.nota_referencia
      });
      toast({ title: 'Sucesso', description: 'Entrada registrada com sucesso.' });
      setIsEntradaModalOpen(false);
      setEntradaForm({ qtd_caixas: '', nota_referencia: '', observacao: '' });
      loadData();
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao registrar entrada.', variant: 'danger' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleAjusteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!piso) return;
    
    setFormLoading(true);
    try {
      await registrarAjuste({
        piso_id: piso.id,
        quantidade_nova: Number(ajusteForm.nova_quantidade),
        motivo: ajusteForm.motivo,
        observacao: ajusteForm.observacao
      });
      toast({ title: 'Sucesso', description: 'Ajuste de estoque realizado com sucesso.' });
      setIsAjusteModalOpen(false);
      setAjusteForm({ nova_quantidade: '', motivo: '', observacao: '' });
      loadData();
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao registrar ajuste.', variant: 'danger' });
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!piso) return null;

  const pAny = piso as any;
  const qty = pAny.quantidade_caixas ?? pAny.quantidade ?? pAny.caixas ?? 0;
  const m2cx = pAny.metros_por_caixa ?? pAny.m2_caixa ?? pAny.m2PorCaixa ?? 1;
  const stockStatus = getStockStatus(qty, piso.estoque_minimo);
  const totalM2 = qty * m2cx;
  const progressPercent = Math.min(100, Math.max(0, (qty / (piso.estoque_minimo * 2 || 1)) * 100));

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-10">
      <Header 
        title="Detalhes do Piso" 
        leftContent={<Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-5 h-5" /></Button>}
      />
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Image */}
          <Card className="flex flex-col overflow-hidden bg-white">
            <div className="bg-slate-100 aspect-square flex items-center justify-center relative">
              {piso.imagem_url ? (
                <img src={piso.imagem_url} alt={piso.nome} className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-400 flex flex-col items-center">
                  <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                  <span>Sem Imagem</span>
                </div>
              )}
            </div>
          </Card>

          {/* Right: Details & Actions */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">{piso.nome}</h1>
                  <p className="text-sm text-slate-500 font-medium">Cód: {piso.codigo}</p>
                </div>
                <StockBadge status={stockStatus} size="md" />
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 my-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Marca</p>
                  <p className="font-medium text-slate-800">{piso.marca}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Modelo/Linha</p>
                  <p className="font-medium text-slate-800">{piso.modelo} / {piso.linha}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Dimensões</p>
                  <p className="font-medium text-slate-800">{piso.dimensao}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Tipo</p>
                  <p className="font-medium text-slate-800">{piso.tipo}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Situação do Estoque</h3>
                
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-3xl font-bold text-slate-800">{formatNumber(qty)}</span>
                    <span className="text-slate-500 ml-1">caixas</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-teal-700">{formatArea(totalM2)}</span>
                    <span className="text-slate-500 ml-1">m²</span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 mt-4 mb-1">
                  <div 
                    className={`h-2 rounded-full ${stockStatus === 'critico' || stockStatus === 'sem_estoque' ? 'bg-red-500' : stockStatus === 'baixo' ? 'bg-amber-500' : 'bg-teal-500'}`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Zero</span>
                  <span>Mínimo: {piso.estoque_minimo}</span>
                </div>
                
                <div className="mt-3 text-xs text-slate-500">
                  Rendimento: {formatArea(m2cx)} por caixa
                </div>
                
                {piso.localizacao && (
                  <div className="mt-3 pt-3 border-t border-slate-200 text-sm">
                    <span className="font-medium text-slate-700">Localização:</span> {piso.localizacao}
                  </div>
                )}
              </div>
            </Card>

            {isAdmin && (
              <Card className="p-4 grid grid-cols-2 gap-3">
                <Link href={`/baixa?piso=${piso.id}`} className="col-span-2">
                  <Button className="w-full" variant="destructive">
                    Registrar Saída / Venda
                  </Button>
                </Link>
                <Button variant="outline" className="border-teal-600 text-teal-700 hover:bg-teal-50" onClick={() => setIsEntradaModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Entrada
                </Button>
                <Button variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-50" onClick={() => setIsAjusteModalOpen(true)}>
                  <AlertTriangle className="w-4 h-4 mr-2" /> Ajuste
                </Button>
                <Link href={`/cadastro/${piso.id}`} className="col-span-2">
                  <Button variant="secondary" className="w-full">
                    <Edit className="w-4 h-4 mr-2" /> Editar Cadastro
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        </div>

        {/* Histórico Recente */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Últimas Movimentações</h3>
          {movimentacoes.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">Nenhuma movimentação registrada para este piso.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 font-medium">Data</th>
                    <th className="px-4 py-2 font-medium">Tipo</th>
                    <th className="px-4 py-2 font-medium text-right">Qtd</th>
                    <th className="px-4 py-2 font-medium text-center">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movimentacoes.map(mov => {
                    const mAny = mov as any;
                    const tipo = mAny.tipo_movimentacao || mAny.tipo || 'baixa';
                    const isBaixa = tipo.toLowerCase() === 'baixa';
                    const isEntrada = tipo.toLowerCase() === 'entrada';
                    const qtd = mAny.quantidade_caixas ?? mAny.quantidade ?? 0;
                    const saldo = mAny.estoque_posterior ?? mAny.saldo_atual ?? 0;

                    return (
                      <tr key={mov.id}>
                        <td className="px-4 py-3 text-slate-600">{formatDateTime(mov.created_at)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={isEntrada ? 'success' : isBaixa ? 'danger' : 'warning'}>
                            {tipo.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {isBaixa ? '-' : '+'}{Math.abs(qtd)}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">{saldo}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {/* Entrada Modal */}
      <Modal isOpen={isEntradaModalOpen} onClose={() => setIsEntradaModalOpen(false)} title="Entrada de Estoque">
        <form onSubmit={handleEntradaSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade de Caixas *</label>
            <Input 
              type="number" 
              min="1" 
              required
              value={entradaForm.qtd_caixas} 
              onChange={(e) => setEntradaForm({...entradaForm, qtd_caixas: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nota Fiscal / Referência</label>
            <Input 
              value={entradaForm.nota_referencia} 
              onChange={(e) => setEntradaForm({...entradaForm, nota_referencia: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observação</label>
            <Input 
              value={entradaForm.observacao} 
              onChange={(e) => setEntradaForm({...entradaForm, observacao: e.target.value})} 
            />
          </div>
          
          <div className="bg-slate-50 p-3 rounded text-sm text-center">
            <span className="text-slate-500">Novo Estoque: </span>
            <strong className="text-teal-700 text-lg">
              {qty + (Number(entradaForm.qtd_caixas) || 0)} caixas
            </strong>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEntradaModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={formLoading || !entradaForm.qtd_caixas}>Confirmar Entrada</Button>
          </div>
        </form>
      </Modal>

      {/* Ajuste Modal */}
      <Modal isOpen={isAjusteModalOpen} onClose={() => setIsAjusteModalOpen(false)} title="Ajuste de Estoque">
        <form onSubmit={handleAjusteSubmit} className="space-y-4">
          <div className="bg-amber-50 p-3 rounded border border-amber-100 text-amber-800 text-sm mb-4">
            Atenção: O ajuste de estoque deve ser usado apenas para correção de inventário ou perdas/avarias.
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade Real (Atualizada) *</label>
            <Input 
              type="number" 
              min="0" 
              required
              value={ajusteForm.nova_quantidade} 
              onChange={(e) => setAjusteForm({...ajusteForm, nova_quantidade: e.target.value})} 
            />
            <p className="text-xs text-slate-500 mt-1">Estoque registrado atualmente: {qty}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo *</label>
            <Input 
              required
              placeholder="Ex: Avaria, Diferença de inventário"
              value={ajusteForm.motivo} 
              onChange={(e) => setAjusteForm({...ajusteForm, motivo: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observação Adicional</label>
            <Input 
              value={ajusteForm.observacao} 
              onChange={(e) => setAjusteForm({...ajusteForm, observacao: e.target.value})} 
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAjusteModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="destructive" disabled={formLoading || !ajusteForm.nova_quantidade || !ajusteForm.motivo}>Confirmar Ajuste</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
