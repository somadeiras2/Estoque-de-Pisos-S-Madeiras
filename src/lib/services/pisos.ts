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
  // Try server-side API route first (bypasses RLS issues)
  try {
    const params = new URLSearchParams()
    if (filters?.search) params.set('search', filters.search)
    if (filters?.marca) params.set('marca', filters.marca)
    if (filters?.tipo) params.set('tipo', filters.tipo)
    if (filters?.cor) params.set('cor', filters.cor)
    if (filters?.dimensao) params.set('dimensao', filters.dimensao)
    if (filters?.status) params.set('status', filters.status)
    if (filters?.id) params.set('id', filters.id)

    const url = `/api/pisos/list?${params.toString()}`
    const res = await fetch(url)
    const result = await res.json()
    if (res.ok && result.success && Array.isArray(result.data)) {
      return result.data as any[]
    }
  } catch (err) {
    console.warn('Fetch /api/pisos/list falhou, tentando Supabase client direto:', err)
  }

  // Fallback: direct Supabase browser client
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
  if (filters?.cor) {
    query = query.ilike('cor', `%${filters.cor}%`)
  }
  if (filters?.dimensao) {
    query = query.ilike('dimensao', `%${filters.dimensao}%`)
  }
  if (filters?.tipo) {
    query = query.eq('tipo', normalizeTipo(filters.tipo))
  }
  if (filters?.status === 'inativo') {
    query = query.eq('ativo', false)
  } else if (filters?.status === 'ativo') {
    query = query.eq('ativo', true)
  }

  const res = await query.order('created_at', { ascending: false })
  return (res.data || []) as any[]
}

export async function getPisoById(id: string) {
  // Try server-side API route first
  try {
    const res = await fetch(`/api/pisos/list?id=${id}`)
    const result = await res.json()
    if (res.ok && result.success && Array.isArray(result.data) && result.data.length > 0) {
      return result.data[0] as any
    }
  } catch (err) {
    console.warn('Fetch /api/pisos/list?id falhou, tentando Supabase client direto:', err)
  }

  // Fallback
  const supabase = createClient()
  const res = await (supabase as any).from('pisos').select('*').eq('id', id).single()
  return res.data as any
}

export const getPiso = getPisoById

function normalizeTipo(tipo?: string): string {
  if (!tipo) return 'ceramica';
  const norm = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (norm.includes('porcelanato')) return 'porcelanato';
  if (norm.includes('ceramica')) return 'ceramica';
  if (norm.includes('acetinado')) return 'acetinado';
  if (norm.includes('polido')) return 'polido';
  return 'outros';
}

function safeNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const parsed = parseFloat(String(val).replace(',', '.'));
  return isNaN(parsed) ? fallback : parsed;
}

function cleanString(val: any): string | null {
  if (!val || typeof val !== 'string' || !val.trim()) return null;
  return val.trim();
}

