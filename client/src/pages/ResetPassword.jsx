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
    <div className="min-h-[90vh] bg-black flex items-center justify-center py-10 px-2 sm:px-6 lg:px-8">
      <div className="max-w-xl min-w-[320px] sm:min-w-[380px] md:min-w-[420px] w-full">
        <div className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-700">
          <div className="px-6 py-4 text-center border-b border-neutral-800">
            <div className="mx-auto h-12 w-12 bg-neutral-800 rounded-full flex items-center justify-center mb-3 border border-neutral-700">
              <span className="text-white text-lg font-bold">F!</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Create New Password
            </h2>
            <p className="text-neutral-400 text-xs mt-1">
              Your password must be at least 6 characters long
            </p>
          </div>

          <div className="px-6 sm:px-10 py-10 overflow-x-hidden">
            {success.resetPassword ? (
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
                    Password reset successful!
                  </h3>
                  <p className="mt-2 text-sm text-neutral-400">
                    You will be redirected to the login page shortly.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-white mb-2"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    className="w-full px-4 py-3 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 text-white placeholder-neutral-400 bg-neutral-800"
                    placeholder="Enter your new password"
                    required
                    minLength="6"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-white mb-2"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={onChange}
                    className="w-full px-4 py-3 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 text-white placeholder-neutral-400 bg-neutral-800"
                    placeholder="Confirm your new password"
                    required
                    minLength="6"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading.resetPassword}
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-neutral-800 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading.resetPassword ? (
                      <Spinner size={20} />
                    ) : (
                      "Reset Password"
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

export default ResetPassword;
