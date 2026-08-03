const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlnpsaudwbpnvuyirpnl.supabase.co';
const supabaseKey = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('--- TESTANDO INSERÇÃO DE PISO ---');
  const payload = {
    nome: 'Porcelanato Teste RVI',
    marca: 'Eliane',
    codigo: 'RVI5710',
    quantidade_caixas: 10,
    metros_por_caixa: 2.5,
    estoque_minimo: 2,
    tipo: 'porcelanato',
    ativo: true
  };
  const { data, error } = await supabase.from('pisos').insert(payload).select().single();
  console.log('Error:', error);
  console.log('Data:', data);
}

testInsert();
