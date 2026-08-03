'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Save, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import { createPiso } from '@/lib/services/pisos';
import { formatArea } from '@/lib/utils/formatters';

const numberSchema = z.coerce.number().min(0);

const pisoSchema = z.object({
  nome: z.string().min(1, "Nome do piso é obrigatório"),
  marca: z.string().optional().or(z.literal('')),
  codigo: z.string().optional().or(z.literal('')),
  modelo: z.string().optional().or(z.literal('')),
  linha: z.string().optional().or(z.literal('')),
  cor: z.string().optional().or(z.literal('')),
  dimensao: z.string().optional().or(z.literal('')),
  tipo: z.string().optional().or(z.literal('')),
  localizacao: z.string().optional().or(z.literal('')),
  caixas: numberSchema,
  m2PorCaixa: numberSchema,
  estoqueMinimo: numberSchema,
  observacoes: z.string().optional().or(z.literal('')),
  ativo: z.boolean(),
});

type PisoFormValues = z.infer<typeof pisoSchema>;

export default function CadastroPisoPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<PisoFormValues>({
    resolver: zodResolver(pisoSchema),
    defaultValues: {
      nome: '',
      marca: '',
      codigo: '',
      caixas: 0,
      m2PorCaixa: 1,
      estoqueMinimo: 0,
      ativo: true,
      tipo: 'Porcelanato'
    }
  });

  const watchCaixas = watch('caixas', 0);
  const watchM2 = watch('m2PorCaixa', 0);
  
  const parseNum = (val: any) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const n = parseFloat(String(val).replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };
  
  const totalArea = parseNum(watchCaixas) * parseNum(watchM2);

  if (authLoading) return <div className="p-8">Carregando...</div>;
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-md mx-auto mt-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Acesso Negado</h2>
        <p className="text-slate-600 mb-6">Você não tem permissão para acessar esta página. Apenas administradores podem cadastrar pisos.</p>
        <Button onClick={() => router.push('/estoque')} variant="outline">Voltar para Estoque</Button>
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
      await createPiso(data, imageFile);
      toast({ title: 'Sucesso', description: 'Piso cadastrado com sucesso!', variant: 'success' });
      router.refresh();
      router.push('/estoque');
    } catch (error: any) {
      toast({ title: 'Erro', description: error?.message || 'Não foi possível cadastrar o piso.', variant: 'danger' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFormError = (formErrors: any) => {
    console.error('Erros de validação:', formErrors);
    const firstError = Object.values(formErrors)[0] as any;
    toast({
      title: 'Atenção',
      description: firstError?.message || 'Por favor, preencha o Nome do Piso.',
      variant: 'danger'
    });
  };

  return (
    <div className="flex flex-col gap-6 min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 pb-24">
      <Header title="Cadastro de Pisos" />
      
      <form onSubmit={handleSubmit(onSubmit, onFormError)} className="max-w-4xl mx-auto w-full space-y-6">
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

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Informações Gerais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Nome do Piso *</label>
                  <Input {...register('nome')} error={errors.nome?.message} placeholder="Ex: Porcelanato Calacata" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Marca</label>
                  <Input {...register('marca')} placeholder="Ex: Eliane" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Código / SKU</label>
                  <Input {...register('codigo')} placeholder="Ex: ELI-CAL-01" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Modelo</label>
                  <Input {...register('modelo')} placeholder="Ex: Polido Retificado" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Linha</label>
                  <Input {...register('linha')} placeholder="Ex: Mármores Clássicos" />
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
                  <Input {...register('cor')} placeholder="Ex: Branco com veios cinzas" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Formato / Dimensão</label>
                  <Input {...register('dimensao')} placeholder="Ex: 80x80 cm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Localização no Galpão</label>
                  <Input {...register('localizacao')} placeholder="Ex: Corredor A, Prateleira 2" />
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
                <Input type="number" {...register('caixas')} error={errors.caixas?.message} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">m² por Caixa</label>
                <Input type="number" step="0.01" {...register('m2PorCaixa')} error={errors.m2PorCaixa?.message} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Estoque Mínimo (caixas)</label>
                <Input type="number" {...register('estoqueMinimo')} error={errors.estoqueMinimo?.message} />
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
              placeholder="Adicione informações adicionais, detalhes técnicos ou alertas sobre o piso..."
            ></textarea>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pb-12">
          <Button type="button" variant="outline" onClick={() => router.push('/estoque')} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white min-w-[150px]" loading={isSubmitting}>
            <Save className="w-4 h-4 mr-2" /> Cadastrar Piso
          </Button>
        </div>
      </form>
    </div>
  );
}
