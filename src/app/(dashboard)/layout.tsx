import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const userData = profile || { nome: user.email?.split('@')[0], tipo_usuario: 'usuario' }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar user={userData} />
      
      <div className="md:ml-64 flex flex-col min-h-screen pb-16 md:pb-0">
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      <BottomNav user={userData} />
    </div>
  )
}
