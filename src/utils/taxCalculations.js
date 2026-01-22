/**
 * Calculate Personal Income Tax (PAYE) based on Nigeria Tax Act 2025
 * @param {number} monthlyGross - Monthly gross income
 * @param {number} annualRent - Annual rent paid
 * @param {boolean} hasPension - Whether employee contributes to pension
 * @param {boolean} hasNHF - Whether employee contributes to NHF
 * @param {number} additionalIncome - Additional annual income from other sources
 * @param {number} pensionBase - Optional: Custom base for pension calculation (e.g. BHT)
 * @param {number} nhfBase - Optional: Custom base for NHF calculation
 * @returns {object} Tax calculation breakdown
 */
export function calculatePAYE(monthlyGross, annualRent = 0, hasPension = true, hasNHF = true, additionalIncome = 0, pensionBase = null, nhfBase = null) {
  const annualSalary = monthlyGross * 12
  const annualGross = annualSalary + (additionalIncome || 0)
  
  // Deductions
  const pensionBasis = pensionBase !== null ? (pensionBase * 12) : annualGross
  const nhfBasis = nhfBase !== null ? (nhfBase * 12) : annualGross

  const pensionDeduction = hasPension ? pensionBasis * 0.08 : 0
  const nhfDeduction = hasNHF ? nhfBasis * 0.025 : 0
  
  // Rent Relief: 20% of annual rent, capped at ₦500,000
  const rentRelief = Math.min(annualRent * 0.20, 500000)
  
  // Total deductions
  const totalDeductions = pensionDeduction + nhfDeduction + rentRelief
  
  // Taxable income
  const taxableIncome = Math.max(0, annualGross - totalDeductions)
  
  // Tax calculation using progressive bands
  let tax = 0
  let remainingIncome = taxableIncome
  
  // 0 to ₦800k: 0%
  if (remainingIncome <= 800000) {
    tax = 0
  } else {
    remainingIncome -= 800000
    
    // Next ₦2.2M: 15%
    if (remainingIncome > 0) {
      const band1 = Math.min(remainingIncome, 2200000)
      tax += band1 * 0.15
      remainingIncome -= band1
    }
    
    // Next ₦9M: 18%
    if (remainingIncome > 0) {
      const band2 = Math.min(remainingIncome, 9000000)
      tax += band2 * 0.18
      remainingIncome -= band2
    }
    
    // Next ₦13M: 21%
    if (remainingIncome > 0) {
      const band3 = Math.min(remainingIncome, 13000000)
      tax += band3 * 0.21
      remainingIncome -= band3
    }
    
    // Next ₦25M: 23%
    if (remainingIncome > 0) {
      const band4 = Math.min(remainingIncome, 25000000)
      tax += band4 * 0.23
      remainingIncome -= band4
    }
    
    // Above ₦50M: 25%
    if (remainingIncome > 0) {
      tax += remainingIncome * 0.25
    }
  }
  
  const monthlyTax = tax / 12
  const netAnnual = annualGross - pensionDeduction - nhfDeduction - tax
  const netMonthly = netAnnual / 12
  
  // Build breakdown array for display
  const breakdown = []
  // Reset remainingIncome for breakdown calculation
  remainingIncome = taxableIncome
  
  if (remainingIncome > 0) {
    // 0 to ₦800k: 0%
    if (remainingIncome <= 800000) {
      breakdown.push({
        band: 'First ₦800,000',
        rate: 0,
        tax: 0,
        amount: remainingIncome
      })
    } else {
      breakdown.push({
        band: 'First ₦800,000',
        rate: 0,
        tax: 0,
        amount: 800000
      })
      remainingIncome -= 800000
      
      // Next ₦2.2M: 15%
      if (remainingIncome > 0) {
        const band1 = Math.min(remainingIncome, 2200000)
        breakdown.push({
          band: 'Next ₦2,200,000',
          rate: 15,
          tax: band1 * 0.15,
          amount: band1
        })
        remainingIncome -= band1
      }
      
      // Next ₦9M: 18%
      if (remainingIncome > 0) {
        const band2 = Math.min(remainingIncome, 9000000)
        breakdown.push({
          band: 'Next ₦9,000,000',
          rate: 18,
          tax: band2 * 0.18,
          amount: band2
        })
        remainingIncome -= band2
      }
      
      // Next ₦13M: 21%
      if (remainingIncome > 0) {
        const band3 = Math.min(remainingIncome, 13000000)
        breakdown.push({
          band: 'Next ₦13,000,000',
          rate: 21,
          tax: band3 * 0.21,
          amount: band3
        })
        remainingIncome -= band3
      }
      
      // Next ₦25M: 23%
      if (remainingIncome > 0) {
        const band4 = Math.min(remainingIncome, 25000000)
        breakdown.push({
          band: 'Next ₦25,000,000',
          rate: 23,
          tax: band4 * 0.23,
          amount: band4
        })
        remainingIncome -= band4
      }
      
      // Above ₦50M: 25%
      if (remainingIncome > 0) {
        breakdown.push({
          band: 'Above ₦50,000,000',
          rate: 25,
          tax: remainingIncome * 0.25,
          amount: remainingIncome
        })
      }
    }
  }
  
  return {
    annualGross,
    pension: pensionDeduction,
    nhf: nhfDeduction,
    rentRelief: rentRelief,
    totalDeductions: totalDeductions,
    taxableIncome,
    grossTax: tax,
    netTax: tax,
    monthlyTax: monthlyTax,
    netAnnual,
    netMonthly,
    effectiveRate: annualGross > 0 ? (tax / annualGross) * 100 : 0,
    breakdown: breakdown
  }
}

