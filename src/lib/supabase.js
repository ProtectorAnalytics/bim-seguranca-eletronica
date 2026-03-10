import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ Supabase credentials missing! Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file or Vercel environment variables.'
  )
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
