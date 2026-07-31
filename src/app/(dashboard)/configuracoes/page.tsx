'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { Shield, User, Lock, Info, Users } from 'lucide-react';
import Link from 'next/link';

// Assume supabase client is available
import { supabase } from '@/lib/supabase/client';

export default function ConfiguracoesPage() {
  const { profile, user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    nome_exibicao: profile?.nome_exibicao || '',
    telefone: profile?.telefone || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    nova_senha: '',
    confirmar_senha: ''
  });

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setIsSavingProfile(true);
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          nome_exibicao: profileData.nome_exibicao,
          telefone: profileData.telefone
        })
        .eq('id', user.id);
        
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Perfil atualizado com sucesso.' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar perfil.', variant: 'danger' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.nova_senha !== passwordData.confirmar_senha) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'danger' });
      return;
    }
    
    if (passwordData.nova_senha.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres.', variant: 'danger' });
      return;
    }
    
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.nova_senha
      });
      
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Senha alterada com sucesso.' });
      setPasswordData({ nova_senha: '', confirmar_senha: '' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao alterar senha.', variant: 'danger' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (loading) return null; // Can rely on global layout loading

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-10">
      <Header title="Configurações" />
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-3xl mx-auto w-full space-y-6">
        
        {/* Meu Perfil */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <User className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-800">Meu Perfil</h2>
          </div>
          
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <Input value={user?.email || ''} disabled className="bg-slate-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <Input value={profile?.nome || ''} disabled className="bg-slate-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome de Exibição</label>
                <Input 
                  value={profileData.nome_exibicao} 
                  onChange={(e) => setProfileData({...profileData, nome_exibicao: e.target.value})} 
                  placeholder="Como você quer ser chamado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                <Input 
                  value={profileData.telefone} 
                  onChange={(e) => setProfileData({...profileData, telefone: e.target.value})} 
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? 'Salvando...' : 'Salvar Perfil'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Alterar Senha - Admin only mostly, but any user can update their own if setup */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <Lock className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-800">Alterar Senha</h2>
          </div>
          
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                <Input 
                  type="password"
                  value={passwordData.nova_senha} 
                  onChange={(e) => setPasswordData({...passwordData, nova_senha: e.target.value})} 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nova Senha</label>
                <Input 
                  type="password"
                  value={passwordData.confirmar_senha} 
                  onChange={(e) => setPasswordData({...passwordData, confirmar_senha: e.target.value})} 
                  required
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSavingPassword}>
                {isSavingPassword ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Gerenciar Usuários - Admin Only */}
        {isAdmin && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <Shield className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-semibold text-slate-800">Administração</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-slate-800">Gerenciamento de Vendedores</h3>
                <p className="text-sm text-slate-500">Adicione, edite ou desative vendedores do sistema.</p>
              </div>
              <Link href="/vendedores">
                <Button variant="outline"><Users className="w-4 h-4 mr-2" /> Acessar Vendedores</Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Sobre */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4 border-b pb-4">
            <Info className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-800">Sobre o Sistema</h2>
          </div>
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-teal-100 rounded-xl mx-auto flex items-center justify-center mb-3">
              <span className="text-teal-700 font-bold text-2xl">SM</span>
            </div>
            <h3 className="font-bold text-slate-800">Estoque Pisos</h3>
            <p className="text-sm text-slate-500 mt-1">Versão 1.0.0</p>
            <p className="text-xs text-slate-400 mt-4">© {new Date().getFullYear()} Só Madeiras. Todos os direitos reservados.</p>
          </div>
        </Card>

      </main>
    </div>
  );
}
