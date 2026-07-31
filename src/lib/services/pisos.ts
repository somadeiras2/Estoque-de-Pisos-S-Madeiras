import { createClient } from '@/lib/supabase/client'
import { Piso } from '@/lib/types'

export async function getPisos(filters?: {
  search?: string
  marca?: string
  tipo?: string
  cor?: string
  dimensao?: string
  status?: string
  page?: number
  limit?: number
  id?: string
}) {
  const supabase = createClient()
  let query = (supabase as any).from('pisos').select('*', { count: 'exact' })

  if (filters?.id) {
    query = query.eq('id', filters.id)
  }
  if (filters?.search) {
    query = query.ilike('nome', `%${filters.search}%`)
  }
  if (filters?.marca) {
    query = query.ilike('marca', `%${filters.marca}%`)
  }
  if (filters?.tipo) {
    query = query.eq('tipo', filters.tipo)
  }
  if (filters?.cor) {
    query = query.ilike('cor', `%${filters.cor}%`)
  }
  if (filters?.dimensao) {
    query = query.ilike('dimensao', `%${filters.dimensao}%`)
  }

  if (filters?.status === 'inativo') {
    query = query.eq('ativo', false)
  } else if (filters?.status === 'todos') {
    // don't filter by ativo
  } else {
    query = query.eq('ativo', true)
  }

  if (filters?.page !== undefined && filters?.limit !== undefined) {
    const from = (filters.page - 1) * filters.limit
    const to = from + filters.limit - 1
    query = query.range(from, to)
  }

  const res = await query.order('created_at', { ascending: false })
  return (res.data || []) as any[]
}

export async function getPisoById(id: string) {
  const supabase = createClient()
  const res = await (supabase as any).from('pisos').select('*').eq('id', id).single()
  return res.data as any
}

export const getPiso = getPisoById

export async function createPiso(data: Partial<Piso> | any) {
  const supabase = createClient()
  return await (supabase as any).from('pisos').insert(data).select().single()
}

export async function updatePiso(id: string, data: Partial<Piso> | any) {
  const supabase = createClient()
  return await (supabase as any).from('pisos').update(data).eq('id', id).select().single()
}

export async function deletePiso(id: string) {
  const supabase = createClient()
  return await (supabase as any).from('pisos').update({ ativo: false }).eq('id', id)
}

export async function uploadPisoImage(file: File) {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await (supabase as any).storage
    .from('piso-images')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  const { data } = (supabase as any).storage.from('piso-images').getPublicUrl(filePath)
  return data.publicUrl
}

export async function deletePisoImage(path: string) {
  const supabase = createClient()
  const fileName = path.split('/').pop()
  if (fileName) {
    return await (supabase as any).storage.from('piso-images').remove([fileName])
  }
  return { error: null }
}
