import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { verifyOtp, reset, resetVerification } from "../redux/slices/authSlice";
import api from "../utils/api";
import Spinner from "../components/Spinner";
import { FaEnvelopeOpen, FaLock, FaArrowLeft, FaRedoAlt } from "react-icons/fa";

function VerifyOtp() {
  const [otpError, setOtpError] = useState("");
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
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
      toast.error(error.verifyOtp);
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
    if (!email) {
      setOtpError("Email is required");
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
      await api.post("/api/v1/auth/resend-otp", { email });
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
  return (
    <div className="min-h-[90vh] bg-black flex items-center justify-center py-10 px-2 sm:px-6 lg:px-8">
      <div className="max-w-xl min-w-[320px] sm:min-w-[380px] md:min-w-[420px] w-full">
        <div className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-700 shadow-lg">
          <div className="px-6 py-4 text-center border-b border-neutral-800 bg-gradient-to-r from-purple-900/30 to-violet-900/30">
            <div className="mx-auto h-14 w-14 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full flex items-center justify-center mb-3 border border-purple-400/20 shadow-lg">
              <FaEnvelopeOpen className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {isFromLogin
                ? "Account Verification Required"
                : "Verify your account"}
            </h2>
            <p className="text-neutral-300 text-sm mt-2">
              Enter the 6-digit code sent to <span className="text-purple-300 font-medium">{email || "your email"}</span>
            </p>
          </div>
          <div className="px-6 sm:px-10 py-10 overflow-x-hidden bg-neutral-900">
            <form onSubmit={onSubmit} className="space-y-6">
              <div>                <label
                  htmlFor="otp-input-0"
                  className="flex items-center text-sm font-medium text-neutral-300 mb-2"
                >
                  <FaLock className="mr-2 text-purple-400" /> Verification Code
                </label>
                <div className="flex justify-center gap-2 md:gap-3">
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
                      className="w-11 h-14 md:w-14 md:h-16 text-center text-xl md:text-2xl border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-white bg-neutral-800 shadow-md"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
                {otpError && (
                  <p
                    id="otp-error"
                    className="mt-2 text-xs text-red-400"
                    role="alert"
                    aria-live="assertive"
                  >
                    {otpError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading.verifyOtp || otpArray.join("").length !== 6}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-purple-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading.verifyOtp ? <Spinner size={20} /> : "Verify & Continue"}
              </button>
            </form>
            
            <div className="text-center pt-6 border-t border-neutral-800 mt-6">
              {isFromLogin && (
                <div className="mb-4 bg-amber-900/20 border border-amber-700/30 rounded-lg p-4">
                  <p className="text-sm text-amber-300 flex items-center">
                    <span className="flex-shrink-0 w-5 h-5 bg-amber-500/20 rounded-full flex items-center justify-center mr-2">
                      <span className="text-amber-300 text-xs">!</span>
                    </span>
                    Your account requires verification before you can log in.
                  </p>
                </div>
              )}
              <p className="text-sm text-neutral-400 mb-4">
                Didn't receive the code? Check your spam folder or try again.
              </p>
              <div className="flex flex-col space-y-3">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading || resendCooldown > 0}
                  className="text-sm flex items-center justify-center text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaRedoAlt className="mr-2 h-3 w-3" />
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
                  className="text-sm flex items-center justify-center text-neutral-400 hover:text-neutral-300 transition-colors"
                >
                  <FaArrowLeft className="mr-2 h-3 w-3" />
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;
// No navigation changes needed unless you want to add a login link.
