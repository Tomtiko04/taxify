import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../utils/taxCalculations'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

export default function History({ userProfile }) {
  const [calculations, setCalculations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedCalc, setSelectedCalc] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [exporting, setExporting] = useState(null)

  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      if (!userProfile?.id) return
      
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('saved_calculations')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        if (isMounted) setCalculations(data || [])
      } catch (error) {
        console.error('Error fetching calculations:', error)
        toast.error('Failed to load saved analyses')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    return () => { isMounted = false }
  }, [userProfile])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return

    setDeleting(id)
    try {
      const { error } = await supabase
        .from('saved_calculations')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCalculations(prev => prev.filter(c => c.id !== id))
      if (selectedCalc?.id === id) setSelectedCalc(null)
      toast.success('Analysis deleted')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete analysis')
    } finally {
      setDeleting(null)
    }
  }

  const handleDownloadPDF = (calc) => {
    setExporting(calc.id)
    
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPos = 20

      const primaryColor = [22, 163, 74]
      const darkColor = [15, 23, 42]
      const lightGray = [241, 245, 249]

      const isPersonal = calc.calculation_type === 'personal'
      const data = calc.data
      const inputs = calc.inputs

      // Header
      doc.setFillColor(...primaryColor)
      doc.rect(0, 0, pageWidth, 45, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28)
      doc.setFont('helvetica', 'bold')
      doc.text('₦', 20, 28)
      
      doc.setFontSize(20)
      doc.text('TaxBuddy', 38, 28)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Nigeria Tax Support Portal', 38, 36)

      // Title Badge
      yPos = 55
      const title = isPersonal ? 'Personal Income Tax Report' : 'Corporate Tax Report'
      doc.setFillColor(isPersonal ? 22 : 59, isPersonal ? 163 : 130, isPersonal ? 74 : 246)
      doc.roundedRect(pageWidth / 2 - 50, yPos - 5, 100, 12, 6, 6, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(isPersonal ? 'PERSONAL TAX' : 'BUSINESS TAX', pageWidth / 2, yPos + 3, { align: 'center' })

      yPos += 20
      doc.setTextColor(...darkColor)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text(title, pageWidth / 2, yPos, { align: 'center' })

      yPos += 12
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      const userName = userProfile?.full_name || userProfile?.email?.split('@')[0] || 'User'
      doc.text(`Prepared for: ${userName}`, pageWidth / 2, yPos, { align: 'center' })

      yPos += 8
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date(calc.created_at).toLocaleString('en-NG')}`, pageWidth / 2, yPos, { align: 'center' })

      yPos += 15

      // Analysis Name
      if (inputs?.name || inputs?.companyName) {
        doc.setFillColor(...lightGray)
        doc.roundedRect(20, yPos - 5, pageWidth - 40, 14, 3, 3, 'F')
        doc.setTextColor(...darkColor)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`Analysis: ${inputs?.name || inputs?.companyName}`, 25, yPos + 4)
        yPos += 18
      }

      // Divider
      doc.setDrawColor(200, 200, 200)
      doc.line(20, yPos, pageWidth - 20, yPos)
      yPos += 12

      if (isPersonal) {
        // Personal Tax Report
        
        // Income Section
        doc.setFillColor(...primaryColor)
        doc.roundedRect(20, yPos - 2, 4, 18, 2, 2, 'F')
        doc.setTextColor(...darkColor)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Income Details', 30, yPos + 8)
        yPos += 22

        const incomeData = [
          ['Monthly Gross Salary', formatCurrency(parseFloat(inputs?.monthlyGross) || 0)],
          ['Annual Gross Income', formatCurrency(data?.annualGross || 0)],
          ['Annual Rent Paid', formatCurrency(parseFloat(inputs?.annualRent) || 0)]
        ]

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        incomeData.forEach(([label, value]) => {
          doc.setTextColor(100, 100, 100)
          doc.text(label, 30, yPos)
          doc.setTextColor(...darkColor)
          doc.setFont('helvetica', 'bold')
          doc.text(value, pageWidth - 30, yPos, { align: 'right' })
          doc.setFont('helvetica', 'normal')
          yPos += 8
        })

        yPos += 10

        // Deductions Section
        doc.setFillColor(59, 130, 246)
        doc.roundedRect(20, yPos - 2, 4, 18, 2, 2, 'F')
        doc.setTextColor(...darkColor)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Deductions', 30, yPos + 8)
        yPos += 22

        const deductionData = [
          ['Pension Contribution (8%)', formatCurrency(data?.pension || 0), inputs?.hasPension],
          ['NHF Contribution (2.5%)', formatCurrency(data?.nhf || 0), inputs?.hasNHF],
          ['Rent Relief (20%)', formatCurrency(data?.rentRelief || 0), (data?.rentRelief || 0) > 0]
        ]

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        deductionData.forEach(([label, value, applied]) => {
          if (applied) {
            doc.setTextColor(100, 100, 100)
            doc.text(label, 30, yPos)
            doc.setTextColor(22, 163, 74)
            doc.setFont('helvetica', 'bold')
            doc.text(`-${value}`, pageWidth - 30, yPos, { align: 'right' })
            doc.setFont('helvetica', 'normal')
            yPos += 8
          }
        })

        doc.setDrawColor(...primaryColor)
        doc.line(30, yPos, pageWidth - 30, yPos)
        yPos += 8
        doc.setTextColor(...darkColor)
        doc.setFont('helvetica', 'bold')
        doc.text('Total Deductions', 30, yPos)
        doc.setTextColor(22, 163, 74)
        doc.text(`-${formatCurrency(data?.totalDeductions || 0)}`, pageWidth - 30, yPos, { align: 'right' })
        yPos += 15

        // Tax Calculation
        doc.setFillColor(139, 92, 246)
        doc.roundedRect(20, yPos - 2, 4, 18, 2, 2, 'F')
        doc.setTextColor(...darkColor)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Tax Calculation', 30, yPos + 8)
        yPos += 22

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        doc.text('Taxable Income', 30, yPos)
        doc.setTextColor(...darkColor)
        doc.setFont('helvetica', 'bold')
        doc.text(formatCurrency(data?.taxableIncome || 0), pageWidth - 30, yPos, { align: 'right' })
        yPos += 10

        // Tax bands breakdown if available
        if (data?.breakdown && data.breakdown.length > 0) {
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(120, 120, 120)
          doc.text('Tax Breakdown:', 30, yPos)
          yPos += 7
          data.breakdown.forEach((band) => {
            if (band.tax > 0) {
              doc.text(`  ${band.band} @ ${band.rate}%`, 35, yPos)
              doc.text(formatCurrency(band.tax), pageWidth - 30, yPos, { align: 'right' })
              yPos += 6
            }
          })
          yPos += 5
        }

      } else {
        // Business Tax Report
        
        // Company Info
        doc.setFillColor(59, 130, 246)
        doc.roundedRect(20, yPos - 2, 4, 18, 2, 2, 'F')
        doc.setTextColor(...darkColor)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Company Information', 30, yPos + 8)
        yPos += 22

        const companyData = [
          ['Annual Turnover', formatCurrency(data?.turnover || 0)],
          ['Total Fixed Assets', formatCurrency(data?.assets || 0)],
          ['Net Profit Before Tax', formatCurrency(parseFloat(inputs?.profit) || 0)],
          ['Classification', data?.isSmallBusiness ? 'Small Company' : 'Large Company']
        ]

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        companyData.forEach(([label, value]) => {
          doc.setTextColor(100, 100, 100)
          doc.text(label, 30, yPos)
          doc.setTextColor(...darkColor)
          doc.setFont('helvetica', 'bold')
          doc.text(value, pageWidth - 30, yPos, { align: 'right' })
          doc.setFont('helvetica', 'normal')
          yPos += 8
        })

        yPos += 10

        // Tax Calculation
        doc.setFillColor(139, 92, 246)
        doc.roundedRect(20, yPos - 2, 4, 18, 2, 2, 'F')
        doc.setTextColor(...darkColor)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Tax Calculation', 30, yPos + 8)
        yPos += 22

        const taxData = [
          ['Assessable Profit', formatCurrency(data?.assessableProfit || 0)],
          ['CIT Rate', `${data?.citRate || 0}%`],
          ['Corporate Income Tax', formatCurrency(data?.cit || 0)],
          ['Development Levy', formatCurrency(data?.developmentLevy || 0)]
        ]

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        taxData.forEach(([label, value]) => {
          doc.setTextColor(100, 100, 100)
          doc.text(label, 30, yPos)
          doc.setTextColor(...darkColor)
          doc.setFont('helvetica', 'bold')
          doc.text(value, pageWidth - 30, yPos, { align: 'right' })
          doc.setFont('helvetica', 'normal')
          yPos += 8
        })

        yPos += 5
      }

      // Summary Box
      if (yPos > pageHeight - 70) {
        doc.addPage()
        yPos = 20
      }

      doc.setFillColor(...primaryColor)
      doc.roundedRect(20, yPos, pageWidth - 40, isPersonal ? 50 : 35, 5, 5, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('Total Tax Payable', 30, yPos + 12)

      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      const totalTax = isPersonal ? (data?.netTax || 0) : (data?.totalTax || 0)
      doc.text(formatCurrency(totalTax), 30, yPos + 28)

      if (isPersonal) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Monthly: ${formatCurrency(data?.monthlyTax || 0)}  |  Rate: ${(data?.effectiveRate || 0).toFixed(2)}%`, 30, yPos + 42)
      }

      yPos += isPersonal ? 65 : 50

      // Footer
      doc.setDrawColor(200, 200, 200)
      doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25)

      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.setFont('helvetica', 'italic')
      doc.text('Generated by TaxBuddy - Nigeria Tax Support Portal', pageWidth / 2, pageHeight - 18, { align: 'center' })
      doc.text('Based on Nigeria Tax Act 2025 (effective January 2026)', pageWidth / 2, pageHeight - 12, { align: 'center' })

      // Save
      const fileName = `${calc.calculation_type}-tax-report-${new Date(calc.created_at).toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setExporting(null)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredCalculations = calculations.filter(calc => {
    if (filter === 'all') return true
    return calc.calculation_type === filter
  })

  const isCompany = userProfile?.user_type === 'company'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Saved Analyses</h1>
          <p className="text-slate-600 mt-1">View, download, and manage your tax calculations</p>
        </div>
        <Link
          to={isCompany ? '/dashboard/business' : '/dashboard/personal'}
          className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Analysis
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 inline-flex shadow-sm">
        {[
          { id: 'all', label: 'All', icon: null },
          { id: 'personal', label: 'Personal', color: 'text-green-600' },
          { id: 'business', label: 'Business', color: 'text-blue-600' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 relative mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-green-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-slate-500">Loading your analyses...</p>
            </div>
          ) : filteredCalculations.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                <AnimatePresence>
                  {filteredCalculations.map((calc, index) => (
                    <motion.div
                      key={calc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedCalc(calc)}
                      className={`p-5 flex items-center justify-between cursor-pointer transition-all ${
                        selectedCalc?.id === calc.id 
                          ? 'bg-green-50 border-l-4 border-l-green-500' 
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          calc.calculation_type === 'business'
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                            : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                        }`}>
                          {calc.calculation_type === 'business' ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {calc.inputs?.companyName || calc.inputs?.name || `${calc.calculation_type === 'business' ? 'Business' : 'Personal'} Analysis`}
                          </p>
                          <p className="text-sm text-slate-500">{formatDate(calc.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right hidden sm:block">
                          <p className="font-bold text-slate-900">
                            {formatCurrency(calc.data?.totalTax || calc.data?.netTax || 0)}
                          </p>
                          <p className="text-xs text-slate-500">Tax Payable</p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadPDF(calc)
                            }}
                            disabled={exporting === calc.id}
                            className="p-2.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all disabled:opacity-50"
                            title="Download PDF"
                          >
                            {exporting === calc.id ? (
                              <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(calc.id)
                            }}
                            disabled={deleting === calc.id}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === calc.id ? (
                              <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No analyses found</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                {filter !== 'all' 
                  ? `You haven't saved any ${filter} tax analyses yet`
                  : 'Create your first tax calculation to see it here'}
              </p>
              <Link
                to={isCompany ? '/dashboard/business' : '/dashboard/personal'}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Analysis
              </Link>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedCalc ? (
              <motion.div
                key={selectedCalc.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6"
              >
                {/* Header */}
                <div className={`p-5 ${
                  selectedCalc.calculation_type === 'business'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    : 'bg-gradient-to-br from-green-500 to-emerald-600'
                } text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/80 text-sm font-medium">
                      {selectedCalc.calculation_type === 'business' ? 'Business Tax' : 'Personal Tax'}
                    </span>
                    <button 
                      onClick={() => setSelectedCalc(null)}
                      className="text-white/60 hover:text-white p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="font-bold text-lg truncate">
                    {selectedCalc.inputs?.companyName || selectedCalc.inputs?.name || 'Tax Analysis'}
                  </p>
                  <p className="text-white/70 text-sm mt-1">{formatDate(selectedCalc.created_at)}</p>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {selectedCalc.calculation_type === 'personal' ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-500 mb-1">Annual Income</p>
                          <p className="font-bold text-slate-900">
                            {formatCurrency(selectedCalc.data?.annualGross || 0)}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-500 mb-1">Taxable</p>
                          <p className="font-bold text-slate-900">
                            {formatCurrency(selectedCalc.data?.taxableIncome || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-500 mb-1">Effective Tax Rate</p>
                        <p className="font-bold text-slate-900">
                          {(selectedCalc.data?.effectiveRate || 0).toFixed(2)}%
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-500 mb-1">Turnover</p>
                          <p className="font-bold text-slate-900">
                            {formatCurrency(selectedCalc.data?.turnover || 0)}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-500 mb-1">CIT Rate</p>
                          <p className="font-bold text-slate-900">
                            {selectedCalc.data?.citRate || 0}%
                          </p>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-500 mb-1">Classification</p>
                        <p className="font-bold text-slate-900">
                          {selectedCalc.data?.isSmallBusiness ? 'Small Company' : 'Large Company'}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Tax Amount */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <p className="text-sm text-green-600 font-medium mb-1">Tax Payable</p>
                    <p className="text-3xl font-bold text-green-700">
                      {formatCurrency(selectedCalc.data?.totalTax || selectedCalc.data?.netTax || 0)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => handleDownloadPDF(selectedCalc)}
                      disabled={exporting === selectedCalc.id}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center justify-center disabled:opacity-50"
                    >
                      {exporting === selectedCalc.id ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download PDF Report
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedCalc.id)}
                      disabled={deleting === selectedCalc.id}
                      className="w-full bg-red-50 text-red-600 px-4 py-3 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      {deleting === selectedCalc.id ? (
                        <>
                          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Analysis
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center sticky top-6"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium mb-1">Select an Analysis</p>
                <p className="text-slate-400 text-sm">Click on any analysis to view details and download</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
