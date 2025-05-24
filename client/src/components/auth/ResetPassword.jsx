import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { resetPassword, reset } from "../../redux/slices/authSlice";
import Spinner from "../Spinner";

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
    }
  };

  if (loading && loading.resetPassword) {
    return <Spinner />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Create New Password
        </h1>
        <p className="mb-6 text-center text-gray-600">
          Your password must be at least 6 characters long.
        </p>

        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label
              className="block mb-2 text-sm font-bold text-gray-700"
              htmlFor="password"
            >
              New Password
            </label>
            <input
              className="w-full px-3 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-blue-500"
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Enter your new password"
              required
              minLength="6"
            />
          </div>

          <div className="mb-6">
            <label
              className="block mb-2 text-sm font-bold text-gray-700"
              htmlFor="confirmPassword"
            >
              Confirm New Password
            </label>
            <input
              className="w-full px-3 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-blue-500"
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              placeholder="Confirm your new password"
              required
              minLength="6"
            />
          </div>

          <div className="mb-6">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
            >
              Reset Password
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm">
            Remember your password?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
