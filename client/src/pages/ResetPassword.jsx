import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { reset, resetPassword } from "../redux/slices/authSlice";
import Spinner from "../components/Spinner";

function ResetPassword() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const { password, confirmPassword } = formData;
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error && error.resetPassword) {
      toast.error(error.resetPassword);
    }

    if (success && success.resetPassword) {
      toast.success("Password has been reset successfully");
      setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
    }

    dispatch(reset());
  }, [error, success, navigate, dispatch]);

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
      dispatch(resetPassword({ token, password }));
      navigate("/auth/login");
    }
  };

  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-slate-50 via-purple-50 to-violet-100 flex items-center justify-center py-10 px-2 sm:px-6 lg:px-8">
      <div className="max-w-xl min-w-[320px] sm:min-w-[380px] md:min-w-[420px] w-full">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-purple-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-8 py-6 text-center">
            <div className="mx-auto h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">F!</span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              Create New Password
            </h2>
            <p className="text-purple-100 text-sm mt-1">
              Your password must be at least 6 characters long
            </p>
          </div>

          {/* Form Content */}
          <div className="px-6 sm:px-10 py-10 overflow-x-hidden">
            {success.resetPassword ? (
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
                    Password reset successful!
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    You will be redirected to the login page shortly.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                    placeholder="Enter your new password"
                    required
                    minLength="6"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={onChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-400"
                    placeholder="Confirm your new password"
                    required
                    minLength="6"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading.resetPassword}
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {loading.resetPassword ? (
                      <Spinner size={20} />
                    ) : (
                      "Reset Password"
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
    </div>
  );
}

export default ResetPassword;
