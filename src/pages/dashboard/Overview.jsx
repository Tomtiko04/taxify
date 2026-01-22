import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../utils/taxCalculations'

export default function Overview({ userProfile }) {
  const [recentCalculations, setRecentCalculations] = useState([])
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, totalTaxCalculated: 0 })
  const [loading, setLoading] = useState(true)

  const isCompany = userProfile?.user_type === 'company'

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile?.id) return

      setLoading(true)
      try {
        // Fetch all calculations for stats
        const { data: allCalcs, error: statsError } = await supabase
          .from('saved_calculations')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false })

        if (statsError) throw statsError

        if (isMounted) {
          setRecentCalculations(allCalcs.slice(0, 5) || [])

          // Calculate stats
          const now = new Date()
          const thisMonth = allCalcs.filter(c => {
            const calcDate = new Date(c.created_at)
            return calcDate.getMonth() === now.getMonth() && calcDate.getFullYear() === now.getFullYear()
          })
          
          const totalTax = allCalcs.reduce((sum, c) => {
            const tax = c.data?.totalTax || c.data?.netTax || 0
            return sum + tax
          }, 0)

          setStats({
            total: allCalcs.length,
            thisMonth: thisMonth.length,
            totalTaxCalculated: totalTax
          })
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Add isMounted tracking
    let isMounted = true
    fetchData()
    return () => { isMounted = false }
  }, [userProfile])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">
          Welcome back, {isCompany ? (userProfile?.company_name || userProfile?.full_name || 'there') : (userProfile?.full_name || 'there')}! 👋
        </h1>
        <p className="text-green-100 text-lg">
          {isCompany 
            ? 'Manage your business tax calculations and stay compliant.'
            : 'Track your personal income tax and maximize your savings.'}
        </p>
        <div className="mt-6">
          <Link
            to={isCompany ? '/dashboard/business' : '/dashboard/personal'}
            className="inline-flex items-center px-6 py-3 bg-white text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-colors"
          >
            New Calculation
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Total Analyses</p>
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">This Month</p>
              <p className="text-3xl font-bold text-slate-900">{stats.thisMonth}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Total Tax Calculated</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalTaxCalculated)}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Calculations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Analyses</h2>
          <Link 
            to="/dashboard/history" 
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        ) : recentCalculations.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentCalculations.map((calc) => (
              <div key={calc.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    calc.calculation_type === 'business' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {calc.calculation_type === 'business' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {calc.inputs?.companyName || calc.inputs?.name || `${calc.calculation_type === 'business' ? 'Business' : 'Personal'} Tax Analysis`}
                    </p>
                    <p className="text-sm text-slate-500">{formatDate(calc.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(calc.data?.totalTax || calc.data?.netTax || 0)}
                  </p>
                  <p className="text-xs text-slate-500">Tax Payable</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 mb-4">No calculations yet</p>
            <Link
              to={isCompany ? '/dashboard/business' : '/dashboard/personal'}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Create Your First Analysis
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to={isCompany ? '/dashboard/business' : '/dashboard/personal'}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">New Calculation</p>
                <p className="text-sm text-slate-500">Calculate your {isCompany ? 'corporate' : 'personal'} tax</p>
              </div>
            </Link>
            <Link
              to="/dashboard/history"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Download Reports</p>
                <p className="text-sm text-slate-500">Export your saved analyses</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">2026 Tax Deadlines</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-amber-800">
                  {isCompany ? 'CIT Filing Deadline' : 'PAYE Annual Returns'}
                </span>
              </div>
              <span className="text-sm font-bold text-amber-900">
                {isCompany ? 'June 30' : 'Jan 31'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">
                {isCompany ? 'Quarterly VAT Returns' : 'Monthly PAYE Remittance'}
              </span>
              <span className="text-sm font-medium text-slate-900">
                {isCompany ? '21st of following month' : '10th of each month'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
