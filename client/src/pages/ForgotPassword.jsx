import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { forgotPassword, reset } from "../redux/slices/authSlice";
import { FaEnvelope, FaPaperPlane, FaCheck, FaArrowLeft } from "react-icons/fa";
import AuthCard from "../components/AuthCard";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [validationError, setValidationError] = useState("");

  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error && error.forgotPassword) {
      setFormError(error.forgotPassword);
    } else {
      setFormError("");
    }

    if (success && success.forgotPassword) {
      toast.success("Password reset instructions have been sent to your email");
      setEmail("");
    }

    dispatch(reset());
  }, [error, success, dispatch]);

  // Validate email in real-time
  useEffect(() => {
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      setValidationError("Please enter a valid email address");
    } else {
      setValidationError("");
    }
  }, [email]);

  const onChange = (e) => {
    setEmail(e.target.value);
    // Clear form error when user starts typing
    if (formError) setFormError("");
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (validationError) {
      setFormError("Please enter a valid email address");
      return;
    }

    dispatch(forgotPassword(email));
  };

  const isFormValid = () => {
    return email && !validationError;
  };
  return (
    <AuthCard
      title="Forgot Password"
      subtitle="Enter your email address and we'll send you instructions to reset your password"
      error={formError}
    >
      {success?.forgotPassword ? (
        <div className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20">
            <FaCheck className="h-8 w-8 text-green-500" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">
              Check your email
            </h3>
            <p className="text-sm text-neutral-400">
              We've sent password reset instructions to your email address.
              Check your inbox and follow the link to reset your password.
            </p>
          </div>

          <AuthButton
            as="link"
            to="/auth/login"
            variant="secondary"
            icon={FaArrowLeft}
          >
            Back to Login
          </AuthButton>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <AuthInput
            type="email"
            name="email"
            label="Email Address"
            value={email}
            onChange={onChange}
            placeholder="Enter your email address"
            icon={FaEnvelope}
            error={validationError}
            required
          />

          <AuthButton
            type="submit"
            loading={loading?.forgotPassword}
            disabled={!isFormValid() || loading?.forgotPassword}
            icon={FaPaperPlane}
          >
            Send Reset Link
          </AuthButton>

          <div className="text-center pt-4">
            <p className="text-sm text-neutral-400">
              Remember your password?{" "}
              <Link
                to="/auth/login"
                className="text-white hover:text-neutral-200 font-medium hover:underline transition-colors"
              >
                Back to Login
              </Link>
            </p>
          </div>
        </form>
      )}
    </AuthCard>
  );
}

export default ForgotPassword;
