const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlnpsaudwbpnvuyirpnl.supabase.co';
const supabaseKey = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthInsert() {
  console.log('--- TESTANDO LOGIN E INSERÇÃO DE PISO ---');
  // Primeiro faz login com o usuario marcelotemplates@gmail.com
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'marcelotemplates@gmail.com',
    password: '123' // ou tente com a senha do admin
  });
  console.log('Auth result:', authData?.user?.email, authError);

  const payload = {
    nome: 'Revestimento RVI5710A',
    marca: 'Incenor',
    codigo: 'RVI5710A',
    quantidade_caixas: 50,
    metros_por_caixa: 2.2,
    estoque_minimo: 5,
    tipo: 'ceramica',
    ativo: true
  };
  const { data, error } = await supabase.from('pisos').insert(payload).select().single();
  console.log('Insert Error:', error);
  console.log('Insert Data:', data);
}

testAuthInsert();
