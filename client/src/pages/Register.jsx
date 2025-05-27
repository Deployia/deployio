import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { registerUser, reset } from "../redux/slices/authSlice";
import Spinner from "../components/Spinner";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { username, email, password, confirmPassword } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error, user } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (error && error.signup) {
      toast.error(error.signup);
    }
    // If registration returns otpSent, redirect to verify-otp
    if (user && user.email && !isAuthenticated) {
      toast.success("OTP sent to your email. Please verify.");
      navigate("/auth/verify-otp", { state: { email: user.email } });
    }
    if (isAuthenticated) {
      navigate("/profile");
    }
    dispatch(reset());
  }, [isAuthenticated, error, navigate, dispatch, user]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
    } else {
      const userData = {
        username,
        email,
        password,
      };

      dispatch(registerUser(userData));
    }
  };
  if (loading && loading.signup) {
    return <Spinner />;
  }
  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-slate-50 via-purple-50 to-violet-100 flex items-center justify-center py-10 px-2 sm:px-6 lg:px-8">
      <div className="max-w-xl min-w-[320px] sm:min-w-[380px] md:min-w-[420px] w-full">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-purple-100">
          {/* Header - Compact */}
          <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-4 text-center">
            <div className="mx-auto h-12 w-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
              <span className="text-white text-lg font-bold">F!</span>
            </div>
            <h2 className="text-xl font-bold text-white">Join Fauxigent</h2>
            <p className="text-purple-100 text-xs mt-1">
              Create your account to get started
            </p>
          </div>

          {/* Form Content - Compact */}
          <div className="px-6 sm:px-10 py-10 overflow-x-hidden">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={username}
                  onChange={onChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                  placeholder="Choose a username"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                  placeholder="Create a password"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                  placeholder="Confirm your password"
                  required
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading.signup}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading.signup ? <Spinner size={20} /> : "Create Account"}
                </button>
              </div>{" "}
              {/* OAuth Buttons - Compact */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-slate-500">
                    or continue with
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <a
                  href="http://localhost:5000/api/v1/auth/google"
                  className="flex items-center justify-center py-2.5 px-3 border border-slate-200 rounded-lg shadow-sm bg-white text-slate-700 hover:bg-slate-50 transition-all duration-200 hover:shadow-md"
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
                  className="flex items-center justify-center py-2.5 px-3 border border-slate-200 rounded-lg shadow-sm bg-white text-slate-700 hover:bg-slate-50 transition-all duration-200 hover:shadow-md"
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
                  className="flex items-center justify-center py-2.5 px-3 border border-slate-200 rounded-lg shadow-sm bg-white text-slate-700 hover:bg-slate-50 transition-all duration-200 hover:shadow-md"
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
                <span className="text-xs text-slate-600">
                  Already have an account?{" "}
                  <Link
                    to="/auth/login"
                    className="font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Sign in here
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

export default Register;
