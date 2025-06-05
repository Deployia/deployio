import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { verifyOtp, reset, resetVerification } from "../redux/slices/authSlice";
import api from "../utils/api";
import Spinner from "../components/Spinner";

function VerifyOtp() {
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputsRef = useRef([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated, needsVerification } = useSelector(
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
    if (otp.length !== 6 || !email) {
      toast.error("Enter all 6 digits and email is required");
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
    <div className="min-h-[90vh] bg-gradient-to-br from-slate-50 via-purple-50 to-violet-100 flex items-center justify-center py-10 px-2 sm:px-6 lg:px-8">
      <div className="max-w-xl min-w-[320px] sm:min-w-[380px] md:min-w-[420px] w-full">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-purple-100">
          <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-4 text-center">
            <div className="mx-auto h-12 w-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
              <span className="text-white text-lg font-bold">F!</span>
            </div>{" "}
            <h2 className="text-xl font-bold text-white">
              {isFromLogin
                ? "Account Verification Required"
                : "Verify your account"}
            </h2>
            <p className="text-purple-100 text-xs mt-1">
              Enter the OTP sent to {email || "your email"}
            </p>
          </div>
          <div className="px-6 sm:px-10 py-10 overflow-x-hidden">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="otp-input-0"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  OTP Code
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
                      className="w-10 h-12 md:w-12 md:h-14 text-center text-lg md:text-2xl border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-slate-900 bg-slate-50 shadow-sm"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading.verifyOtp}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading.verifyOtp ? <Spinner size={20} /> : "Verify & Login"}
              </button>
            </form>{" "}
            <div className="text-center pt-3">
              {isFromLogin && (
                <div className="mb-3 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                  <p className="text-xs text-yellow-600">
                    Your account requires verification before you can log in.
                    Please enter the OTP code sent to your email.
                  </p>
                </div>
              )}
              <span className="text-xs text-slate-600">
                Didn't receive the code? Check your spam folder.
              </span>
              <div className="mt-2 flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading || resendCooldown > 0}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resendLoading
                    ? "Resending..."
                    : resendCooldown > 0
                    ? `Resend OTP (${resendCooldown}s)`
                    : "Resend OTP"}
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
                  className="text-xs font-semibold text-slate-500 hover:text-slate-600 transition-colors"
                >
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
