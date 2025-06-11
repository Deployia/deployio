import { useState } from "react";
import { useDispatch } from "react-redux";
import { FiLock, FiAlertTriangle } from "react-icons/fi";
import {
  disable2FA,
  generateNewBackupCodes,
} from "@redux/slices/twoFactorSlice";
import toast from "react-hot-toast";

const PasswordConfirmModal = ({
  title,
  description,
  confirmText,
  onConfirm,
  onCancel,
  type = "default", // "default", "danger"
  action = null, // "disable2FA", "generateBackupCodes", or custom function
}) => {
  const dispatch = useDispatch();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      if (onConfirm) {
        await onConfirm(password);
      } else if (action === "disable2FA") {
        await dispatch(disable2FA(password)).unwrap();
        toast.success("2FA disabled successfully");
      } else if (action === "generateBackupCodes") {
        await dispatch(generateNewBackupCodes(password)).unwrap();
        toast.success("New backup codes generated");
      }
    } catch (err) {
      setError(err.message || "Operation failed");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onCancel(); // Close modal on success
  };

  const getButtonStyle = () => {
    if (type === "danger") {
      return "bg-red-600 hover:bg-red-700 focus:ring-red-500/20";
    }
    return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/20";
  };

  const getIconColor = () => {
    if (type === "danger") {
      return "text-red-400";
    }
    return "text-blue-400";
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="mx-auto h-16 w-16 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center">
          {type === "danger" ? (
            <FiAlertTriangle className={`h-7 w-7 ${getIconColor()}`} />
          ) : (
            <FiLock className={`h-7 w-7 ${getIconColor()}`} />
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400 mt-2">{description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            placeholder="Enter your password"
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
            required
            autoFocus
          />
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className={`flex-1 min-h-[44px] px-4 py-2.5 text-white font-medium rounded-lg focus:outline-none focus:ring-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${getButtonStyle()}`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2.5 border border-neutral-600 text-gray-300 rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 transition-colors duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordConfirmModal;
