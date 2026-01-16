import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [success, setSuccess] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const navigate = useNavigate()
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const type = hashParams.get('type')
    const accessToken = hashParams.get('access_token')
    
    if (type === 'recovery' && accessToken) {
      setIsReady(true)
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && isMounted.current) {
          setIsReady(true)
        } else {
          setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session: s } }) => {
              if (s && isMounted.current) {
                setIsReady(true)
              } else if (isMounted.current) {
                toast.error('Invalid or expired reset link')
                setTimeout(() => navigate('/forgot-password'), 2000)
              }
            })
          }, 1000)
        }
      })
    }

    return () => { isMounted.current = false }
  }, [navigate])

  const getPasswordStrength = (pwd) => {
    let s = 0
    if (pwd.length >= 8) s++
    if (/[A-Z]/.test(pwd)) s++
    if (/[a-z]/.test(pwd)) s++
    if (/[0-9]/.test(pwd)) s++
    if (/[^A-Za-z0-9]/.test(pwd)) s++
    return s
  }

  const strength = getPasswordStrength(password)
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']

  useEffect(() => {
    const newErrors = {}
    if (touched.password) {
      if (!password) newErrors.password = 'Required'
      else if (password.length < 8) newErrors.password = 'Min 8 characters'
    }
    if (touched.confirmPassword) {
      if (confirmPassword !== password) newErrors.confirmPassword = "Doesn't match"
    }
    setErrors(newErrors)
  }, [password, confirmPassword, touched])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    setTouched({ password: true, confirmPassword: true })
    if (!password || password.length < 8 || password !== confirmPassword) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      toast.success('Password reset!')
      setTimeout(() => navigate('/login'), 2000)
    } catch (error) {
      toast.error(error.message || 'Failed to reset')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-green-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Password Reset!</h2>
          <p className="text-slate-500 text-sm mb-4">You can now sign in with your new password.</p>
          <Link
            to="/login"
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg text-sm"
          >
            Go to Login
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 lg:p-10 bg-white">
        <motion.div 
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Logo */}
          <Link to="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
              <span className="text-white font-bold text-xl">₦</span>
            </div>
            <span className="text-xl font-bold text-slate-900">Taxify</span>
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Reset password</h1>
          <p className="text-slate-500 mb-6 text-sm">Create a new secure password for your account.</p>

          {!isReady && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
              <svg className="animate-spin h-4 w-4 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs text-blue-800">Verifying reset link...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" style={{ opacity: isReady ? 1 : 0.5 }}>
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(p => ({ ...p, password: true }))}
                  className={`w-full px-4 py-2.5 pr-10 bg-slate-50 border rounded-lg focus:outline-none focus:bg-white text-sm ${
                    errors.password && touched.password ? 'border-red-300' : 'border-slate-200 focus:border-green-500'
                  }`}
                  placeholder="Min 8 characters"
                  disabled={!isReady}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                  </svg>
                </button>
              </div>
              {password && (
                <div className="flex gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded ${i < strength ? strengthColors[strength - 1] : 'bg-slate-200'}`}></div>
                  ))}
                </div>
              )}
              {errors.password && touched.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, confirmPassword: true }))}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:outline-none focus:bg-white text-sm ${
                  errors.confirmPassword && touched.confirmPassword ? 'border-red-300' : 'border-slate-200 focus:border-green-500'
                }`}
                placeholder="Confirm password"
                disabled={!isReady}
              />
              {errors.confirmPassword && touched.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !isReady}
              className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg shadow-md shadow-green-500/25 hover:shadow-lg transition-all disabled:opacity-50 text-sm"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-green-600 hover:text-green-500 font-medium inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to login
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 relative overflow-hidden items-center justify-center p-8">
        <motion.div 
          className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-10 right-10 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="relative z-10 text-white max-w-md text-center">
          <motion.div 
            className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </motion.div>

          <h2 className="text-2xl font-bold mb-3">Create Strong Password</h2>
          <p className="text-green-100 text-sm mb-6">
            Use at least 8 characters with a mix of letters, numbers, and symbols.
          </p>

          {/* Password tips */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left">
            <p className="text-xs font-medium text-white mb-2">Strong password tips:</p>
            <ul className="space-y-1.5 text-xs text-green-100">
              <li className="flex items-center">
                <svg className="w-3 h-3 mr-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                At least 8 characters
              </li>
              <li className="flex items-center">
                <svg className="w-3 h-3 mr-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mix uppercase & lowercase
              </li>
              <li className="flex items-center">
                <svg className="w-3 h-3 mr-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Include numbers
              </li>
              <li className="flex items-center">
                <svg className="w-3 h-3 mr-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Add special characters
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
