/**
 * Utility functions for saving and restoring calculation data
 */

const STORAGE_KEYS = {
  PERSONAL_CALC: 'taxbuddy_personal_calc',
  BUSINESS_CALC: 'taxbuddy_business_calc',
  RETURN_URL: 'taxbuddy_return_url'
}

/**
 * Save personal tax calculation data
 */
export function savePersonalCalculationData(data) {
  try {
    localStorage.setItem(STORAGE_KEYS.PERSONAL_CALC, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Error saving calculation data:', error)
    return false
  }
}

/**
 * Get and clear personal tax calculation data
 */
export function getPersonalCalculationData() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PERSONAL_CALC)
    if (data) {
      localStorage.removeItem(STORAGE_KEYS.PERSONAL_CALC)
      return JSON.parse(data)
    }
    return null
  } catch (error) {
    console.error('Error retrieving calculation data:', error)
    return null
  }
}

/**
 * Save business tax calculation data
 */
export function saveBusinessCalculationData(data) {
  try {
    localStorage.setItem(STORAGE_KEYS.BUSINESS_CALC, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Error saving calculation data:', error)
    return false
  }
}

/**
 * Get and clear business tax calculation data
 */
export function getBusinessCalculationData() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BUSINESS_CALC)
    if (data) {
      localStorage.removeItem(STORAGE_KEYS.BUSINESS_CALC)
      return JSON.parse(data)
    }
    return null
  } catch (error) {
    console.error('Error retrieving calculation data:', error)
    return null
  }
}

/**
 * Save return URL after signup
 */
export function saveReturnUrl(url) {
  try {
    localStorage.setItem(STORAGE_KEYS.RETURN_URL, url)
    return true
  } catch (error) {
    console.error('Error saving return URL:', error)
    return false
  }
}

/**
 * Get and clear return URL
 */
export function getReturnUrl() {
  try {
    const url = localStorage.getItem(STORAGE_KEYS.RETURN_URL)
    if (url) {
      localStorage.removeItem(STORAGE_KEYS.RETURN_URL)
      return url
    }
    return null
  } catch (error) {
    console.error('Error retrieving return URL:', error)
    return null
  }
}

/**
 * Clear all stored calculation data
 */
export function clearAllCalculationData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.PERSONAL_CALC)
    localStorage.removeItem(STORAGE_KEYS.BUSINESS_CALC)
    localStorage.removeItem(STORAGE_KEYS.RETURN_URL)
    return true
  } catch (error) {
    console.error('Error clearing calculation data:', error)
    return false
  }
}
