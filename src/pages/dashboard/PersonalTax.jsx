import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculatePAYE, formatCurrency } from '../../utils/taxCalculations'
import { supabase } from '../../lib/supabase'
import { savePersonalCalculationData, getPersonalCalculationData, saveReturnUrl } from '../../utils/storage'
import toast from 'react-hot-toast'

export default function PersonalTax({ userProfile }) {
  const navigate = useNavigate()
  const [monthlyGross, setMonthlyGross] = useState(userProfile?.monthly_salary?.toString() || '')
  const [additionalIncome, setAdditionalIncome] = useState('')
  const [annualRent, setAnnualRent] = useState('')
  const [hasPension, setHasPension] = useState(true)
  const [hasNHF, setHasNHF] = useState(true)
  const [analysisName, setAnalysisName] = useState('')
  const [results, setResults] = useState(null)
  const [saving, setSaving] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Restore calculation data after signup/login
  useEffect(() => {
    if (!isMounted.current) return
    
    if (userProfile?.id && results === null) {
      const savedData = getPersonalCalculationData()
      if (savedData) {
        setMonthlyGross(savedData.monthlyGross || userProfile?.monthly_salary?.toString() || '')
        setAdditionalIncome(savedData.additionalIncome || '')
        setAnnualRent(savedData.annualRent || '')
        setHasPension(savedData.hasPension !== undefined ? savedData.hasPension : true)
        setHasNHF(savedData.hasNHF !== undefined ? savedData.hasNHF : true)
        setAnalysisName(savedData.analysisName || '')
        
        // Recalculate if we have the inputs
        if (savedData.monthlyGross) {
          const monthlyValue = parseFloat(savedData.monthlyGross) || 0
          const additionalValue = parseFloat(savedData.additionalIncome) || 0
          const rentValue = parseFloat(savedData.annualRent) || 0
          if (monthlyValue > 0) {
            const calculation = calculatePAYE(
              monthlyValue, 
              rentValue, 
              savedData.hasPension !== undefined ? savedData.hasPension : true,
              savedData.hasNHF !== undefined ? savedData.hasNHF : true,
              additionalValue
            )
            if (isMounted.current) {
              setResults(calculation)
              toast.success('Your calculation has been restored! You can now save it.')
            }
          }
        }
      }
    }
  }, [userProfile])

  const handleCalculate = (e) => {
    e.preventDefault()
    
    const monthlyValue = parseFloat(monthlyGross) || 0
    const additionalValue = parseFloat(additionalIncome) || 0
    const rentValue = parseFloat(annualRent) || 0

    if (monthlyValue <= 0 && additionalValue <= 0) {
      toast.error('Please enter at least your monthly salary or additional income')
      return
    }

    const calculation = calculatePAYE(monthlyValue, rentValue, hasPension, hasNHF, additionalValue)
    setResults(calculation)
    toast.success('Tax calculated successfully!')
  }

  const handleSave = async () => {
    if (!results) {
      toast.error('Please calculate your tax first')
      return
    }

    // If user is not logged in, save to localStorage and redirect to signup
    if (!userProfile?.id) {
      const calcData = {
        monthlyGross,
        additionalIncome,
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
          user_id: userProfile.id,
          calculation_type: 'personal',
          data: results,
          inputs: {
            name: analysisName || `Personal Tax - ${new Date().toLocaleDateString('en-NG')}`,
            monthlyGross,
            additionalIncome,
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

    const breakdownText = results.breakdown && results.breakdown.length > 0
      ? results.breakdown.map(b => `${b.band}: ${formatCurrency(b.tax)} (${b.rate}%)`).join('\n')
      : 'No tax applicable (income below threshold)'

    const content = `
PERSONAL INCOME TAX ANALYSIS
============================
Generated: ${new Date().toLocaleString('en-NG')}
${analysisName ? `Name: ${analysisName}` : ''}

INPUTS
------
Monthly Gross Salary: ${formatCurrency(parseFloat(monthlyGross) || 0)}
${parseFloat(additionalIncome) > 0 ? `Additional Annual Income: ${formatCurrency(parseFloat(additionalIncome) || 0)}\n` : ''}Annual Gross Income: ${formatCurrency(results.annualGross || 0)}
Annual Rent Paid: ${formatCurrency(parseFloat(annualRent) || 0)}
Pension Contribution: ${hasPension ? 'Yes (8%)' : 'No'}
NHF Contribution: ${hasNHF ? 'Yes (2.5%)' : 'No'}

DEDUCTIONS
----------
Pension (8%): ${formatCurrency(results.pension || 0)}
NHF (2.5%): ${formatCurrency(results.nhf || 0)}
Rent Relief (20% capped at ₦500,000): ${formatCurrency(results.rentRelief || 0)}
Total Deductions: ${formatCurrency(results.totalDeductions || 0)}

TAX CALCULATION
---------------
Taxable Income: ${formatCurrency(results.taxableIncome || 0)}
Gross Tax: ${formatCurrency(results.grossTax || results.netTax || 0)}
Net Tax Payable: ${formatCurrency(results.netTax || 0)}
Monthly Tax: ${formatCurrency(results.monthlyTax || 0)}
Effective Tax Rate: ${(results.effectiveRate || 0).toFixed(2)}%

TAX BREAKDOWN BY BAND
---------------------
${breakdownText}

---
Generated by Taxify - Nigeria Tax Support Portal
Based on Nigeria Tax Act 2025 (effective Jan 2026)
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `personal-tax-analysis-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Report downloaded!')
  }

  const resetForm = () => {
    setResults(null)
    setMonthlyGross(userProfile?.monthly_salary?.toString() || '')
    setAdditionalIncome('')
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
              <label htmlFor="additionalIncome" className="block text-sm font-medium text-slate-700 mb-1">
                Additional Annual Income (₦)
              </label>
              <input
                id="additionalIncome"
                type="number"
                value={additionalIncome}
                onChange={(e) => setAdditionalIncome(e.target.value)}
                className="input-field"
                placeholder="e.g., 500000"
              />
              <p className="text-xs text-slate-500 mt-1">
                Add any other annual income sources (e.g., freelance, rental income, dividends, etc.)
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
                {(parseFloat(additionalIncome) || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Additional Income</span>
                    <span className="font-semibold">{formatCurrency(parseFloat(additionalIncome) || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
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
