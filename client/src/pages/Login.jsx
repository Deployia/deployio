import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loginUser, reset, reset2FA } from "../redux/slices/authSlice";
import {
  FaUser,
  FaLock,
  FaSignInAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUserPlus,
} from "react-icons/fa";
import AuthCard from "../components/AuthCard";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import AuthDivider from "../components/AuthDivider";
import OAuthSection from "../components/OAuthSection";
import OTPVerification from "../components/OTPVerification";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
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

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/profile");
    }

    // Redirect to OTP verification if needed
    if (needsVerification && pendingVerificationEmail) {
      navigate("/auth/verify-otp", {
        state: { email: pendingVerificationEmail },
      });
    }

    // Only reset errors, not the 2FA or verification flags
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
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const userData = { email, password };
    try {
      await dispatch(loginUser(userData)).unwrap();
    } catch {
      // Error is handled by the auth slice
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
            navigate("/profile");
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

  const isFormValid = email && password;

  return (
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
        />

        <AuthInput
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={onChange}
          placeholder="Enter your password"
          required
          icon={FaLock}
        />

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
          disabled={!isFormValid}
          className="w-full"
        >
          Sign In
        </AuthButton>

        {!isFormValid && (
          <div className="flex items-center justify-center p-2 bg-neutral-800/30 border border-neutral-700 rounded-lg">
            <FaExclamationTriangle className="text-yellow-400 mr-2 text-sm" />
            <span className="text-neutral-400 text-xs">
              Please fill in all required fields
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
            Don't have an account?{" "}
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
  );
}

export default Login;
