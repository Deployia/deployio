import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { reset, resetPassword } from "../redux/slices/authSlice";
import { FaLock, FaEye, FaEyeSlash, FaCheck, FaKey } from "react-icons/fa";
import AuthCard from "../components/auth/Card";
import AuthInput from "../components/auth/Input";
import AuthButton from "../components/auth/Button";
import zxcvbn from "zxcvbn";
import SEO from "../components/SEO.jsx";

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

  const { password, confirmPassword } = formData;
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error && error.resetPassword) {
      setFormError(error.resetPassword);
    } else {
      setFormError("");
    }

    if (success && success.resetPassword) {
      toast.success("Password has been reset successfully");
      setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
    }

    dispatch(reset());
  }, [error, success, navigate, dispatch]);

  // Update password strength score whenever password changes
  useEffect(() => {
    const { score } = zxcvbn(password || "");
    setPasswordScore(score);
  }, [password]);

  // Validate form fields in real-time
  useEffect(() => {
    const errors = {};

    if (password && password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
  }, [password, confirmPassword]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
    // Clear form error when user starts typing
    if (formError) setFormError("");
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

  const onSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    // Final validation check
    if (Object.keys(validationErrors).length > 0) {
      setFormError("Please fix the errors below");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    dispatch(resetPassword({ token, password }));
  };

  const isFormValid = () => {
    return (
      password && confirmPassword && Object.keys(validationErrors).length === 0
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
                error={validationErrors.password}
                required
              />

              {/* Password strength meter */}
              {password && (
                <div className="space-y-2">
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.width}%` }}
                    />
                  </div>
                  <p className="text-xs text-neutral-400">
                    Password strength:{" "}
                    <span className="font-medium">
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
              error={validationErrors.confirmPassword}
              required
            />

            <AuthButton
              type="submit"
              loading={loading?.resetPassword}
              disabled={!isFormValid() || loading?.resetPassword}
              icon={FaKey}
            >
              Reset Password
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
