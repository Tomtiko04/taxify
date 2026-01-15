import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { calculateCIT, formatCurrency } from '../utils/taxCalculations'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function BusinessCalculator() {
  const [turnover, setTurnover] = useState('')
  const [assets, setAssets] = useState('')
  const [profit, setProfit] = useState('')
  const [results, setResults] = useState(null)
  const [session, setSession] = useState(null)

  // Check session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    
    return () => subscription.unsubscribe()
  }, [])

  const handleCalculate = (e) => {
    e.preventDefault()
    
    const turnoverValue = parseFloat(turnover) || 0
    const assetsValue = parseFloat(assets) || 0
    const profitValue = parseFloat(profit) || 0

    if (turnoverValue <= 0) {
      toast.error('Please enter a valid annual turnover')
      return
    }

    const calculation = calculateCIT(turnoverValue, assetsValue)
    
    // Calculate CIT if it's a large business and profit is provided
    if (!calculation.isSmallBusiness && profitValue > 0) {
      calculation.cit = profitValue * 0.30
      calculation.totalTax = calculation.cit + calculation.developmentLevy
    }

    setResults(calculation)
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-primary-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Corporate Income Tax Calculator</h1>
          <p className="text-lg text-slate-600">
            Calculate your business tax obligations based on Nigeria Tax Act 2025 (effective Jan 2026)
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-6 text-slate-900">Enter Business Details</h2>
            <form onSubmit={handleCalculate} className="space-y-6">
              <div>
                <label htmlFor="turnover" className="block text-sm font-medium text-slate-700 mb-2">
                  Annual Turnover (₦) *
                </label>
                <input
                  id="turnover"
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={turnover}
                  onChange={(e) => setTurnover(e.target.value)}
                  className="input-field"
                  placeholder="e.g., 100000000"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Turnover determines if you're a small (&lt;₦50M) or large business
                </p>
              </div>

              <div>
                <label htmlFor="assets" className="block text-sm font-medium text-slate-700 mb-2">
                  Total Assets Value (₦)
                </label>
                <input
                  id="assets"
                  type="number"
                  min="0"
                  step="1000"
                  value={assets}
                  onChange={(e) => setAssets(e.target.value)}
                  className="input-field"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label htmlFor="profit" className="block text-sm font-medium text-slate-700 mb-2">
                  Annual Profit (₦)
                </label>
                <input
                  id="profit"
                  type="number"
                  min="0"
                  step="1000"
                  value={profit}
                  onChange={(e) => setProfit(e.target.value)}
                  className="input-field"
                  placeholder="Required for large businesses"
                />
                <p className="mt-1 text-xs text-slate-500">
                  CIT is calculated on profit, not turnover. Required for accurate calculation.
                </p>
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
                {/* Business Category */}
                <div className={`rounded-lg p-4 border-2 ${
                  results.isSmallBusiness 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">Business Category</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      results.isSmallBusiness
                        ? 'bg-green-200 text-green-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}>
                      {results.isSmallBusiness ? 'Small Business' : 'Large Business'}
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-700">Annual Turnover</span>
                    <span className="font-bold text-lg">{formatCurrency(results.turnover)}</span>
                  </div>
                  {results.assets > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-700">Total Assets</span>
                      <span className="font-semibold">{formatCurrency(results.assets)}</span>
                    </div>
                  )}
                </div>

                {/* Tax Breakdown */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-slate-900 mb-3">Tax Obligations</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">CIT Rate</span>
                      <span className="font-semibold">{results.citRate}%</span>
                    </div>
                    {results.cit > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Corporate Income Tax</span>
                        <span className="font-semibold text-green-700">{formatCurrency(results.cit)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Development Levy Rate</span>
                      <span className="font-semibold">{results.developmentLevyRate}%</span>
                    </div>
                    {results.developmentLevy > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Development Levy</span>
                        <span className="font-semibold text-green-700">{formatCurrency(results.developmentLevy)}</span>
                      </div>
                    )}
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
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">{results.note}</p>
                  </div>
                )}

                {results.isSmallBusiness && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 font-semibold">
                      ✓ Your business qualifies for tax exemption as a small business!
                    </p>
                  </div>
                )}

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
                                calculation_type: 'business',
                                data: results,
                                inputs: { turnover, assets, profit }
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p>Enter your business details and click "Calculate Tax" to see results</p>
              </div>
            )}
          </div>
        </div>

        {/* Tax Rules Info */}
        <div className="mt-8 card">
          <h3 className="text-xl font-semibold mb-4 text-slate-900">Corporate Tax Rules (2026)</h3>
          <div className="space-y-4">
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <h4 className="font-semibold text-green-900 mb-2">Small Business (Turnover &lt; ₦50M)</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• 0% Corporate Income Tax (CIT)</li>
                <li>• 0% Development Levy</li>
                <li>• Complete tax exemption</li>
              </ul>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Large Business (Turnover ≥ ₦50M)</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 30% Corporate Income Tax (calculated on profit)</li>
                <li>• 4% Development Levy (calculated on turnover)</li>
                <li>• CIT is based on profit, not turnover</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
