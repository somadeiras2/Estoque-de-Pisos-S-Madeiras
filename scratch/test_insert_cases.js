import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wlnpsaudwbpnvuyirpnl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testInsert() {
  console.log('Testing insert into public.pisos...')
  const payload = {
    nome: 'Piso Teste Usuario Browser',
    marca: 'Portobello',
    codigo: 'TST-' + Date.now(),
    modelo: 'Polido',
    linha: 'Premium',
    cor: 'Cinza',
    dimensao: '60x60 cm',
    tipo: 'porcelanato',
    quantidade_caixas: 10,
    metros_por_caixa: 1.44,
    estoque_minimo: 2,
    localizacao: 'Galpão 1',
    observacoes: 'Teste via script node',
    imagem_url: null,
    ativo: true
  }

  const { data, error } = await supabase.from('pisos').insert(payload).select()
  console.log('Insert result error:', error)
  console.log('Insert result data:', data)
}

testInsert()
