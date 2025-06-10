import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { reset, resetPassword } from "@redux/slices/authSlice";
import { FaLock, FaEye, FaEyeSlash, FaCheck, FaKey } from "react-icons/fa";
import AuthCard from "@components/auth/Card";
import AuthInput from "@components/auth/Input";
import AuthButton from "@components/auth/Button";
import zxcvbn from "zxcvbn";
import SEO from "@components/SEO.jsx";

function ResetPassword() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordScore, setPasswordScore] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { password, confirmPassword } = formData;
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);

  // Validation function
  const validateForm = useCallback(() => {
    const errors = {};

    // Password validation
    if (!password || password.length === 0) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!confirmPassword || confirmPassword.length === 0) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  }, [password, confirmPassword]);

  // Update validation errors when form data changes (only show after first submit attempt)
  useEffect(() => {
    if (hasSubmitted) {
      const errors = validateForm();
      setValidationErrors(errors);
    }
  }, [validateForm, hasSubmitted]);

  // Handle reset password success/error
  useEffect(() => {
    if (isSubmitting) {
      if (error?.resetPassword) {
        setFormError(error.resetPassword);
        toast.error(error.resetPassword);
        setIsSubmitting(false);
      } else if (success?.resetPassword) {
        toast.success("Password has been reset successfully!");
        setIsSubmitting(false);
        // Redirect after a short delay
        setTimeout(() => {
          navigate("/auth/login", {
            state: {
              message:
                "Password reset successful. Please log in with your new password.",
            },
          });
        }, 2000);
        return;
      }
    }

    // Clean up on unmount
    return () => {
      if (error || success) {
        dispatch(reset());
      }
    };
  }, [error, success, navigate, dispatch, isSubmitting]);

  // Update password strength score whenever password changes
  useEffect(() => {
    const { score } = zxcvbn(password || "");
    setPasswordScore(score);
  }, [password]);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link. Please request a new password reset.");
      navigate("/auth/forgot-password");
    }
  }, [token, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    // Clear form-level error when user starts typing
    if (formError) setFormError("");

    // Clear field-specific error when user starts typing (only if we've already shown errors)
    if (hasSubmitted && validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const getPasswordStrengthInfo = () => {
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-blue-500",
      "bg-green-500",
    ];
    return {
      label: labels[passwordScore],
      color: colors[passwordScore],
      width: ((passwordScore + 1) / 5) * 100,
    };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);
    setFormError("");

    // Validate form
    const errors = validateForm();
    setValidationErrors(errors);

    // If there are validation errors, don't submit
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      setFormError(firstError);
      toast.error("Please fix the form errors");
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(resetPassword({ token, password })).unwrap();
    } catch (err) {
      // Error handling is done in useEffect
      console.error("Reset password error:", err);
    }
  };
  const isFormValid = () => {
    return (
      password && confirmPassword && Object.keys(validateForm()).length === 0
    );
  };

  const passwordStrength = getPasswordStrengthInfo();
  return (
    <>
      <SEO page="resetPassword" />
      <AuthCard
        title="Create New Password"
        subtitle="Your password must be at least 6 characters long and contain a mix of characters"
        error={formError}
      >
        {success?.resetPassword ? (
          <div className="text-center space-y-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20">
              <FaCheck className="h-8 w-8 text-green-500" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">
                Password reset successful!
              </h3>
              <p className="text-sm text-neutral-400">
                Your password has been updated successfully. You will be
                redirected to the login page shortly.
              </p>
            </div>

            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full w-0 animate-pulse"></div>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-1">
              <AuthInput
                type={showPassword ? "text" : "password"}
                name="password"
                label="New Password"
                value={password}
                onChange={onChange}
                placeholder="Enter your new password"
                icon={FaLock}
                rightIcon={showPassword ? FaEyeSlash : FaEye}
                onRightIconClick={() => setShowPassword(!showPassword)}
                error={hasSubmitted ? validationErrors.password : ""}
                required
              />

              {/* Password strength meter */}
              {password && (
                <div className="space-y-2 mt-2">
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.width}%` }}
                    />
                  </div>
                  <p className="text-xs text-neutral-400">
                    Password strength:{" "}
                    <span
                      className={`font-medium ${
                        passwordScore >= 3
                          ? "text-green-400"
                          : passwordScore >= 2
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <AuthInput
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={onChange}
              placeholder="Confirm your new password"
              icon={FaLock}
              rightIcon={showConfirmPassword ? FaEyeSlash : FaEye}
              onRightIconClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              error={hasSubmitted ? validationErrors.confirmPassword : ""}
              required
            />

            <AuthButton
              type="submit"
              loading={loading?.resetPassword || isSubmitting}
              disabled={loading?.resetPassword || isSubmitting}
              icon={FaKey}
              className={`w-full transition-all duration-200 ${
                isFormValid() && !loading?.resetPassword && !isSubmitting
                  ? "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  : ""
              }`}
            >
              {loading?.resetPassword || isSubmitting
                ? "Resetting Password..."
                : "Reset Password"}
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

export default ResetPassword;
