'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        let { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!userProfile) {
          const newProfile = {
            id: user.id,
            nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            tipo_usuario: 'admin',
            ativo: true
          }
          const { data: createdProfile } = await (supabase as any)
            .from('profiles')
            .upsert(newProfile)
            .select()
            .single()

          userProfile = createdProfile || newProfile
        }

        setProfile((userProfile || null) as any)
      }
      setLoading(false)
    }

    getUser()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAdmin = user ? (profile ? profile.tipo_usuario === 'admin' : true) : false

  return { user, profile, loading, isAdmin, signOut }
}
