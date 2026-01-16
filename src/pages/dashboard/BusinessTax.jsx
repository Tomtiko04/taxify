import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculateCIT, formatCurrency } from '../../utils/taxCalculations'
import { supabase } from '../../lib/supabase'
import { saveBusinessCalculationData, getBusinessCalculationData, saveReturnUrl } from '../../utils/storage'
import toast from 'react-hot-toast'

export default function BusinessTax({ userProfile }) {
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
          const turnoverValue = parseFloat(savedData.turnover) || 0
          const assetsValue = parseFloat(savedData.assets) || 0
          const profitValue = parseFloat(savedData.profit) || 0
          const depreciationValue = parseFloat(savedData.depreciation) || 0
          const finesValue = parseFloat(savedData.fines) || 0
          const capitalAllowancesValue = parseFloat(savedData.capitalAllowances) || 0
          
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
    { id: 'auditedStatement', name: 'Audited Financial Statement', required: true, icon: '📋' },
    { id: 'assetRegister', name: 'Fixed Asset Register', required: false, icon: '🏭' },
    { id: 'trialBalance', name: 'Trial Balance', required: false, icon: '⚖️' },
    { id: 'whtNotes', name: 'WHT Credit Notes', required: false, icon: '🎟️' }
  ]

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
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
Net Profit Before Tax: ${formatCurrency(parseFloat(profit) || 0)}
Depreciation: ${formatCurrency(parseFloat(depreciation) || 0)}
Fines/Penalties: ${formatCurrency(parseFloat(fines) || 0)}
Capital Allowances: ${formatCurrency(parseFloat(capitalAllowances) || 0)}

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
Generated by Taxify - Nigeria Tax Support Portal
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
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Corporate Income Tax Calculator</h1>
          <p className="text-slate-600 mt-1">Calculate your CIT based on Nigeria Tax Act 2025</p>
        </div>

        <div className="text-center py-4">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">How would you like to proceed?</h2>
          <p className="text-slate-600">Choose the method that works best for you</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => setMode('ai')}
            className="group p-8 bg-white rounded-xl border-2 border-slate-200 hover:border-green-500 hover:shadow-lg transition-all text-left"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">AI-Powered Analysis</h3>
            <p className="text-slate-600 text-sm mb-4">
              Upload your Audited Financial Statements and let AI extract the data.
            </p>
            <div className="flex items-center text-green-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
              Upload Documents →
            </div>
          </button>

          <button
            onClick={() => setMode('manual')}
            className="group p-8 bg-white rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all text-left"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <span className="text-2xl">✏️</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Manual Entry</h3>
            <p className="text-slate-600 text-sm mb-4">
              Enter your financial data directly. Quick and straightforward.
            </p>
            <div className="flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
              Enter Data Manually →
            </div>
          </button>
        </div>

        {/* Quick Reference */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">2026 Corporate Tax Rules</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-green-900">Small Business</h4>
              <p className="text-xs text-green-700 mt-1">Turnover ≤ ₦100M AND Assets ≤ ₦250M</p>
              <p className="text-sm text-green-800 font-bold mt-2">0% CIT • 0% Dev Levy</p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
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
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          mode === 'ai' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {mode === 'ai' ? '✨ AI Mode' : '✏️ Manual Mode'}
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
            <div className="bg-white rounded-xl border-2 border-dashed border-green-300 p-6">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center">
                <span className="mr-2">📄</span> Upload Documents
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
                        <span className="text-lg mr-3">{doc.icon}</span>
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
                className={`w-full mt-5 py-3 rounded-lg font-bold flex items-center justify-center transition-all ${
                  isAnalyzing || !uploadedFiles.auditedStatement
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing... {uploadProgress}%
                  </>
                ) : (
                  '🚀 Extract Data with AI'
                )}
              </button>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
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
                    type="number"
                    required
                    value={turnover}
                    onChange={(e) => setTurnover(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fixed Assets (₦)</label>
                  <input
                    type="number"
                    value={assets}
                    onChange={(e) => setAssets(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Net Profit Before Tax (₦)</label>
                <input
                  type="number"
                  value={profit}
                  onChange={(e) => setProfit(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Depreciation (₦)</label>
                  <input type="number" value={depreciation} onChange={(e) => setDepreciation(e.target.value)} className="input-field py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Fines (₦)</label>
                  <input type="number" value={fines} onChange={(e) => setFines(e.target.value)} className="input-field py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cap. Allowances (₦)</label>
                  <input type="number" value={capitalAllowances} onChange={(e) => setCapitalAllowances(e.target.value)} className="input-field py-2 text-sm" />
                </div>
              </div>

              <button type="submit" className="w-full btn-primary mt-2">
                Calculate Tax
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 h-fit sticky top-8">
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
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {saving ? 'Saving...' : '💾 Save Analysis'}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownload}
                    className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center justify-center text-sm"
                  >
                    📥 Download
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
