const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlnpsaudwbpnvuyirpnl.supabase.co';
const supabaseKey = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('--- BUSCANDO PISOS ---');
  const { data, error, count } = await supabase.from('pisos').select('*', { count: 'exact' });
  console.log('Count:', count);
  console.log('Error:', error);
  console.log('Data:', data);
}

test();
