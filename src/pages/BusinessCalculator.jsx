import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
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
    { id: 'auditedStatement', name: 'Audited Financial Statement', required: true, icon: '📋' },
    { id: 'assetRegister', name: 'Fixed Asset Register', required: false, icon: '🏭' },
    { id: 'trialBalance', name: 'Trial Balance', required: false, icon: '⚖️' },
    { id: 'whtNotes', name: 'WHT Credit Notes', required: false, icon: '🎟️' }
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
      <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-green-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Corporate Income Tax Calculator</h1>
            <p className="text-lg text-slate-600">
              Calculate your business tax obligations based on Nigeria Tax Act 2025 (effective Jan 2026)
            </p>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">How would you like to proceed?</h2>
            <p className="text-slate-600">Choose the method that works best for you</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* AI Option */}
            <button
              onClick={() => setMode('ai')}
              className="group p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-green-500 hover:shadow-xl transition-all text-left"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">AI-Powered Analysis</h3>
              <p className="text-slate-600 mb-4">
                Upload your Audited Financial Statements and let AI extract all the data automatically.
              </p>
              <ul className="text-sm text-slate-500 space-y-1">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Automatic data extraction
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Reduces manual errors
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Review &amp; edit before calculating
                </li>
              </ul>
              <div className="mt-6 flex items-center text-green-600 font-semibold group-hover:translate-x-2 transition-transform">
                Upload Documents
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>

            {/* Manual Option */}
            <button
              onClick={() => setMode('manual')}
              className="group p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all text-left"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">✏️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Manual Entry</h3>
              <p className="text-slate-600 mb-4">
                Enter your financial data directly into the form. Quick and straightforward.
              </p>
              <ul className="text-sm text-slate-500 space-y-1">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  No documents needed
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Full control over inputs
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Instant calculation
                </li>
              </ul>
              <div className="mt-6 flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                Enter Data Manually
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>
          </div>

          {/* Tax Rules Info */}
          <div className="mt-12 card max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-slate-900">Corporate Tax Rules (2026)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-green-900 mb-2">Small Business</h4>
                <p className="text-xs text-green-700 mb-2">Turnover ≤ ₦100M AND Assets ≤ ₦250M</p>
                <p className="text-sm text-green-800 font-bold">0% CIT • 0% Dev Levy</p>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Large Business</h4>
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
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-green-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => {
              setMode(null)
              setResults(null)
            }}
            className="flex items-center text-slate-600 hover:text-green-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Options
          </button>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              mode === 'ai' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {mode === 'ai' ? '✨ AI Mode' : '✏️ Manual Mode'}
            </span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Corporate Income Tax Calculator</h1>
          <p className="text-slate-600">
            {mode === 'ai' 
              ? 'Upload your documents and let AI extract the data' 
              : 'Enter your financial details to calculate tax'}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {mode === 'ai' && (
              <div className="card border-2 border-dashed border-green-300 bg-green-50/50">
                <h2 className="text-xl font-semibold mb-4 text-slate-900 flex items-center">
                  <span className="mr-2">📄</span>
                  Upload Documents
                </h2>
                
                <div className="space-y-3">
                  {documentTypes.map((doc) => (
                    <div key={doc.id} className="relative">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, doc.id)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={isAnalyzing}
                      />
                      <div className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                        uploadedFiles[doc.id] 
                          ? 'bg-green-100 border-green-400 text-green-800' 
                          : 'bg-white border-slate-200 hover:border-green-400'
                      }`}>
                        <div className="flex items-center overflow-hidden">
                          <span className="text-lg mr-3">{doc.icon}</span>
                          <div className="flex flex-col overflow-hidden">
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

                <button
                  onClick={runAiAnalysis}
                  disabled={isAnalyzing || !uploadedFiles.auditedStatement}
                  className={`w-full mt-6 py-3 rounded-lg font-bold flex items-center justify-center transition-all ${
                    isAnalyzing || !uploadedFiles.auditedStatement
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing... {uploadProgress}%
                    </>
                  ) : (
                    '🚀 Extract Data with AI'
                  )}
                </button>
                
                <p className="mt-3 text-[10px] text-slate-400 italic text-center">
                  Your documents are processed securely and not stored.
                </p>
              </div>
            )}

            {/* Form - Always shown, but with different header based on mode */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-6 text-slate-900">
                {mode === 'ai' ? 'Review & Edit Extracted Data' : 'Enter Your Financial Details'}
              </h2>
              <form onSubmit={handleCalculate} className="space-y-5">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1">
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="input-field"
                    placeholder="e.g., ABC Enterprises Ltd"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="turnover" className="block text-sm font-medium text-slate-700 mb-1">
                      Annual Turnover (₦) *
                    </label>
                    <input
                      id="turnover"
                      type="number"
                      required
                      value={turnover}
                      onChange={(e) => setTurnover(e.target.value)}
                      className="input-field"
                      placeholder="100,000,000"
                    />
                  </div>
                  <div>
                    <label htmlFor="assets" className="block text-sm font-medium text-slate-700 mb-1">
                      Total Fixed Assets (₦)
                    </label>
                    <input
                      id="assets"
                      type="number"
                      value={assets}
                      onChange={(e) => setAssets(e.target.value)}
                      className="input-field"
                      placeholder="250,000,000"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profit" className="block text-sm font-medium text-slate-700 mb-1">
                    Net Profit Before Tax (₦)
                  </label>
                  <input
                    id="profit"
                    type="number"
                    value={profit}
                    onChange={(e) => setProfit(e.target.value)}
                    className="input-field"
                    placeholder="25,000,000"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="depreciation" className="block text-xs font-medium text-slate-700 mb-1">
                      Depreciation (₦)
                    </label>
                    <input
                      id="depreciation"
                      type="number"
                      value={depreciation}
                      onChange={(e) => setDepreciation(e.target.value)}
                      className="input-field py-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="fines" className="block text-xs font-medium text-slate-700 mb-1">
                      Fines/Penalties (₦)
                    </label>
                    <input
                      id="fines"
                      type="number"
                      value={fines}
                      onChange={(e) => setFines(e.target.value)}
                      className="input-field py-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="capitalAllowances" className="block text-xs font-medium text-slate-700 mb-1">
                      Cap. Allowances (₦)
                    </label>
                    <input
                      id="capitalAllowances"
                      type="number"
                      value={capitalAllowances}
                      onChange={(e) => setCapitalAllowances(e.target.value)}
                      className="input-field py-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full btn-primary mt-4">
                  Calculate Tax Liability
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="card h-fit sticky top-8">
            <h2 className="text-xl font-semibold mb-6 text-slate-900">Tax Breakdown</h2>
            
            {results ? (
              <div className="space-y-5">
                {companyName && (
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">{companyName}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">Tax Liability Summary</p>
                  </div>
                )}
                
                {/* Business Category */}
                <div className={`rounded-lg p-4 border-2 ${
                  results.isSmallBusiness 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">Classification</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      results.isSmallBusiness
                        ? 'bg-green-200 text-green-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}>
                      {results.isSmallBusiness ? 'Small Company' : 'Large Company'}
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
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
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-slate-900 mb-3">Tax Obligations</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">CIT ({results.citRate}%)</span>
                      <span className="font-semibold">{formatCurrency(results.cit)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Dev. Levy ({results.developmentLevyRate}%)</span>
                      <span className="font-semibold">{formatCurrency(results.developmentLevy)}</span>
                    </div>
                    <div className="border-t border-green-200 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-900 font-bold">Total Tax Payable</span>
                        <span className="font-bold text-xl text-green-600">{formatCurrency(results.totalTax)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note */}
                {results.note && (
                  <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-600">{results.note}</p>
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
                        className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                      >
                        💾 Save Results
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="w-full bg-slate-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-slate-700 transition-colors text-sm"
                      >
                        📄 Generate Report
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-center text-slate-500 mb-2">
                        Sign up to save your results
                      </p>
                      <Link
                        to="/signup"
                        className="block w-full bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center text-sm"
                      >
                        💾 Save Results
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
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
  )
}
