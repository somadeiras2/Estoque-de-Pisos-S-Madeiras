'use client'

import { Bell } from 'lucide-react'
import { ReactNode } from 'react'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  leftContent?: ReactNode
}

export function Header({ title, subtitle, actions, leftContent }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white/80 px-4 md:px-6 lg:px-8 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center gap-4">
        {leftContent}
        <div className="md:hidden">
          <div className="bg-teal-700 text-white p-1.5 rounded-lg">
             <span className="font-bold text-sm">EP</span>
          </div>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-800 leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 hidden md:block">{subtitle}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {actions}
        
        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}

export default Header
