import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { calculateCIT, formatCurrency, formatNumberWithCommas, parseFormattedNumber } from '../utils/taxCalculations'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function BusinessCalculator({ session }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState(null) // 'ai' or 'manual' or null (selection screen)
  const [turnover, setTurnover] = useState('')
  const [assets, setAssets] = useState('')
  const [profit, setProfit] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [depreciation, setDepreciation] = useState('0')
  const [fines, setFines] = useState('0')
  const [capitalAllowances, setCapitalAllowances] = useState('0')
  
  const [results, setResults] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState({
    auditedStatement: null,
    assetRegister: null,
    trialBalance: null,
    whtNotes: null
  })

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

  // Session is now handled by App.jsx and passed as a prop

  const handleCalculate = (e) => {
    if (e) e.preventDefault()
    
    const turnoverValue = parseFormattedNumber(turnover)
    const assetsValue = parseFormattedNumber(assets)
    const profitValue = parseFormattedNumber(profit)
    const depreciationValue = parseFormattedNumber(depreciation)
    const finesValue = parseFormattedNumber(fines)
    const capitalAllowancesValue = parseFormattedNumber(capitalAllowances)

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

  const handleSave = async () => {
    if (!results) {
      toast.error('Please calculate tax first')
      return
    }

    if (!session?.user) {
      const calcData = { 
        turnover, assets, profit, companyName, 
        depreciation, fines, capitalAllowances,
        results
      }
      localStorage.setItem('businessCalculationData', JSON.stringify(calcData))
      localStorage.setItem('returnUrl', '/business-calculator')
      toast.loading('Redirecting to login...', { id: 'login-redirect' })
      navigate('/login?return=/business-calculator')
      return
    }

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
      navigate('/dashboard/history')
    } catch (error) {
      toast.error('Error saving calculation. Please try again.')
    }
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

    setIsAnalyzing(true)
    setUploadProgress(10)
    toast.loading('AI is analyzing your documents...', { id: 'analysis' })

    try {
      setUploadProgress(30)
      
      const payload = { pdfs: filesToUpload }
      const payloadSize = JSON.stringify(payload).length

      if (payloadSize > 8 * 1024 * 1024) {
        toast.error('Files are too large. Please upload smaller PDFs (total under 8MB).', { id: 'analysis' })
        setIsAnalyzing(false)
        return
      }

      const { data, error } = await supabase.functions.invoke('analyze-tax-docs', {
        body: payload
      })

      if (error) throw error
      
      if (data?.error) {
        throw new Error(data.error)
      }
      
      setUploadProgress(100)
      toast.success('Analysis complete! Data extracted.', { id: 'analysis' })

      if (data.company_name) setCompanyName(data.company_name)
      if (data.annual_turnover) setTurnover(data.annual_turnover.toString())
      if (data.total_fixed_assets) setAssets(formatNumberWithCommas(data.total_fixed_assets.toString()))
      if (data.net_profit_before_tax) setProfit(formatNumberWithCommas(data.net_profit_before_tax.toString()))
      if (data.depreciation) setDepreciation(formatNumberWithCommas(data.depreciation.toString()))
      if (data.fines_penalties) setFines(data.fines_penalties.toString())
      if (data.capital_allowances) setCapitalAllowances(formatNumberWithCommas(data.capital_allowances.toString()))

      setIsAnalyzing(false)
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error(error.message || 'Failed to analyze documents', { id: 'analysis' })
      setIsAnalyzing(false)
    }
  }

  // Selection Screen
  if (mode === null) {
    return (
      <div className="min-h-screen pt-19 pb-16 bg-slate-50">
        <div className="text-white bg-gradient-to-br from-green-600 via-emerald-600 to-green-700">
          <div className="max-w-6xl px-4 py-[7em] mx-auto sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="inline-flex items-center px-4 py-2 mb-4 text-sm rounded-full bg-white/10 backdrop-blur-sm">
                Updated for Nigeria Tax Act 2025
              </div>
              <h1 className="mb-3 text-3xl font-bold sm:text-4xl">Corporate Income Tax Calculator</h1>
              <p className="max-w-2xl mx-auto text-lg text-green-100">Calculate your business tax obligations quickly and accurately</p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-4xl px-4 mx-auto -mt-8 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <motion.button onClick={() => setMode('ai')} className="p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-green-500 hover:shadow-xl transition-all text-left">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">AI-Powered Analysis</h3>
              <p className="text-slate-600 mb-4">Upload documents and let AI extract the data for you.</p>
              <span className="text-green-600 font-semibold">Start with AI →</span>
            </motion.button>

            <motion.button onClick={() => setMode('manual')} className="p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all text-left">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Manual Entry</h3>
              <p className="text-slate-600 mb-4">Enter your financial data directly into the form.</p>
              <span className="text-blue-600 font-semibold">Manual Entry →</span>
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16 pt-19 bg-slate-50">
      <div className="text-white bg-gradient-to-br from-green-600 via-emerald-600 to-green-700">
        <div className="max-w-6xl px-4 py-[7em] mx-auto sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl mb-3">Corporate Tax Calculator</h1>
          <p className="text-green-100">{mode === 'ai' ? 'AI Document Analysis' : 'Manual Data Entry'}</p>
        </div>
      </div>

      <div className="max-w-6xl px-4 mx-auto -mt-8 sm:px-6 lg:px-8">
        <button onClick={() => setMode(null)} className="mb-6 flex items-center text-slate-600 hover:text-green-600"><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Back to Options</button>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {mode === 'ai' && (
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
                <h2 className="text-xl font-bold mb-4 flex items-center"><svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>Upload Documents</h2>
                <div className="space-y-3 mb-6">
                  {documentTypes.map(doc => (
                    <div key={doc.id} className="relative">
                      <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, doc.id)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className={`p-4 border-2 rounded-xl flex items-center justify-between ${uploadedFiles[doc.id] ? 'bg-green-50 border-green-400' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-sm font-medium">{uploadedFiles[doc.id] ? uploadedFiles[doc.id].name : doc.name}</span>
                        {uploadedFiles[doc.id] ? <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> : <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={runAiAnalysis} disabled={isAnalyzing || !uploadedFiles.auditedStatement} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold disabled:bg-slate-200">{isAnalyzing ? `Analyzing... ${uploadProgress}%` : 'Extract with AI'}</button>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
              <h2 className="text-xl font-bold mb-6">Financial Details</h2>
              <form onSubmit={handleCalculate} className="space-y-4">
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company Name" className="w-full p-3 border rounded-xl" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" value={turnover} onChange={e => setTurnover(e.target.value)} placeholder="Turnover" className="w-full p-3 border rounded-xl" required />
                  <input type="text" value={assets} onChange={e => setAssets(formatNumberWithCommas(e.target.value))} placeholder="Total Assets" className="w-full p-3 border rounded-xl" />
                </div>
                <input type="text" value={profit} onChange={e => setProfit(formatNumberWithCommas(e.target.value))} placeholder="Net Profit" className="w-full p-3 border rounded-xl" />
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" value={depreciation} onChange={e => setDepreciation(formatNumberWithCommas(e.target.value))} placeholder="Depreciation" className="w-full p-3 border rounded-xl" />
                  <input type="number" value={fines} onChange={e => setFines(e.target.value)} placeholder="Fines" className="w-full p-3 border rounded-xl" />
                  <input type="text" value={capitalAllowances} onChange={e => setCapitalAllowances(formatNumberWithCommas(e.target.value))} placeholder="Cap. Allowances" className="w-full p-3 border rounded-xl" />
                </div>
                <button type="submit" className="w-full py-4 bg-green-600 text-white rounded-xl font-bold">Calculate Tax</button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden sticky top-24">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Tax Breakdown</h2>
              </div>
              {results ? (
                <div className="p-6 space-y-6">
                  <div className={`p-4 rounded-xl border-2 ${results.isSmallBusiness ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Classification</span>
                      <span className={`px-3 py-1 rounded-lg text-white font-bold ${results.isSmallBusiness ? 'bg-green-500' : 'bg-blue-500'}`}>{results.isSmallBusiness ? 'Small Company' : 'Large Company'}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between text-sm"><span>Turnover</span><span className="font-bold">{formatCurrency(results.turnover)}</span></div>
                    <div className="flex justify-between text-sm"><span>Profit</span><span className="font-bold">{formatCurrency(results.assessableProfit)}</span></div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
                    <div className="flex justify-between items-center mb-2"><span>CIT ({results.citRate}%)</span><span className="font-bold">{formatCurrency(results.cit)}</span></div>
                    <div className="flex justify-between items-center border-t border-green-200 pt-3">
                      <span className="font-bold">Total Tax</span>
                      <span className="text-2xl font-bold text-green-600">{formatCurrency(results.totalTax)}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t space-y-3">
                    <button onClick={handleSave} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold">Save Analysis</button>
                    {!session && (
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-2">Login to save your results</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Link to="/login?return=/business-calculator" className="py-2 border rounded-lg text-sm font-medium">Login</Link>
                          <Link to="/signup?return=/business-calculator" className="py-2 bg-slate-100 rounded-lg text-sm font-medium">Sign Up</Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <p>Calculate tax to see breakdown</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
