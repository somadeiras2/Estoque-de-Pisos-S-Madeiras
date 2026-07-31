'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import {
  Home,
  Boxes,
  ArrowDownCircle,
  TrendingUp,
  Menu,
  History,
  Users,
  Settings,
  LogOut,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface BottomNavProps {
  user: {
    nome?: string
    tipo_usuario?: string
  } | null
}

const mainTabs = [
  { name: 'Início', href: '/', icon: Home },
  { name: 'Estoque', href: '/estoque', icon: Boxes },
  { name: 'Baixa', href: '/baixa', icon: ArrowDownCircle },
  { name: 'Top', href: '/mais-vendidos', icon: TrendingUp },
]

const menuItems = [
  { name: 'Histórico', href: '/historico', icon: History },
  { name: 'Vendedores', href: '/vendedores', icon: Users },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
]

export function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16 px-2">
          {mainTabs.map((tab) => {
            const isActive = pathname === tab.href || (pathname?.startsWith(tab.href) && tab.href !== '/')
            const Icon = tab.icon
            
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
                  isActive ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'fill-teal-50' : ''}`} />
                <span className="text-[10px] font-medium">{tab.name}</span>
              </Link>
            )
          })}
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
              isMenuOpen ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </nav>

      {/* Slide-up Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl transform transition-transform pb-safe">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                  {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{user?.nome || 'Usuário'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5 text-slate-400" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
              
              <div className="h-px bg-slate-100 my-2 mx-3" />
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
