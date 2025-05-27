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
        navigate("/login");
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
      navigate("/login");
    }
  };

  if (loading && loading.resetPassword) {
    return <Spinner />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full flex items-center justify-center">
            <span className="text-white text-3xl font-bold">F!</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create new password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your password must be at least 6 characters long
          </p>
        </div>
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          {success.resetPassword ? (
            <div className="text-center space-y-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
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
                <h3 className="text-lg font-medium text-gray-900">
                  Password reset successful!
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  You will be redirected to the login page shortly.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm transition-colors"
                  placeholder="Enter your new password"
                  required
                  minLength="6"
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm transition-colors"
                  placeholder="Confirm your new password"
                  required
                  minLength="6"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading.resetPassword}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading.resetPassword ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Resetting...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>

              <div className="text-center">
                <span className="text-sm text-gray-600">
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-amber-600 hover:text-amber-500 transition-colors"
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

export default ResetPassword;
