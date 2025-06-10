import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiShield, FiKey, FiRefreshCw } from "react-icons/fi";
import {
  get2FAStatus,
  generate2FASecret,
  clearError,
  clearQRCode,
  clearBackupCodes,
} from "@redux/slices/twoFactorSlice";
import TwoFactorQRCode from "./TwoFactorQRCode";
import OTPVerification from "./OTPVerification";
import BackupCodes from "./BackupCodes";
import Spinner from "../Spinner";
import toast from "react-hot-toast";

const TwoFactorDashboard = () => {
  const dispatch = useDispatch();
  const {
    twoFactorEnabled,
    backupCodesCount,
    isLoading,
    error,
    qrCode,
    secret,
    backupCodes,
  } = useSelector((state) => state.twoFactor);

  const [showQRCode, setShowQRCode] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showDisableForm, setShowDisableForm] = useState(false);

  useEffect(() => {
    dispatch(get2FAStatus());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSetup2FA = () => {
    dispatch(generate2FASecret());
    setShowQRCode(true);
  };

  const handleBackToSetup = () => {
    setShowQRCode(false);
    dispatch(clearQRCode());
  };

  const handle2FAEnabled = () => {
    setShowQRCode(false);
    setShowBackupCodes(true);
    dispatch(clearQRCode());
    toast.success("2FA enabled successfully!");
  };

  const handleBackupCodesDownloaded = () => {
    setShowBackupCodes(false);
    // Only clear backup codes if they were from initial setup, not when generating new ones
    if (!twoFactorEnabled) {
      dispatch(clearBackupCodes());
    }
    dispatch(get2FAStatus()); // Refresh status
  };

  if (isLoading && !twoFactorEnabled && !showQRCode) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner />
      </div>
    );
  }

  // Show backup codes after successful 2FA setup
  if (showBackupCodes) {
    return (
      <BackupCodes
        backupCodes={backupCodes}
        onClose={handleBackupCodesDownloaded}
        showRefresh={twoFactorEnabled} // Show refresh button for existing accounts with 2FA enabled
      />
    );
  }

  // Show QR code setup
  if (showQRCode && qrCode && secret) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">
            Set Up Two-Factor Authentication
          </h3>
          <button
            onClick={handleBackToSetup}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
        </div>

        <TwoFactorQRCode
          qrCode={qrCode}
          secret={secret}
          onSuccess={handle2FAEnabled}
        />
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <FiShield className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">
            Two-Factor Authentication
          </h3>
          <p className="text-sm text-gray-400">
            Add an extra layer of security to your account
          </p>
        </div>
      </div>

      {twoFactorEnabled ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-green-500/30 rounded-full flex items-center justify-center">
                <FiShield className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-green-400">
                  Two-Factor Authentication is enabled
                </p>
                <p className="text-sm text-green-300">
                  Your account is protected with 2FA
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-green-400">
              <FiKey className="h-4 w-4" />
              <span>{backupCodesCount} backup codes remaining</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowDisableForm(!showDisableForm)}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors duration-200"
            >
              Disable 2FA
            </button>
            <button
              onClick={() => {
                // Clear any existing backup codes in the Redux store before showing the component
                dispatch(clearBackupCodes());
                setShowBackupCodes(true);
              }}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-500/20 border border-gray-500/30 rounded-lg hover:bg-gray-500/30 focus:outline-none focus:ring-2 focus:ring-gray-500/20 gap-2 transition-colors duration-200"
            >
              <FiRefreshCw className="h-4 w-4 flex-shrink-0" />
              <span>Generate New Backup Codes</span>
            </button>
          </div>

          {showDisableForm && (
            <div className="mt-4 p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg">
              <OTPVerification
                mode="disable"
                onSuccess={() => {
                  setShowDisableForm(false);
                  dispatch(get2FAStatus());
                  toast.success("2FA disabled successfully");
                }}
                onCancel={() => setShowDisableForm(false)}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="h-8 w-8 bg-yellow-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                <FiShield className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="font-medium text-yellow-400">
                  Two-Factor Authentication is disabled
                </p>
                <p className="text-sm text-yellow-300 mt-1">
                  Enable 2FA to add an extra layer of security to your account.
                  You&apos;ll need to enter a code from your authenticator app
                  when signing in.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-white">How it works:</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-xs font-medium text-blue-400">
                  1
                </span>
                <span>
                  Download an authenticator app like Google Authenticator,
                  Microsoft Authenticator, Authy, or 1Password
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-xs font-medium text-blue-400">
                  2
                </span>
                <span>Scan the QR code with your authenticator app</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-xs font-medium text-blue-400">
                  3
                </span>
                <span>Enter the verification code to complete setup</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-xs font-medium text-blue-400">
                  4
                </span>
                <span>Save your backup codes in a secure location</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleSetup2FA}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex items-center justify-center gap-2 transition-colors duration-200"
          >
            <FiShield className="h-5 w-5 flex-shrink-0" />
            <span>Enable Two-Factor Authentication</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorDashboard;