export async function createPiso(data: Partial<Piso> | any, imageFile?: File | null) {
  let imagem_url = data.imagem_url || null
  if (imageFile) {
    try {
      imagem_url = await uploadPisoImage(imageFile)
    } catch (e) {
      console.warn('Erro ao fazer upload da imagem no Storage, salvando piso sem foto por enquanto:', e)
    }
  }

  const payload = {
    ...data,
    imagem_url
  }

  try {
    const res = await fetch('/api/pisos/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const result = await res.json()
    if (res.ok && result.success) {
      return result.data
    }
    if (result?.error) {
      throw new Error(result.error)
    }
  } catch (err: any) {
    console.warn('Fetch para /api/pisos/create falhou, tentando envio direto via Supabase client:', err)
  }

  const supabase = createClient()
  const dbPayload = {
    nome: String(data.nome || '').trim(),
    marca: cleanString(data.marca),
    codigo: cleanString(data.codigo),
    modelo: cleanString(data.modelo),
    linha: cleanString(data.linha),
    cor: cleanString(data.cor),
    dimensao: cleanString(data.dimensao),
    tipo: normalizeTipo(data.tipo),
    quantidade_caixas: safeNumber(data.quantidade_caixas ?? data.caixas, 0),
    metros_por_caixa: safeNumber(data.metros_por_caixa ?? data.m2PorCaixa, 1),
    estoque_minimo: safeNumber(data.estoque_minimo ?? data.estoqueMinimo, 0),
    localizacao: cleanString(data.localizacao),
    observacoes: cleanString(data.observacoes),
    imagem_url: imagem_url,
    ativo: data.ativo ?? true
  }

  let res = await (supabase as any).from('pisos').insert(dbPayload).select()
  if (res.error) {
    if (res.error.code === '23505' || (res.error.message && res.error.message.includes('pisos_codigo_key'))) {
      dbPayload.codigo = `${dbPayload.codigo || 'PISO'}-${Math.floor(1000 + Math.random() * 9000)}`;
      res = await (supabase as any).from('pisos').insert(dbPayload).select()
    }
    if (res.error) {
      throw new Error(res.error.message || 'Erro ao cadastrar piso no banco de dados.')
    }
  }
  return res.data?.[0] || dbPayload
}

export async function updatePiso(id: string, data: Partial<Piso> | any, imageFile?: File | null) {
  let imagem_url = data.imagem_url
  if (imageFile) {
    try {
      imagem_url = await uploadPisoImage(imageFile)
    } catch (e) {
      console.error('Erro ao fazer upload da imagem:', e)
    }
  }

  const payload: Record<string, any> = {
    id,
    nome: String(data.nome || '').trim(),
    marca: cleanString(data.marca),
    codigo: cleanString(data.codigo),
    modelo: cleanString(data.modelo),
    linha: cleanString(data.linha),
    cor: cleanString(data.cor),
    dimensao: cleanString(data.dimensao),
    tipo: normalizeTipo(data.tipo),
    quantidade_caixas: safeNumber(data.quantidade_caixas ?? data.caixas, 0),
    metros_por_caixa: safeNumber(data.metros_por_caixa ?? data.m2PorCaixa, 1),
    estoque_minimo: safeNumber(data.estoque_minimo ?? data.estoqueMinimo, 0),
    localizacao: cleanString(data.localizacao),
    observacoes: cleanString(data.observacoes),
    ativo: data.ativo ?? true
  }

  if (imagem_url !== undefined) {
    payload.imagem_url = imagem_url
  }

  try {
    const res = await fetch('/api/pisos/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const result = await res.json()
    if (res.ok && result.success) {
      return result.data
    }
    if (result?.error) {
      throw new Error(result.error)
    }
  } catch (err: any) {
    console.warn('Fetch para /api/pisos/update falhou, usando Supabase client com movimentação:', err)
  }

  const supabase = createClient()
  const { data: currentPiso } = await (supabase as any).from('pisos').select('*').eq('id', id).single()
  const oldCaixas = currentPiso ? Number(currentPiso.quantidade_caixas ?? 0) : null

  const res = await (supabase as any).from('pisos').update(payload).eq('id', id).select().single()
  if (res.error) throw res.error

  const newCaixas = payload.quantidade_caixas
  if (oldCaixas !== null && oldCaixas !== newCaixas) {
    try {
      const diff = newCaixas - oldCaixas
      const { data: { user } } = await supabase.auth.getUser()
      await (supabase as any).from('movimentacoes_estoque').insert({
        piso_id: id,
        tipo_movimentacao: diff < 0 ? 'baixa' : 'entrada',
        quantidade_caixas: Math.abs(diff),
        metros_quadrados: Math.abs(diff) * payload.metros_por_caixa,
        estoque_anterior: oldCaixas,
        estoque_posterior: newCaixas,
        observacao: payload.observacoes || (diff < 0 ? 'Baixa por atualização direta de estoque' : 'Entrada por atualização direta de estoque'),
        usuario_responsavel_id: user?.id || null
      })
    } catch (movErr) {
      console.warn('Registro de movimentacao falhou no fallback:', movErr)
    }
  }

  return res.data
}

export async function deletePiso(id: string) {
  try {
    const res = await fetch('/api/pisos/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    const result = await res.json()
    if (res.ok && result.success) {
      return result
    }
    if (result?.error) {
      throw new Error(result.error)
    }
  } catch (err) {
    console.warn('Fetch /api/pisos/delete falhou, tentando Supabase client direto:', err)
  }

  const supabase = createClient()
  const res = await (supabase as any).from('pisos').delete().eq('id', id)
  if (res.error) throw res.error
  return res.data
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
