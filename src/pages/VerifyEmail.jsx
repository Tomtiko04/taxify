import { useEffect, useState, useRef } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getReturnUrl } from "../utils/storage";
import toast from "react-hot-toast";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const isMounted = useRef(true);

  // Get redirect path from location state or localStorage
  const from = location.state?.from || getReturnUrl() || "/dashboard";

  useEffect(() => {
    isMounted.current = true;

    const checkVerification = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        // Ignore AbortError
        if (error?.name === "AbortError") return;

        if (!isMounted.current) return;

        if (session?.user) {
          // Check if email is verified
          if (session.user.email_confirmed_at) {
            setVerified(true);
            toast.success("Email verified successfully!");

            // Redirect to the original destination or dashboard
            setTimeout(() => {
              if (isMounted.current) {
                navigate(from, { replace: true });
              }
            }, 2000);
          } else {
            // Check for verification token in URL
            const token = searchParams.get("token");
            const type = searchParams.get("type");

            if (token && type === "signup") {
              // User clicked verification link
              toast.success("Email verified! Redirecting...");
              setVerified(true);

              // Check if user was trying to save a calculation
              const returnUrl = getReturnUrl();
              const redirectPath = returnUrl || "/dashboard";

              setTimeout(() => {
                if (isMounted.current) {
                  navigate(redirectPath);
                }
              }, 2000);
            } else {
              setVerified(false);
            }
          }
        } else {
          setVerified(false);
        }
      } catch (error) {
        // Ignore AbortError - it's expected when navigating away
        if (error?.name === "AbortError") return;
        console.error("Verification check error:", error);
        // Don't show error toast for AbortError or if unmounted
        if (isMounted.current) {
          toast.error("Error checking verification status");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    // Small delay to let any pending navigation complete
    const timeoutId = setTimeout(() => {
      checkVerification();
    }, 100);

    // Listen for auth changes
    let subscription = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted.current) return;
        if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
          setVerified(true);
          toast.success("Email verified successfully!");

          // Check if user was trying to save a calculation
          const returnUrl = getReturnUrl();
          const redirectPath = returnUrl || "/dashboard";

          setTimeout(() => {
            if (isMounted.current) {
              navigate(redirectPath);
            }
          }, 2000);
        }
      });
      subscription = data?.subscription;
    } catch (error) {
      console.error("Auth listener error:", error);
    }

    return () => {
      isMounted.current = false;
      clearTimeout(timeoutId);
      if (subscription) subscription.unsubscribe();
    };
  }, [searchParams, navigate]);

  const handleResendEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: searchParams.get("email") || "",
      });

      if (error) throw error;

      toast.success("Verification email sent! Check your inbox.");
    } catch (error) {
      toast.error(error.message || "Failed to resend verification email");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20 bg-gradient-to-br from-green-50 to-slate-100">
        <div className="w-12 h-12 border-b-2 border-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 pt-24 pb-12 bg-gradient-to-br from-green-50 to-slate-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656-.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-slate-900">TaxBuddy</span>
          </Link>
        </div>

        <div className="text-center card">
          {verified ? (
            <>
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                Email Verified!
              </h2>
              <p className="mb-6 text-slate-600">
                Your email has been successfully verified. You can now use all
                features of TaxBuddy.
              </p>
              <Link to="/" className="inline-block btn-primary">
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                Verify Your Email
              </h2>
              <p className="mb-6 text-slate-600">
                We've sent a verification email to your inbox. Please click the
                link in the email to verify your account.
              </p>
              <div className="space-y-4">
                <button
                  onClick={handleResendEmail}
                  className="w-full btn-secondary"
                >
                  Resend Verification Email
                </button>
                <Link
                  to="/login"
                  className="block text-sm font-medium text-green-600 hover:text-green-500"
                >
                  Already verified? Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
