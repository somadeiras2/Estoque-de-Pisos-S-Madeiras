const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlnpsaudwbpnvuyirpnl.supabase.co';
const supabaseKey = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('--- VERIFICANDO DADOS NO SUPABASE CURRENT (wlnpsaudwbpnvuyirpnl) ---');
  
  // 1. Perfis
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log('Profiles no Supabase:', profiles);

  // 2. Pisos
  const { data: pisos, count } = await supabase.from('pisos').select('*', { count: 'exact' });
  console.log('Total de pisos no Supabase:', count, pisos);
}

checkUsers();
