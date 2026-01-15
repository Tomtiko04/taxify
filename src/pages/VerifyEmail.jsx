import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Check if email is verified
          if (session.user.email_confirmed_at) {
            setVerified(true)
            toast.success('Email verified successfully!')
            setTimeout(() => {
              navigate('/personal-calculator')
            }, 2000)
          } else {
            // Check for verification token in URL
            const token = searchParams.get('token')
            const type = searchParams.get('type')
            
            if (token && type === 'signup') {
              // User clicked verification link
              toast.success('Email verified! Redirecting...')
              setVerified(true)
              setTimeout(() => {
                navigate('/personal-calculator')
              }, 2000)
            } else {
              setVerified(false)
            }
          }
        } else {
          setVerified(false)
        }
      } catch (error) {
        console.error('Verification check error:', error)
        toast.error('Error checking verification status')
      } finally {
        setLoading(false)
      }
    }

    checkVerification()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        setVerified(true)
        toast.success('Email verified successfully!')
        setTimeout(() => {
          navigate('/personal-calculator')
        }, 2000)
      }
    })

    return () => subscription.unsubscribe()
  }, [searchParams, navigate])

  const handleResendEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: searchParams.get('email') || ''
      })

      if (error) throw error

      toast.success('Verification email sent! Check your inbox.')
    } catch (error) {
      toast.error(error.message || 'Failed to resend verification email')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">₦</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">Taxify</span>
          </Link>
        </div>

        <div className="card text-center">
          {verified ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Email Verified!</h2>
              <p className="text-slate-600 mb-6">
                Your email has been successfully verified. You can now use all features of Taxify.
              </p>
              <Link
                to="/personal-calculator"
                className="inline-block btn-primary"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Verify Your Email</h2>
              <p className="text-slate-600 mb-6">
                We've sent a verification email to your inbox. Please click the link in the email to verify your account.
              </p>
              <div className="space-y-4">
                <button
                  onClick={handleResendEmail}
                  className="w-full btn-secondary"
                >
                  Resend Verification Email
                </button>
                <Link
                  to="/login"
                  className="block text-sm text-green-600 hover:text-green-500 font-medium"
                >
                  Already verified? Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
