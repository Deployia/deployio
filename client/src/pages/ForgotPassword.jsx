import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { forgotPassword, reset } from "../redux/slices/authSlice";
import Spinner from "../components/Spinner"; // Import the Spinner component

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error && error.forgotPassword) {
      toast.error(error.forgotPassword);
    }

    if (success && success.forgotPassword) {
      toast.success("Password reset instructions have been sent to your email");
      setEmail("");
    }

    dispatch(reset());
  }, [error, success, dispatch]);

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(forgotPassword(email));
  };
  return (
    <div className="min-h-[90vh] bg-black flex items-center justify-center py-10 px-2 sm:px-6 lg:px-8">
      <div className="max-w-xl min-w-[320px] sm:min-w-[380px] md:min-w-[420px] w-full">
        <div className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-700">
          {/* Header */}
          <div className="px-6 py-4 text-center border-b border-neutral-800">
            <div className="mx-auto h-12 w-12 bg-neutral-800 rounded-full flex items-center justify-center mb-3 border border-neutral-700">
              <img src="/favicon.png" alt="Logo" className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Forgot Password</h2>
            <p className="text-neutral-400 text-xs mt-1">
              Enter your email to reset your password
            </p>
          </div>

          {/* Form Content */}
          <div className="px-6 sm:px-10 py-10 overflow-x-hidden">
            {success.forgotPassword ? (
              <div className="text-center space-y-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-neutral-800 border border-neutral-700">
                  <svg
                    className="h-8 w-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Check your email
                  </h3>
                  <p className="mt-2 text-sm text-neutral-400">
                    We've sent password reset instructions to your email
                    address.
                  </p>
                </div>
                <Link
                  to="/auth/login"
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-neutral-800 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-all duration-200"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-white mb-2"
                  >
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all duration-200 text-white placeholder:text-neutral-400"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading.forgotPassword}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-neutral-800 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading.forgotPassword ? (
                      <Spinner size={20} />
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </div>

                <div className="text-center pt-2">
                  <span className="text-sm text-neutral-400">
                    Remember your password?{" "}
                    <Link
                      to="/auth/login"
                      className="font-semibold text-white hover:text-neutral-300 transition-colors"
                    >
                      Back to Login
                    </Link>
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
