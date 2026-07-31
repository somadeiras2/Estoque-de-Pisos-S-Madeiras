'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import Header from '@/components/layout/Header';
import { useAuth } from '@/lib/hooks/useAuth';
import { Plus, Edit2, Power, UserX, UserCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vendedorSchema } from '@/lib/utils/validators';

// Assume these service functions exist based on the prompt
import { getVendedores, createVendedor, updateVendedor, toggleVendedorStatus } from '@/lib/services/vendedores';
import { Profile } from '@/lib/types';

export default function VendedoresPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [vendedores, setVendedores] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    sellerId: string | null;
    currentStatus: boolean;
  }>({
    isOpen: false,
    sellerId: null,
    currentStatus: true,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(vendedorSchema),
    defaultValues: {
      nome_completo: '',
      nome_exibicao: '',
      email: '',
      telefone: ''
    }
  });

  const loadVendedores = async () => {
    try {
      setLoading(true);
      const res = await getVendedores();
      const list = Array.isArray(res) ? res : (res as any)?.data || [];
      setVendedores(list);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os vendedores.',
        variant: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadVendedores();
    }
  }, [isAdmin, authLoading]);

  if (authLoading) return <div className="p-8"><Skeleton className="h-8 w-64 mb-8" /><Skeleton className="h-32 w-full" /></div>;

  if (!isAdmin) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <EmptyState 
          icon={UserX}
          title="Acesso Restrito"
          description="Você não tem permissão para acessar esta página."
        />
      </div>
    );
  }

  const onSubmit = async (data: any) => {
    try {
      if (editingId) {
        await updateVendedor(editingId, data);
        toast({ title: 'Sucesso', description: 'Vendedor atualizado com sucesso.' });
      } else {
        await createVendedor(data);
        toast({ title: 'Sucesso', description: 'Vendedor criado com sucesso.' });
      }
      setIsModalOpen(false);
      reset();
      loadVendedores();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar.',
        variant: 'danger',
      });
    }
  };

  const handleEdit = (vendedor: Profile) => {
    setEditingId(vendedor.id);
    reset({
      nome_completo: (vendedor as any).nome_completo || vendedor.nome || '',
      nome_exibicao: vendedor.nome_exibicao || '',
      email: vendedor.email || '',
      telefone: vendedor.telefone || '',
    });
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingId(null);
    reset({ nome_completo: '', nome_exibicao: '', email: '', telefone: '' });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!confirmDialog.sellerId) return;
    
    try {
      await toggleVendedorStatus(confirmDialog.sellerId, !confirmDialog.currentStatus);
      toast({ title: 'Sucesso', description: 'Status atualizado com sucesso.' });
      loadVendedores();
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar status.', variant: 'danger' });
    } finally {
      setConfirmDialog({ isOpen: false, sellerId: null, currentStatus: true });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-10">
      <Header title="Vendedores" actions={<Button onClick={openNewModal}><Plus className="w-4 h-4 mr-2" /> Novo Vendedor</Button>} />
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
          </div>
        ) : vendedores.length === 0 ? (
          <EmptyState 
            icon={UserCheck}
            title="Nenhum vendedor encontrado"
            description="Cadastre um novo vendedor para começar."
            action={<Button onClick={openNewModal}>Adicionar Vendedor</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendedores.map((vendedor) => (
              <Card key={vendedor.id} className="p-4 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                      {(vendedor.nome_exibicao || vendedor.nome || '?').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800 line-clamp-1">{vendedor.nome}</h3>
                      <p className="text-sm text-slate-500 line-clamp-1">{vendedor.nome_exibicao || 'Sem nome de exibição'}</p>
                    </div>
                  </div>
                  <Badge variant={vendedor.ativo ? 'success' : 'secondary'}>
                    {vendedor.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                
                <div className="text-sm text-slate-600 flex flex-col gap-1">
                  <p><span className="font-medium">Email:</span> {vendedor.email}</p>
                  <p><span className="font-medium">Tel:</span> {vendedor.telefone || '-'}</p>
                </div>
                
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-100">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(vendedor)}>
                    <Edit2 className="w-4 h-4 mr-2" /> Editar
                  </Button>
                  <Button 
                    variant={vendedor.ativo ? 'destructive' : 'default'}
                    size="sm" 
                    className="flex-1"
                    onClick={() => setConfirmDialog({ isOpen: true, sellerId: vendedor.id, currentStatus: !!vendedor.ativo })}
                  >
                    <Power className="w-4 h-4 mr-2" /> {vendedor.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? 'Editar Vendedor' : 'Novo Vendedor'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo *</label>
            <Input {...register('nome_completo')} error={errors.nome_completo?.message as string} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome de Exibição</label>
            <Input {...register('nome_exibicao')} error={errors.nome_exibicao?.message as string} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <Input type="email" {...register('email')} error={errors.email?.message as string} disabled={!!editingId} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
            <Input {...register('telefone')} error={errors.telefone?.message as string} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, sellerId: null, currentStatus: true })}
        onConfirm={handleToggleStatus}
        title={confirmDialog.currentStatus ? 'Desativar Vendedor' : 'Ativar Vendedor'}
        description={`Tem certeza que deseja ${confirmDialog.currentStatus ? 'desativar' : 'ativar'} este vendedor? ${confirmDialog.currentStatus ? 'Ele não poderá mais acessar o sistema.' : 'Ele poderá acessar o sistema novamente.'}`}
        confirmText={confirmDialog.currentStatus ? 'Desativar' : 'Ativar'}
        variant={confirmDialog.currentStatus ? 'destructive' : 'default'}
      />
    </div>
  );
}
