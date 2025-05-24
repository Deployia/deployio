import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { forgotPassword, reset } from "../../redux/slices/authSlice";
import Spinner from "../Spinner";

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
  if (loading && loading.forgotPassword) {
    return <Spinner />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Reset Your Password
        </h1>
        <p className="mb-6 text-center text-gray-600">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>

        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label
              className="block mb-2 text-sm font-bold text-gray-700"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="w-full px-3 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-blue-500"
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-6">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
            >
              Send Reset Link
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

export default ForgotPassword;
