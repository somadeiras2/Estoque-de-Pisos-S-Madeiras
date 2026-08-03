const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlnpsaudwbpnvuyirpnl.supabase.co';
const supabaseKey = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  console.log('--- VERIFICANDO PERFIS NO SUPABASE ---');
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  console.log('Error:', error);
  console.log('Todos os perfis cadastrados:', profiles);
}

checkProfiles();
