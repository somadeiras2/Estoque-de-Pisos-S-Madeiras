const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlnpsaudwbpnvuyirpnl.supabase.co';
const supabaseKey = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV';
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeTipo(tipo) {
  if (!tipo) return 'ceramica';
  const norm = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (norm.includes('porcelanato')) return 'porcelanato';
  if (norm.includes('ceramica')) return 'ceramica';
  if (norm.includes('acetinado')) return 'acetinado';
  if (norm.includes('polido')) return 'polido';
  return 'outros';
}

async function testAll() {
  const testInputs = ['Porcelanato', 'Cerâmica', 'Vinílico', 'Laminado', 'Acetinado', 'Polido'];
  
  for (const input of testInputs) {
    const payload = {
      nome: `Piso Teste ${input}`,
      tipo: normalizeTipo(input),
      quantidade_caixas: 10,
      metros_por_caixa: 1.5,
      estoque_minimo: 1
    };
    const { data, error } = await supabase.from('pisos').insert(payload).select();
    console.log(`Input "${input}" -> Normalizado "${payload.tipo}":`, error ? error.message : 'OK - ID: ' + data[0]?.id);
  }

  // Deletar os de teste
  await supabase.from('pisos').delete().ilike('nome', 'Piso Teste%');
  console.log('Limpeza finalizada.');
}

testAll();
