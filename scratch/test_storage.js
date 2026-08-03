const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlnpsaudwbpnvuyirpnl.supabase.co';
const supabaseKey = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
  console.log('--- TESTANDO UPLOAD NO BUCKET piso-images ---');
  const buffer = Buffer.from('fake image content');
  const fileName = `test-${Date.now()}.png`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('piso-images')
    .upload(fileName, buffer, { contentType: 'image/png' });

  console.log('Upload Error:', uploadError);
  console.log('Upload Data:', uploadData);

  if (!uploadError) {
    const { data: urlData } = supabase.storage.from('piso-images').getPublicUrl(fileName);
    console.log('Public URL:', urlData.publicUrl);
  }
}

testStorage();
