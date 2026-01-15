import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Signup() {
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState(null) // 'individual' or 'company'
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
  const navigate = useNavigate()

  const businessTypes = [
    'Sole Proprietorship',
    'Partnership',
    'Limited Liability Company',
    'Public Limited Company',
    'Non-Profit Organization',
    'Other'
  ]

  const handleUserTypeSelect = (type) => {
    setUserType(type)
    setStep(2)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const validateForm = () => {

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emailToCheck = userType === 'individual' ? formData.email : formData.businessEmail
    if (!emailRegex.test(emailToCheck)) {
      toast.error('Please enter a valid email address')
      return false
    }

    // Password validation
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return false
    }

    // Required fields validation
    if (userType === 'individual') {
      if (!formData.fullName || !formData.email || !formData.monthlySalary) {
        toast.error('Please fill in all required fields')
        return false
      }
    } else {
      if (!formData.companyName || !formData.businessEmail || !formData.annualTurnover || !formData.businessType) {
        toast.error('Please fill in all required fields')
        return false
      }
    }

    // NDPR checkbox
    if (!formData.agreeToNDPR) {
      toast.error('You must agree to the Data Privacy Policy')
      return false
    }

    return true
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const email = userType === 'individual' ? formData.email : formData.businessEmail
      const { data, error } = await supabase.auth.signUp({
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

      // Wait a bit for the trigger to create the profile, then update it with additional data
      if (data.user) {
        // Wait for trigger to complete (give it 1 second)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const profileData = {
          id: data.user.id,
          user_type: userType,
          full_name: userType === 'individual' ? formData.fullName : formData.companyName,
          monthly_salary: userType === 'individual' && formData.monthlySalary 
            ? parseFloat(formData.monthlySalary) 
            : null,
          company_name: userType === 'company' ? formData.companyName : null,
          business_type: userType === 'company' ? formData.businessType : null,
          annual_turnover: userType === 'company' && formData.annualTurnover
            ? parseFloat(formData.annualTurnover) 
            : null,
          annual_income: userType === 'individual' && formData.monthlySalary
            ? parseFloat(formData.monthlySalary) * 12 
            : null,
          email: email
        }

        // Update profile (trigger should have created it, but we'll ensure it exists)
        try {
          // First check if profile exists
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', data.user.id)
            .single()

          if (existingProfile) {
            // Profile exists, update it
            const { error: profileError } = await supabase
              .from('user_profiles')
              .update(profileData)
              .eq('id', data.user.id)
            
            if (profileError) {
              console.error('Profile update error (non-critical):', profileError)
            }
          } else {
            // Profile doesn't exist yet, try to insert (trigger might not have run yet)
            await new Promise(resolve => setTimeout(resolve, 500))
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert(profileData)
            
            if (insertError) {
              console.error('Profile insert error (non-critical):', insertError)
            }
          }
        } catch (profileErr) {
          console.error('Profile update exception (non-critical):', profileErr)
        }
      }

      toast.success('Account created! Please check your email to verify your account.')
      navigate(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (error) {
      toast.error(error.message || 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/personal-calculator`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) throw error
      toast.success('Redirecting to Google...')
    } catch (error) {
      toast.error(error.message || 'An error occurred during Google signup')
      setLoading(false)
    }
  }

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">₦</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">Taxify</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-slate-900">Create your account</h2>
          <p className="mt-2 text-sm text-slate-600">
            Or{' '}
            <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <div className="card relative overflow-hidden">
          <AnimatePresence mode="wait" custom={step}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl font-semibold mb-6 text-center text-slate-900">
                  Who are you registering for?
                </h3>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleUserTypeSelect('individual')}
                    className="p-8 border-2 border-slate-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer text-left group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <svg className="w-6 h-6 text-slate-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-semibold text-slate-900 mb-2">Individual</h4>
                    <p className="text-slate-600">Calculate your personal income tax (PAYE)</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleUserTypeSelect('company')}
                    className="p-8 border-2 border-slate-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer text-left group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <svg className="w-6 h-6 text-slate-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-semibold text-slate-900 mb-2">Company</h4>
                    <p className="text-slate-600">Calculate your corporate income tax (CIT)</p>
                  </motion.button>
                </div>

                {/* Google Signup for Individuals */}
                <div className="border-t border-slate-200 pt-6">
                  <p className="text-center text-sm text-slate-600 mb-4">Quick signup for individuals</p>
                  <button
                    onClick={handleGoogleSignup}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-slate-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-medium text-slate-700">Sign up with Google</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={2}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setStep(1)}
                    className="mr-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="text-2xl font-semibold text-slate-900">
                    {userType === 'individual' ? 'Individual Registration' : 'Company Registration'}
                  </h3>
                </div>

                <form onSubmit={handleSignup} className="space-y-6">
                  {userType === 'individual' ? (
                    <>
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="you@example.com"
                        />
                      </div>

                      <div>
                        <label htmlFor="monthlySalary" className="block text-sm font-medium text-slate-700 mb-2">
                          Monthly Salary (₦) *
                        </label>
                        <input
                          id="monthlySalary"
                          name="monthlySalary"
                          type="number"
                          min="0"
                          step="1000"
                          required
                          value={formData.monthlySalary}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="200000"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label htmlFor="businessType" className="block text-sm font-medium text-slate-700 mb-2">
                          Business Type *
                        </label>
                        <select
                          id="businessType"
                          name="businessType"
                          required
                          value={formData.businessType}
                          onChange={handleInputChange}
                          className="input-field"
                        >
                          <option value="">Select business type</option>
                          {businessTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-2">
                          Company Name *
                        </label>
                        <input
                          id="companyName"
                          name="companyName"
                          type="text"
                          required
                          value={formData.companyName}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="ABC Enterprises Ltd"
                        />
                      </div>

                      <div>
                        <label htmlFor="businessEmail" className="block text-sm font-medium text-slate-700 mb-2">
                          Business Email *
                        </label>
                        <input
                          id="businessEmail"
                          name="businessEmail"
                          type="email"
                          required
                          value={formData.businessEmail}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="contact@company.com"
                        />
                      </div>

                      <div>
                        <label htmlFor="annualTurnover" className="block text-sm font-medium text-slate-700 mb-2">
                          Annual Turnover (₦) *
                        </label>
                        <input
                          id="annualTurnover"
                          name="annualTurnover"
                          type="number"
                          min="0"
                          step="1000"
                          required
                          value={formData.annualTurnover}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="100000000"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                      Password *
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Confirm your password"
                    />
                  </div>

                  <div className="flex items-start">
                    <input
                      id="agreeToNDPR"
                      name="agreeToNDPR"
                      type="checkbox"
                      checked={formData.agreeToNDPR}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300 rounded mt-1"
                    />
                    <label htmlFor="agreeToNDPR" className="ml-2 block text-sm text-slate-700">
                      I agree to the{' '}
                      <a href="#" className="text-green-600 hover:text-green-500 font-medium">
                        Data Privacy Policy
                      </a>{' '}
                      under the NDPR (Nigeria Data Protection Regulation). *
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
