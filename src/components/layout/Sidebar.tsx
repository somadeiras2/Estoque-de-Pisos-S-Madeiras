'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Boxes,
  ArrowDownCircle,
  PlusCircle,
  Users,
  TrendingUp,
  History,
  Settings,
  Package,
  LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  user: {
    nome?: string
    tipo_usuario?: string
  } | null
}

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Estoque', href: '/estoque', icon: Boxes },
  { name: 'Dar Baixa', href: '/baixa', icon: ArrowDownCircle },
  { name: 'Cadastro', href: '/cadastro', icon: PlusCircle },
  { name: 'Vendedores', href: '/vendedores', icon: Users },
  { name: 'Mais Vendidos', href: '/mais-vendidos', icon: TrendingUp },
  { name: 'Histórico', href: '/historico', icon: History },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = user?.nome
    ? user.nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-slate-200 z-40">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100">
        <div className="bg-teal-700 text-white p-1.5 rounded-lg">
          <Package className="w-5 h-5" />
        </div>
        <span className="font-semibold text-slate-800 text-lg">Estoque Pisos</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/')
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'}`} />
              {item.name}
              {isActive && (
                <div className="absolute left-0 w-1 h-8 bg-teal-700 rounded-r-full" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {user?.nome || 'Usuário'}
            </p>
            <p className="text-xs text-slate-500 truncate capitalize">
              {user?.tipo_usuario || 'Acesso Limitado'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
