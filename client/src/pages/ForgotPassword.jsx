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
    <div className="min-h-[90vh] bg-[rgb(var(--bg-primary))] flex flex-col justify-center items-center p-4">
      <div className="bg-[rgb(var(--bg-card))] text-[rgb(var(--text-primary))] p-8 rounded-lg shadow-xl w-full max-w-md border border-[rgb(var(--border-color))]">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] rounded-full flex items-center justify-center">
            <span className="text-[rgb(var(--text-on-accent))] text-2xl font-bold">
              D!
            </span>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center text-[rgb(var(--text-primary))] mb-6">
          Reset Password
        </h2>
        <p className="text-center text-[rgb(var(--text-secondary))] text-sm mb-8">
          We'll send you a link to reset your password
        </p>

        {/* Form Content */}
        <div className="px-6 sm:px-10 py-10 overflow-x-hidden">
          {success.forgotPassword ? (
            <div className="text-center space-y-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[rgb(var(--accent-primary))] bg-opacity-20">
                <svg
                  className="h-8 w-8 text-[rgb(var(--accent-primary))]"
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
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Check your email
                </h3>
                <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                  We've sent password reset instructions to your email address.
                </p>
              </div>
              <Link
                to="/auth/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-[rgb(var(--text-on-accent))] bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] hover:from-[rgb(var(--accent-primary-hover))] hover:to-[rgb(var(--accent-secondary-hover))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--accent-primary))] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-[rgb(var(--text-secondary))] mb-2"
                >
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-[rgb(var(--border-color))] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:border-transparent transition-all duration-200 bg-[rgb(var(--bg-input))] text-[rgb(var(--text-input))] placeholder:text-[rgb(var(--text-placeholder))]"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading.forgotPassword}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-[rgb(var(--text-on-accent))] bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] hover:from-[rgb(var(--accent-primary-hover))] hover:to-[rgb(var(--accent-secondary-hover))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--accent-primary))] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading.forgotPassword ? (
                    <Spinner size={20} />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-sm text-[rgb(var(--text-secondary))]">
                  Remember your password?{" "}
                  <Link
                    to="/auth/login"
                    className="font-semibold text-[rgb(var(--accent-primary))] hover:text-[rgb(var(--accent-primary-hover))] transition-colors"
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
