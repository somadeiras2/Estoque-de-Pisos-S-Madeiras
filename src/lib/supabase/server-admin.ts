import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wlnpsaudwbpnvuyirpnl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable__1u9ZdTA1xOvdh7i2zCtBw_Fvo1ZgYV'

let cachedToken: string | null = null
let cachedTokenExpiry = 0

export async function getSystemSupabaseClient() {
  const now = Date.now()
  if (cachedToken && now < cachedTokenExpiry) {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${cachedToken}` } }
    })
  }

  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data } = await client.auth.signInWithPassword({
      email: 'admin@somadeiras.com.br',
      password: 'Password123!'
    })

    if (data?.session?.access_token) {
      cachedToken = data.session.access_token
      cachedTokenExpiry = now + (3000 * 1000) // 50 min cache
      return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${cachedToken}` } }
      })
    }
  } catch (err) {
    console.error('getSystemSupabaseClient auth error:', err)
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
