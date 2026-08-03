const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlnpsaudwbpnvuyirpnl.supabase.co';
const supabaseKey = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealInsert() {
  console.log('--- TESTANDO INSERÇÃO FINAL NO SUPABASE ---');
  const payload = {
    nome: 'Porcelanato Calacata Gold 80x80',
    marca: 'Eliane',
    codigo: 'CAL-8080-GOLD',
    modelo: 'Polido Retificado',
    linha: 'Mármores Nobres',
    cor: 'Branco com Veios Dourados',
    dimensao: '80x80 cm',
    tipo: 'porcelanato',
    quantidade_caixas: 45,
    metros_por_caixa: 2.56,
    estoque_minimo: 5,
    localizacao: 'Corredor A - Prateleira 3',
    observacoes: 'Piso de altíssima qualidade cadastrado para teste de produção',
    ativo: true
  };

  const { data, error } = await supabase.from('pisos').insert(payload).select().single();
  console.log('Error:', error);
  console.log('Piso criado com sucesso:', data);

  const { count } = await supabase.from('pisos').select('*', { count: 'exact', head: true });
  console.log('Total de modelos cadastrados no banco:', count);
}

testRealInsert();
