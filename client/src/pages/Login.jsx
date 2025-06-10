import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loginUser, reset, reset2FA } from "../redux/slices/authSlice";
import {
  FaUser,
  FaLock,
  FaSignInAlt,
  FaExclamationTriangle,
  FaUserPlus,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import AuthCard from "../components/auth/Card";
import AuthInput from "../components/auth/Input";
import AuthButton from "../components/auth/Button";
import AuthDivider from "../components/auth/Divider";
import OAuthSection from "../components/auth/OAuthSection";
import OTPVerification from "../components/auth/OTPVerification";
import SEO from "../components/SEO.jsx";
import { toast } from "react-hot-toast";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

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
    if (isAuthenticated) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }

    // Redirect to OTP verification if needed
    if (needsVerification && pendingVerificationEmail) {
      toast.success("Please verify your account to continue");
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
    needsVerification,
    pendingVerificationEmail,
    error,
    navigate,
    dispatch,
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

    if (!validateForm()) {
      toast.error("Please fix the errors below");
      return;
    }

    if (!email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    const userData = { email, password };
    try {
      await dispatch(loginUser(userData)).unwrap();
    } catch (error) {
      // Error is already handled by the auth slice and will be displayed in the card
      console.error("Login error:", error);
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
        <OTPVerification
          mode="login"
          userId={twoFAUserId}
          onSuccess={() => {
            // Clear 2FA state and params, then redirect to profile
            setSearchParams({});
            dispatch(reset2FA());
            toast.success("Login successful!");
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
        <form onSubmit={onSubmit} className="space-y-4">
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
              className="absolute right-3 top-8 text-neutral-400 hover:text-white transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
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
            loading={loading.login}
            disabled={loading.login}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Sign In
          </AuthButton>

          {hasSubmitted && !isFormValid && !loading.login && (
            <div className="flex items-center justify-center p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <FaExclamationTriangle className="text-red-400 mr-2 text-sm" />
              <span className="text-red-400 text-xs">
                Please fix the errors above
              </span>
            </div>
          )}
        </form>

        <AuthDivider />
        <OAuthSection />

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center p-3 bg-neutral-800/30 border border-neutral-700 rounded-lg">
            <FaUserPlus className="text-purple-400 mr-2" />
            <span className="text-neutral-400 text-sm">
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
