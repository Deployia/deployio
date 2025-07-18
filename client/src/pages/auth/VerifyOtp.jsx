import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { verifyOtp, reset, resetVerification } from "@redux/slices/authSlice";
import api from "@utils/api";
import {
  FaEnvelopeOpen,
  FaLock,
  FaArrowLeft,
  FaRedoAlt,
  FaCheck,
  FaCheckCircle,
} from "react-icons/fa";
import AuthCard from "@components/auth/Card";
import AuthButton from "@components/auth/Button";
import SEO from "@components/SEO.jsx";

function VerifyOtp() {
  const [otpError, setOtpError] = useState("");
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [formError, setFormError] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const inputsRef = useRef([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  // Get email from location state or from redux state (redirected from register or login)
  const { pendingVerificationEmail } = useSelector((state) => state.auth);
  const email = location.state?.email || pendingVerificationEmail || "";

  // Track the verification source (login or register)
  const isFromLogin = location.state?.fromLogin || !!pendingVerificationEmail;
  const isFromRegistration = location.state?.fromRegistration;

  // Validation function
  const validateOtp = useCallback(() => {
    const otp = otpArray.join("");
    const errors = {};

    if (!email || email.trim().length === 0) {
      errors.email = "Email is required for verification";
    }

    if (!otp || otp.length === 0) {
      errors.otp = "Please enter the verification code";
    } else if (otp.length !== 6) {
      errors.otp = "Please enter all 6 digits of the verification code";
    } else if (!/^\d{6}$/.test(otp)) {
      errors.otp = "Verification code must contain only numbers";
    }

    return errors;
  }, [otpArray, email]);

  // Handle verification success/error
  useEffect(() => {
    if (isSubmitting) {
      if (error?.verifyOtp) {
        setFormError(error.verifyOtp);
        toast.error(error.verifyOtp);
        setIsSubmitting(false);

        // Clear OTP on error for security
        setOtpArray(["", "", "", "", "", ""]);
        if (inputsRef.current[0]) {
          inputsRef.current[0].focus();
        }
      } else if (isAuthenticated) {
        setShowSuccessMessage(true);
        toast.success(
          isFromRegistration
            ? "Account verified successfully! Welcome to DeployIO!"
            : "Account verified and logged in!"
        );

        // Delay navigation to show success message
        setTimeout(() => {
          navigate("/dashboard");
          // Clear verification state if coming from login flow
          if (isFromLogin) {
            dispatch(resetVerification());
          }
        }, 1500);

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
  }, [
    error,
    isAuthenticated,
    isFromLogin,
    isFromRegistration,
    navigate,
    dispatch,
    isSubmitting,
  ]);

  // Cooldown timer for resend
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  // Handle OTP input change
  const handleOtpChange = (e, idx) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otpArray];
    newOtp[idx] = value;
    setOtpArray(newOtp);

    // Clear any previous errors when user types
    if (otpError) setOtpError("");
    if (formError) setFormError("");

    // Move to next input if available and value is entered
    if (value && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  // Handle backspace and other navigation keys
  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otpArray];

      if (otpArray[idx]) {
        // Clear current digit
        newOtp[idx] = "";
        setOtpArray(newOtp);
      } else if (idx > 0) {
        // Move to previous input and clear it
        newOtp[idx - 1] = "";
        setOtpArray(newOtp);
        inputsRef.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/[^0-9]/g, "");

    if (pasteData.length === 6) {
      const newOtp = pasteData.split("");
      setOtpArray(newOtp);

      // Focus the last input
      inputsRef.current[5]?.focus();

      // Clear errors
      if (otpError) setOtpError("");
      if (formError) setFormError("");
    }
  };
  const onSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);
    setOtpError("");
    setFormError("");

    // Validate form
    const errors = validateOtp();

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      setFormError(firstError);
      setOtpError(errors.otp || "");
      toast.error(firstError);
      return;
    }

    setIsSubmitting(true);

    try {
      const otp = otpArray.join("");
      await dispatch(verifyOtp({ email, otp })).unwrap();
    } catch (err) {
      // Error handling is done in useEffect
      console.error("OTP verification error:", err);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.error("No email found for resend");
      return;
    }

    setResendLoading(true);
    try {
      await api.post("/auth/resend-otp", { email });
      toast.success("OTP resent to your email");
      setResendCooldown(60); // 60s cooldown for better UX
    } catch (err) {
      const message =
        err?.response?.data?.message || err.message || "Failed to resend OTP";
      toast.error(message);
    } finally {
      setResendLoading(false);
    }
  };

  const isFormValid = () => {
    const otp = otpArray.join("");
    return email && otp.length === 6 && /^\d{6}$/.test(otp);
  };
  return (
    <>
      <SEO page="verifyOtp" />
      <AuthCard
        title={
          isFromLogin ? "Account Verification Required" : "Verify Your Account"
        }
        subtitle={
          <>
            Enter the 6-digit code sent to{" "}
            <span className="text-white font-medium">
              {email || "your email"}
            </span>
          </>
        }
        error={formError}
        icon={FaEnvelopeOpen}
      >
        <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
          {/* Success Message */}
          {showSuccessMessage && !formError && (
            <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <FaCheckCircle />
              <span>
                {isFromRegistration
                  ? "Account verified successfully! Redirecting to dashboard..."
                  : "Account verified! Redirecting to dashboard..."}
              </span>
            </div>
          )}

          <div className="space-y-3">
            <label
              htmlFor="otp-input-0"
              className="flex items-center text-sm font-medium text-neutral-300"
            >
              <FaLock className="mr-2 text-neutral-400" /> Verification Code
            </label>
            <div className="flex justify-center gap-1.5 sm:gap-2 md:gap-3">
              {otpArray.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  ref={(el) => (inputsRef.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  aria-invalid={otpError ? true : false}
                  aria-describedby={otpError ? "otp-error" : undefined}
                  className={`w-10 h-12 xs:w-12 xs:h-14 sm:w-14 sm:h-16 text-center text-lg xs:text-xl sm:text-2xl border rounded-lg transition-all duration-200 text-white bg-neutral-800/50 focus:bg-neutral-800 ${
                    otpError ||
                    (hasSubmitted && !digit && otpArray.join("").length < 6)
                      ? "border-red-500 focus:border-red-400 focus:ring-red-400/20"
                      : "border-neutral-700 focus:border-white focus:ring-white/20"
                  } focus:outline-none focus:ring-2`}
                  autoComplete="one-time-code"
                />
              ))}
            </div>
            {otpError && (
              <p
                id="otp-error"
                className="text-xs text-red-400 text-center"
                role="alert"
                aria-live="assertive"
              >
                {otpError}
              </p>
            )}
          </div>

          <AuthButton
            type="submit"
            loading={loading?.verifyOtp || isSubmitting}
            disabled={
              !isFormValid() ||
              loading?.verifyOtp ||
              isSubmitting ||
              showSuccessMessage
            }
            icon={FaCheck}
            className={`w-full transition-all duration-200 ${
              isFormValid() &&
              !loading?.verifyOtp &&
              !isSubmitting &&
              !showSuccessMessage
                ? "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                : ""
            }`}
          >
            {showSuccessMessage
              ? "Redirecting..."
              : loading?.verifyOtp || isSubmitting
              ? "Verifying..."
              : "Verify & Continue"}
          </AuthButton>
        </form>

        <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-neutral-800">
          {isFromLogin && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-xs text-amber-300 flex items-center">
                <span className="flex-shrink-0 w-4 h-4 bg-amber-500/20 rounded-full flex items-center justify-center mr-2">
                  <span className="text-amber-300 text-xs">!</span>
                </span>
                Your account requires verification before you can log in.
              </p>
            </div>
          )}

          {isFromRegistration && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-blue-300 flex items-center">
                <span className="flex-shrink-0 w-4 h-4 bg-blue-500/20 rounded-full flex items-center justify-center mr-2">
                  <span className="text-blue-300 text-xs">✓</span>
                </span>
                Account created successfully! Please verify your email to
                complete setup.
              </p>
            </div>
          )}

          <div className="text-center space-y-3">
            <p className="text-sm text-neutral-400">
              Didn&apos;t receive the code? Check your spam folder or try again.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendLoading || resendCooldown > 0}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-sm sm:text-base text-white hover:text-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium rounded-lg hover:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <FaRedoAlt
                  className={`mr-2 h-3 w-3 flex-shrink-0 ${
                    resendLoading ? "animate-spin" : ""
                  }`}
                />
                {resendLoading
                  ? "Resending..."
                  : resendCooldown > 0
                  ? `Resend Code (${resendCooldown}s)`
                  : "Resend Code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  // If from login, reset verification state and go back to login
                  if (isFromLogin) {
                    dispatch(resetVerification());
                  }
                  navigate("/auth/login");
                }}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-sm sm:text-base text-neutral-400 hover:text-neutral-200 transition-colors duration-200 rounded-lg hover:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <FaArrowLeft className="mr-2 h-3 w-3 flex-shrink-0" />
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </AuthCard>
    </>
  );
}

export default VerifyOtp;
