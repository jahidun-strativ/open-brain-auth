import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local',
  )
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Implicit flow returns session material in the URL hash, so the magic-link
    // callback works even if the email opens in a different browser/profile
    // than the one that requested the OTP. PKCE would require a code_verifier
    // stored in the same browser's localStorage, which mail clients regularly
    // break.
    flowType: 'implicit',
  },
})
