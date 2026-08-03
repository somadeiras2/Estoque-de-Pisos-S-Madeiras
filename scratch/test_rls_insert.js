const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlnpsaudwbpnvuyirpnl.supabase.co';
// Anon key used in browser
const anonKey = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV';

const supabase = createClient(supabaseUrl, anonKey);

async function testRlsInsert() {
  console.log('--- TESTANDO INSERÇÃO COM ANON CLIENT (BROWSER UNAUTHENTICATED) ---');
  
  const payload = {
    nome: 'Piso Teste Anonimo ' + Date.now(),
    tipo: 'porcelanato',
    quantidade_caixas: 10,
    metros_por_caixa: 1.5,
    estoque_minimo: 2,
    ativo: true
  };

  const { data, error } = await supabase.from('pisos').insert(payload).select().single();
  console.log('Error:', error);
  console.log('Data:', data);
}

testRlsInsert();
