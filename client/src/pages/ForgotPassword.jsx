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
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">D!</span>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          Reset Password
        </h2>
        <p className="text-center text-purple-200 text-sm mb-8">
          We'll send you a link to reset your password
        </p>

        {/* Form Content */}
        <div className="px-6 sm:px-10 py-10 overflow-x-hidden">
          {success.forgotPassword ? (
            <div className="text-center space-y-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100">
                <svg
                  className="h-8 w-8 text-purple-600"
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
                <h3 className="text-lg font-semibold text-slate-900">
                  Check your email
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  We've sent password reset instructions to your email address.
                </p>
              </div>
              <Link
                to="/auth/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading.forgotPassword}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading.forgotPassword ? (
                    <Spinner size={20} />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-sm text-slate-600">
                  Remember your password?{" "}
                  <Link
                    to="/auth/login"
                    className="font-semibold text-purple-600 hover:text-purple-700 transition-colors"
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
  );
}

export default ForgotPassword;
