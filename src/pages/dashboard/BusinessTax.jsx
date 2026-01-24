import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculateCIT, formatCurrency, formatNumberWithCommas, parseFormattedNumber } from '../../utils/taxCalculations'
import { supabase } from '../../lib/supabase'
import { saveBusinessCalculationData, getBusinessCalculationData, saveReturnUrl } from '../../utils/storage'
import toast from 'react-hot-toast'

export default function BusinessTax({ userProfile, session }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState(null) // 'ai' or 'manual'
  const [turnover, setTurnover] = useState('')
  const [assets, setAssets] = useState('')
  const [profit, setProfit] = useState('')
  const [companyName, setCompanyName] = useState(userProfile?.company_name || '')
  const [depreciation, setDepreciation] = useState('0')
  const [fines, setFines] = useState('0')
  const [capitalAllowances, setCapitalAllowances] = useState('0')
  
  const [results, setResults] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState({
    auditedStatement: null,
    assetRegister: null,
    trialBalance: null,
    whtNotes: null
  })
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  // Restore calculation data after signup/login
  useEffect(() => {
    if (userProfile?.id && results === null) {
      const savedData = getBusinessCalculationData()
      if (savedData) {
        setMode(savedData.mode || 'manual')
        setTurnover(savedData.turnover || '')
        setAssets(savedData.assets || '')
        setProfit(savedData.profit || '')
        setCompanyName(savedData.companyName || userProfile?.company_name || '')
        setDepreciation(savedData.depreciation || '0')
        setFines(savedData.fines || '0')
        setCapitalAllowances(savedData.capitalAllowances || '0')
        
        // Recalculate if we have the inputs
        if (savedData.turnover) {
          const turnoverValue = parseFormattedNumber(savedData.turnover)
          const assetsValue = parseFormattedNumber(savedData.assets)
          const profitValue = parseFormattedNumber(savedData.profit)
          const depreciationValue = parseFormattedNumber(savedData.depreciation)
          const finesValue = parseFormattedNumber(savedData.fines)
          const capitalAllowancesValue = parseFormattedNumber(savedData.capitalAllowances)
          
          if (turnoverValue > 0) {
            const calculation = calculateCIT(
              turnoverValue,
              assetsValue,
              profitValue,
              depreciationValue,
              finesValue,
              capitalAllowancesValue
            )
            setResults(calculation)
            toast.success('Your calculation has been restored! You can now save it.')
          }
        }
      }
    }
  }, [userProfile])

  const documentTypes = [
    { 
      id: 'auditedStatement', 
      name: 'Audited Financial Statement', 
      required: true,
      icon: (
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: 'assetRegister', 
      name: 'Fixed Asset Register', 
      required: false,
      icon: (
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      id: 'trialBalance', 
      name: 'Trial Balance', 
      required: false,
      icon: (
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2M9 20h6a2 2 0 002-2v-1a4 4 0 00-4-4H11a4 4 0 00-4 4v1a2 2 0 002 2zM12 3a3 3 0 00-3 3v1a3 3 0 006 0V6a3 3 0 00-3-3z" />
        </svg>
      )
    },
    { 
      id: 'whtNotes', 
      name: 'WHT Credit Notes', 
      required: false,
      icon: (
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2m8-4a8 8 0 11-16 0 8 8 0 0116 0z" />
        </svg>
      )
    }
  ]

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

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
        [typeId]: { name: file.name, data: base64 }
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
      .map(([type, file]) => ({ type, name: file.name, data: file.data }))

    if (filesToUpload.length === 0 || !uploadedFiles.auditedStatement) {
      toast.error('Please upload the Audited Financial Statement')
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
        toast.error('Files are too large. Please upload smaller PDFs.', { id: 'analysis' })
        setIsAnalyzing(false)
        return
      }

      const { data, error } = await supabase.functions.invoke('analyze-tax-docs', { body: payload })

      if (error) throw error
      if (data?.error) throw new Error(data.error)
      
      console.log('AI Extraction Result:', data)
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
      let errorMessage = 'Failed to analyze documents.'
      if (error.message?.includes('API Key not configured')) {
        errorMessage = 'AI service not configured.'
      }
      toast.error(errorMessage, { id: 'analysis' })
      setIsAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (!results) {
      toast.error('Please calculate your tax first')
      return
    }

    // If user is not logged in, save to localStorage and redirect to signup
    if (!userProfile?.id) {
      const calcData = {
        mode,
        turnover,
        assets,
        profit,
        companyName,
        depreciation,
        fines,
        capitalAllowances,
        results
      }
      
      if (saveBusinessCalculationData(calcData)) {
        saveReturnUrl('/dashboard/business')
        toast.loading('Redirecting to signup...', { id: 'signup-redirect' })
        navigate('/signup?return=business')
      } else {
        toast.error('Failed to save your calculation. Please try again.')
      }
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('saved_calculations')
        .insert({
          user_id: userProfile.id,
          calculation_type: 'business',
          data: results,
          inputs: { 
            companyName: companyName || `Business - ${new Date().toLocaleDateString('en-NG')}`,
            turnover, assets, profit, depreciation, fines, capitalAllowances 
          }
        })

      if (error) throw error

      // Clear any stored calculation data after successful save
      getBusinessCalculationData()
      
      toast.success('Analysis saved successfully!')
      navigate('/dashboard/history')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save analysis')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = () => {
    if (!results) return

    const content = `
CORPORATE INCOME TAX ANALYSIS
=============================
Generated: ${new Date().toLocaleString('en-NG')}
Company: ${companyName || 'Business Tax Analysis'}

FINANCIAL DATA
--------------
Annual Turnover: ${formatCurrency(results.turnover)}
Total Fixed Assets: ${formatCurrency(results.assets)}
Net Profit Before Tax: ${formatCurrency(parseFormattedNumber(profit))}
Depreciation: ${formatCurrency(parseFormattedNumber(depreciation))}
Fines/Penalties: ${formatCurrency(parseFormattedNumber(fines))}
Capital Allowances: ${formatCurrency(parseFormattedNumber(capitalAllowances))}

TAX CALCULATION
---------------
Classification: ${results.isSmallBusiness ? 'Small Company' : 'Large Company'}
Assessable Profit: ${formatCurrency(results.assessableProfit)}
CIT Rate: ${results.citRate}%
Development Levy Rate: ${results.developmentLevyRate}%

TAX PAYABLE
-----------
Corporate Income Tax: ${formatCurrency(results.cit)}
Development Levy: ${formatCurrency(results.developmentLevy)}
Total Tax Payable: ${formatCurrency(results.totalTax)}

NOTE
----
${results.note}

---
Generated by TaxBuddy - Nigeria Tax Support Portal
Based on Nigeria Tax Act 2025 (effective Jan 2026)
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `business-tax-analysis-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Report downloaded!')
  }

  // Mode Selection
  if (mode === null) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-green-600 uppercase tracking-wide">Business tax</span>
          <h1 className="text-2xl font-bold text-slate-900">Corporate Income Tax Calculator</h1>
          <p className="text-slate-600">Calculate your CIT based on Nigeria Tax Act 2025.</p>
        </div>

        <div className="card text-center space-y-2">
          <h2 className="text-xl font-semibold text-slate-800">Choose your workflow</h2>
          <p className="text-slate-600 text-sm">Pick the method that matches how you manage your financial data.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => setMode('ai')}
            className="group card text-left hover:border-green-500 hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center mb-5 group-hover:bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1-2.5L5 17l2.5-1L9 13l.75 4zm7.5-9.5L17 11l-1-2.5L13 7.5l2.5-1L17 4l.25 3.5zM7 8l1.5 4L5 11l2-3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">AI-powered analysis</h3>
            <p className="text-slate-600 text-sm mb-4">
              Upload audited statements and let AI extract the key figures.
            </p>
            <div className="flex items-center text-green-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
              Upload documents
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => setMode('manual')}
            className="group card text-left hover:border-blue-500 hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l8-8 3 3-8 8H9v-3zM4 20h16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Manual entry</h3>
            <p className="text-slate-600 text-sm mb-4">
              Enter financial data yourself for a quick tax estimate.
            </p>
            <div className="flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
              Enter data manually
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-slate-900">2026 Corporate Tax Rules</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
              <h4 className="font-semibold text-green-900">Small Business</h4>
              <p className="text-xs text-green-700 mt-1">Turnover ≤ ₦100M AND Assets ≤ ₦250M</p>
              <p className="text-sm text-green-800 font-bold mt-2">0% CIT • 0% Dev Levy</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <h4 className="font-semibold text-blue-900">Large Business</h4>
              <p className="text-xs text-blue-700 mt-1">Turnover &gt; ₦100M OR Assets &gt; ₦250M</p>
              <p className="text-sm text-blue-800 font-bold mt-2">30% CIT • 4% Dev Levy</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calculator View
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setMode(null); setResults(null) }}
          className="flex items-center text-slate-600 hover:text-green-600 transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2 ${
          mode === 'ai' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {mode === 'ai' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1-2.5L5 17l2.5-1L9 13l.75 4zm7.5-9.5L17 11l-1-2.5L13 7.5l2.5-1L17 4l.25 3.5zM7 8l1.5 4L5 11l2-3z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l8-8 3 3-8 8H9v-3zM4 20h16" />
            </svg>
          )}
          {mode === 'ai' ? 'AI Mode' : 'Manual Mode'}
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Corporate Income Tax Calculator</h1>
        <p className="text-slate-600">
          {mode === 'ai' ? 'Upload documents and let AI extract the data' : 'Enter your financial details'}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {mode === 'ai' && (
            <div className="card border-dashed border-green-300">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-9 h-9 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3" />
                  </svg>
                </span>
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
                        ? 'bg-green-100 border-green-400' 
                        : 'bg-white border-slate-200 hover:border-green-400'
                    }`}>
                      <div className="flex items-center">
                        <span className="mr-3">{doc.icon}</span>
                        <div>
                          <span className="text-sm font-medium truncate block max-w-[180px]">
                            {uploadedFiles[doc.id] ? uploadedFiles[doc.id].name : doc.name}
                          </span>
                          {doc.required && !uploadedFiles[doc.id] && (
                            <span className="text-[10px] text-amber-600 font-bold">Required</span>
                          )}
                        </div>
                      </div>
                      {uploadedFiles[doc.id] && (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={runAiAnalysis}
                disabled={isAnalyzing || !uploadedFiles.auditedStatement}
                className={`w-full mt-5 py-3 rounded-lg font-semibold flex items-center justify-center transition-all ${
                  isAnalyzing || !uploadedFiles.auditedStatement
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Extract Data with AI
                  </>
                )}
              </button>
            </div>
          )}

          {/* Form */}
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-5">
              {mode === 'ai' ? 'Review & Edit Data' : 'Enter Financial Details'}
            </h2>
            
            <form onSubmit={handleCalculate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., ABC Enterprises Ltd"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Annual Turnover (₦) *</label>
                  <input
                    type="text"
                    required
                    value={turnover}
                    onChange={(e) => setTurnover(formatNumberWithCommas(e.target.value))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fixed Assets (₦)</label>
                  <input
                    type="text"
                    value={assets}
                    onChange={(e) => setAssets(formatNumberWithCommas(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Net Profit Before Tax (₦)</label>
                <input
                  type="text"
                  value={profit}
                  onChange={(e) => setProfit(formatNumberWithCommas(e.target.value))}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Depreciation (₦)</label>
                  <input type="text" value={depreciation} onChange={(e) => setDepreciation(formatNumberWithCommas(e.target.value))} className="input-field py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Fines (₦)</label>
                  <input type="text" value={fines} onChange={(e) => setFines(formatNumberWithCommas(e.target.value))} className="input-field py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cap. Allowances (₦)</label>
                  <input type="text" value={capitalAllowances} onChange={(e) => setCapitalAllowances(formatNumberWithCommas(e.target.value))} className="input-field py-2 text-sm" />
                </div>
              </div>

              <button type="submit" className="w-full btn-primary mt-2">
                Calculate Tax
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Results */}
          <div className="card h-fit sticky top-8">
            <h2 className="font-semibold text-slate-900 mb-5">Tax Breakdown</h2>

          {results ? (
            <div className="space-y-5">
              {companyName && (
                <div className="text-center pb-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">{companyName}</h3>
                  <p className="text-xs text-slate-500 uppercase">Tax Liability Summary</p>
                </div>
              )}

              <div className={`rounded-lg p-4 border-2 ${
                results.isSmallBusiness ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-900">Classification</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    results.isSmallBusiness ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'
                  }`}>
                    {results.isSmallBusiness ? 'Small Company' : 'Large Company'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Turnover</span>
                  <span className="font-semibold">{formatCurrency(results.turnover)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Fixed Assets</span>
                  <span className="font-semibold">{formatCurrency(results.assets)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-800 font-medium">Assessable Profit</span>
                  <span className="font-bold">{formatCurrency(results.assessableProfit)}</span>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-3">Tax Obligations</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">CIT ({results.citRate}%)</span>
                    <span className="font-semibold">{formatCurrency(results.cit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Dev. Levy ({results.developmentLevyRate}%)</span>
                    <span className="font-semibold">{formatCurrency(results.developmentLevy)}</span>
                  </div>
                  <div className="border-t border-green-200 pt-2 mt-2 flex justify-between">
                    <span className="font-bold text-slate-900">Total Tax</span>
                    <span className="font-bold text-xl text-green-600">{formatCurrency(results.totalTax)}</span>
                  </div>
                </div>
              </div>

              {results.note && (
                <div className="bg-slate-100 rounded-lg p-3">
                  <p className="text-xs text-slate-600">{results.note}</p>
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-slate-200">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? 'Saving...' : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Analysis
                    </>
                  )}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownload}
                    className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center justify-center text-sm gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3" />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={() => { setResults(null); setMode(null) }}
                    className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors text-sm"
                  >
                    New Analysis
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Fill in the form and click<br/>"Calculate Tax" to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
