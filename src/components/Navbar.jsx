import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Navbar({ session }) {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">₦</span>
              </div>
              <span className="text-xl font-bold text-slate-900">Taxify</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/personal-calculator" className="text-slate-700 hover:text-green-600 transition-colors">
              Personal Tax
            </Link>
            <Link to="/business-calculator" className="text-slate-700 hover:text-green-600 transition-colors">
              Business Tax
            </Link>
            <Link to="/faq" className="text-slate-700 hover:text-green-600 transition-colors">
              FAQ
            </Link>
            
            {session ? (
              <button
                onClick={handleSignOut}
                className="btn-secondary text-sm"
              >
                Sign Out
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-slate-700 hover:text-green-600 transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary text-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-slate-700 hover:text-green-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
