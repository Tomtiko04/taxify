import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function ChatbotSignup({ onComplete }) {
  const [step, setStep] = useState(0)
  const [userType, setUserType] = useState(null)
  const [annualIncome, setAnnualIncome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const messages = [
    {
      type: 'ai',
      text: "Hi! Are you checking taxes for yourself or your business?",
      options: ['Myself (Individual)', 'My Business']
    },
    {
      type: 'ai',
      text: userType === 'individual' 
        ? "Great! Roughly how much do you make in a year?"
        : "Great! Roughly how much does the business make in a year?",
      input: true,
      inputType: 'number',
      placeholder: 'Enter annual income/turnover in ₦',
      value: annualIncome,
      onChange: setAnnualIncome
    },
    {
      type: 'ai',
      text: "Perfect! To save your calculations and generate reports, I'll need your email and a password.",
      input: true,
      inputType: 'email',
      placeholder: 'your@email.com',
      value: email,
      onChange: setEmail
    },
    {
      type: 'ai',
      text: "And finally, create a password (at least 8 characters):",
      input: true,
      inputType: 'password',
      placeholder: 'Create a secure password',
      value: password,
      onChange: setPassword
    }
  ]

  const handleOptionSelect = (option) => {
    if (step === 0) {
      setUserType(option.includes('Individual') ? 'individual' : 'business')
      setStep(1)
    }
  }

  const handleNext = async () => {
    if (step === 1) {
      if (!annualIncome || parseFloat(annualIncome) <= 0) {
        setError('Please enter a valid annual income')
        return
      }
      setStep(2)
    } else if (step === 2) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address')
        return
      }
      setStep(3)
    } else if (step === 3) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
      // Sign up
      setLoading(true)
      setError('')
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              user_type: userType,
              annual_income: annualIncome
            }
          }
        })
        if (error) throw error
        if (onComplete) onComplete()
      } catch (error) {
        setError(error.message || 'An error occurred')
        setLoading(false)
      }
    }
  }

  const handleInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNext()
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">TaxBuddy Assistant</h3>
              <p className="text-sm text-green-100">Let's get you set up</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {messages.slice(0, step + 1).map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`flex ${message.type === 'ai' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[80%] ${message.type === 'ai' ? 'bg-slate-100' : 'bg-green-600 text-white'} rounded-2xl p-4`}>
                  <p className="text-sm">{message.text}</p>
                  
                  {message.options && (
                    <div className="mt-3 space-y-2">
                      {message.options.map((option, optIndex) => (
                        <button
                          key={optIndex}
                          onClick={() => handleOptionSelect(option)}
                          className="block w-full text-left px-4 py-2 bg-white text-slate-900 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {message.input && index === step && (
                    <div className="mt-3">
                      <input
                        type={message.inputType}
                        value={message.value}
                        onChange={(e) => message.onChange(e.target.value)}
                        onKeyPress={handleInputKeyPress}
                        placeholder={message.placeholder}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                      {error && index === step && (
                        <p className="mt-2 text-xs text-red-600">{error}</p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {step < messages.length - 1 && (
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                disabled={loading || (step === 1 && !annualIncome) || (step === 2 && !email) || (step === 3 && !password)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {loading ? 'Creating account...' : 'Next →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
