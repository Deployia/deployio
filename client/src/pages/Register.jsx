import { useState, useEffect, useCallback } from "react";
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
import AuthCard from "../components/auth/Card";
import AuthInput from "../components/auth/Input";
import AuthButton from "../components/auth/Button";
import AuthDivider from "../components/auth/Divider";
import OAuthSection from "../components/auth/OAuthSection";
import SEO from "../components/SEO.jsx";

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
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { username, email, password, confirmPassword } = formData;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, user } = useSelector((state) => state.auth);

  // Validation function
  const validateForm = useCallback(() => {
    const errors = {};

    // Username validation
    if (!username || username.trim().length === 0) {
      errors.username = "Username is required";
    } else if (username.length < 3) {
      errors.username = "Username must be at least 3 characters long";
    } else if (username.length > 20) {
      errors.username = "Username cannot exceed 20 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.username =
        "Username can only contain letters, numbers, hyphens, and underscores";
    }

    // Email validation
    if (!email || email.trim().length === 0) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

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
  }, [username, email, password, confirmPassword]);

  // Update validation errors when form data changes (only show after first submit attempt)
  useEffect(() => {
    if (hasSubmitted) {
      const errors = validateForm();
      setValidationErrors(errors);
    }
  }, [validateForm, hasSubmitted]);

  // Update password strength score whenever password changes
  useEffect(() => {
    const { score } = zxcvbn(password || "");
    setPasswordScore(score);
  }, [password]);

  // Handle registration success/error
  useEffect(() => {
    if (isSubmitting) {
      if (error?.signup) {
        setFormError(error.signup);
        toast.error(error.signup);
        setIsSubmitting(false);
      } else if (user?.email) {
        // Registration successful, redirect to OTP verification
        toast.success("Registration successful! Please verify your email.");
        navigate("/auth/verify-otp", {
          state: {
            email: user.email,
            fromRegistration: true,
          },
        });
        dispatch(reset());
        setIsSubmitting(false);
        return;
      }
    }

    // Clean up on unmount or error reset
    return () => {
      if (error) {
        dispatch(reset());
      }
    };
  }, [error, user, navigate, dispatch, isSubmitting]);

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
      const userData = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      };

      await dispatch(registerUser(userData)).unwrap();
    } catch (err) {
      // Error handling is done in useEffect
      console.error("Registration error:", err);
    }
  };

  const isFormValid = () => {
    return (
      username.trim() &&
      email.trim() &&
      password &&
      confirmPassword &&
      Object.keys(validateForm()).length === 0
    );
  };
  const passwordStrength = getPasswordStrengthInfo();
  return (
    <>
      <SEO page="register" />
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
            error={hasSubmitted ? validationErrors.username : ""}
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
            error={hasSubmitted ? validationErrors.email : ""}
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
            label="Confirm Password"
            value={confirmPassword}
            onChange={onChange}
            placeholder="Confirm your password"
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
            loading={loading?.signup || isSubmitting}
            disabled={loading?.signup || isSubmitting}
            icon={FaUserPlus}
            className={`w-full transition-all duration-200 ${
              isFormValid() && !loading?.signup && !isSubmitting
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                : ""
            }`}
          >
            {loading?.signup || isSubmitting
              ? "Creating Account..."
              : "Create Account"}
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
    </>
  );
}

export default Register;
