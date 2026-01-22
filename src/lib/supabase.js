import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials MISSING. The app will be stuck in loading or crash. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'taxify-auth-token',
    flowType: 'pkce'
  }
})

// Helper function to clear all auth-related storage
export const clearAuthStorage = () => {
  // Clear the main auth token
  localStorage.removeItem('taxify-auth-token')
  
  // Clear any Supabase auth tokens (multiple possible formats)
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (
      key.includes('supabase') || 
      key.includes('sb-') ||
      key.includes('auth-token')
    )) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
  
  // Clear app-specific data
  localStorage.removeItem('personalCalculationData')
  localStorage.removeItem('businessCalculationData')
  localStorage.removeItem('returnUrl')
}
