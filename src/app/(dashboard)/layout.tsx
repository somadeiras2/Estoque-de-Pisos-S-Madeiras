import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cache } from 'react'

const getAuthenticatedUserData = cache(async () => {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, tipo_usuario')
    .eq('id', user.id)
    .single()

  return profile || { nome: user.email?.split('@')[0], tipo_usuario: 'admin' }
})

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userData = await getAuthenticatedUserData()

  if (!userData) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 antialiased selection:bg-teal-500 selection:text-white">
      <div className="print:hidden">
        <Sidebar user={userData} />
      </div>
      
      <div className="md:ml-64 print:ml-0 flex flex-col min-h-screen pb-20 md:pb-0 print:pb-0">
        <main className="flex-1 w-full max-w-7xl print:max-w-none mx-auto p-3 sm:p-4 md:p-6 lg:p-8 print:p-0 print:m-0">
          {children}
        </main>
      </div>

      <div className="print:hidden">
        <BottomNav user={userData} />
      </div>
    </div>
  )
}
