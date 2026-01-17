import { useEffect, useState, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading, null = no session
  const location = useLocation()
  const isMounted = useRef(true)
  const timeoutRef = useRef(null)

  useEffect(() => {
    isMounted.current = true

    // Safety timeout - if auth check takes more than 2 seconds, redirect to login
    // This prevents the page from being stuck indefinitely
    timeoutRef.current = setTimeout(() => {
      if (isMounted.current && session === undefined) {
        console.warn('Auth check timeout - redirecting to login')
        setSession(null)
      }
    }, 2000)

    // Check session immediately
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        if (!isMounted.current) return
        
        if (error) {
          console.error('Session check error:', error)
          setSession(null)
        } else {
          setSession(currentSession)
        }
      } catch (error) {
        if (!isMounted.current) return
        console.error('Error checking session:', error)
        setSession(null)
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted.current) {
        setSession(newSession)
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
