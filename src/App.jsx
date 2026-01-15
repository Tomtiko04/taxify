import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Landing from './pages/Landing'
import Signup from './pages/Signup'
import Login from './pages/Login'
import PersonalCalculator from './pages/PersonalCalculator'
import BusinessCalculator from './pages/BusinessCalculator'
import FAQ from './pages/FAQ'
import VerifyEmail from './pages/VerifyEmail'
import Navbar from './components/Navbar'
import ChatbotSignup from './components/ChatbotSignup'
import toast from 'react-hot-toast'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      
      // Handle OAuth callback - ensure profile exists
      if (session?.user) {
        ensureUserProfile(session.user)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      
      // When user signs in (especially via OAuth), ensure profile exists
      if (session?.user && _event === 'SIGNED_IN') {
        await ensureUserProfile(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Helper function to ensure user profile exists
  const ensureUserProfile = async (user) => {
    try {
      // Wait a moment for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // If profile doesn't exist, create it
      if (!existingProfile || checkError?.code === 'PGRST116') {
        const profileData = {
          id: user.id,
          email: user.email || '',
          user_type: user.user_metadata?.user_type || 'individual',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          monthly_salary: user.user_metadata?.monthly_salary && user.user_metadata.monthly_salary !== ''
            ? parseFloat(user.user_metadata.monthly_salary) 
            : null,
          company_name: user.user_metadata?.company_name || null,
          business_type: user.user_metadata?.business_type || null,
          annual_turnover: user.user_metadata?.annual_turnover && user.user_metadata.annual_turnover !== ''
            ? parseFloat(user.user_metadata.annual_turnover) 
            : null,
          annual_income: user.user_metadata?.annual_income && user.user_metadata.annual_income !== ''
            ? parseFloat(user.user_metadata.annual_income) 
            : null
        }

        const { error: insertError } = await supabase
          .from('user_profiles')
          .upsert(profileData, {
            onConflict: 'id'
          })
        
        if (insertError) {
          console.error('Error creating/updating user profile:', insertError)
        }
      } else if (existingProfile) {
        // Update email if it changed (for OAuth users)
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ email: user.email })
          .eq('id', user.id)
        
        if (updateError) {
          console.error('Error updating user profile email:', updateError)
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error)
      // Don't throw - this is a non-critical operation
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar session={session} />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/personal-calculator" element={<PersonalCalculator />} />
          <Route path="/business-calculator" element={<BusinessCalculator />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/aiSignup" element={<ChatbotSignup />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
