import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiShield, FiKey } from "react-icons/fi";
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

  const isLoading = mode === "disable" ? isDisabling : loading.login;

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
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
          {useBackupCode ? (
            <FiKey className="h-6 w-6 text-blue-600" />
          ) : (
            <FiShield className="h-6 w-6 text-blue-600" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
        <p className="text-sm text-gray-600">{getDescription()}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder={useBackupCode ? "XXXXXXXX" : "000000"}
            value={code}
            onChange={(e) => {
              const value = useBackupCode
                ? e.target.value.toUpperCase().slice(0, 8)
                : e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(value);
            }}
            className="w-full px-4 py-3 text-center text-lg font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={useBackupCode ? 8 : 6}
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          disabled={
            isLoading ||
            !code ||
            (useBackupCode ? code.length !== 8 : code.length !== 6)
          }
          className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" />
              <span>Verifying...</span>
            </>
          ) : (
            <span>Verify</span>
          )}
        </button>

        {mode === "login" && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode("");
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {useBackupCode
                ? "Use authenticator code instead"
                : "Use backup code instead"}
            </button>
          </div>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        )}
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
