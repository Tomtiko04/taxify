import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculatePAYE, formatCurrency } from '../../utils/taxCalculations'
import { supabase } from '../../lib/supabase'
import { savePersonalCalculationData, getPersonalCalculationData, saveReturnUrl } from '../../utils/storage'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

export default function PersonalTax({ userProfile }) {
  const navigate = useNavigate()
  const [monthlyGross, setMonthlyGross] = useState(userProfile?.monthly_salary?.toString() || '')
  const [additionalIncomes, setAdditionalIncomes] = useState([{ name: '', amount: '' }])
  const [annualRent, setAnnualRent] = useState('')
  const [hasPension, setHasPension] = useState(true)
  const [hasNHF, setHasNHF] = useState(true)
  const [analysisName, setAnalysisName] = useState('')
  const [results, setResults] = useState(null)
  const [saving, setSaving] = useState(false)
  const [session, setSession] = useState(null)
  const isMounted = useRef(true)

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

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Restore calculation data after signup/login
  useEffect(() => {
    if (!isMounted.current) return
    
    if (session?.user && results === null) {
      const savedData = getPersonalCalculationData()
      if (savedData) {
        setMonthlyGross(savedData.monthlyGross || userProfile?.monthly_salary?.toString() || '')
        setAdditionalIncomes(savedData.additionalIncomes || [{ name: '', amount: '' }])
        setAnnualRent(savedData.annualRent || '')
        setHasPension(savedData.hasPension !== undefined ? savedData.hasPension : true)
        setHasNHF(savedData.hasNHF !== undefined ? savedData.hasNHF : true)
        setAnalysisName(savedData.analysisName || '')
        
        // Recalculate if we have the inputs
        if (savedData.monthlyGross) {
          const monthlyValue = parseFloat(savedData.monthlyGross) || 0
          const additionalTotal = (savedData.additionalIncomes || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
          const rentValue = parseFloat(savedData.annualRent) || 0
          if (monthlyValue > 0 || additionalTotal > 0) {
            const calculation = calculatePAYE(
              monthlyValue, 
              rentValue, 
              savedData.hasPension !== undefined ? savedData.hasPension : true,
              savedData.hasNHF !== undefined ? savedData.hasNHF : true,
              additionalTotal
            )
            if (isMounted.current) {
              setResults(calculation)
              toast.success('Your calculation has been restored! You can now save it.')
            }
          }
        }
      }
    }
  }, [session, userProfile])

  const handleCalculate = (e) => {
    e.preventDefault()
    
    const monthlyValue = parseFloat(monthlyGross) || 0
    const additionalTotal = additionalIncomes.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0
      return sum + amount
    }, 0)
    const rentValue = parseFloat(annualRent) || 0

    if (monthlyValue <= 0 && additionalTotal <= 0) {
      toast.error('Please enter at least your monthly salary or add additional income')
      return
    }

    const calculation = calculatePAYE(monthlyValue, rentValue, hasPension, hasNHF, additionalTotal)
    setResults(calculation)
    toast.success('Tax calculated successfully!')
  }

  const addAdditionalIncome = () => {
    setAdditionalIncomes([...additionalIncomes, { name: '', amount: '' }])
  }

  const removeAdditionalIncome = (index) => {
    if (additionalIncomes.length > 1) {
      setAdditionalIncomes(additionalIncomes.filter((_, i) => i !== index))
    }
  }

  const updateAdditionalIncome = (index, field, value) => {
    const updated = [...additionalIncomes]
    updated[index][field] = value
    setAdditionalIncomes(updated)
  }

  const handleSave = async () => {
    if (!results) {
      toast.error('Please calculate your tax first')
      return
    }

    // Check session instead of userProfile - this is a protected route so session should exist
    if (!session?.user) {
      const calcData = {
        monthlyGross,
        additionalIncomes,
        annualRent,
        hasPension,
        hasNHF,
        analysisName,
        results
      }
      
      if (savePersonalCalculationData(calcData)) {
        saveReturnUrl('/dashboard/personal')
        toast.loading('Redirecting to signup...', { id: 'signup-redirect' })
        navigate('/signup?return=personal')
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
          user_id: session.user.id,
          calculation_type: 'personal',
          data: results,
          inputs: {
            name: analysisName || `Personal Tax - ${new Date().toLocaleDateString('en-NG')}`,
            monthlyGross,
            additionalIncomes,
            annualRent,
            hasPension,
            hasNHF
          }
        })

      if (error) throw error

      // Clear any stored calculation data after successful save
      getPersonalCalculationData()
      
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

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPos = 20

    // Colors
    const primaryColor = [22, 163, 74] // green-600
    const darkColor = [15, 23, 42] // slate-900
    const lightGray = [241, 245, 249] // slate-50

    // Header with logo and company name
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    // Logo placeholder (using text as logo)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('₦', 20, 25)
    
    // Company name
    doc.setFontSize(18)
    doc.text('Taxify', 35, 25)
    
    // Tagline
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Nigeria Tax Support Portal', 35, 32)

    yPos = 50

    // Title
    doc.setTextColor(...darkColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Personal Income Tax Analysis', pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 10

    // User name
    const userName = userProfile?.full_name || session?.user?.email?.split('@')[0] || 'User'
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Prepared for: ${userName}`, pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 8
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${new Date().toLocaleString('en-NG')}`, pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 15

    // Analysis name if provided
    if (analysisName) {
      doc.setFontSize(11)
      doc.setTextColor(...darkColor)
      doc.setFont('helvetica', 'bold')
      doc.text(`Analysis: ${analysisName}`, 20, yPos)
      yPos += 8
    }

    // Income Sources Section
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkColor)
    doc.text('Income Sources', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    
    // Monthly Salary
    const monthlySalary = parseFloat(monthlyGross) || 0
    const annualSalary = monthlySalary * 12
    doc.text(`Monthly Gross Salary:`, 25, yPos)
    doc.text(formatCurrency(monthlySalary), pageWidth - 25, yPos, { align: 'right' })
    yPos += 6
    doc.text(`Annual Salary (×12):`, 25, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(formatCurrency(annualSalary), pageWidth - 25, yPos, { align: 'right' })
    yPos += 8

    // Additional Incomes
    const additionalTotal = additionalIncomes.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    if (additionalTotal > 0) {
      doc.setFont('helvetica', 'normal')
      doc.text('Additional Income Sources:', 25, yPos)
      yPos += 6
      
      additionalIncomes.forEach((income) => {
        const amount = parseFloat(income.amount) || 0
        if (amount > 0) {
          const name = income.name || 'Unnamed Income'
          doc.text(`  • ${name}:`, 30, yPos)
          doc.text(formatCurrency(amount), pageWidth - 25, yPos, { align: 'right' })
          yPos += 6
        }
      })
      
      doc.setFont('helvetica', 'bold')
      doc.text('Total Additional Income:', 25, yPos)
      doc.text(formatCurrency(additionalTotal), pageWidth - 25, yPos, { align: 'right' })
      yPos += 8
    }

    // Total Annual Gross Income
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.5)
    doc.line(20, yPos - 2, pageWidth - 20, yPos - 2)
    yPos += 5
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('Total Annual Gross Income:', 25, yPos)
    doc.text(formatCurrency(results.annualGross || 0), pageWidth - 25, yPos, { align: 'right' })
    yPos += 12

    // Check if new page needed
    if (yPos > pageHeight - 80) {
      doc.addPage()
      yPos = 20
    }

    // Deductions Section
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkColor)
    doc.text('Deductions', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)

    if (results.pension > 0) {
      doc.text(`Pension Contribution (8%):`, 25, yPos)
      doc.text(formatCurrency(results.pension || 0), pageWidth - 25, yPos, { align: 'right' })
      yPos += 6
    }

    if (results.nhf > 0) {
      doc.text(`NHF Contribution (2.5%):`, 25, yPos)
      doc.text(formatCurrency(results.nhf || 0), pageWidth - 25, yPos, { align: 'right' })
      yPos += 6
    }

    if (results.rentRelief > 0) {
      doc.text(`Rent Relief (20%, max ₦500,000):`, 25, yPos)
      doc.text(formatCurrency(results.rentRelief || 0), pageWidth - 25, yPos, { align: 'right' })
      yPos += 6
    }

    doc.setDrawColor(...primaryColor)
    doc.line(20, yPos, pageWidth - 20, yPos)
    yPos += 6
    doc.setFont('helvetica', 'bold')
    doc.text('Total Deductions:', 25, yPos)
    doc.text(formatCurrency(results.totalDeductions || 0), pageWidth - 25, yPos, { align: 'right' })
    yPos += 12

    // Check if new page needed
    if (yPos > pageHeight - 100) {
      doc.addPage()
      yPos = 20
    }

    // Tax Calculation Section
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkColor)
    doc.text('Tax Calculation', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)

    doc.text(`Taxable Income:`, 25, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(formatCurrency(results.taxableIncome || 0), pageWidth - 25, yPos, { align: 'right' })
    yPos += 8

    // Tax Breakdown by Band
    if (results.breakdown && results.breakdown.length > 0) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Tax Breakdown by Band:', 25, yPos)
      yPos += 6

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      results.breakdown.forEach((band) => {
        if (yPos > pageHeight - 30) {
          doc.addPage()
          yPos = 20
        }
        doc.text(`${band.band} (${band.rate}%):`, 30, yPos)
        doc.text(formatCurrency(band.tax), pageWidth - 25, yPos, { align: 'right' })
        yPos += 5
      })
      yPos += 3
    }

    // Check if new page needed
    if (yPos > pageHeight - 60) {
      doc.addPage()
      yPos = 20
    }

    // Summary Box
    doc.setFillColor(...lightGray)
    doc.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'F')
    
    yPos += 8
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkColor)
    doc.text('Summary', 25, yPos)
    
    yPos += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Annual Tax Payable:`, 25, yPos)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text(formatCurrency(results.netTax || 0), pageWidth - 25, yPos, { align: 'right' })
    
    yPos += 6
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.text(`Monthly Tax:`, 25, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(formatCurrency(results.monthlyTax || 0), pageWidth - 25, yPos, { align: 'right' })
    
    yPos += 6
    doc.setFont('helvetica', 'normal')
    doc.text(`Effective Tax Rate:`, 25, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(`${(results.effectiveRate || 0).toFixed(2)}%`, pageWidth - 25, yPos, { align: 'right' })

    yPos += 20

    // Footer
    if (yPos > pageHeight - 30) {
      doc.addPage()
      yPos = 20
    }

    doc.setDrawColor(200, 200, 200)
    doc.line(20, yPos, pageWidth - 20, yPos)
    yPos += 8

    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'italic')
    doc.text('Generated by Taxify - Nigeria Tax Support Portal', pageWidth / 2, yPos, { align: 'center' })
    yPos += 4
    doc.text('Based on Nigeria Tax Act 2025 (effective Jan 2026)', pageWidth / 2, yPos, { align: 'center' })

    // Save PDF
    const fileName = `personal-tax-analysis-${userName.replace(/\s+/g, '-')}-${Date.now()}.pdf`
    doc.save(fileName)
    
    toast.success('PDF report downloaded!')
  }

  const resetForm = () => {
    setResults(null)
    setMonthlyGross(userProfile?.monthly_salary?.toString() || '')
    setAdditionalIncomes([{ name: '', amount: '' }])
    setAnnualRent('')
    setHasPension(true)
    setHasNHF(true)
    setAnalysisName('')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Personal Income Tax Calculator</h1>
        <p className="text-slate-600 mt-1">Calculate your PAYE tax based on Nigeria Tax Act 2025</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Enter Your Details</h2>
          
          <form onSubmit={handleCalculate} className="space-y-5">
            <div>
              <label htmlFor="analysisName" className="block text-sm font-medium text-slate-700 mb-1">
                Analysis Name (Optional)
              </label>
              <input
                id="analysisName"
                type="text"
                value={analysisName}
                onChange={(e) => setAnalysisName(e.target.value)}
                className="input-field"
                placeholder="e.g., January 2026 Salary"
              />
            </div>

            <div>
              <label htmlFor="monthlyGross" className="block text-sm font-medium text-slate-700 mb-1">
                Monthly Gross Salary (₦) *
              </label>
              <input
                id="monthlyGross"
                type="number"
                required
                value={monthlyGross}
                onChange={(e) => setMonthlyGross(e.target.value)}
                className="input-field"
                placeholder="e.g., 500000"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter your monthly salary. We'll calculate your annual tax based on this amount.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Additional Income Sources
                </label>
                <button
                  type="button"
                  onClick={addAdditionalIncome}
                  className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Income
                </button>
              </div>
              
              <div className="space-y-3">
                {additionalIncomes.map((income, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={income.name}
                        onChange={(e) => updateAdditionalIncome(index, 'name', e.target.value)}
                        className="input-field mb-2"
                        placeholder="Income source (e.g., Freelance, Rental)"
                      />
                      <input
                        type="number"
                        value={income.amount}
                        onChange={(e) => updateAdditionalIncome(index, 'amount', e.target.value)}
                        className="input-field"
                        placeholder="Annual amount (₦)"
                      />
                    </div>
                    {additionalIncomes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAdditionalIncome(index)}
                        className="mt-8 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Add other annual income sources (freelance, rental, dividends, etc.)
              </p>
            </div>

            <div>
              <label htmlFor="annualRent" className="block text-sm font-medium text-slate-700 mb-1">
                Annual Rent Paid (₦)
              </label>
              <input
                id="annualRent"
                type="number"
                value={annualRent}
                onChange={(e) => setAnnualRent(e.target.value)}
                className="input-field"
                placeholder="e.g., 1200000"
              />
              <p className="text-xs text-slate-500 mt-1">20% of rent is tax-deductible (max ₦500,000)</p>
            </div>

            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <p className="text-xs font-medium text-slate-600 mb-3">Deductions (reduce your taxable income)</p>
              
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={hasPension}
                  onChange={(e) => setHasPension(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500 mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700 block">Pension Contribution (8%)</span>
                  <span className="text-xs text-slate-500">
                    If you contribute to a pension fund, 8% of your annual income is deducted from your taxable income, reducing your tax.
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={hasNHF}
                  onChange={(e) => setHasNHF(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500 mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700 block">NHF Contribution (2.5%)</span>
                  <span className="text-xs text-slate-500">
                    If you contribute to the National Housing Fund, 2.5% of your annual income is deducted from your taxable income, reducing your tax.
                  </span>
                </div>
              </label>
            </div>

            <button type="submit" className="w-full btn-primary">
              Calculate Tax
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Tax Breakdown</h2>

          {results ? (
            <div className="space-y-5">
              {/* Tax Exempt Check */}
              {results.annualGross <= 800000 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-green-800">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Tax Exempt!</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Your annual income is below ₦800,000, so you pay 0% tax.
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Annual Salary (Monthly × 12)</span>
                  <span className="font-semibold">{formatCurrency((parseFloat(monthlyGross) || 0) * 12)}</span>
                </div>
                {additionalIncomes.some(item => parseFloat(item.amount) > 0) && (
                  <>
                    {additionalIncomes.map((income, index) => {
                      const amount = parseFloat(income.amount) || 0
                      if (amount <= 0) return null
                      return (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-slate-600">
                            {income.name || 'Additional Income'}:
                          </span>
                          <span className="font-semibold">{formatCurrency(amount)}</span>
                        </div>
                      )
                    })}
                    <div className="flex justify-between text-sm border-t border-slate-200 pt-1 mt-1">
                      <span className="text-slate-600 font-medium">Total Additional Income:</span>
                      <span className="font-semibold">
                        {formatCurrency(additionalIncomes.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0))}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-2">
                  <span className="text-slate-700 font-medium">Annual Gross Income</span>
                  <span className="font-bold">{formatCurrency(results.annualGross)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Deductions</span>
                  <span className="font-semibold text-green-600">
                    -{formatCurrency(results.totalDeductions || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                  <span className="text-slate-800 font-medium">Taxable Income</span>
                  <span className="font-bold">{formatCurrency(results.taxableIncome)}</span>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-3">Deductions Breakdown</h3>
                <p className="text-xs text-slate-600 mb-3">These amounts reduce your taxable income:</p>
                <div className="space-y-3 text-sm">
                  {(results.pension || 0) > 0 && (
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-slate-700 font-medium block">Pension Contribution</span>
                        <span className="text-xs text-slate-500">8% of annual income</span>
                      </div>
                      <span className="font-semibold text-green-700">{formatCurrency(results.pension || 0)}</span>
                    </div>
                  )}
                  {(results.nhf || 0) > 0 && (
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-slate-700 font-medium block">NHF Contribution</span>
                        <span className="text-xs text-slate-500">2.5% of annual income</span>
                      </div>
                      <span className="font-semibold text-green-700">{formatCurrency(results.nhf || 0)}</span>
                    </div>
                  )}
                  {(results.rentRelief || 0) > 0 && (
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-slate-700 font-medium block">Rent Relief</span>
                        <span className="text-xs text-slate-500">20% of annual rent (max ₦500,000)</span>
                      </div>
                      <span className="font-semibold text-green-700">{formatCurrency(results.rentRelief || 0)}</span>
                    </div>
                  )}
                  {((results.pension || 0) === 0 && (results.nhf || 0) === 0 && (results.rentRelief || 0) === 0) && (
                    <p className="text-xs text-slate-500 italic">No deductions applied</p>
                  )}
                </div>
              </div>

              {/* Tax by Band */}
              {results.breakdown && results.breakdown.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-2">Tax Calculation by Income Band</h3>
                  <p className="text-xs text-slate-600 mb-3">Your income is taxed at different rates:</p>
                  <div className="space-y-2 text-sm">
                    {results.breakdown.map((band, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1.5 border-b border-blue-100 last:border-0">
                        <div className="flex-1">
                          <span className="text-slate-700 font-medium block">{band.band}</span>
                          <span className="text-xs text-slate-500">
                            {band.amount > 0 ? `${formatCurrency(band.amount)} × ${band.rate}%` : 'Exempt'}
                          </span>
                        </div>
                        <span className="font-semibold text-blue-700 ml-2">{formatCurrency(band.tax || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Tax */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-5 text-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-100">Annual Tax Payable</span>
                  <span className="text-2xl font-bold">{formatCurrency(results.netTax)}</span>
                </div>
                <div className="flex justify-between items-center text-green-100">
                  <span>Monthly Tax</span>
                  <span className="font-semibold">{formatCurrency(results.monthlyTax)}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-green-500 flex justify-between items-center text-green-100 text-sm">
                  <span>Effective Tax Rate</span>
                  <span className="font-semibold">{results.effectiveRate.toFixed(2)}%</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save Analysis
                    </>
                  )}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownload}
                    className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={resetForm}
                    className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                  >
                    New Calculation
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p>Enter your salary details and click<br/>"Calculate Tax" to see results</p>
            </div>
          )}
        </div>
      </div>

      {/* Tax Bands Reference */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4">2026 Personal Income Tax Bands</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-slate-600 font-medium">Income Band</th>
                <th className="text-right py-2 text-slate-600 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr><td className="py-2">First ₦800,000</td><td className="text-right font-semibold text-green-600">0%</td></tr>
              <tr><td className="py-2">Next ₦2,200,000</td><td className="text-right">15%</td></tr>
              <tr><td className="py-2">Next ₦9,000,000</td><td className="text-right">18%</td></tr>
              <tr><td className="py-2">Next ₦13,000,000</td><td className="text-right">21%</td></tr>
              <tr><td className="py-2">Next ₦25,000,000</td><td className="text-right">23%</td></tr>
              <tr><td className="py-2">Above ₦50,000,000</td><td className="text-right">25%</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
