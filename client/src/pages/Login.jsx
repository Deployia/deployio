import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { loginUser, reset, reset2FA } from "../redux/slices/authSlice";
import Spinner from "../components/Spinner";
import OTPVerification from "../components/OTPVerification";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const oauth2fa = searchParams.get("oauth2fa");
  const oauth2faUserId = searchParams.get("userId");

  const { email, password } = formData;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    isAuthenticated,
    loading,
    error,
    requires2FA,
    pending2FAUserId,
    needsVerification,
    pendingVerificationEmail,
  } = useSelector((state) => state.auth);

  // Determine if 2FA verification is needed (OAuth or normal login)
  const twoFAUserId =
    oauth2fa === "true"
      ? oauth2faUserId
      : requires2FA
      ? pending2FAUserId
      : null;

  useEffect(() => {
    if (error && error.login) {
      toast.error(error.login);
    }

    if (isAuthenticated) {
      navigate("/profile");
    }

    // Redirect to OTP verification if needed
    if (needsVerification && pendingVerificationEmail) {
      navigate("/auth/verify-otp", {
        state: { email: pendingVerificationEmail },
      });
    }

    // Only reset errors, not the 2FA or verification flags
    if (error) {
      dispatch(reset());
    }
  }, [
    isAuthenticated,
    needsVerification,
    pendingVerificationEmail,
    error,
    navigate,
    dispatch,
  ]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };
  const onSubmit = async (e) => {
    e.preventDefault();

    const userData = {
      email,
      password,
    };
    try {
      await dispatch(loginUser(userData)).unwrap();
      // No need to handle 2FA here, the Redux state will be updated automatically
    } catch {
      // Error is handled by the auth slice
    }
  };

  // If any 2FA flow is required, render OTP form
  if (twoFAUserId) {
    return (
      <div className="min-h-[90vh] bg-black flex items-center justify-center py-10 px-2 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-700 p-8">
            <OTPVerification
              mode="login"
              userId={twoFAUserId}
              onSuccess={() => {
                // Clear 2FA state and params, then redirect to profile
                setSearchParams({});
                dispatch(reset2FA());
                toast.success("Login successful!");
                navigate("/profile");
              }}
              onCancel={() => {
                setSearchParams({});
                dispatch(reset2FA());
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] bg-black flex items-center justify-center py-10 px-2 sm:px-6 lg:px-8">
      <div className="max-w-xl min-w-[320px] sm:min-w-[380px] md:min-w-[420px] w-full">
        <div className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-700">
          {/* Header - Compact */}
          <div className="px-6 py-4 text-center border-b border-neutral-800">
            <div className="mx-auto h-12 w-12 bg-neutral-800 rounded-full flex items-center justify-center mb-3 border border-neutral-700">
              <span className="text-white text-lg font-bold">F!</span>
            </div>
            <h2 className="text-xl font-bold text-white">Welcome back</h2>
            <p className="text-neutral-400 text-xs mt-1">
              Sign in to your Fauxigent account
            </p>
          </div>

          {/* Form Content - Compact */}
          <div className="px-6 sm:px-10 py-10 overflow-x-hidden">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-neutral-300 mb-1"
                >
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  className="w-full px-3 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 bg-black text-white placeholder-neutral-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-neutral-300 mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  className="w-full px-3 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 bg-black text-white placeholder-neutral-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div className="flex items-center justify-end">
                <Link
                  to="/auth/forgot-password"
                  className="text-xs text-neutral-400 hover:underline font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading.login || !email || !password}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-neutral-700 text-sm font-semibold rounded-lg text-white bg-neutral-800 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading.login ? <Spinner size={20} /> : "Sign in"}
                </button>
                {(!email || !password) && (
                  <p className="mt-1 text-xs text-red-600" role="alert">
                    Email and password are required
                  </p>
                )}
              </div>
              {/* OAuth Buttons - Compact */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-black text-neutral-500">
                    or continue with
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <a
                  href="http://localhost:5000/api/v1/auth/google"
                  className="flex items-center justify-center py-2.5 px-3 border border-neutral-700 rounded-lg bg-black text-white hover:bg-neutral-800 transition-all duration-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <g>
                      <path
                        fill="#4285F4"
                        d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.64 2.36 30.18 0 24 0 14.82 0 6.71 5.48 2.69 13.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"
                      />
                      <path
                        fill="#34A853"
                        d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.59C43.99 37.13 46.1 31.36 46.1 24.55z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.67 28.65c-1.13-3.36-1.13-6.99 0-10.35l-7.98-6.2C.64 16.09 0 19.95 0 24c0 4.05.64 7.91 2.69 11.9l7.98-6.2z"
                      />
                      <path
                        fill="#EA4335"
                        d="M24 48c6.18 0 11.64-2.03 15.54-5.53l-7.19-5.59c-2.01 1.35-4.6 2.13-8.35 2.13-6.38 0-11.87-3.63-14.33-8.94l-7.98 6.2C6.71 42.52 14.82 48 24 48z"
                      />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </g>
                  </svg>
                </a>
                <a
                  href="http://localhost:5000/api/v1/auth/github"
                  className="flex items-center justify-center py-2.5 px-3 border border-neutral-700 rounded-lg bg-black text-white hover:bg-neutral-800 transition-all duration-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#181717"
                      d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.415-4.042-1.415-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.233 1.911 1.233 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12.297c0-6.627-5.373-12-12-12"
                    />
                  </svg>
                </a>
                <a
                  href="http://localhost:5000/api/v1/auth/facebook"
                  className="flex items-center justify-center py-2.5 px-3 border border-neutral-700 rounded-lg bg-black text-white hover:bg-neutral-800 transition-all duration-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#1877F3"
                      d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0"
                    />
                  </svg>
                </a>
              </div>
              <div className="text-center pt-3">
                <span className="text-xs text-neutral-500">
                  Don't have an account?{" "}
                  <Link
                    to="/auth/register"
                    className="font-semibold text-white hover:underline"
                  >
                    Create one here
                  </Link>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
