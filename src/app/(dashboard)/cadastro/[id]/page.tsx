'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Save, AlertCircle, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { getPiso, updatePiso, deletePiso } from '@/lib/services/pisos';
import { formatArea } from '@/lib/utils/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const pisoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  marca: z.string().optional(),
  codigo: z.string().optional(),
  modelo: z.string().optional(),
  linha: z.string().optional(),
  cor: z.string().optional(),
  dimensao: z.string().optional(),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  localizacao: z.string().optional(),
  caixas: z.number().min(0, "Quantidade não pode ser negativa"),
  m2PorCaixa: z.number().min(0.01, "Mínimo de 0.01"),
  estoqueMinimo: z.number().min(0, "Não pode ser negativo"),
  observacoes: z.string().optional(),
  ativo: z.boolean(),
});

type PisoFormValues = z.infer<typeof pisoSchema>;

export default function EditPisoPage() {
  const router = useRouter();
  const params = useParams();
  const pisoId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<PisoFormValues>({
    resolver: zodResolver(pisoSchema)
  });

  useEffect(() => {
    const fetchPiso = async () => {
      try {
        const piso = await getPiso(pisoId);
        if (piso) {
          reset({
            nome: piso.nome,
            marca: piso.marca || '',
            codigo: piso.codigo || '',
            modelo: piso.modelo || '',
            linha: piso.linha || '',
            cor: piso.cor || '',
            dimensao: piso.dimensao || '',
            tipo: piso.tipo || 'ceramica',
            localizacao: piso.localizacao || '',
            caixas: piso.quantidade_caixas,
            m2PorCaixa: Number(piso.metros_por_caixa),
            estoqueMinimo: piso.estoque_minimo,
            observacoes: piso.observacoes || '',
            ativo: piso.ativo ?? true,
          });
          if (piso.imagem_url) {
            setImagePreview(piso.imagem_url);
          }
        } else {
          toast({ title: 'Não encontrado', description: 'O piso solicitado não existe.', variant: 'danger' });
          router.push('/estoque');
        }
      } catch (error) {
        console.error(error);
        toast({ title: 'Erro', description: 'Erro ao carregar os dados do piso.', variant: 'danger' });
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.role === 'admin') {
      fetchPiso();
    }
  }, [pisoId, reset, router, toast, user?.role]);

  const watchCaixas = watch('caixas', 0);
  const watchM2 = watch('m2PorCaixa', 0);
  const totalArea = (watchCaixas || 0) * (watchM2 || 0);

  if (authLoading || loading) return (
    <div className="p-8 space-y-6">
      <Skeleton className="h-12 w-1/3" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 max-w-md mx-auto mt-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Acesso Negado</h2>
        <p className="text-slate-600 mb-6">Você não tem permissão para acessar esta página.</p>
        <Button onClick={() => router.push('/estoque')} variant="outline">Voltar</Button>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: PisoFormValues) => {
    setIsSubmitting(true);
    try {
      await updatePiso(pisoId, { ...data, imagem: imageFile });
      toast({ title: 'Sucesso', description: 'Piso atualizado com sucesso!', variant: 'success' });
      router.push('/estoque');
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o piso.', variant: 'danger' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePiso(pisoId);
      toast({ title: 'Excluído', description: 'Piso excluído com sucesso.', variant: 'success' });
      router.push('/estoque');
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir o piso.', variant: 'danger' });
      console.error(error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 pb-24">
      <Header title="Editar Piso" />
      
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto w-full space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Imagem do Produto</h3>
            
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-6 transition-colors hover:bg-slate-100">
              {imagePreview ? (
                <div className="relative w-full max-w-md">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-contain rounded-lg" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Trocar
                    </Button>
                    <Button type="button" size="sm" variant="danger" onClick={removeImage}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 font-medium">Clique ou arraste uma imagem aqui</p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG até 5MB</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            </div>
          </CardContent>
        </Card>

        {/* Similar form layout to Cadastro */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Informações Gerais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Nome do Piso *</label>
                  <Input {...register('nome')} error={errors.nome?.message} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Marca</label>
                  <Input {...register('marca')} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Código / SKU</label>
                  <Input {...register('codigo')} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Modelo</label>
                  <Input {...register('modelo')} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Linha</label>
                  <Input {...register('linha')} />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Tipo *</label>
                  <Controller
                    name="tipo"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        {...field} 
                        options={[{value:'', label:'Selecione...'}, {value:'Porcelanato', label:'Porcelanato'}, {value:'Cerâmica', label:'Cerâmica'}, {value:'Vinílico', label:'Vinílico'}, {value:'Laminado', label:'Laminado'}]}
                        error={errors.tipo?.message}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Cor</label>
                  <Input {...register('cor')} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Formato / Dimensão</label>
                  <Input {...register('dimensao')} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Localização no Galpão</label>
                  <Input {...register('localizacao')} />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input type="checkbox" id="ativo" {...register('ativo')} className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500" />
                  <label htmlFor="ativo" className="text-sm font-medium text-slate-700">Piso Ativo</label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Estoque e Quantidades</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Quantidade de Caixas</label>
                <Input type="number" {...register('caixas', { valueAsNumber: true })} error={errors.caixas?.message} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">m² por Caixa</label>
                <Input type="number" step="0.01" {...register('m2PorCaixa', { valueAsNumber: true })} error={errors.m2PorCaixa?.message} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Estoque Mínimo (caixas)</label>
                <Input type="number" {...register('estoqueMinimo', { valueAsNumber: true })} error={errors.estoqueMinimo?.message} />
              </div>
            </div>

            <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 flex items-center justify-center">
              <p className="text-teal-800 font-medium text-lg">
                <span className="font-bold">{watchCaixas || 0}</span> caixas × <span className="font-bold">{formatArea(watchM2 || 0)}</span>/cx = <span className="font-bold text-xl">{formatArea(totalArea)}</span> disponíveis
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Observações</h3>
            <textarea 
              {...register('observacoes')} 
              className="w-full min-h-[120px] rounded-xl border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            ></textarea>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-between gap-4 pb-12">
          <Button type="button" variant="danger" onClick={() => setShowDeleteConfirm(true)} disabled={isSubmitting || isDeleting}>
            <Trash2 className="w-4 h-4 mr-2" /> Excluir Piso
          </Button>
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.push('/estoque')} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white min-w-[150px]" loading={isSubmitting}>
              <Save className="w-4 h-4 mr-2" /> Salvar Alterações
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir Piso"
        description="Tem certeza que deseja excluir este piso? Esta ação não pode ser desfeita e todas as movimentações relacionadas também podem ser afetadas."
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
