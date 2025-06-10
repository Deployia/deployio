import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { forgotPassword, reset } from "@redux/slices/authSlice";
import { FaEnvelope, FaPaperPlane, FaCheck, FaArrowLeft } from "react-icons/fa";
import AuthCard from "@components/auth/Card";
import AuthInput from "@components/auth/Input";
import AuthButton from "@components/auth/Button";
import SEO from "@components/SEO.jsx";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);

  // Validation function
  const validateEmail = useCallback(() => {
    const errors = {};

    if (!email || email.trim().length === 0) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    return errors;
  }, [email]);

  // Update validation errors when email changes (only show after first submit attempt)
  useEffect(() => {
    if (hasSubmitted) {
      const errors = validateEmail();
      setValidationError(errors.email || "");
    }
  }, [validateEmail, hasSubmitted]);

  // Handle password reset success/error
  useEffect(() => {
    if (isSubmitting) {
      if (error?.forgotPassword) {
        setFormError(error.forgotPassword);
        toast.error(error.forgotPassword);
        setIsSubmitting(false);
      } else if (success?.forgotPassword) {
        toast.success(
          "Password reset instructions have been sent to your email"
        );
        setIsSubmitting(false);
        // Don't clear email to show success state with the email visible
      }
    }

    // Clean up on unmount
    return () => {
      if (error || success) {
        dispatch(reset());
      }
    };
  }, [error, success, dispatch, isSubmitting]);

  const onChange = (e) => {
    const { value } = e.target;
    setEmail(value);

    // Clear form-level error when user starts typing
    if (formError) setFormError("");

    // Clear field-specific error when user starts typing (only if we've already shown errors)
    if (hasSubmitted && validationError) {
      setValidationError("");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);
    setFormError("");

    // Validate form
    const errors = validateEmail();
    setValidationError(errors.email || "");

    // If there are validation errors, don't submit
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      setFormError(firstError);
      toast.error("Please fix the form errors");
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(forgotPassword(email.trim().toLowerCase())).unwrap();
    } catch (err) {
      // Error handling is done in useEffect
      console.error("Forgot password error:", err);
    }
  };

  const isFormValid = () => {
    return email.trim() && !validateEmail().email;
  };
  return (
    <>
      <SEO page="forgotPassword" />
      <AuthCard
        title="Forgot Password"
        subtitle="Enter your email address and we'll send you instructions to reset your password"
        error={formError}
      >
        {" "}
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
                We&apos;ve sent password reset instructions to{" "}
                <span className="text-white font-medium">{email}</span>. Check
                your inbox and follow the link to reset your password.
              </p>
              <p className="text-xs text-neutral-500 mt-2">
                If you don&apos;t see the email, check your spam folder.
              </p>
            </div>

            <div className="space-y-3">
              <AuthButton
                as="link"
                to="/auth/login"
                variant="secondary"
                icon={FaArrowLeft}
                className="w-full"
              >
                Back to Login
              </AuthButton>

              <button
                type="button"
                onClick={() => {
                  // Reset success state to show form again
                  dispatch(reset());
                  setEmail("");
                  setHasSubmitted(false);
                }}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors duration-200 rounded-lg hover:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                Send to a different email
              </button>
            </div>
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
              error={hasSubmitted ? validationError : ""}
              required
              autoComplete="email"
            />

            <AuthButton
              type="submit"
              loading={loading?.forgotPassword || isSubmitting}
              disabled={loading?.forgotPassword || isSubmitting}
              icon={FaPaperPlane}
              className={`w-full transition-all duration-200 ${
                isFormValid() && !loading?.forgotPassword && !isSubmitting
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  : ""
              }`}
            >
              {loading?.forgotPassword || isSubmitting
                ? "Sending..."
                : "Send Reset Link"}
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
    </>
  );
}

export default ForgotPassword;
