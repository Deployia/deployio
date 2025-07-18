import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loginUser, reset, reset2FA } from "@redux/index";
import {
  FaUser,
  FaLock,
  FaSignInAlt,
  FaExclamationTriangle,
  FaUserPlus,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
} from "react-icons/fa";
import AuthCard from "@components/auth/Card";
import AuthInput from "@components/auth/Input";
import AuthButton from "@components/auth/Button";
import AuthDivider from "@components/auth/Divider";
import OAuthSection from "@components/auth/OAuthSection";
import OTPInput from "@components/auth/OTPInput";
import SEO from "@components/SEO.jsx";
import { getRedirectPath } from "@utils/authUtils";
import { getAndClearIntendedDestination } from "@utils/authUtils";
import toast from "react-hot-toast";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const oauth2fa = searchParams.get("oauth2fa");
  const oauth2faUserId = searchParams.get("userId");

  const { email, password } = formData;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    isAuthenticated,
    loading,
    error,
    success,
    requires2FA,
    pending2FAUserId,
    needsVerification,
    pendingVerificationEmail,
  } = useSelector((state) => state.auth);

  // Determine if 2FA verification is needed (OAuth or normal login)
  const twoFAUserId =
    oauth2fa === "true"
      ? oauth2faUserId
      : requires2FA
      ? pending2FAUserId
      : null;

  // Real-time validation
  const validateForm = useCallback(() => {
    const errors = {};

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (password && password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [email, password]);

  useEffect(() => {
    if (hasSubmitted) {
      validateForm();
    }
  }, [email, password, hasSubmitted, validateForm]);
  useEffect(() => {
    // Handle OAuth success
    const oauthSuccess = searchParams.get("oauth");
    if (oauthSuccess === "success" && isAuthenticated) {
      toast.success("Successfully logged in!");
      setShowSuccessMessage(true);
      // Get intended destination or use default
      const intendedDestination = getAndClearIntendedDestination();
      const redirectPath =
        intendedDestination || getRedirectPath(searchParams, "/dashboard");

      // Delay navigation to show success message
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1000);
      return;
    }

    if (isAuthenticated && !loading.login) {
      setShowSuccessMessage(true);
      toast.success("Login successful!");
      const redirectPath = getRedirectPath(searchParams, "/dashboard");

      // Delay navigation to show success message
      setTimeout(() => {
        navigate(redirectPath);
      }, 1000);
    }

    // Redirect to OTP verification if needed
    if (needsVerification && pendingVerificationEmail) {
      navigate("/auth/verify-otp", {
        state: { email: pendingVerificationEmail, fromLogin: true },
      });
    }

    // Clear errors after showing them
    if (error?.login) {
      const timer = setTimeout(() => {
        dispatch(reset());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [
    isAuthenticated,
    loading.login,
    needsVerification,
    pendingVerificationEmail,
    error,
    navigate,
    dispatch,
    searchParams,
  ]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    // Clear specific field error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);
    setShowSuccessMessage(false);

    if (!validateForm()) {
      return;
    }

    if (!email || !password) {
      return;
    }

    setIsSubmitting(true);
    const userData = { email, password };

    try {
      await dispatch(loginUser(userData)).unwrap();
      // Success is handled in useEffect
    } catch (error) {
      // Error is already handled by the auth slice and will be displayed in the card
      console.error("Login error:", error);
      toast.error(error || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If any 2FA flow is required, render OTP form
  if (twoFAUserId) {
    return (
      <AuthCard
        title="Two-Factor Authentication"
        subtitle="Enter your verification code"
        icon={FaLock}
        iconColor="text-blue-400"
        maxWidth="max-w-md"
      >
        {" "}
        <OTPInput
          userId={twoFAUserId}
          onSuccess={() => {
            // Clear 2FA state and params, then redirect to profile
            setSearchParams({});
            dispatch(reset2FA());
            navigate("/dashboard");
          }}
          onCancel={() => {
            setSearchParams({});
            dispatch(reset2FA());
            navigate("/auth/login");
          }}
        />
      </AuthCard>
    );
  }

  const isFormValid =
    email && password && Object.keys(validationErrors).length === 0;

  return (
    <>
      <SEO page="login" />
      <AuthCard
        title="Welcome Back"
        subtitle="Sign in to your DeployIO account"
        icon={FaSignInAlt}
        error={error?.login}
        maxWidth="max-w-lg"
      >
        <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
          {/* Success Message */}
          {showSuccessMessage && !error?.login && (
            <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <FaCheckCircle />
              <span>Login successful! Redirecting...</span>
            </div>
          )}

          <AuthInput
            label="Email Address"
            type="email"
            name="email"
            value={email}
            onChange={onChange}
            placeholder="Enter your email"
            required
            icon={FaUser}
            error={hasSubmitted ? validationErrors.email : null}
          />

          <div className="relative">
            <AuthInput
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Enter your password"
              required
              icon={FaLock}
              error={hasSubmitted ? validationErrors.password : null}
            />
            <button
              type="button"
              className="absolute right-2.5 sm:right-3 top-7 sm:top-8 text-neutral-400 hover:text-white transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <FaEyeSlash size={14} className="sm:w-4 sm:h-4" />
              ) : (
                <FaEye size={14} className="sm:w-4 sm:h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-end">
            <Link
              to="/auth/forgot-password"
              className="text-xs text-neutral-400 hover:text-purple-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <AuthButton
            type="submit"
            variant="primary"
            size="md"
            loading={loading.login || isSubmitting}
            disabled={loading.login || isSubmitting || showSuccessMessage}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {showSuccessMessage ? "Redirecting..." : "Sign In"}
          </AuthButton>

          {hasSubmitted &&
            !isFormValid &&
            !loading.login &&
            !isSubmitting &&
            !showSuccessMessage && (
              <div className="flex items-center justify-center p-2 sm:p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                <FaExclamationTriangle className="text-red-400 mr-2 text-xs sm:text-sm flex-shrink-0" />
                <span className="text-red-400 text-xs">
                  Please fix the errors above
                </span>
              </div>
            )}
        </form>

        <AuthDivider />
        <OAuthSection />

        <div className="mt-3 sm:mt-6 text-center">
          <div className="flex items-center justify-center p-2 sm:p-3 bg-neutral-800/30 border border-neutral-700 rounded-lg">
            <FaUserPlus className="text-purple-400 mr-2 text-sm flex-shrink-0" />
            <span className="text-neutral-400 text-xs sm:text-sm">
              Don&apos;t have an account?{" "}
              <Link
                to="/auth/register"
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Create one here
              </Link>
            </span>
          </div>
        </div>
      </AuthCard>
    </>
  );
}

export default Login;
