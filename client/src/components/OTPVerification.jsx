import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiShield, FiKey, FiSmartphone } from "react-icons/fi";
import { disable2FA, verify2FALogin } from "../redux/slices/twoFactorSlice";
import toast from "react-hot-toast";
import AuthButton from "./AuthButton";
import AuthInput from "./AuthInput";

const OTPVerification = ({
  mode = "login", // 'login', 'disable'
  userId = null,
  onSuccess,
  onCancel,
}) => {
  const dispatch = useDispatch();
  const { isDisabling } = useSelector((state) => state.twoFactor);
  const { loading } = useSelector((state) => state.auth);

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const inputsRef = useRef([]);

  // For split input UI while keeping original logic
  const [otpArray, setOtpArray] = useState(
    Array(useBackupCode ? 8 : 6).fill("")
  );

  const isLoading = mode === "disable" ? isDisabling : loading.login;

  // Focus on first input when component loads or when switching between TOTP/backup mode
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, [useBackupCode]);

  // Keep the original code state in sync with the visual separated inputs
  useEffect(() => {
    setCode(otpArray.join(""));
  }, [otpArray]);

  const handleInputChange = (value, index) => {
    // For TOTP mode, only allow digits
    if (!useBackupCode && !/^[0-9]?$/.test(value)) return;

    // For backup codes, allow alphanumeric (uppercase)
    if (useBackupCode && !/^[0-9A-Z]?$/.test(value)) return;

    const newOtpArray = [...otpArray];
    newOtpArray[index] = useBackupCode ? value.toUpperCase() : value;
    setOtpArray(newOtpArray);

    // Auto-advance to next field
    if (value && index < otpArray.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otpArray[index]) {
        // Clear current field if it has content
        const newOtpArray = [...otpArray];
        newOtpArray[index] = "";
        setOtpArray(newOtpArray);
      } else if (index > 0) {
        // Move to previous field if current is empty
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData
      .getData("text")
      .slice(0, useBackupCode ? 8 : 6);

    // Validate pasted content based on mode
    if (useBackupCode) {
      if (!/^[0-9A-Z]{8}$/i.test(paste)) return;
    } else {
      if (!/^\d{6}$/.test(paste)) return;
    }

    const newOtpArray = paste
      .split("")
      .map((char) => (useBackupCode ? char.toUpperCase() : char));
    setOtpArray(newOtpArray);

    // Set focus to last field after paste
    inputsRef.current[newOtpArray.length - 1]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "disable") {
      if (!password) {
        toast.error("Please enter your password");
        return;
      }

      try {
        await dispatch(disable2FA(password)).unwrap();
        onSuccess();
      } catch {
        // Error handled by Redux slice
      }
    } else if (mode === "login") {
      if (!code || (code.length !== 6 && code.length !== 8)) {
        toast.error(
          useBackupCode
            ? "Please enter a valid backup code"
            : "Please enter a 6-digit verification code"
        );
        return;
      }
      try {
        await dispatch(
          verify2FALogin({ token: code, userId, rememberDevice })
        ).unwrap();
        onSuccess();
      } catch (error) {
        // Display the error message from the API or fallback
        const msg =
          (error && (error.message || error.toString())) ||
          "Verification failed. Please try again.";
        toast.error(msg);
      }
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "disable":
        return "Disable Two-Factor Authentication";
      case "login":
        return "Two-Factor Authentication";
      default:
        return "Verification Required";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "disable":
        return "Enter your password to disable 2FA";
      case "login":
        return useBackupCode
          ? "Enter one of your backup codes"
          : "Enter the 6-digit code from your authenticator app";
      default:
        return "Please complete verification";
    }
  };
  if (mode === "disable") {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-red-500/20 rounded-full flex items-center justify-center">
            <FiShield className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <h4 className="font-semibold text-red-300">{getTitle()}</h4>
            <p className="text-sm text-red-400">{getDescription()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            type="password"
            name="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="bg-neutral-800"
            required
          />

          <div className="flex space-x-3">
            <AuthButton
              type="submit"
              loading={isLoading}
              disabled={isLoading || !password}
              variant="danger"
              className="flex-1"
            >
              Disable 2FA
            </AuthButton>

            <AuthButton
              type="button"
              onClick={onCancel}
              variant="secondary"
              className="px-6"
            >
              Cancel
            </AuthButton>
          </div>
        </form>
      </div>
    );
  }
  return (
    <>
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center">
            {useBackupCode ? (
              <FiKey className="h-7 w-7 text-white" />
            ) : (
              <FiShield className="h-7 w-7 text-white" />
            )}
          </div>
          <h3 className="text-2xl font-semibold text-white">{getTitle()}</h3>
          <p className="text-sm text-neutral-400">{getDescription()}</p>
          {mode === "login" && (
            <div className="flex items-center justify-center gap-2 mt-2 text-neutral-300 font-medium">
              <FiSmartphone className="text-white" />
              <span>Use your authenticator app</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="otp-input"
              className="block text-sm font-medium text-neutral-300 mb-3 text-center"
            >
              Enter {useBackupCode ? "8-character" : "6-digit"} verification
              code
            </label>

            <div
              className="w-full flex justify-center items-center gap-2"
              onPaste={handlePaste}
            >
              {otpArray.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleInputChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  ref={(el) => (inputsRef.current[index] = el)}
                  autoFocus={index === 0}
                  inputMode={useBackupCode ? "text" : "numeric"}
                  className="w-10 h-12 sm:w-12 sm:h-14 rounded-lg border border-neutral-700 text-center text-xl font-mono font-medium bg-neutral-800/50 text-white focus:bg-neutral-800 focus:ring-2 focus:ring-white/20 focus:border-white focus:outline-none transition-all duration-200"
                />
              ))}
            </div>

            {/* Hidden input to maintain original logic */}
            <input type="hidden" value={code} readOnly />
          </div>

          <div className="flex flex-col space-y-3">
            <AuthButton
              type="submit"
              loading={isLoading}
              disabled={
                isLoading ||
                !code ||
                (useBackupCode ? code.length !== 8 : code.length !== 6)
              }
            >
              Verify
            </AuthButton>{" "}
            {mode === "login" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setCode("");
                    setOtpArray(Array(useBackupCode ? 6 : 8).fill(""));
                  }}
                  className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm sm:text-base text-white hover:text-neutral-200 font-medium transition-colors duration-200 rounded-lg hover:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  {useBackupCode ? "Use authenticator code" : "Use backup code"}
                </button>
              </div>
            )}
            {onCancel && (
              <AuthButton type="button" onClick={onCancel} variant="secondary">
                Cancel
              </AuthButton>
            )}
          </div>
        </form>

        {mode === "login" && (
          <div className="text-center text-xs text-neutral-500">
            <p>Lost your device? Contact support for assistance.</p>
          </div>
        )}
      </div>

      {mode === "login" && (
        <div className="mt-4 flex items-center space-x-2">
          <input
            type="checkbox"
            id="rememberDevice"
            checked={rememberDevice}
            onChange={(e) => setRememberDevice(e.target.checked)}
            className="h-4 w-4 text-white focus:ring-white/20 bg-neutral-800 border-neutral-600 rounded"
          />
          <label htmlFor="rememberDevice" className="text-sm text-neutral-300">
            Remember this device for 30 days
          </label>
        </div>
      )}
    </>
  );
};

export default OTPVerification;
