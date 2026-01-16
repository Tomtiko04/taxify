import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials MISSING. The app will be stuck in loading or crash. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
