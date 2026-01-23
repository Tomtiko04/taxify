import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase, clearAuthStorage } from "../lib/supabase";
import toast from "react-hot-toast";

export default function Login({ session }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const from = queryParams.get('return') || location.state?.from || "/dashboard";

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user?.email_confirmed_at) {
      navigate(from, { replace: true });
    }
  }, [session, navigate, from]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user && !data.user.email_confirmed_at) {
        toast.error("Please verify your email.");
        clearAuthStorage();
        await supabase.auth.signOut();
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 bg-white">
        <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="inline-flex items-center mb-8 space-x-2">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656-.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900">TaxBuddy</span>
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-slate-500 mb-6">
            Don't have an account? <Link to="/signup" className="text-green-600 font-medium">Sign up</Link>
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500/20 outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <Link to="/forgot-password" strokeLinecap="round" className="text-xs text-green-600">Forgot?</Link>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500/20 outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-2 bg-white text-slate-400">or</span></div>
          </div>

          <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Google</span>
          </button>
        </motion.div>
      </div>

      <div className="hidden lg:flex lg:w-[55%] bg-green-600 items-center justify-center text-white p-12">
        <div className="max-w-md text-center">
          <h2 className="text-3xl font-bold mb-4">Trusted Tax Solutions</h2>
          <p className="text-green-50 mb-8 text-lg">Calculate your taxes accurately with the most up-to-date Nigeria Tax Act compliance.</p>
          <div className="grid grid-cols-3 gap-8">
            <div><div className="text-2xl font-bold">10K+</div><div className="text-xs text-green-200 uppercase">Users</div></div>
            <div><div className="text-2xl font-bold">98%</div><div className="text-xs text-green-200 uppercase">Accuracy</div></div>
            <div><div className="text-2xl font-bold">24/7</div><div className="text-xs text-green-200 uppercase">Support</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
