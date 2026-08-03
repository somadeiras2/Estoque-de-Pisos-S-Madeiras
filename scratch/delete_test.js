const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlnpsaudwbpnvuyirpnl.supabase.co';
const supabaseKey = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteTest() {
  console.log('--- EXCLUINDO PISO DE TESTE ---');
  const { data, error } = await supabase.from('pisos').delete().eq('codigo', 'RVI5710');
  console.log('Delete Error:', error);
  console.log('Delete Data:', data);
  
  const { data: allPisos } = await supabase.from('pisos').select('*');
  console.log('Todos os pisos no banco atualmente:', allPisos);
}

deleteTest();