/**
 * Calculate Corporate Income Tax (CIT) based on Nigeria Tax Act 2025
 * @param {number} turnover - Annual turnover
 * @param {number} assets - Total assets value (Net Book Value of PPE)
 * @param {number} profit - Net profit before tax
 * @param {number} depreciation - Depreciation for the year
 * @param {number} fines - Fines and non-deductible penalties
 * @param {number} capitalAllowances - Capital allowances for the year
 * @returns {object} Tax calculation breakdown
 */
export function calculateCIT(turnover, assets = 0, profit = 0, depreciation = 0, fines = 0, capitalAllowances = 0) {
  // NTA 2025 Thresholds: 
  // Small Company: Turnover <= ₦100M AND Assets <= ₦250M
  // Large Company: Turnover > ₦100M OR Assets > ₦250M
  const isSmallCompany = turnover <= 100000000 && assets <= 250000000
  
  // Assessable Profit = (Net Profit + Depreciation + Fines) - Capital Allowances
  const assessableProfit = Math.max(0, (profit + depreciation + fines) - capitalAllowances)
  
  let cit = 0
  let developmentLevy = 0
  
  if (isSmallCompany) {
    cit = 0
    developmentLevy = 0
  } else {
    // Large Company: 30% CIT + 4% Development Levy on Assessable Profit
    cit = assessableProfit * 0.30
    developmentLevy = assessableProfit * 0.04
  }
  
  return {
    turnover,
    assets,
    profit,
    depreciation,
    fines,
    capitalAllowances,
    assessableProfit,
    isSmallBusiness: isSmallCompany,
    citRate: isSmallCompany ? 0 : 30,
    developmentLevyRate: isSmallCompany ? 0 : 4,
    cit,
    developmentLevy,
    totalTax: cit + developmentLevy,
    note: isSmallCompany 
      ? "Small businesses (Turnover <= ₦100M AND Assets <= ₦250M) are exempt from CIT, Development Levy, and VAT (registration optional)."
      : "Large businesses (Turnover > ₦100M OR Assets > ₦250M) pay 30% CIT and 4% Development Levy on assessable profit. VAT registration is mandatory."
  }
}

/**
 * Format currency in Nigerian Naira
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format number with commas (for input display)
 * @param {string|number} value - The value to format
 * @returns {string} Formatted number with commas
 */
export function formatNumberWithCommas(value) {
  if (!value && value !== 0) return ''
  // Remove all non-digit characters
  const numericValue = String(value).replace(/\D/g, '')
  if (!numericValue) return ''
  // Add commas
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Parse formatted number (remove commas) for calculations
 * @param {string} value - The formatted value
 * @returns {number} Parsed number
 */
export function parseFormattedNumber(value) {
  if (!value) return 0
  // Remove all non-digit characters and parse
  const numericString = String(value).replace(/\D/g, '')
  return numericString ? parseFloat(numericString) : 0
}
