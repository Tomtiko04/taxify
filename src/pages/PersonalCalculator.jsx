import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { calculatePAYE, formatCurrency } from '../utils/taxCalculations'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function PersonalCalculator() {
  const [monthlyGross, setMonthlyGross] = useState('')
  const [annualRent, setAnnualRent] = useState('')
  const [hasPension, setHasPension] = useState(true)
  const [hasNHF, setHasNHF] = useState(true)
  const [results, setResults] = useState(null)
  const [session, setSession] = useState(null)
  const navigate = useNavigate()
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

  const handleCalculate = (e) => {
    e.preventDefault()
    
    const gross = parseFloat(monthlyGross) || 0
    const rent = parseFloat(annualRent) || 0

    if (gross <= 0) {
      toast.error('Please enter a valid monthly gross income')
      return
    }

    const calculation = calculatePAYE(gross, rent, hasPension, hasNHF)
    setResults(calculation)
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-primary-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Personal Income Tax Calculator</h1>
          <p className="text-lg text-slate-600">
            Calculate your PAYE tax based on Nigeria Tax Act 2025 (effective Jan 2026)
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6 text-slate-900">Enter Your Details</h2>
            <form onSubmit={handleCalculate} className="space-y-6">
              <div>
                <label htmlFor="monthlyGross" className="block text-sm font-medium text-slate-700 mb-2">
                  Monthly Gross Income (₦)
                </label>
                <input
                  id="monthlyGross"
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={monthlyGross}
                  onChange={(e) => setMonthlyGross(e.target.value)}
                  className="input-field"
                  placeholder="e.g., 200000"
                />
              </div>

              <div>
                <label htmlFor="annualRent" className="block text-sm font-medium text-slate-700 mb-2">
                  Annual Rent Paid (₦)
                </label>
                <input
                  id="annualRent"
                  type="number"
                  min="0"
                  step="1000"
                  value={annualRent}
                  onChange={(e) => setAnnualRent(e.target.value)}
                  className="input-field"
                  placeholder="e.g., 1200000"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Rent relief: 20% of annual rent (capped at ₦500,000)
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="hasPension"
                    type="checkbox"
                    checked={hasPension}
                    onChange={(e) => setHasPension(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300 rounded"
                  />
                  <label htmlFor="hasPension" className="ml-2 block text-sm text-slate-700">
                    I contribute to Pension (8% deduction)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="hasNHF"
                    type="checkbox"
                    checked={hasNHF}
                    onChange={(e) => setHasNHF(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300 rounded"
                  />
                  <label htmlFor="hasNHF" className="ml-2 block text-sm text-slate-700">
                    I contribute to NHF (2.5% deduction)
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full btn-primary">
                Calculate Tax
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6 text-slate-900">Tax Breakdown</h2>
            
            {results ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-700">Annual Gross Income</span>
                    <span className="font-bold text-lg">{formatCurrency(results.annualGross)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-700">Total Deductions</span>
                    <span className="font-semibold text-green-700">{formatCurrency(results.deductions.total)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-700">Taxable Income</span>
                    <span className="font-semibold">{formatCurrency(results.taxableIncome)}</span>
                  </div>
                  <div className="border-t border-green-200 pt-2 mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-700">Annual Tax Payable</span>
                      <span className="font-bold text-xl text-green-600">{formatCurrency(results.annualTax)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Monthly Tax</span>
                      <span className="font-semibold text-green-600">{formatCurrency(results.monthlyTax)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Breakdown */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Deductions Breakdown</h3>
                  <div className="space-y-2">
                    {results.deductions.pension > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Pension (8%)</span>
                        <span className="font-medium">{formatCurrency(results.deductions.pension)}</span>
                      </div>
                    )}
                    {results.deductions.nhf > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">NHF (2.5%)</span>
                        <span className="font-medium">{formatCurrency(results.deductions.nhf)}</span>
                      </div>
                    )}
                    {results.deductions.rentRelief > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Rent Relief (20%)</span>
                        <span className="font-medium">{formatCurrency(results.deductions.rentRelief)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Net Income */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-700 font-semibold">Net Annual Income</span>
                    <span className="font-bold text-xl text-green-700">{formatCurrency(results.netAnnual)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-semibold">Net Monthly Income</span>
                    <span className="font-bold text-lg text-green-700">{formatCurrency(results.netMonthly)}</span>
                  </div>
                </div>

                {/* Effective Rate */}
                <div className="text-center pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">Effective Tax Rate</p>
                  <p className="text-2xl font-bold text-green-600">{results.effectiveRate.toFixed(2)}%</p>
                </div>

                {/* Save/Report Actions */}
                <div className="pt-6 border-t border-slate-200 space-y-3">
                  {session ? (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('saved_calculations')
                              .insert({
                                user_id: session.user.id,
                                calculation_type: 'personal',
                                data: results,
                                inputs: { monthlyGross, annualRent, hasPension, hasNHF }
                              })
                            if (error) throw error
                            toast.success('Calculation saved successfully!')
                          } catch (error) {
                            toast.error('Error saving calculation. Please try again.')
                          }
                        }}
                        className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
                      >
                        💾 Save These Results for 2026
                      </button>
                      <button
                        onClick={() => {
                          // Generate PDF report (placeholder)
                          const reportData = {
                            type: 'Personal Income Tax',
                            date: new Date().toLocaleDateString(),
                            ...results
                          }
                          window.print()
                        }}
                        className="w-full bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors"
                      >
                        📄 Generate Official Report
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-center text-slate-600 mb-2">
                        Want to save your results or generate a report?
                      </p>
                      <Link
                        to="/signup"
                        className="block w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md text-center"
                      >
                        💾 Save These Results for 2026
                      </Link>
                      <Link
                        to="/signup"
                        className="block w-full bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors text-center"
                      >
                        📄 Generate Official Report
                      </Link>
                      <p className="text-xs text-center text-slate-500 mt-2">
                        Free signup takes less than 30 seconds
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p>Enter your details and click "Calculate Tax" to see results</p>
              </div>
            )}
          </div>
        </div>

        {/* Tax Bands Info */}
        <div className="mt-8 card">
          <h3 className="text-xl font-semibold mb-4 text-slate-900">Tax Bands (2026)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Income Range</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Tax Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                <tr>
                  <td className="px-4 py-3 text-sm text-slate-900">₦0 - ₦800,000</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">0%</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-slate-900">₦800,001 - ₦3,000,000</td>
                  <td className="px-4 py-3 text-sm font-semibold">15%</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-slate-900">₦3,000,001 - ₦12,000,000</td>
                  <td className="px-4 py-3 text-sm font-semibold">18%</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-slate-900">₦12,000,001 - ₦25,000,000</td>
                  <td className="px-4 py-3 text-sm font-semibold">21%</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-slate-900">₦25,000,001 - ₦50,000,000</td>
                  <td className="px-4 py-3 text-sm font-semibold">23%</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-slate-900">Above ₦50,000,000</td>
                  <td className="px-4 py-3 text-sm font-semibold">25%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
