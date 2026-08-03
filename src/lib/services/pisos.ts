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
  if (filters?.search && filters.search.trim() !== '') {
    const s = filters.search.trim()
    query = query.or(`nome.ilike.%${s}%,marca.ilike.%${s}%,codigo.ilike.%${s}%,cor.ilike.%${s}%,modelo.ilike.%${s}%`)
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

export async function createPiso(data: Partial<Piso> | any, imageFile?: File | null) {
  const supabase = createClient()

  let imagem_url = data.imagem_url || null
  if (imageFile) {
    try {
      imagem_url = await uploadPisoImage(imageFile)
    } catch (e) {
      console.error('Erro ao fazer upload da imagem:', e)
    }
  }

  const payload = {
    nome: data.nome,
    marca: data.marca || null,
    codigo: data.codigo || null,
    modelo: data.modelo || null,
    linha: data.linha || null,
    cor: data.cor || null,
    dimensao: data.dimensao || null,
    tipo: data.tipo || 'ceramica',
    quantidade_caixas: Number(data.quantidade_caixas ?? data.caixas ?? 0),
    metros_por_caixa: Number(data.metros_por_caixa ?? data.m2PorCaixa ?? 1),
    estoque_minimo: Number(data.estoque_minimo ?? data.estoqueMinimo ?? 0),
    localizacao: data.localizacao || null,
    observacoes: data.observacoes || null,
    imagem_url: imagem_url,
    ativo: data.ativo ?? true
  }

  const res = await (supabase as any).from('pisos').insert(payload).select().single()
  if (res.error) throw res.error
  return res.data
}

export async function updatePiso(id: string, data: Partial<Piso> | any, imageFile?: File | null) {
  const supabase = createClient()

  let imagem_url = data.imagem_url
  if (imageFile) {
    try {
      imagem_url = await uploadPisoImage(imageFile)
    } catch (e) {
      console.error('Erro ao fazer upload da imagem:', e)
    }
  }

  const payload: Record<string, any> = {
    nome: data.nome,
    marca: data.marca || null,
    codigo: data.codigo || null,
    modelo: data.modelo || null,
    linha: data.linha || null,
    cor: data.cor || null,
    dimensao: data.dimensao || null,
    tipo: data.tipo || 'ceramica',
    quantidade_caixas: Number(data.quantidade_caixas ?? data.caixas ?? 0),
    metros_por_caixa: Number(data.metros_por_caixa ?? data.m2PorCaixa ?? 1),
    estoque_minimo: Number(data.estoque_minimo ?? data.estoqueMinimo ?? 0),
    localizacao: data.localizacao || null,
    observacoes: data.observacoes || null,
    ativo: data.ativo ?? true
  }

  if (imagem_url !== undefined) {
    payload.imagem_url = imagem_url
  }

  const res = await (supabase as any).from('pisos').update(payload).eq('id', id).select().single()
  if (res.error) throw res.error
  return res.data
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
