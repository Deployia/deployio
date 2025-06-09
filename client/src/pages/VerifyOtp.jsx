import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { verifyOtp, reset, resetVerification } from "../redux/slices/authSlice";
import api from "../utils/api";
import {
  FaEnvelopeOpen,
  FaLock,
  FaArrowLeft,
  FaRedoAlt,
  FaCheck,
} from "react-icons/fa";
import AuthCard from "../components/auth/Card";
import AuthButton from "../components/auth/Button";
import SEO from "../components/SEO.jsx";

function VerifyOtp() {
  const [otpError, setOtpError] = useState("");
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [formError, setFormError] = useState("");
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
  const isFromLogin = !!pendingVerificationEmail;

  useEffect(() => {
    if (error && error.verifyOtp) {
      setFormError(error.verifyOtp);
    } else {
      setFormError("");
    }

    if (isAuthenticated) {
      toast.success("Account verified and logged in!");
      navigate("/profile");

      // Clear verification state if coming from login flow
      if (isFromLogin) {
        dispatch(resetVerification());
      }
    }

    // Clean up - only reset errors, not the verification state
    return () => dispatch(reset());
  }, [error, isAuthenticated, isFromLogin, navigate, dispatch]);

  // Cooldown timer for resend
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Handle OTP input change
  const handleOtpChange = (e, idx) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (!value) return;

    const newOtp = [...otpArray];
    newOtp[idx] = value[0]; // Take only first digit
    setOtpArray(newOtp);

    // Clear any previous errors
    if (otpError) setOtpError("");
    if (formError) setFormError("");

    // Move to next input if available
    if (value && idx < 5) {
      inputsRef.current[idx + 1].focus();
    }
  };

  // Handle backspace
  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      // Always clear current input first
      const newOtp = [...otpArray];
      newOtp[idx] = "";
      setOtpArray(newOtp);

      // Always move to previous input if not the first block
      if (idx > 0) {
        inputsRef.current[idx - 1].focus();
      }
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const otp = otpArray.join("");
    setOtpError("");
    setFormError("");

    if (!email) {
      setFormError("Email is required");
      return;
    }
    if (otp.length !== 6) {
      setOtpError("Please enter all 6 digits of the OTP");
      return;
    }
    dispatch(verifyOtp({ email, otp }));
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
      setResendCooldown(30); // 30s cooldown
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err.message || "Failed to resend OTP"
      );
    } finally {
      setResendLoading(false);
    }
  };

  const isFormValid = () => {
    return otpArray.join("").length === 6;
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
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-3">
            <label
              htmlFor="otp-input-0"
              className="flex items-center text-sm font-medium text-neutral-300"
            >
              <FaLock className="mr-2 text-neutral-400" /> Verification Code
            </label>{" "}
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
                  aria-invalid={otpError ? true : false}
                  aria-describedby={otpError ? "otp-error" : undefined}
                  className={`w-10 h-12 xs:w-12 xs:h-14 sm:w-14 sm:h-16 text-center text-lg xs:text-xl sm:text-2xl border rounded-lg transition-all duration-200 text-white bg-neutral-800/50 focus:bg-neutral-800 ${
                    otpError
                      ? "border-red-500 focus:border-red-400 focus:ring-red-400/20"
                      : "border-neutral-700 focus:border-white focus:ring-white/20"
                  } focus:outline-none focus:ring-2`}
                  autoFocus={idx === 0}
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
            loading={loading?.verifyOtp}
            disabled={!isFormValid() || loading?.verifyOtp}
            icon={FaCheck}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Verify & Continue
          </AuthButton>
        </form>

        <div className="space-y-4 pt-6 border-t border-neutral-800">
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

          <div className="text-center space-y-3">
            <p className="text-sm text-neutral-400">
              Didn&apos;t receive the code? Check your spam folder or try again.
            </p>{" "}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendLoading || resendCooldown > 0}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-sm sm:text-base text-white hover:text-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium rounded-lg hover:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <FaRedoAlt className="mr-2 h-3 w-3 flex-shrink-0" />
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
// No navigation changes needed unless you want to add a login link.
