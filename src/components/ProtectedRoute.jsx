import { useEffect, useState, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase, clearAuthStorage } from '../lib/supabase'

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading, null = no session
  const location = useLocation()
  const isMounted = useRef(true)
  const timeoutRef = useRef(null)

  useEffect(() => {
    isMounted.current = true

    // Check if there's a session token in localStorage
    const hasStoredToken = () => {
      try {
        // Check for our custom storage key
        const customToken = localStorage.getItem('taxify-auth-token')
        if (customToken) {
          const parsed = JSON.parse(customToken)
          return parsed?.access_token ? true : false
        }
        
        // Check for any Supabase auth tokens
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth-token'))) {
            return true
          }
        }
        return false
      } catch {
        return false
      }
    }

    const storedTokenExists = hasStoredToken()

    // Safety timeout to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      if (isMounted.current && session === undefined) {
        console.warn('Auth check timeout - clearing stale tokens and redirecting to login')
        clearAuthStorage()
        setSession(null)
      }
    }, storedTokenExists ? 8000 : 3000)

    // Check and validate session
    const checkSession = async () => {
      try {
        // First, try to get the session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (!isMounted.current) return
        
        if (sessionError) {
          console.error('Session check error:', sessionError)
          clearAuthStorage()
          setSession(null)
          return
        }
        
        if (!currentSession) {
          // No session found, clear any stale storage
          if (storedTokenExists) {
            clearAuthStorage()
          }
          setSession(null)
          return
        }
        
        // Session exists, verify it's still valid by trying to get user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (!isMounted.current) return
        
        if (userError || !user) {
          console.warn('Session exists but user verification failed, clearing session')
          clearAuthStorage()
          try {
            await supabase.auth.signOut({ scope: 'local' })
          } catch (e) {
            // Ignore signout errors
          }
          setSession(null)
          return
        }
        
        // Session is valid
        setSession(currentSession)
        
      } catch (error) {
        if (!isMounted.current) return
        console.error('Error checking session:', error)
        clearAuthStorage()
        setSession(null)
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (isMounted.current) {
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !newSession) {
          clearAuthStorage()
          setSession(null)
        } else {
          setSession(newSession)
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    })

    return () => {
      isMounted.current = false
      subscription.unsubscribe()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Show loading state while checking session (brief - max 2 seconds)
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 relative mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-green-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!session) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }}
        replace 
      />
    )
  }

  // Check if email is verified
  if (!session.user.email_confirmed_at) {
    return (
      <Navigate 
        to="/verify-email" 
        state={{ from: location.pathname }}
        replace 
      />
    )
  }

  // User is authenticated and verified
  return children
}
