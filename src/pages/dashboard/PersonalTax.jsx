import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { calculatePAYE, formatCurrency, formatNumberWithCommas, parseFormattedNumber } from '../../utils/taxCalculations'
import { supabase } from '../../lib/supabase'
import { savePersonalCalculationData, getPersonalCalculationData, saveReturnUrl } from '../../utils/storage'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

export default function PersonalTax({ userProfile, session }) {
  const navigate = useNavigate()
  const [monthlyGross, setMonthlyGross] = useState(userProfile?.monthly_salary ? formatNumberWithCommas(userProfile.monthly_salary.toString()) : '')
  const [isDetailed, setIsDetailed] = useState(false)
  const [basicSalary, setBasicSalary] = useState('')
  const [housingAllowance, setHousingAllowance] = useState('')
  const [transportAllowance, setTransportAllowance] = useState('')
  const [additionalIncomes, setAdditionalIncomes] = useState([{ name: '', amount: '' }])
  const [annualRent, setAnnualRent] = useState('')
  const [hasPension, setHasPension] = useState(true)
  const [hasNHF, setHasNHF] = useState(true)
  const [nhfOnBasicOnly, setNhfOnBasicOnly] = useState(true) // 2026 compliant
  const [analysisName, setAnalysisName] = useState('')
  const [results, setResults] = useState(null)
  const [isSavingCalculation, setIsSavingCalculation] = useState(false)
  const [showTaxInfo, setShowTaxInfo] = useState(false)
  const isMounted = useRef(true)

  // Remove the initial auth useEffect, only keep the restoration one
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    if (!isMounted.current) return
    if (session?.user && results === null) {
      const savedData = getPersonalCalculationData()
      if (savedData) {
        setMonthlyGross(savedData.monthlyGross ? formatNumberWithCommas(savedData.monthlyGross) : (userProfile?.monthly_salary ? formatNumberWithCommas(userProfile.monthly_salary.toString()) : ''))
        setAdditionalIncomes((savedData.additionalIncomes || [{ name: '', amount: '' }]).map(item => ({ ...item, amount: item.amount ? formatNumberWithCommas(item.amount) : '' })))
        setAnnualRent(savedData.annualRent ? formatNumberWithCommas(savedData.annualRent) : '')
        setHasPension(savedData.hasPension !== undefined ? savedData.hasPension : true)
        setHasNHF(savedData.hasNHF !== undefined ? savedData.hasNHF : true)
        setNhfOnBasicOnly(savedData.nhfOnBasicOnly !== undefined ? savedData.nhfOnBasicOnly : true)
        setAnalysisName(savedData.analysisName || '')
        
        if (savedData.monthlyGross || savedData.isDetailed) {
          const basicValue = parseFormattedNumber(savedData.basicSalary || '')
          const housingValue = parseFormattedNumber(savedData.housingAllowance || '')
          const transportValue = parseFormattedNumber(savedData.transportAllowance || '')
          
          const monthlyValue = savedData.isDetailed 
            ? (basicValue + housingValue + transportValue)
            : parseFormattedNumber(savedData.monthlyGross || '')

          const pensionBase = savedData.isDetailed 
            ? (basicValue + housingValue + transportValue)
            : monthlyValue

          const additionalTotal = (savedData.additionalIncomes || []).reduce((sum, item) => sum + parseFormattedNumber(item.amount), 0)
          const rentValue = parseFormattedNumber(savedData.annualRent)
          
          // NHF 2026 Compliance
          const savedNhfOnBasicOnly = savedData.nhfOnBasicOnly !== undefined ? savedData.nhfOnBasicOnly : true
          const nhfBase = savedData.isDetailed && savedNhfOnBasicOnly ? basicValue : monthlyValue
          
          if (monthlyValue > 0 || additionalTotal > 0) {
            const calculation = calculatePAYE(
              monthlyValue, rentValue,
              savedData.hasPension !== undefined ? savedData.hasPension : true,
              savedData.hasNHF !== undefined ? savedData.hasNHF : true,
              additionalTotal,
              pensionBase,
              nhfBase
            )
            if (isMounted.current) {
              setResults(calculation)
              toast.success('Your calculation has been restored!')
            }
          }
        }
      }
    }
  }, [session, userProfile, results])

  const handleCalculate = (e) => {
    e.preventDefault()
    const basicValue = parseFormattedNumber(basicSalary)
    const housingValue = parseFormattedNumber(housingAllowance)
    const transportValue = parseFormattedNumber(transportAllowance)
    
    const monthlyValue = isDetailed 
      ? (basicValue + housingValue + transportValue)
      : parseFormattedNumber(monthlyGross)

    const pensionBase = isDetailed 
      ? (basicValue + housingValue + transportValue)
      : monthlyValue

    // NHF 2026 Compliance: Calculate on Basic Salary (standard) or Total Gross (optional)
    const nhfBase = isDetailed && nhfOnBasicOnly ? basicValue : monthlyValue

    const additionalTotal = additionalIncomes.reduce((sum, item) => sum + parseFormattedNumber(item.amount), 0)
    const rentValue = parseFormattedNumber(annualRent)

    if (monthlyValue <= 0 && additionalTotal <= 0) {
      toast.error('Please enter your salary details')
      return
    }

    const calculation = calculatePAYE(monthlyValue, rentValue, hasPension, hasNHF, additionalTotal, pensionBase, nhfBase)
    setResults(calculation)
    toast.success('Tax calculated!')
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
    if (field === 'amount') {
      updated[index][field] = formatNumberWithCommas(value)
    } else {
      updated[index][field] = value
    }
    setAdditionalIncomes(updated)
  }

  const handleSave = async () => {
    if (!results) {
      toast.error('Please calculate your tax first')
      return
    }

    if (!session?.user) {
      const calcData = { 
        monthlyGross, 
        basicSalary,
        housingAllowance,
        transportAllowance,
        isDetailed,
        additionalIncomes, 
        annualRent, 
        hasPension, 
        hasNHF,
        nhfOnBasicOnly,
        analysisName, 
        results 
      }
      if (savePersonalCalculationData(calcData)) {
        saveReturnUrl('/dashboard/personal')
        toast.loading('Redirecting to signup...', { id: 'signup-redirect' })
        navigate('/signup?return=personal')
      } else {
        toast.error('Failed to save. Please try again.')
      }
      return
    }

    setIsSavingCalculation(true)
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
            basicSalary,
            housingAllowance,
            transportAllowance,
            isDetailed,
            additionalIncomes,
            annualRent,
            hasPension,
            hasNHF,
            nhfOnBasicOnly
          }
        })

      if (error) throw error
      getPersonalCalculationData()
      toast.success('Analysis saved!')
      navigate('/dashboard/history')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save')
    } finally {
      setIsSavingCalculation(false);
    }
  }

  const handleDownload = () => {
    if (!results) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPos = 20

    const primaryColor = [22, 163, 74]
    const darkColor = [15, 23, 42]
    const lightGray = [241, 245, 249]

    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, pageWidth, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('₦', 20, 25)
    doc.setFontSize(18)
    doc.text('Taxify', 35, 25)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Nigeria Tax Support Portal', 35, 32)

    yPos = 50
    doc.setTextColor(...darkColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Personal Income Tax Analysis', pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 10
    const userName = userProfile?.full_name || session?.user?.email?.split('@')[0] || 'User'
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Prepared for: ${userName}`, pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 8
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${new Date().toLocaleString('en-NG')}`, pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 15
    if (analysisName) {
      doc.setFontSize(11)
      doc.setTextColor(...darkColor)
      doc.setFont('helvetica', 'bold')
      doc.text(`Analysis: ${analysisName}`, 20, yPos)
      yPos += 8
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkColor)
    doc.text('Income Sources', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    
    const monthlySalary = parseFloat(monthlyGross) || 0
    const annualSalary = monthlySalary * 12
    doc.text(`Monthly Gross Salary:`, 25, yPos)
    doc.text(formatCurrency(monthlySalary), pageWidth - 25, yPos, { align: 'right' })
    yPos += 6
    doc.text(`Annual Salary (×12):`, 25, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(formatCurrency(annualSalary), pageWidth - 25, yPos, { align: 'right' })
    yPos += 8

    const additionalTotal = additionalIncomes.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    if (additionalTotal > 0) {
      doc.setFont('helvetica', 'normal')
      doc.text('Additional Income Sources:', 25, yPos)
      yPos += 6
      additionalIncomes.forEach((income) => {
        const amount = parseFloat(income.amount) || 0
        if (amount > 0) {
          doc.text(`  • ${income.name || 'Unnamed'}:`, 30, yPos)
          doc.text(formatCurrency(amount), pageWidth - 25, yPos, { align: 'right' })
          yPos += 6
        }
      })
    }

    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.5)
    doc.line(20, yPos, pageWidth - 20, yPos)
    yPos += 8
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('Total Annual Gross:', 25, yPos)
    doc.text(formatCurrency(results.annualGross || 0), pageWidth - 25, yPos, { align: 'right' })
    yPos += 12

    if (yPos > pageHeight - 80) { doc.addPage(); yPos = 20 }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkColor)
    doc.text('Deductions', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)

    if (results.pension > 0) {
      doc.text(`Pension (8%):`, 25, yPos)
      doc.text(formatCurrency(results.pension), pageWidth - 25, yPos, { align: 'right' })
      yPos += 6
    }
    if (results.nhf > 0) {
      doc.text(`NHF (2.5%):`, 25, yPos)
      doc.text(formatCurrency(results.nhf), pageWidth - 25, yPos, { align: 'right' })
      yPos += 6
    }
    if (results.rentRelief > 0) {
      doc.text(`Rent Relief:`, 25, yPos)
      doc.text(formatCurrency(results.rentRelief), pageWidth - 25, yPos, { align: 'right' })
      yPos += 6
    }

    doc.line(20, yPos, pageWidth - 20, yPos)
    yPos += 6
    doc.setFont('helvetica', 'bold')
    doc.text('Total Deductions:', 25, yPos)
    doc.text(formatCurrency(results.totalDeductions || 0), pageWidth - 25, yPos, { align: 'right' })
    yPos += 12

    if (yPos > pageHeight - 100) { doc.addPage(); yPos = 20 }

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
    yPos += 10

    if (results.breakdown?.length > 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      results.breakdown.forEach((band) => {
        if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20 }
        doc.text(`${band.band} (${band.rate}%):`, 30, yPos)
        doc.text(formatCurrency(band.tax), pageWidth - 25, yPos, { align: 'right' })
        yPos += 5
      })
      yPos += 5
    }

    if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20 }

    doc.setFillColor(...lightGray)
    doc.roundedRect(20, yPos, pageWidth - 40, 32, 3, 3, 'F')
    yPos += 8
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkColor)
    doc.text('Summary', 25, yPos)
    yPos += 7
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Annual Tax:`, 25, yPos)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text(formatCurrency(results.netTax || 0), pageWidth - 25, yPos, { align: 'right' })
    yPos += 6
    doc.setTextColor(60, 60, 60)
    doc.setFont('helvetica', 'normal')
    doc.text(`Monthly Tax:`, 25, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(formatCurrency(results.monthlyTax || 0), pageWidth - 25, yPos, { align: 'right' })

    yPos += 20
    doc.setDrawColor(200, 200, 200)
    doc.line(20, yPos, pageWidth - 20, yPos)
    yPos += 8
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'italic')
    doc.text('Generated by Taxify - Based on Nigeria Tax Act 2025', pageWidth / 2, yPos, { align: 'center' })

    doc.save(`tax-report-${userName.replace(/\s+/g, '-')}-${Date.now()}.pdf`)
    toast.success('PDF downloaded!')
  }

  const resetForm = () => {
    setResults(null)
    setMonthlyGross(userProfile?.monthly_salary ? formatNumberWithCommas(userProfile.monthly_salary.toString()) : '')
    setBasicSalary('')
    setHousingAllowance('')
    setTransportAllowance('')
    setIsDetailed(false)
    setAdditionalIncomes([{ name: '', amount: '' }])
    setAnnualRent('')
    setHasPension(true)
    setHasNHF(true)
    setNhfOnBasicOnly(true)
    setAnalysisName('')
  }

  const taxBands = [
    { range: '₦0 - ₦800,000', rate: 0, color: 'bg-green-500' },
    { range: '₦800K - ₦3M', rate: 15, color: 'bg-blue-500' },
    { range: '₦3M - ₦12M', rate: 18, color: 'bg-indigo-500' },
    { range: '₦12M - ₦25M', rate: 21, color: 'bg-purple-500' },
    { range: '₦25M - ₦50M', rate: 23, color: 'bg-orange-500' },
    { range: 'Above ₦50M', rate: 25, color: 'bg-red-500' }
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personal Tax Calculator</h1>
          <p className="text-slate-600">Calculate your 2026 income tax based on Nigeria Tax Act</p>
        </div>
        <button
          onClick={() => setShowTaxInfo(!showTaxInfo)}
          className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {showTaxInfo ? 'Hide' : 'View'} Tax Bands
        </button>
      </div>

      {/* Tax Bands Info Panel */}
      <AnimatePresence>
        {showTaxInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4">2026 Personal Income Tax Bands</h3>
              
              {/* Visual Bar */}
              <div className="h-4 rounded-full overflow-hidden flex mb-6">
                {taxBands.map((band, i) => (
                  <div key={i} className={`${band.color} flex-1`} />
                ))}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 font-semibold text-slate-700">Income Range</th>
                      <th className="text-center py-3 font-semibold text-slate-700">Tax Rate</th>
                      <th className="text-left py-3 font-semibold text-slate-700">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>₦0 - ₦800,000</td>
                      <td className="py-3 text-center font-bold text-green-600">0%</td>
                      <td className="py-3 text-slate-600">Tax-free threshold</td>
                    </tr>
                    <tr>
                      <td className="py-3 flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>₦800,001 - ₦3,000,000</td>
                      <td className="py-3 text-center font-bold text-blue-600">15%</td>
                      <td className="py-3 text-slate-600">Lower-middle income</td>
                    </tr>
                    <tr>
                      <td className="py-3 flex items-center"><span className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></span>₦3,000,001 - ₦12,000,000</td>
                      <td className="py-3 text-center font-bold text-indigo-600">18%</td>
                      <td className="py-3 text-slate-600">Middle income</td>
                    </tr>
                    <tr>
                      <td className="py-3 flex items-center"><span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>₦12,000,001 - ₦25,000,000</td>
                      <td className="py-3 text-center font-bold text-purple-600">21%</td>
                      <td className="py-3 text-slate-600">Upper-middle income</td>
                    </tr>
                    <tr>
                      <td className="py-3 flex items-center"><span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>₦25,000,001 - ₦50,000,000</td>
                      <td className="py-3 text-center font-bold text-orange-600">23%</td>
                      <td className="py-3 text-slate-600">High income</td>
                    </tr>
                    <tr>
                      <td className="py-3 flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>Above ₦50,000,000</td>
                      <td className="py-3 text-center font-bold text-red-600">25%</td>
                      <td className="py-3 text-slate-600">Top earners</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Deductions Info */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-3">Allowable Deductions</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600">8%</div>
                    <div className="text-xs text-green-700">Pension</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600">2.5%</div>
                    <div className="text-xs text-green-700">NHF</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600">20%</div>
                    <div className="text-xs text-green-700">Rent (max ₦500K)</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Calculator Form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                Income Details
              </h2>

              <form onSubmit={handleCalculate} className="space-y-5">
                {/* Analysis Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Analysis Name <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={analysisName}
                    onChange={(e) => setAnalysisName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
                    placeholder="e.g., January 2026 Salary"
                  />
                </div>

                {/* Calculation Mode Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6 font-medium">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Detailed Salary Breakdown</h4>
                    <p className="text-xs text-slate-500">Break down your salary for more accurate pension calculation</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDetailed(!isDetailed)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isDetailed ? 'bg-green-600' : 'bg-slate-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDetailed ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {isDetailed ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block mb-2 text-xs font-medium text-slate-700">Basic Salary (Monthly)</label>
                      <div className="relative">
                        <span className="absolute -translate-y-1/2 left-3 top-1/2 text-slate-400 text-xs">₦</span>
                        <input
                          type="text"
                          value={basicSalary}
                          onChange={(e) => setBasicSalary(formatNumberWithCommas(e.target.value))}
                          className="w-full py-2 pl-7 pr-3 text-sm transition-all border border-slate-200 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="250,000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-2 text-xs font-medium text-slate-700">Housing (Monthly)</label>
                      <div className="relative">
                        <span className="absolute -translate-y-1/2 left-3 top-1/2 text-slate-400 text-xs">₦</span>
                        <input
                          type="text"
                          value={housingAllowance}
                          onChange={(e) => setHousingAllowance(formatNumberWithCommas(e.target.value))}
                          className="w-full py-2 pl-7 pr-3 text-sm transition-all border border-slate-200 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="150,000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-2 text-xs font-medium text-slate-700">Transport (Monthly)</label>
                      <div className="relative">
                        <span className="absolute -translate-y-1/2 left-3 top-1/2 text-slate-400 text-xs">₦</span>
                        <input
                          type="text"
                          value={transportAllowance}
                          onChange={(e) => setTransportAllowance(formatNumberWithCommas(e.target.value))}
                          className="w-full py-2 pl-7 pr-3 text-sm transition-all border border-slate-200 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="100,000"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Monthly Salary */
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Monthly Gross Salary <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₦</span>
                      <input
                        type="text"
                        value={monthlyGross}
                        onChange={(e) => setMonthlyGross(formatNumberWithCommas(e.target.value))}
                        className="w-full pl-10 pr-4 py-2.5 text-lg font-semibold border border-slate-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
                        placeholder="500,000"
                        required={!isDetailed}
                      />
                    </div>
                  </div>
                )}

                {/* Deductions */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="font-medium text-slate-900 mb-3">Tax-Saving Contributions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      hasPension ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white'
                    }`}>
                      <input
                        type="checkbox"
                        checked={hasPension}
                        onChange={(e) => setHasPension(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 ${
                        hasPension ? 'bg-green-500 border-green-500' : 'border-slate-300'
                      }`}>
                        {hasPension && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900 text-sm">Pension (8%)</span>
                          <div className="group relative">
                            <svg className="w-3.5 h-3.5 text-slate-400 hover:text-green-600 transition-colors cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-slate-900 text-white text-[11px] leading-relaxed rounded-xl opacity-0 group-hover:opacity-100 transition-all z-20 pointer-events-none shadow-2xl border border-slate-700">
                              <div className="font-bold text-green-400 mb-1">Pension Tax Relief</div>
                              Every Naira that goes into your Pension is 100% Tax-Free.
                              <div className="mt-2 text-slate-400 italic text-[10px]">
                                Tip: Check your pay slip to see if pension is based on Basic or Total Salary.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      hasNHF ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white'
                    }`}>
                      <input
                        type="checkbox"
                        checked={hasNHF}
                        onChange={(e) => setHasNHF(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 ${
                        hasNHF ? 'bg-green-500 border-green-500' : 'border-slate-300'
                      }`}>
                        {hasNHF && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900 text-sm">NHF (2.5%)</span>
                          <div className="group relative">
                            <svg className="w-3.5 h-3.5 text-slate-400 hover:text-green-600 transition-colors cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-slate-900 text-white text-[11px] leading-relaxed rounded-xl opacity-0 group-hover:opacity-100 transition-all z-20 pointer-events-none shadow-2xl border border-slate-700">
                              <div className="font-bold text-green-400 mb-1">NHF Tax Relief (2026)</div>
                              2.5% contribution to National Housing Fund. Optional for private sector.
                              <div className="mt-2 text-slate-400 italic text-[10px]">
                                Legal standard: 2.5% of Basic Salary. Some employers use Total Gross.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* NHF Calculation Base - Only show when detailed mode AND NHF enabled */}
                  {isDetailed && hasNHF && (
                    <div className="mt-3 p-3 bg-green-50/50 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700">NHF Base:</span>
                        <div className="flex bg-white rounded-md border border-slate-200 p-0.5">
                          <button
                            type="button"
                            onClick={() => setNhfOnBasicOnly(true)}
                            className={`px-2 py-1 text-[10px] font-semibold rounded transition-all ${
                              nhfOnBasicOnly
                                ? "bg-green-600 text-white"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            Basic Only
                          </button>
                          <button
                            type="button"
                            onClick={() => setNhfOnBasicOnly(false)}
                            className={`px-2 py-1 text-[10px] font-semibold rounded transition-all ${
                              !nhfOnBasicOnly
                                ? "bg-green-600 text-white"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            Total Gross
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-green-700 mt-1">
                        {nhfOnBasicOnly 
                          ? "2026 Compliant: NHF on Basic Salary" 
                          : "NHF on Total Gross"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Annual Rent */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Annual Rent Paid <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₦</span>
                    <input
                      type="text"
                      value={annualRent}
                      onChange={(e) => setAnnualRent(formatNumberWithCommas(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
                      placeholder="1,200,000"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">20% is deductible (max ₦500,000)</p>
                </div>

                {/* Additional Income */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Other Income <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <button type="button" onClick={addAdditionalIncome} className="text-xs text-green-600 hover:text-green-700 font-medium">
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {additionalIncomes.map((income, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={income.name}
                          onChange={(e) => updateAdditionalIncome(index, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-green-500 focus:outline-none"
                          placeholder="Source"
                        />
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₦</span>
                          <input
                            type="text"
                            value={income.amount}
                            onChange={(e) => updateAdditionalIncome(index, 'amount', e.target.value)}
                            className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-green-500 focus:outline-none"
                            placeholder="Annual"
                          />
                        </div>
                        {additionalIncomes.length > 1 && (
                          <button type="button" onClick={() => removeAdditionalIncome(index)} className="p-2 text-red-400 hover:text-red-600 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculate Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg shadow-md shadow-green-500/25 hover:shadow-green-500/40 transition-all flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Calculate Tax
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            {results ? (
              <div>
                {/* Result Header */}
                <div className="bg-gradient-to-br from-emerald-600 to-green-700 p-5 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-green-100">Monthly Take-Home</span>
                    <button onClick={resetForm} className="text-green-100 hover:text-white text-xs underline">
                      Reset
                    </button>
                  </div>
                  <div className="text-3xl font-extrabold mb-1">
                    {formatCurrency(results.netMonthly || 0)}
                  </div>
                  <div className="flex gap-4 text-sm text-green-50">
                    <span>Yearly: <strong className="text-white">{formatCurrency(results.netAnnual || 0)}</strong></span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-semibold text-green-700 uppercase">Annual Tax</span>
                      </div>
                      <span className="text-xl font-extrabold text-green-800">{formatCurrency(results.netTax || 0)}</span>
                      <p className="text-[10px] text-green-600 mt-0.5">{formatCurrency(results.monthlyTax || 0)}/month</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-6 h-6 bg-slate-500 rounded-md flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-600 uppercase">Effective Rate</span>
                      </div>
                      <span className="text-xl font-extrabold text-slate-800">{(results.effectiveRate || 0).toFixed(1)}%</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">of gross income</p>
                    </div>
                  </div>

                  {/* Tax-Shielded Income */}
                  {results.totalDeductions > 0 && (
                    <div className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-800 uppercase">Tax-Shielded Income</span>
                        </div>
                        <span className="text-sm font-extrabold text-emerald-700">{formatCurrency(results.totalDeductions)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {results.pension > 0 && (
                          <span className="px-2 py-1 bg-white/70 rounded text-[10px] text-emerald-700 font-medium border border-emerald-100">
                            Pension: {formatCurrency(results.pension)}
                          </span>
                        )}
                        {results.nhf > 0 && (
                          <span className="px-2 py-1 bg-white/70 rounded text-[10px] text-emerald-700 font-medium border border-emerald-100">
                            NHF: {formatCurrency(results.nhf)}
                          </span>
                        )}
                        {results.rentRelief > 0 && (
                          <span className="px-2 py-1 bg-white/70 rounded text-[10px] text-emerald-700 font-medium border border-emerald-100">
                            Rent (20%): {formatCurrency(results.rentRelief)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Detailed Table */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
                        <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-[11px] font-semibold text-slate-900">Breakdown</h4>
                    </div>
                    
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center py-1.5 px-2 bg-slate-50 rounded">
                        <span className="text-slate-600">Gross (Annual)</span>
                        <span className="font-bold text-slate-900">{formatCurrency(results.annualGross)}</span>
                      </div>
                      
                      {results.pension > 0 && (
                        <div className="flex justify-between items-center py-1 px-2">
                          <span className="text-slate-500 flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></div>
                            Pension (8%)
                          </span>
                          <span className="font-semibold text-slate-700">-{formatCurrency(results.pension)}</span>
                        </div>
                      )}
                      {results.nhf > 0 && (
                        <div className="flex justify-between items-center py-1 px-2">
                          <span className="text-slate-500 flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></div>
                            NHF (2.5%)
                          </span>
                          <span className="font-semibold text-slate-700">-{formatCurrency(results.nhf)}</span>
                        </div>
                      )}
                      {results.rentRelief > 0 && (
                        <div className="flex justify-between items-center py-1 px-2">
                          <span className="text-slate-500 flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5"></div>
                            Rent Relief (20%)
                          </span>
                          <span className="font-semibold text-slate-700">-{formatCurrency(results.rentRelief)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center py-1.5 px-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-slate-700 font-medium">Taxable Income</span>
                        <span className="font-bold text-slate-900">{formatCurrency(results.taxableIncome)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <button
                      onClick={handleSave}
                      disabled={isSavingCalculation}
                      className="flex items-center justify-center py-3 text-sm font-medium text-white transition-colors bg-green-600 rounded-xl hover:bg-green-700"
                    >
                      {isSavingCalculation ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Save Analysis
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center justify-center py-3 text-sm font-medium transition-colors bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Your Results</h3>
                <p className="text-slate-500 text-sm">Enter your salary and click calculate to see your tax breakdown</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
