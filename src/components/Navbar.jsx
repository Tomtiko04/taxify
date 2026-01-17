import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Navbar({ session, userProfile }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Check if on landing page hero section
  const isLandingPage = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear any cached calculation data
      localStorage.removeItem('personalCalculationData')
      localStorage.removeItem('businessCalculationData')
      
      toast.success('Signed out successfully')
      // Navigate to home and reload to clear all state
      navigate('/', { replace: true })
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out. Please try again.')
    }
  }

  const isIndividual = userProfile?.user_type === 'individual'
  const isCompany = userProfile?.user_type === 'company'

  // Dynamic styling based on scroll and page
  const navBackground = isScrolled 
    ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200' 
    : isLandingPage 
      ? 'bg-transparent' 
      : 'bg-white shadow-md border-b border-slate-200'
  
  const textColor = isScrolled || !isLandingPage ? 'text-slate-700' : 'text-white'
  const logoTextColor = isScrolled || !isLandingPage ? 'text-slate-900' : 'text-white'
  const hoverColor = 'hover:text-green-500'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBackground}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className={`w-10 h-10 ${isScrolled || !isLandingPage ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-white/20 backdrop-blur-sm border border-white/30'} rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-105`}>
                <span className={`font-bold text-xl ${isScrolled || !isLandingPage ? 'text-white' : 'text-white'}`}>₦</span>
              </div>
              <span className={`text-xl font-bold ${logoTextColor} transition-colors duration-300`}>Taxify</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {(!session || isIndividual) && (
              <Link 
                to="/personal-calculator" 
                className={`${textColor} ${hoverColor} transition-colors font-medium`}
              >
                Personal Tax
              </Link>
            )}
            {(!session || isCompany) && (
              <Link 
                to="/business-calculator" 
                className={`${textColor} ${hoverColor} transition-colors font-medium`}
              >
                Business Tax
              </Link>
            )}
            <Link 
              to="/faq" 
              className={`${textColor} ${hoverColor} transition-colors font-medium`}
            >
              FAQ
            </Link>
            
            {session ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/dashboard" 
                  className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isScrolled || !isLandingPage 
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                      : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className={`${textColor} ${hoverColor} transition-colors font-medium`}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`${textColor} ${hoverColor} p-2 rounded-lg transition-colors`}
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white rounded-2xl shadow-xl mt-2 p-4 border border-slate-100 animate-fadeIn">
            <div className="space-y-3">
              {(!session || isIndividual) && (
                <Link 
                  to="/personal-calculator" 
                  className="block px-4 py-3 text-slate-700 hover:bg-green-50 hover:text-green-600 rounded-xl transition-colors font-medium"
                >
                  Personal Tax
                </Link>
              )}
              {(!session || isCompany) && (
                <Link 
                  to="/business-calculator" 
                  className="block px-4 py-3 text-slate-700 hover:bg-green-50 hover:text-green-600 rounded-xl transition-colors font-medium"
                >
                  Business Tax
                </Link>
              )}
              <Link 
                to="/faq" 
                className="block px-4 py-3 text-slate-700 hover:bg-green-50 hover:text-green-600 rounded-xl transition-colors font-medium"
              >
                FAQ
              </Link>
              
              <hr className="border-slate-200" />
              
              {session ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="block px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center rounded-xl font-medium"
                  >
                    Go to Dashboard
                  </Link>
                  <div className="px-4 py-2 text-sm text-slate-500">
                    Signed in as <span className="font-medium text-slate-700">{userProfile?.full_name || userProfile?.company_name || 'User'}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="block px-4 py-3 text-slate-700 hover:bg-green-50 hover:text-green-600 rounded-xl transition-colors font-medium"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="block px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center rounded-xl font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
