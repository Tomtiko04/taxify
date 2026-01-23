import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase, clearAuthStorage } from "./lib/supabase";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PersonalCalculator from "./pages/PersonalCalculator";
import BusinessCalculator from "./pages/BusinessCalculator";
import FAQ from "./pages/FAQ";
import VerifyEmail from "./pages/VerifyEmail";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Navbar from "./components/Navbar";
import ChatbotSignup from "./components/ChatbotSignup";
import ScrollToTop from "./components/ScrollToTop";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Overview from "./pages/dashboard/Overview";
import PersonalTax from "./pages/dashboard/PersonalTax";
import BusinessTax from "./pages/dashboard/BusinessTax";
import History from "./pages/dashboard/History";
import Profile from "./pages/dashboard/Profile";

function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // Safety timeout: if loading takes > 5 seconds, just show the app
    const loadingTimeout = setTimeout(() => {
      if (isMounted.current && loading) {
        console.warn("Auth check timeout - forcing app to load");
        setLoading(false);
      }
    }, 5000);

    const initAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (!isMounted.current) return;

        if (error) {
          console.error("Session error:", error);
          clearAuthStorage();
        }

        if (currentSession) {
          setSession(currentSession);
          // Set userProfile as soon as we have session metadata as a fallback
          const tempProfile = {
            id: currentSession.user.id,
            email: currentSession.user.email,
            full_name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split("@")[0] || "User",
            user_type: currentSession.user.user_metadata?.user_type || "individual"
          };
          setUserProfile(tempProfile);

          // Then fetch/create the real profile from DB
          const profile = await ensureUserProfile(currentSession.user);
          if (isMounted.current && profile) {
            setUserProfile(profile);
          }
        }
      } catch (error) {
        console.error("Critical auth error:", error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted.current) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUserProfile(null);
        clearAuthStorage();
      } else if (newSession) {
        setSession(newSession);
        // Always try to get/create profile if session is present
        const profile = await ensureUserProfile(newSession.user);
        if (isMounted.current && profile) {
          setUserProfile(profile);
        }
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  // Helper function to ensure user profile exists
  const ensureUserProfile = async (user) => {
    try {
      if (!isMounted.current) return null;

      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!isMounted.current) return null;

      if (!existingProfile) {
        const profileData = {
          id: user.id,
          email: user.email || "",
          user_type: user.user_metadata?.user_type || "individual",
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        };

        const { data: newProfile, error: upsertError } = await supabase
          .from("user_profiles")
          .upsert(profileData)
          .select()
          .single();

        if (upsertError) {
          console.error("Profile upsert error:", upsertError);
          // Return the profileData as a fallback if upsert fails
          return { ...profileData };
        }

        return newProfile;
      }
      return existingProfile;
    } catch (error) {
      console.error("Profile error:", error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading TaxBuddy...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-slate-50">
            <Navbar session={session} userProfile={userProfile} />
            <Landing session={session} userProfile={userProfile} />
            <ScrollToTop />
          </div>
        } />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login session={session} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/faq" element={<><Navbar session={session} userProfile={userProfile} /><FAQ /><ScrollToTop /></>} />
        <Route path="/privacy" element={<><Navbar session={session} userProfile={userProfile} /><Privacy /><ScrollToTop /></>} />
        <Route path="/terms" element={<><Navbar session={session} userProfile={userProfile} /><Terms /><ScrollToTop /></>} />
        <Route
          path="/personal-calculator"
          element={
            <div className="min-h-screen bg-slate-50">
              <Navbar session={session} userProfile={userProfile} />
              <PersonalCalculator session={session} />
              <ScrollToTop />
            </div>
          }
        />
        <Route
          path="/business-calculator"
          element={
            <div className="min-h-screen bg-slate-50">
              <Navbar session={session} userProfile={userProfile} />
              <BusinessCalculator session={session} />
              <ScrollToTop />
            </div>
          }
        />

        <Route path="/dashboard" element={
          <ProtectedRoute session={session}>
            <DashboardLayout userProfile={userProfile}>
              <Overview userProfile={userProfile} />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/personal" element={
          <ProtectedRoute session={session}>
            <DashboardLayout userProfile={userProfile}>
              <PersonalTax userProfile={userProfile} session={session} />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/business" element={
          <ProtectedRoute session={session}>
            <DashboardLayout userProfile={userProfile}>
              <BusinessTax userProfile={userProfile} session={session} />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/history" element={
          <ProtectedRoute session={session}>
            <DashboardLayout userProfile={userProfile}>
              <History userProfile={userProfile} />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/profile" element={
          <ProtectedRoute session={session}>
            <DashboardLayout userProfile={userProfile}>
              <Profile userProfile={userProfile} onProfileUpdate={(p) => setUserProfile(p)} />
            </DashboardLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
