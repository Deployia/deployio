import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiShield, FiKey, FiSmartphone } from "react-icons/fi";
import { disable2FA, verify2FALogin } from "../redux/slices/twoFactorSlice";
import Spinner from "./Spinner";
import toast from "react-hot-toast";

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
      } catch (err) {
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
        await dispatch(verify2FALogin({ token: code, userId })).unwrap();
        onSuccess();
      } catch (error) {
        // Display the error message from the API
        toast.error(error || "Verification failed. Please try again.");
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
            <FiShield className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <h4 className="font-semibold text-red-800">{getTitle()}</h4>
            <p className="text-sm text-red-600">{getDescription()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLoading || !password}
              className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  <span>Disabling...</span>
                </>
              ) : (
                <span>Disable 2FA</span>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
          {useBackupCode ? (
            <FiKey className="h-7 w-7 text-blue-600" />
          ) : (
            <FiShield className="h-7 w-7 text-blue-600" />
          )}
        </div>
        <h3 className="text-2xl font-semibold text-gray-900">{getTitle()}</h3>
        <p className="text-sm text-gray-600">{getDescription()}</p>
        {mode === "login" && (
          <div className="flex items-center justify-center gap-2 mt-1 text-gray-700 font-medium">
            <FiSmartphone className="text-blue-500" />
            <span>Use your authenticator app</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="otp-input"
            className="block text-sm font-medium text-gray-700 mb-3 text-center"
          >
            Enter {useBackupCode ? "8-character" : "6-digit"} verification code
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
                className="w-10 h-12 sm:w-12 sm:h-14 rounded-md border border-gray-300 text-center text-xl font-mono font-medium bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors"
              />
            ))}
          </div>

          {/* Hidden input to maintain original logic */}
          <input type="hidden" value={code} readOnly />
        </div>

        <div className="flex flex-col space-y-3">
          <button
            type="submit"
            disabled={
              isLoading ||
              !code ||
              (useBackupCode ? code.length !== 8 : code.length !== 6)
            }
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Spinner size="sm" />
                <span>Verifying...</span>
              </div>
            ) : (
              "Verify"
            )}
          </button>

          {mode === "login" && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setCode("");
                  setOtpArray(Array(useBackupCode ? 6 : 8).fill(""));
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {useBackupCode ? "Use authenticator code" : "Use backup code"}
              </button>
            </div>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {mode === "login" && (
        <div className="text-center text-xs text-gray-500">
          <p>Lost your device? Contact support for assistance.</p>
        </div>
      )}
    </div>
  );
};

export default OTPVerification;
