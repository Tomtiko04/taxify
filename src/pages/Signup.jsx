import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Signup() {
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    monthlySalary: '',
    businessType: '',
    companyName: '',
    businessEmail: '',
    annualTurnover: '',
    password: '',
    confirmPassword: '',
    agreeToNDPR: false
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const businessTypes = [
    'Sole Proprietorship',
    'Partnership',
    'Limited Liability Company',
    'Public Limited Company',
    'Non-Profit Organization',
    'Other'
  ]

  // Validation
  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
      case 'companyName':
        return !value ? 'Required' : value.length < 2 ? 'Too short' : ''
      case 'email':
      case 'businessEmail':
        if (!value) return 'Required'
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email' : ''
      case 'monthlySalary':
      case 'annualTurnover':
        return !value ? 'Required' : parseFloat(value) < 0 ? 'Invalid' : ''
      case 'businessType':
        return !value ? 'Required' : ''
      case 'password':
        if (!value) return 'Required'
        if (value.length < 8) return 'Min 8 characters'
        return ''
      case 'confirmPassword':
        return value !== formData.password ? 'Passwords don\'t match' : ''
      default:
        return ''
    }
  }

  const getPasswordStrength = (pwd) => {
    let s = 0
    if (pwd.length >= 8) s++
    if (/[A-Z]/.test(pwd)) s++
    if (/[a-z]/.test(pwd)) s++
    if (/[0-9]/.test(pwd)) s++
    if (/[^A-Za-z0-9]/.test(pwd)) s++
    return s
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']

  useEffect(() => {
    const newErrors = {}
    Object.keys(touched).forEach(key => {
      if (touched[key]) {
        newErrors[key] = validateField(key, formData[key])
      }
    })
    setErrors(newErrors)
  }, [formData, touched])

  const handleBlur = (field) => setTouched(prev => ({ ...prev, [field]: true }))
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleUserTypeSelect = (type) => {
    setUserType(type)
    setStep(2)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    
    // Validate all
    const fields = userType === 'individual' 
      ? ['fullName', 'email', 'monthlySalary', 'password', 'confirmPassword']
      : ['companyName', 'businessEmail', 'businessType', 'annualTurnover', 'password', 'confirmPassword']
    
    const newErrors = {}
    fields.forEach(f => { newErrors[f] = validateField(f, formData[f]) })
    setErrors(newErrors)
    setTouched(fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}))

    if (Object.values(newErrors).some(e => e) || !formData.agreeToNDPR) {
      if (!formData.agreeToNDPR) toast.error('Please agree to the privacy policy')
      return
    }

    setLoading(true)
    try {
      const email = userType === 'individual' ? formData.email : formData.businessEmail
      const { error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            user_type: userType,
            full_name: formData.fullName,
            monthly_salary: formData.monthlySalary,
            company_name: formData.companyName,
            business_type: formData.businessType,
            annual_turnover: formData.annualTurnover,
          }
        }
      })
      if (error) throw error
      toast.success('Check your email to verify your account!')
      navigate(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (error) {
      toast.error(error.message || 'Signup failed')
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` }
      })
      if (error) throw error
    } catch (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  const InputField = ({ name, label, type = 'text', placeholder, value }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={handleInputChange}
        onBlur={() => handleBlur(name)}
        className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:outline-none focus:bg-white transition-all text-sm ${
          errors[name] && touched[name] ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
        }`}
        placeholder={placeholder}
      />
      {errors[name] && touched[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 relative overflow-hidden items-center justify-center p-8">
        <motion.div 
          className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-10 left-10 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="relative z-10 text-white max-w-sm">
          {/* Step indicator */}
          <div className="flex items-center mb-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-white text-green-600' : 'bg-white/30'}`}>1</div>
            <div className={`w-12 h-1 mx-2 rounded ${step >= 2 ? 'bg-white' : 'bg-white/30'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-white text-green-600' : 'bg-white/30'}`}>2</div>
          </div>

          <motion.h2 
            className="text-2xl font-bold mb-3"
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {step === 1 ? 'Join Taxify Today' : userType === 'individual' ? 'Personal Account' : 'Business Account'}
          </motion.h2>
          
          <motion.p 
            className="text-green-100 mb-6 text-sm"
            key={`${step}-p`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {step === 1 
              ? 'Create an account to save calculations and get personalized tax insights.'
              : userType === 'individual'
                ? 'Calculate your PAYE with all deductions and reliefs.'
                : 'Calculate your CIT and development levy with ease.'
            }
          </motion.p>

          {/* Benefits */}
          <div className="space-y-3">
            {(step === 1 ? [
              'Free to use',
              'Nigeria Tax Act 2025',
              'NDPR compliant',
              'Access anywhere'
            ] : userType === 'individual' ? [
              'PAYE calculation',
              'Pension & NHF deductions',
              'Rent relief (₦500K max)',
              '₦800K tax-free threshold'
            ] : [
              'CIT calculation',
              'Development levy',
              'Small business exemptions',
              'Assessable profit breakdown'
            ]).map((item, i) => (
              <motion.div 
                key={i}
                className="flex items-center text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <svg className="w-4 h-4 mr-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-100">{item}</span>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { value: '10K+', label: 'Users' },
                { value: '98%', label: 'Accuracy' },
                { value: 'Secure', label: 'Data' }
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-lg font-bold">{stat.value}</div>
                  <div className="text-xs text-green-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 lg:p-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
              <span className="text-white font-bold text-xl">₦</span>
            </div>
            <span className="text-xl font-bold text-slate-900">Taxify</span>
          </Link>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
                <p className="text-slate-500 mb-6 text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="text-green-600 hover:text-green-500 font-medium">Sign in</Link>
                </p>

                {/* Account Type Selection */}
                <div className="space-y-3 mb-5">
                  <button
                    onClick={() => handleUserTypeSelect('individual')}
                    className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50/50 transition-all text-left group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white mr-3 group-hover:scale-105 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 text-sm">Individual</div>
                        <div className="text-xs text-slate-500">Personal income tax (PAYE)</div>
                      </div>
                      <svg className="w-5 h-5 text-slate-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  <button
                    onClick={() => handleUserTypeSelect('company')}
                    className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50/50 transition-all text-left group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white mr-3 group-hover:scale-105 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 text-sm">Company</div>
                        <div className="text-xs text-slate-500">Corporate income tax (CIT)</div>
                      </div>
                      <svg className="w-5 h-5 text-slate-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-slate-400">Quick signup with Google for Individual</span>
                  </div>
                </div>

                {/* Google */}
                <button
                  onClick={handleGoogleSignup}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-slate-700">Continue with Google</span>
                </button>

                <p className="mt-5 text-center text-xs text-slate-400">
                  By signing up, you agree to our{' '}
                  <Link to="/terms" className="text-green-600 hover:underline">Terms</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-green-600 hover:underline">Privacy Policy</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center text-slate-500 hover:text-slate-700 mb-4 text-sm group"
                >
                  <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  {userType === 'individual' ? 'Personal Details' : 'Business Details'}
                </h1>
                <p className="text-slate-500 mb-5 text-sm">Fill in your information to get started</p>

                <form onSubmit={handleSignup} className="space-y-4">
                  {userType === 'individual' ? (
                    <>
                      <InputField name="fullName" label="Full Name" placeholder="John Doe" value={formData.fullName} />
                      <InputField name="email" label="Email" type="email" placeholder="you@example.com" value={formData.email} />
                      <InputField name="monthlySalary" label="Monthly Salary (₦)" type="number" placeholder="200000" value={formData.monthlySalary} />
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Type</label>
                        <select
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('businessType')}
                          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:outline-none focus:bg-white text-sm ${
                            errors.businessType && touched.businessType ? 'border-red-300' : 'border-slate-200 focus:border-green-500'
                          }`}
                        >
                          <option value="">Select type</option>
                          {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {errors.businessType && touched.businessType && <p className="mt-1 text-xs text-red-500">{errors.businessType}</p>}
                      </div>
                      <InputField name="companyName" label="Company Name" placeholder="ABC Ltd" value={formData.companyName} />
                      <InputField name="businessEmail" label="Business Email" type="email" placeholder="contact@company.com" value={formData.businessEmail} />
                      <InputField name="annualTurnover" label="Annual Turnover (₦)" type="number" placeholder="100000000" value={formData.annualTurnover} />
                    </>
                  )}

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('password')}
                        className={`w-full px-4 py-2.5 pr-10 bg-slate-50 border rounded-lg focus:outline-none focus:bg-white text-sm ${
                          errors.password && touched.password ? 'border-red-300' : 'border-slate-200 focus:border-green-500'
                        }`}
                        placeholder="Min 8 characters"
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
                    {formData.password && (
                      <div className="flex gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`h-1 flex-1 rounded ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-slate-200'}`}></div>
                        ))}
                      </div>
                    )}
                    {errors.password && touched.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                    <input
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('confirmPassword')}
                      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:outline-none focus:bg-white text-sm ${
                        errors.confirmPassword && touched.confirmPassword ? 'border-red-300' : 'border-slate-200 focus:border-green-500'
                      }`}
                      placeholder="Confirm password"
                    />
                    {errors.confirmPassword && touched.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
                  </div>

                  {/* NDPR */}
                  <label className="flex items-start cursor-pointer">
                    <input
                      name="agreeToNDPR"
                      type="checkbox"
                      checked={formData.agreeToNDPR}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-slate-300 rounded mt-0.5"
                    />
                    <span className="ml-2 text-xs text-slate-600">
                      I agree to the <Link to="/privacy" className="text-green-600 hover:underline">Privacy Policy</Link> under NDPR
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg shadow-md shadow-green-500/25 hover:shadow-lg transition-all disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
