const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlnpsaudwbpnvuyirpnl.supabase.co';
const anonKey = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV';

const supabase = createClient(supabaseUrl, anonKey);

async function cleanTest() {
  await supabase.from('pisos').delete().eq('id', '38086f70-4b90-4fb8-999f-b61105d9708f');
  console.log('Test row cleaned');
}

cleanTest();
