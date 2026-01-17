import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateCIT, formatCurrency } from '../utils/taxCalculations'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function BusinessCalculator() {
  const [mode, setMode] = useState(null) // 'ai' or 'manual' or null (selection screen)
  const [turnover, setTurnover] = useState('')
  const [assets, setAssets] = useState('')
  const [profit, setProfit] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [depreciation, setDepreciation] = useState('0')
  const [fines, setFines] = useState('0')
  const [capitalAllowances, setCapitalAllowances] = useState('0')
  
  const [results, setResults] = useState(null)
  const [session, setSession] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState({
    auditedStatement: null,
    assetRegister: null,
    trialBalance: null,
    whtNotes: null
  })
  const isMounted = useRef(true)

  const documentTypes = [
    { 
      id: 'auditedStatement', 
      name: 'Audited Financial Statement', 
      required: true, 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: 'assetRegister', 
      name: 'Fixed Asset Register', 
      required: false, 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      id: 'trialBalance', 
      name: 'Trial Balance', 
      required: false, 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: 'whtNotes', 
      name: 'WHT Credit Notes', 
      required: false, 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ]

  // Check session on mount
  useEffect(() => {
    isMounted.current = true
    
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error?.name === 'AbortError' || !isMounted.current) return
      setSession(session)
    }).catch(err => {
      if (err?.name !== 'AbortError') console.error(err)
    })
    
    let subscription = null
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (isMounted.current) setSession(session)
      })
      subscription = data?.subscription
    } catch (err) {
      console.error('Auth listener error:', err)
    }
    
    return () => {
      isMounted.current = false
      if (subscription) subscription.unsubscribe()
    }
  }, [])

  const handleCalculate = (e) => {
    if (e) e.preventDefault()
    
    const turnoverValue = parseFloat(turnover) || 0
    const assetsValue = parseFloat(assets) || 0
    const profitValue = parseFloat(profit) || 0
    const depreciationValue = parseFloat(depreciation) || 0
    const finesValue = parseFloat(fines) || 0
    const capitalAllowancesValue = parseFloat(capitalAllowances) || 0

    if (turnoverValue <= 0) {
      toast.error('Please enter a valid annual turnover')
      return
    }

    const calculation = calculateCIT(
      turnoverValue, 
      assetsValue, 
      profitValue, 
      depreciationValue, 
      finesValue, 
      capitalAllowancesValue
    )
    
    setResults(calculation)
    toast.success('Tax calculated successfully!')
  }

  const handleFileChange = async (e, typeId) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    try {
      const reader = new FileReader()
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = (error) => reject(error)
      })
      reader.readAsDataURL(file)
      const base64 = await base64Promise
      
      setUploadedFiles(prev => ({
        ...prev,
        [typeId]: {
          name: file.name,
          data: base64
        }
      }))
      
      toast.success(`${documentTypes.find(d => d.id === typeId).name} uploaded`)
    } catch (error) {
      console.error('File read error:', error)
      toast.error('Failed to read file')
    }
  }

  const runAiAnalysis = async () => {
    const filesToUpload = Object.entries(uploadedFiles)
      .filter(([_, file]) => file !== null)
      .map(([type, file]) => ({
        type,
        name: file.name,
        data: file.data
      }))

    if (filesToUpload.length === 0) {
      toast.error('Please upload at least the Audited Financial Statement')
      return
    }

    if (!uploadedFiles.auditedStatement) {
      toast.error('Audited Financial Statement is highly recommended for accurate results')
    }

    setIsAnalyzing(true)
    setUploadProgress(10)
    toast.loading('AI is analyzing your documents...', { id: 'analysis' })

    try {
      setUploadProgress(30)
      
      const payload = { pdfs: filesToUpload }
      const payloadSize = JSON.stringify(payload).length
      console.log(`Sending payload to AI: ${(payloadSize / 1024 / 1024).toFixed(2)} MB`)

      if (payloadSize > 8 * 1024 * 1024) {
        toast.error('Files are too large. Please upload smaller PDFs (total under 8MB).', { id: 'analysis' })
        setIsAnalyzing(false)
        return
      }

      const { data, error } = await supabase.functions.invoke('analyze-tax-docs', {
        body: payload
      })

      if (error) throw error

      console.log('AI Extraction Result:', data)
      
      if (data?.error) {
        throw new Error(data.error)
      }
      
      setUploadProgress(100)
      toast.success('Analysis complete! Data extracted.', { id: 'analysis' })

      if (data.company_name) setCompanyName(data.company_name)
      if (data.annual_turnover) setTurnover(data.annual_turnover.toString())
      if (data.total_fixed_assets) setAssets(data.total_fixed_assets.toString())
      if (data.net_profit_before_tax) setProfit(data.net_profit_before_tax.toString())
      if (data.depreciation) setDepreciation(data.depreciation.toString())
      if (data.fines_penalties) setFines(data.fines_penalties.toString())
      if (data.capital_allowances) setCapitalAllowances(data.capital_allowances.toString())

      setIsAnalyzing(false)
    } catch (error) {
      console.error('Analysis error:', error)
      
      let errorMessage = 'Failed to analyze documents. Please enter details manually.'
      
      if (error.message?.includes('API Key not configured')) {
        errorMessage = 'AI service not configured. Please contact support.'
      } else if (error.message?.includes('payload too large')) {
        errorMessage = 'Files are too large for the AI to process.'
      } else if (error.name === 'AbortError') {
        errorMessage = 'Request was cancelled. Please try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage, { id: 'analysis' })
      setIsAnalyzing(false)
    }
  }

  // Mode Selection Screen
  if (mode === null) {
    return (
      <div className="min-h-screen pt-19 pb-16 bg-slate-50">
        {/* Hero Section */}
        <div className="text-white bg-gradient-to-br from-green-600 via-emerald-600 to-green-700">
          <div className="max-w-6xl px-4 py-[7em] mx-auto sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center px-4 py-2 mb-4 text-sm rounded-full bg-white/10 backdrop-blur-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Updated for Nigeria Tax Act 2025
              </div>
              <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
                Corporate Income Tax Calculator
              </h1>
              <p className="max-w-2xl mx-auto text-lg text-green-100">
                Calculate your business tax obligations quickly and accurately
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-4xl px-4 mx-auto -mt-8 sm:px-6 lg:px-8">
          {/* Method Selection Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center mb-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-green-500"></div>
              <div className="mx-4 w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-green-500"></div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Choose Your Method</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Select the approach that works best for your business. Both methods provide accurate tax calculations.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* AI Option */}
            <motion.button
              onClick={() => setMode('ai')}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="group relative p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-green-500 hover:shadow-2xl hover:shadow-green-500/10 transition-all text-left overflow-hidden"
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 to-emerald-50/0 group-hover:from-green-50 group-hover:to-emerald-50 transition-all duration-300"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg shadow-green-500/25">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Recommended
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-green-700 transition-colors">
                  AI-Powered Analysis
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Upload your Audited Financial Statements and let our advanced AI extract all financial data automatically. Perfect for businesses with complete documentation.
                </p>
                
                <ul className="text-sm text-slate-600 space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Automatic data extraction from PDFs</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Reduces manual errors significantly</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Review & edit extracted data before calculating</span>
                  </li>
                </ul>
                
                <div className="flex items-center text-green-600 font-semibold group-hover:text-green-700 group-hover:translate-x-2 transition-all">
                  <span>Get Started with AI</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </motion.button>

            {/* Manual Option */}
            <motion.button
              onClick={() => setMode('manual')}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="group relative p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all text-left overflow-hidden"
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50 group-hover:to-indigo-50 transition-all duration-300"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg shadow-blue-500/25">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    Quick Start
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                  Manual Entry
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Enter your financial data directly into our intuitive form. Ideal for quick calculations or when you don't have documents ready.
                </p>
                
                <ul className="text-sm text-slate-600 space-y-3 mb-6">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>No documents required</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Full control over all inputs</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Instant calculation results</span>
                  </li>
                </ul>
                
                <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700 group-hover:translate-x-2 transition-all">
                  <span>Start Manual Entry</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </motion.button>
          </div>

          {/* Tax Rules Info */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Corporate Tax Rules (2026)</h3>
              <p className="text-slate-600 text-sm">Understanding business classification and tax rates</p>
            </div>
            <div className="p-6 sm:p-8 grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-green-900">Small Business</h4>
                </div>
                <p className="text-xs text-green-700 mb-2">Turnover ≤ ₦100M AND Assets ≤ ₦250M</p>
                <p className="text-sm text-green-800 font-bold">0% CIT • 0% Dev Levy</p>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-blue-900">Large Business</h4>
                </div>
                <p className="text-xs text-blue-700 mb-2">Turnover &gt; ₦100M OR Assets &gt; ₦250M</p>
                <p className="text-sm text-blue-800 font-bold">30% CIT • 4% Dev Levy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calculator Screen (AI or Manual mode)
  return (
    <div className="min-h-screen pb-16 pt-19 bg-slate-50">
      {/* Hero Section */}
      <div className="text-white bg-gradient-to-br from-green-600 via-emerald-600 to-green-700">
        <div className="max-w-6xl px-4 py-[7em] mx-auto sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center px-4 py-2 mb-4 text-sm rounded-full bg-white/10 backdrop-blur-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Updated for Nigeria Tax Act 2025
            </div>
            <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
              Corporate Income Tax Calculator
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-green-100">
              {mode === 'ai' 
                ? 'Upload your documents and let AI extract the data' 
                : 'Enter your financial details to calculate tax'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl px-4 mx-auto -mt-8 sm:px-6 lg:px-8">
        {/* Mode Badge and Back Button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              setMode(null)
              setResults(null)
            }}
            className="flex items-center px-4 py-2 text-slate-600 hover:text-green-600 hover:bg-white rounded-xl transition-all"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Options
          </button>
          <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm">
            {mode === 'ai' ? (
              <>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-sm font-medium text-green-700">AI Mode</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-sm font-medium text-blue-700">Manual Mode</span>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Column - Form */}
          <div className="lg:col-span-3 space-y-6">
            {mode === 'ai' && (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Documents
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">Upload your financial documents for AI analysis</p>
                </div>
                
                <div className="p-6 sm:p-8 space-y-3">
                  {documentTypes.map((doc) => (
                    <div key={doc.id} className="relative">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, doc.id)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={isAnalyzing}
                      />
                      <div className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
                        uploadedFiles[doc.id] 
                          ? 'bg-green-50 border-green-400' 
                          : 'bg-slate-50 border-slate-200 hover:border-green-400'
                      }`}>
                        <div className="flex items-center overflow-hidden flex-1">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 ${
                            uploadedFiles[doc.id] ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {doc.icon}
                          </div>
                          <div className="flex flex-col overflow-hidden min-w-0">
                            <span className="text-sm font-medium truncate">
                              {uploadedFiles[doc.id] ? uploadedFiles[doc.id].name : doc.name}
                            </span>
                            {doc.required && !uploadedFiles[doc.id] && (
                              <span className="text-[10px] text-amber-600 font-bold uppercase">Required</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          {uploadedFiles[doc.id] ? (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                  <button
                    onClick={runAiAnalysis}
                    disabled={isAnalyzing || !uploadedFiles.auditedStatement}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center transition-all ${
                      isAnalyzing || !uploadedFiles.auditedStatement
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg shadow-green-500/25'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Processing... {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Extract Data with AI
                      </>
                    )}
                  </button>
                  
                  <p className="mt-3 text-xs text-slate-400 italic text-center">
                    Your documents are processed securely and not stored.
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">
                  {mode === 'ai' ? 'Review & Edit Extracted Data' : 'Enter Your Financial Details'}
                </h2>
                <p className="text-sm text-slate-600 mt-1">Fill in the required information to calculate your tax</p>
              </div>
              <form onSubmit={handleCalculate} className="p-6 sm:p-8 space-y-5">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-2">
                    Company Name <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none transition-all"
                    placeholder="e.g., ABC Enterprises Ltd"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="turnover" className="block text-sm font-medium text-slate-700 mb-2">
                      Annual Turnover <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₦</span>
                      <input
                        id="turnover"
                        type="number"
                        required
                        value={turnover}
                        onChange={(e) => setTurnover(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none transition-all"
                        placeholder="100,000,000"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="assets" className="block text-sm font-medium text-slate-700 mb-2">
                      Total Fixed Assets
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₦</span>
                      <input
                        id="assets"
                        type="number"
                        value={assets}
                        onChange={(e) => setAssets(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none transition-all"
                        placeholder="250,000,000"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="profit" className="block text-sm font-medium text-slate-700 mb-2">
                    Net Profit Before Tax
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₦</span>
                    <input
                      id="profit"
                      type="number"
                      value={profit}
                      onChange={(e) => setProfit(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none transition-all"
                      placeholder="25,000,000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="depreciation" className="block text-xs font-medium text-slate-700 mb-1.5">
                      Depreciation
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₦</span>
                      <input
                        id="depreciation"
                        type="number"
                        value={depreciation}
                        onChange={(e) => setDepreciation(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/10 focus:outline-none transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="fines" className="block text-xs font-medium text-slate-700 mb-1.5">
                      Fines/Penalties
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₦</span>
                      <input
                        id="fines"
                        type="number"
                        value={fines}
                        onChange={(e) => setFines(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/10 focus:outline-none transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="capitalAllowances" className="block text-xs font-medium text-slate-700 mb-1.5">
                      Cap. Allowances
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₦</span>
                      <input
                        id="capitalAllowances"
                        type="number"
                        value={capitalAllowances}
                        onChange={(e) => setCapitalAllowances(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/10 focus:outline-none transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <motion.button 
                  type="submit" 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all mt-6"
                >
                  Calculate Tax Liability
                </motion.button>
              </form>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden sticky top-24">
              <div className="p-6 sm:p-8 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Tax Breakdown</h2>
              </div>
              
              {results ? (
                <div className="p-6 sm:p-8 space-y-5">
                  {companyName && (
                    <div className="text-center mb-4 pb-4 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800">{companyName}</h3>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Tax Liability Summary</p>
                    </div>
                  )}
                  
                  {/* Business Category */}
                  <div className={`rounded-xl p-4 border-2 ${
                    results.isSmallBusiness 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">Classification</span>
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                        results.isSmallBusiness
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {results.isSmallBusiness ? 'Small Company' : 'Large Company'}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex justify-between items-center mb-2 text-sm">
                      <span className="text-slate-600">Annual Turnover</span>
                      <span className="font-bold">{formatCurrency(results.turnover)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2 text-sm">
                      <span className="text-slate-600">Total Fixed Assets</span>
                      <span className="font-bold">{formatCurrency(results.assets)}</span>
                    </div>
                    <div className="border-t border-slate-200 my-2 pt-2 flex justify-between items-center">
                      <span className="text-slate-800 font-semibold">Assessable Profit</span>
                      <span className="font-bold text-lg">{formatCurrency(results.assessableProfit)}</span>
                    </div>
                  </div>

                  {/* Tax Breakdown */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                    <h3 className="font-bold text-slate-900 mb-4">Tax Obligations</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">CIT ({results.citRate}%)</span>
                        <span className="font-semibold">{formatCurrency(results.cit)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Dev. Levy ({results.developmentLevyRate}%)</span>
                        <span className="font-semibold">{formatCurrency(results.developmentLevy)}</span>
                      </div>
                      <div className="border-t-2 border-green-200 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-900 font-bold text-base">Total Tax Payable</span>
                          <span className="font-bold text-2xl text-green-600">{formatCurrency(results.totalTax)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Note */}
                  {results.note && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-xs text-amber-800">{results.note}</p>
                    </div>
                  )}

                  {/* Save/Report Actions */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    {session ? (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('saved_calculations')
                                .insert({
                                  user_id: session.user.id,
                                  calculation_type: 'business',
                                  data: results,
                                  inputs: { 
                                    turnover, assets, profit, companyName, 
                                    depreciation, fines, capitalAllowances 
                                  }
                                })
                              if (error) throw error
                              toast.success('Calculation saved successfully!')
                            } catch (error) {
                              toast.error('Error saving calculation. Please try again.')
                            }
                          }}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg shadow-green-500/25 transition-all flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Save Results
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="w-full bg-slate-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Generate Report
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-center text-slate-500 mb-2">
                          Sign up to save your results
                        </p>
                        <Link
                          to="/signup"
                          className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg shadow-green-500/25 transition-all text-center flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Save Results
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Fill in the form and click<br/>"Calculate Tax Liability"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
