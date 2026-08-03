const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlnpsaudwbpnvuyirpnl.supabase.co';
const supabaseKey = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clean() {
  await supabase.from('pisos').delete().eq('nome', 'Piso Teste Minusculo');
  const { data } = await supabase.from('pisos').select('*');
  console.log('Banco de dados após limpeza:', data);
}

clean();
