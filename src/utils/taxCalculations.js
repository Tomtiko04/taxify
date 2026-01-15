/**
 * Calculate Personal Income Tax (PAYE) based on Nigeria Tax Act 2025
 * @param {number} monthlyGross - Monthly gross income
 * @param {number} annualRent - Annual rent paid
 * @param {boolean} hasPension - Whether employee contributes to pension
 * @param {boolean} hasNHF - Whether employee contributes to NHF
 * @returns {object} Tax calculation breakdown
 */
export function calculatePAYE(monthlyGross, annualRent = 0, hasPension = true, hasNHF = true) {
  const annualGross = monthlyGross * 12
  
  // Deductions
  const pensionDeduction = hasPension ? annualGross * 0.08 : 0
  const nhfDeduction = hasNHF ? annualGross * 0.025 : 0
  
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
  const netAnnual = annualGross - totalDeductions - tax
  const netMonthly = netAnnual / 12
  
  return {
    annualGross,
    deductions: {
      pension: pensionDeduction,
      nhf: nhfDeduction,
      rentRelief: rentRelief,
      total: totalDeductions
    },
    taxableIncome,
    annualTax: tax,
    monthlyTax: monthlyTax,
    netAnnual,
    netMonthly,
    effectiveRate: annualGross > 0 ? (tax / annualGross) * 100 : 0
  }
}

/**
 * Calculate Corporate Income Tax (CIT) based on Nigeria Tax Act 2025
 * @param {number} turnover - Annual turnover
 * @param {number} assets - Total assets value
 * @returns {object} Tax calculation breakdown
 */
export function calculateCIT(turnover, assets = 0) {
  const isSmallBusiness = turnover < 50000000
  
  let cit = 0
  let developmentLevy = 0
  
  if (isSmallBusiness) {
    cit = 0
    developmentLevy = 0
  } else {
    // For large businesses, we need profit. Using a simplified calculation
    // In reality, CIT is calculated on profit, not turnover
    // This is a simplified version assuming a profit margin
    // Note: Actual CIT calculation requires profit, not turnover
    cit = 0 // Will be calculated based on profit
    developmentLevy = turnover * 0.04
  }
  
  return {
    turnover,
    assets,
    isSmallBusiness,
    citRate: isSmallBusiness ? 0 : 30,
    developmentLevyRate: isSmallBusiness ? 0 : 4,
    cit,
    developmentLevy,
    totalTax: cit + developmentLevy,
    note: isSmallBusiness 
      ? "Small businesses (turnover < ₦50M) are exempt from CIT and Development Levy"
      : "CIT is calculated on profit (not turnover). Development Levy is 4% of turnover."
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
