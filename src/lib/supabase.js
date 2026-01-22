import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials MISSING. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to clear all auth-related storage
export const clearAuthStorage = () => {
  localStorage.removeItem('personalCalculationData')
  localStorage.removeItem('businessCalculationData')
  localStorage.removeItem('returnUrl')
  
  // Clear any possible Supabase tokens
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth-token'))) {
      localStorage.removeItem(key)
    }
  }
}
