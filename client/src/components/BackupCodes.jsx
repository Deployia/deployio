import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiDownload,
  FiCopy,
  FiRefreshCw,
  FiAlertTriangle,
} from "react-icons/fi";
import { generateNewBackupCodes } from "../redux/slices/twoFactorSlice";
import Spinner from "./Spinner";
import toast from "react-hot-toast";

const BackupCodes = ({
  backupCodes: initialBackupCodes = [],
  onClose,
  showRefresh = false,
}) => {
  const dispatch = useDispatch();
  const { isLoading, backupCodes: storeBackupCodes } = useSelector(
    (state) => state.twoFactor
  );

  // Use backupCodes from Redux store if available, otherwise use the ones passed in via props
  const backupCodes =
    storeBackupCodes.length > 0 ? storeBackupCodes : initialBackupCodes;

  const [password, setPassword] = useState("");
  const [showRefreshForm, setShowRefreshForm] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const handleCopy = async () => {
    try {
      const codesText = backupCodes.join("\n");
      await navigator.clipboard.writeText(codesText);
      toast.success("Backup codes copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy backup codes");
    }
  };

  const handleDownload = () => {
    const codesText = [
      "DeployIO Backup Codes",
      "========================",
      "",
      "These are your backup codes for two-factor authentication.",
      "Each code can only be used once.",
      "Store them in a safe place!",
      "",
      ...backupCodes,
      "",
      `Generated on: ${new Date().toLocaleString()}`,
    ].join("\n");

    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deployio-backup-codes.txt"; // Changed filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setHasDownloaded(true);
    toast.success("Backup codes downloaded");
  };
  const handleGenerateNew = async (e) => {
    e.preventDefault();

    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    try {
      await dispatch(generateNewBackupCodes(password)).unwrap();
      setShowRefreshForm(false);
      setPassword("");
      // Reset hasDownloaded to false since new codes were generated
      setHasDownloaded(false);
      toast.success("New backup codes generated");
    } catch (error) {
      // Error already handled by Redux slice through its rejected action
      console.error("Failed to generate new backup codes", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
          <FiAlertTriangle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Save Your Backup Codes
        </h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Store these backup codes in a safe place. Each code can only be used
          once and will help you regain access if you lose your authenticator
          device.
        </p>
      </div>
      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FiAlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Important:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Each backup code can only be used once</li>
              <li>
                Store them in a secure location (password manager recommended)
              </li>
              <li>Don't share these codes with anyone</li>
              <li>
                Generate new codes if you suspect they've been compromised
              </li>
            </ul>
          </div>
        </div>
      </div>{" "}
      {/* Backup Codes Grid */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        {backupCodes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="bg-white border border-gray-300 rounded-lg p-3 text-center font-mono text-sm"
              >
                {code}
              </div>
            ))}
          </div>
        ) : showRefresh ? (
          <div className="text-center py-6">
            <p className="text-gray-600">
              Use the "Generate New Codes" button to create new backup codes
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <Spinner />
            <p className="text-gray-600 mt-2">Loading backup codes...</p>
          </div>
        )}
      </div>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={handleDownload}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2"
        >
          <FiDownload className="h-4 w-4" />
          <span>Download as Text File</span>
        </button>

        <button
          onClick={handleCopy}
          className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center space-x-2"
        >
          <FiCopy className="h-4 w-4" />
          <span>Copy to Clipboard</span>
        </button>

        {showRefresh && (
          <button
            onClick={() => setShowRefreshForm(!showRefreshForm)}
            className="px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center space-x-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Generate New Codes</span>
          </button>
        )}
      </div>
      {/* Generate New Codes Form */}
      {showRefreshForm && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <FiRefreshCw className="h-5 w-5 text-orange-600" />
            <div>
              <h4 className="font-medium text-orange-800">
                Generate New Backup Codes
              </h4>
              <p className="text-sm text-orange-600">
                This will invalidate all current backup codes
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerateNew} className="space-y-4">
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
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter your password to confirm"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading || !password}
                className="flex-1 px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>Generate New Codes</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowRefreshForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}{" "}
      {/* Continue Button */}
      <div className="text-center">
        <button
          onClick={onClose}
          disabled={backupCodes.length > 0 && !hasDownloaded}
          className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {backupCodes.length === 0
            ? "Return to Dashboard"
            : hasDownloaded
            ? "Continue"
            : "Download codes first to continue"}
        </button>
      </div>
      {backupCodes.length > 0 && !hasDownloaded && (
        <div className="text-center text-sm text-gray-500">
          Please download or copy your backup codes before continuing
        </div>
      )}
    </div>
  );
};

export default BackupCodes;
