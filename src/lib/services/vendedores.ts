import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'

export async function getVendedores(apenasAtivos = true) {
  const supabase = createClient()
  let query = (supabase as any).from('profiles').select('*').eq('tipo_usuario', 'vendedor')
  
  if (apenasAtivos) {
    query = query.eq('ativo', true)
  }
  
  const res = await query.order('nome', { ascending: true })
  return (res.data || []) as any[]
}

export async function getVendedoresAtivos() {
  const data = await getVendedores(true)
  return data || []
}

export async function getVendedorById(id: string) {
  const supabase = createClient()
  const res = await (supabase as any).from('profiles').select('*').eq('id', id).single()
  return res.data as any
}

export async function createVendedor(data: Partial<Profile> | any) {
  const supabase = createClient()
  const res = await (supabase as any).from('profiles').insert(data).select().single()
  if (res.error) throw res.error
  return res.data
}

export async function updateVendedor(id: string, data: Partial<Profile> | any) {
  const supabase = createClient()
  const res = await (supabase as any).from('profiles').update(data).eq('id', id).select().single()
  if (res.error) throw res.error
  return res.data
}

export async function toggleVendedorStatus(id: string, ativo: boolean) {
  const supabase = createClient()
  const res = await (supabase as any).from('profiles').update({ ativo }).eq('id', id).select().single()
  if (res.error) throw res.error
  return res.data
}
