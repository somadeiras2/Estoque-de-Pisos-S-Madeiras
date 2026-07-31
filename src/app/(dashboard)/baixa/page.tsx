'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { Search, PackageMinus, CheckCircle2, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { SearchInput } from '@/components/ui/SearchInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { getPisos } from '@/lib/services/pisos';
import { realizarBaixa } from '@/lib/services/estoque';
import { getVendedoresAtivos } from '@/lib/services/vendedores';
import { formatArea } from '@/lib/utils/formatters';
import Image from 'next/image';

function BaixaEstoqueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPisoId = searchParams.get('piso');
  
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [pisos, setPisos] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [selectedPiso, setSelectedPiso] = useState<any | null>(null);
  
  const [quantidade, setQuantidade] = useState<number | ''>('');
  const [vendedorId, setVendedorId] = useState('');
  const [pedido, setPedido] = useState('');
  const [observacao, setObservacao] = useState('');
  
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const v = await getVendedoresAtivos();
        setVendedores(v || []);
        if (profile?.tipo_usuario === 'vendedor' && user?.id) {
          setVendedorId(user.id);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchVendedores();
  }, [user]);

  useEffect(() => {
    const fetchInitialPiso = async () => {
      if (initialPisoId) {
        try {
          const res = await getPisos({ id: initialPisoId });
          if (res && res.length > 0) {
            setSelectedPiso(res[0]);
          }
        } catch (error) {
          console.error(error);
        }
      }
    };
    fetchInitialPiso();
  }, [initialPisoId]);

  useEffect(() => {
    if (debouncedSearch && !selectedPiso) {
      const search = async () => {
        setIsSearching(true);
        try {
          const res = await getPisos({ search: debouncedSearch });
          setPisos(res || []);
        } catch (error) {
          console.error(error);
        } finally {
          setIsSearching(false);
        }
      };
      search();
    } else if (!debouncedSearch) {
      setPisos([]);
    }
  }, [debouncedSearch, selectedPiso]);

  const handleConfirmar = async () => {
    if (!selectedPiso || !quantidade || !vendedorId || !pedido) {
      toast({ title: 'Atenção', description: 'Preencha todos os campos obrigatórios.', variant: 'warning' });
      return;
    }
    
    if (Number(quantidade) <= 0) {
      toast({ title: 'Atenção', description: 'A quantidade deve ser maior que zero.', variant: 'warning' });
      return;
    }

    if (Number(quantidade) > selectedPiso.caixas) {
      toast({ title: 'Atenção', description: 'A quantidade informada é maior que o estoque atual.', variant: 'warning' });
      return;
    }

    setShowConfirm(true);
  };

  const executeBaixa = async () => {
    setIsSubmitting(true);
    try {
      await realizarBaixa({
        pisoId: selectedPiso.id,
        quantidade: Number(quantidade),
        vendedorId,
        pedido,
        observacao,
        usuarioId: user?.id
      });
      setShowConfirm(false);
      setIsSuccess(true);
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível realizar a baixa.', variant: 'danger' });
      console.error(error);
      setShowConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedPiso(null);
    setQuantidade('');
    setPedido('');
    setObservacao('');
    setSearchTerm('');
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-6 min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 justify-center items-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center flex flex-col items-center">
            <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Baixa Realizada!</h2>
            <p className="text-slate-600 mb-6">
              Foram retiradas <span className="font-bold">{quantidade} caixas</span> de <span className="font-bold">{selectedPiso?.nome}</span> do estoque.
            </p>
            <div className="w-full space-y-3">
              <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={resetForm}>
                Nova Baixa
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/estoque')}>
                Voltar ao Estoque
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const qtdNum = Number(quantidade) || 0;
  const novoEstoque = selectedPiso ? selectedPiso.caixas - qtdNum : 0;
  const novoM2 = selectedPiso ? novoEstoque * selectedPiso.m2PorCaixa : 0;

  return (
    <div className="flex flex-col gap-6 min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 pb-24">
      <Header title="Dar Baixa no Estoque" />

      <div className="max-w-3xl mx-auto w-full space-y-6">
        {!selectedPiso ? (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Selecione o Piso</h3>
              <SearchInput 
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                placeholder="Busque por nome, marca ou código..."
                className="mb-6"
              />
              
              <div className="space-y-3">
                {isSearching ? (
                  <div className="text-center py-8 text-slate-500">Buscando...</div>
                ) : pisos.length > 0 ? (
                  pisos.map(piso => (
                    <div 
                      key={piso.id} 
                      className="flex items-center p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 cursor-pointer transition-all"
                      onClick={() => setSelectedPiso(piso)}
                    >
                      <div className="w-12 h-12 bg-slate-100 rounded-lg mr-4 overflow-hidden flex-shrink-0">
                        {piso.imagemUrl && <Image src={piso.imagemUrl} width={48} height={48} alt="" className="object-cover w-full h-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 truncate">{piso.nome}</h4>
                        <p className="text-xs text-slate-500 truncate">{piso.marca} • Cód: {piso.codigo}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-slate-800">{piso.caixas} cx</p>
                        <p className="text-xs text-slate-500">{formatArea(piso.caixas * piso.m2PorCaixa)}</p>
                      </div>
                    </div>
                  ))
                ) : searchTerm ? (
                  <EmptyState title="Nenhum piso encontrado" description="Tente outra palavra-chave." icon={Search} />
                ) : (
                  <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                    <Search className="w-12 h-12 mb-3 opacity-20" />
                    <p>Digite para buscar um piso no estoque</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-teal-500 shadow-sm">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                  onClick={() => setSelectedPiso(null)}
                >
                  Trocar
                </Button>
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-100 rounded-xl flex-shrink-0 overflow-hidden">
                  {selectedPiso.imagemUrl && <Image src={selectedPiso.imagemUrl} width={128} height={128} alt="" className="object-cover w-full h-full" />}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-bold text-slate-800">{selectedPiso.nome}</h3>
                  <p className="text-slate-500 mb-3">{selectedPiso.marca} • {selectedPiso.dimensao}</p>
                  <div className="inline-flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500">Estoque Atual</p>
                      <p className="font-bold text-lg text-slate-800">{selectedPiso.caixas} cx</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200"></div>
                    <div>
                      <p className="text-xs text-slate-500">Rendimento</p>
                      <p className="font-bold text-lg text-slate-800">{formatArea(selectedPiso.m2PorCaixa)}/cx</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Quantidade (caixas) *</label>
                      <Input 
                        type="number" 
                        value={quantidade} 
                        onChange={(e: any) => setQuantidade(e.target.value)} 
                        placeholder="0"
                        min="1"
                        max={selectedPiso.caixas}
                        className="text-lg"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Número do Pedido *</label>
                      <Input 
                        value={pedido} 
                        onChange={(e: any) => setPedido(e.target.value)} 
                        placeholder="Ex: PED-12345"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Vendedor *</label>
                      <Select 
                        value={vendedorId} 
                        onChange={(e: any) => setVendedorId(e.target.value)}
                        options={[
                          {value: '', label: 'Selecione um vendedor'},
                          ...vendedores.map(v => ({ value: v.id, label: v.nome }))
                        ]}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Observações (opcional)</label>
                      <textarea 
                        value={observacao}
                        onChange={(e: any) => setObservacao(e.target.value)}
                        className="w-full h-[60px] rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Detalhes adicionais..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 sm:p-6 border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Simulação após a baixa</h4>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center">
                      <p className="text-slate-500 text-sm mb-1">Estoque Atual</p>
                      <p className="text-xl font-bold text-slate-800">{selectedPiso.caixas}</p>
                    </div>
                    
                    <PackageMinus className="w-6 h-6 text-red-500" />
                    
                    <div className="text-center">
                      <p className="text-slate-500 text-sm mb-1">Retirada</p>
                      <p className="text-xl font-bold text-red-600">{qtdNum || 0}</p>
                    </div>
                    
                    <ArrowRight className="w-6 h-6 text-slate-400" />
                    
                    <div className="text-center bg-teal-50 px-6 py-2 rounded-lg border border-teal-100">
                      <p className="text-teal-700 text-sm mb-1 font-medium">Novo Estoque</p>
                      <p className={`text-2xl font-bold ${novoEstoque < selectedPiso.estoqueMinimo ? 'text-amber-600' : 'text-teal-700'}`}>
                        {novoEstoque} <span className="text-base font-normal">cx</span>
                      </p>
                      <p className="text-xs text-teal-600 mt-1">{formatArea(novoM2)} disponíveis</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button 
                    onClick={handleConfirmar} 
                    className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white min-w-[200px]"
                    size="lg"
                  >
                    Confirmar Baixa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeBaixa}
        title="Confirmar Baixa de Estoque"
        description={`Deseja confirmar a retirada de ${quantidade} caixas do piso ${selectedPiso?.nome}?`}
        confirmText="Sim, confirmar baixa"
        cancelText="Cancelar"
        variant="primary"
        loading={isSubmitting}
      />
    </div>
  );
}

export default function BaixaEstoquePage() {
  return (
    <Suspense fallback={<div className="p-8">Carregando...</div>}>
      <BaixaEstoqueContent />
    </Suspense>
  );
}
