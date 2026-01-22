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

    // Safety timeout: if loading takes > 3 seconds, just show the app
    const loadingTimeout = setTimeout(() => {
      if (isMounted.current) {
        console.warn("Loading timeout reached - forcing loading to false");
        setLoading(false);
      }
    }, 3000);

    // Check active session with a timeout/error catch to prevent stuck loading
    const fetchSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        // Ignore AbortError
        if (error?.name === "AbortError") return;
        if (!isMounted.current) return;

        if (error) {
          console.error("Supabase session error:", error);
          clearAuthStorage();
          setSession(null);
          setLoading(false);
          return;
        }
        
        // If we have a session, verify it's actually valid
        if (session) {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (!isMounted.current) return;
          
          if (userError || !user) {
            console.warn("Session exists but user verification failed");
            clearAuthStorage();
            setSession(null);
            setLoading(false);
            return;
          }
          
          // Session is valid
          setSession(session);
          const profile = await ensureUserProfile(session.user);
          if (isMounted.current) {
            setUserProfile(profile);
          }
        } else {
          setSession(null);
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
        console.error("Critical error fetching session:", error);
        clearAuthStorage();
        setSession(null);
      } finally {
        if (isMounted.current) {
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      }
    };

    fetchSession();

    // Listen for auth changes
    let subscription = null;
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          // Handle sign out
          if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
            if (isMounted.current) {
              setSession(null);
              setUserProfile(null);
            }
            return;
          }
          
          setSession(session);

          // When user signs in (especially via OAuth), ensure profile exists
          if (session?.user && event === "SIGNED_IN") {
            const profile = await ensureUserProfile(session.user);
            if (isMounted.current) {
              setUserProfile(profile);
            }
          }
        }
      );
      subscription = data.subscription;
    } catch (error) {
      console.error("Error setting up auth listener:", error);
    }

    return () => {
      isMounted.current = false;
      if (subscription) subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  // Helper function to ensure user profile exists
  const ensureUserProfile = async (user) => {
    try {
      // Wait a moment for trigger to complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (!isMounted.current) return null;

      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (checkError?.name === "AbortError") return null;
      if (!isMounted.current) return null;

      // If profile doesn't exist, create it
      if (!existingProfile || checkError?.code === "PGRST116") {
        const profileData = {
          id: user.id,
          email: user.email || "",
          user_type: user.user_metadata?.user_type || "individual",
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User",
          monthly_salary:
            user.user_metadata?.monthly_salary &&
            user.user_metadata.monthly_salary !== ""
              ? parseFloat(user.user_metadata.monthly_salary)
              : null,
          company_name: user.user_metadata?.company_name || null,
          business_type: user.user_metadata?.business_type || null,
          annual_turnover:
            user.user_metadata?.annual_turnover &&
            user.user_metadata.annual_turnover !== ""
              ? parseFloat(user.user_metadata.annual_turnover)
              : null,
          annual_income:
            user.user_metadata?.annual_income &&
            user.user_metadata.annual_income !== ""
              ? parseFloat(user.user_metadata.annual_income)
              : null,
        };

        if (!isMounted.current) return profileData;

        const { data: newProfile, error: insertError } = await supabase
          .from("user_profiles")
          .upsert(profileData, {
            onConflict: "id",
          })
          .select()
          .single();

        if (insertError?.name === "AbortError") return profileData;
        if (insertError) {
          console.error("Error creating/updating user profile:", insertError);
          return profileData; // Fallback to what we tried to insert
        }
        return newProfile;
      } else if (existingProfile) {
        if (!isMounted.current) return existingProfile;

        // Update email if it changed (for OAuth users)
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ email: user.email })
          .eq("id", user.id);

        if (updateError && updateError.name !== "AbortError") {
          console.error("Error updating user profile email:", updateError);
        }
        return { ...existingProfile, email: user.email };
      }
      return existingProfile;
    } catch (error) {
      // Ignore AbortError - it's expected when navigating away
      if (error?.name === "AbortError") return null;
      console.error("Error ensuring user profile:", error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-b-2 border-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle profile updates from Profile page
  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile);
  };

  return (
    <Router>
      <Routes>
        {/* Public pages with Navbar */}
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-slate-50">
              <Navbar session={session} userProfile={userProfile} />
              <Landing session={session} userProfile={userProfile} />
              <ScrollToTop />
            </div>
          }
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/verify-email"
          element={
            <div className="min-h-screen bg-slate-50">
              {/* <Navbar session={session} userProfile={userProfile} /> */}
              <VerifyEmail />
              <ScrollToTop />
            </div>
          }
        />
        <Route
          path="/faq"
          element={
            <div className="min-h-screen bg-slate-50">
              <Navbar session={session} userProfile={userProfile} />
              <FAQ />
              <ScrollToTop />
            </div>
          }
        />
        <Route
          path="/privacy"
          element={
            <div className="min-h-screen bg-slate-50">
              <Navbar session={session} userProfile={userProfile} />
              <Privacy />
              <ScrollToTop />
            </div>
          }
        />
        <Route
          path="/terms"
          element={
            <div className="min-h-screen bg-slate-50">
              <Navbar session={session} userProfile={userProfile} />
              <Terms />
              <ScrollToTop />
            </div>
          }
        />
        <Route
          path="/aiSignup"
          element={
            <div className="min-h-screen bg-slate-50">
              <Navbar session={session} userProfile={userProfile} />
              <ChatbotSignup />
              <ScrollToTop />
            </div>
          }
        />

        {/* Guest calculators (no login required) */}
        <Route
          path="/personal-calculator"
          element={
            <div className="min-h-screen bg-slate-50">
              <Navbar session={session} userProfile={userProfile} />
              <PersonalCalculator />
              <ScrollToTop />
            </div>
          }
        />
        <Route
          path="/business-calculator"
          element={
            <div className="min-h-screen bg-slate-50">
              <Navbar session={session} userProfile={userProfile} />
              <BusinessCalculator />
              <ScrollToTop />
            </div>
          }
        />

        {/* Dashboard routes (protected) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout userProfile={userProfile}>
                <Overview userProfile={userProfile} />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/personal"
          element={
            <ProtectedRoute>
              <DashboardLayout userProfile={userProfile}>
                <PersonalTax userProfile={userProfile} />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/business"
          element={
            <ProtectedRoute>
              <DashboardLayout userProfile={userProfile}>
                <BusinessTax userProfile={userProfile} />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/history"
          element={
            <ProtectedRoute>
              <DashboardLayout userProfile={userProfile}>
                <History userProfile={userProfile} />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout userProfile={userProfile}>
                <Profile
                  userProfile={userProfile}
                  onProfileUpdate={handleProfileUpdate}
                />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
