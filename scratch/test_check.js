const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlnpsaudwbpnvuyirpnl.supabase.co';
const supabaseKey = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCheck() {
  console.log('--- TESTANDO INSERÇÃO COM TIPO "Porcelanato" (Maiúsculo) ---');
  const payload1 = {
    nome: 'Piso Teste Maiusculo',
    quantidade_caixas: 10,
    metros_por_caixa: 2,
    tipo: 'Porcelanato'
  };
  const res1 = await supabase.from('pisos').insert(payload1).select();
  console.log('Resultado com Porcelanato:', res1.error);

  console.log('--- TESTANDO INSERÇÃO COM TIPO "porcelanato" (Minúsculo) ---');
  const payload2 = {
    nome: 'Piso Teste Minusculo',
    quantidade_caixas: 10,
    metros_por_caixa: 2,
    tipo: 'porcelanato'
  };
  const res2 = await supabase.from('pisos').insert(payload2).select();
  console.log('Resultado com porcelanato:', res2.error, res2.data);
}

testCheck();
