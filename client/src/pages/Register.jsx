import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { registerUser, reset } from "../redux/slices/authSlice";
import zxcvbn from "zxcvbn";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserPlus,
} from "react-icons/fa";
import AuthCard from "../components/AuthCard";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import AuthDivider from "../components/AuthDivider";
import OAuthSection from "../components/OAuthSection";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordScore, setPasswordScore] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const { username, email, password, confirmPassword } = formData;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error && error.signup) {
      setFormError(error.signup);
    } else {
      setFormError("");
    }

    // If registration returns user with email, redirect to verify-otp
    if (user && user?.email) {
      toast.success("OTP sent to your email. Please verify.");
      navigate("/auth/verify-otp", { state: { email: user?.email } });
      dispatch(reset());
      return;
    }

    dispatch(reset());
  }, [error, navigate, dispatch, user]);

  // Update password strength score whenever password changes
  useEffect(() => {
    const { score } = zxcvbn(password || "");
    setPasswordScore(score);
  }, [password]);

  // Validate form fields in real-time
  useEffect(() => {
    const errors = {};

    if (username && username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (password && password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
  }, [username, email, password, confirmPassword]);

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

    const userData = {
      username,
      email,
      password,
    };

    dispatch(registerUser(userData));
  };

  const isFormValid = () => {
    return (
      username &&
      email &&
      password &&
      confirmPassword &&
      Object.keys(validationErrors).length === 0
    );
  };

  const passwordStrength = getPasswordStrengthInfo();
  return (
    <AuthCard
      title="Create Account"
      subtitle="Join DeployIO and start deploying your projects"
      error={formError}
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <AuthInput
          type="text"
          name="username"
          label="Username"
          value={username}
          onChange={onChange}
          placeholder="Choose a username"
          icon={FaUser}
          error={validationErrors.username}
          required
        />

        <AuthInput
          type="email"
          name="email"
          label="Email Address"
          value={email}
          onChange={onChange}
          placeholder="Enter your email"
          icon={FaEnvelope}
          error={validationErrors.email}
          required
        />

        <div className="space-y-1">
          <AuthInput
            type={showPassword ? "text" : "password"}
            name="password"
            label="Password"
            value={password}
            onChange={onChange}
            placeholder="Create a strong password"
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
                <span className="font-medium">{passwordStrength.label}</span>
              </p>
            </div>
          )}
        </div>

        <AuthInput
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          label="Confirm Password"
          value={confirmPassword}
          onChange={onChange}
          placeholder="Confirm your password"
          icon={FaLock}
          rightIcon={showConfirmPassword ? FaEyeSlash : FaEye}
          onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
          error={validationErrors.confirmPassword}
          required
        />

        <AuthButton
          type="submit"
          loading={loading?.signup}
          disabled={!isFormValid() || loading?.signup}
          icon={FaUserPlus}
        >
          Create Account
        </AuthButton>

        <AuthDivider text="or continue with" />

        <OAuthSection />

        <div className="text-center pt-4">
          <p className="text-sm text-neutral-400">
            Already have an account?{" "}
            <Link
              to="/auth/login"
              className="text-white hover:text-neutral-200 font-medium hover:underline transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </AuthCard>
  );
}

export default Register;
