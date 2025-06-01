import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiShield, FiKey, FiDownload, FiRefreshCw } from "react-icons/fi";
import {
  get2FAStatus,
  generate2FASecret,
  clearError,
  clearQRCode,
  clearBackupCodes,
} from "../redux/slices/twoFactorSlice";
import TwoFactorQRCode from "./TwoFactorQRCode";
import OTPVerification from "./OTPVerification";
import BackupCodes from "./BackupCodes";
import Spinner from "./Spinner";
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
          <h3 className="text-lg font-semibold text-gray-900">
            Set Up Two-Factor Authentication
          </h3>
          <button
            onClick={handleBackToSetup}
            className="text-sm text-gray-600 hover:text-gray-800"
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <FiShield className="h-6 w-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Two-Factor Authentication
          </h3>
          <p className="text-sm text-gray-600">
            Add an extra layer of security to your account
          </p>
        </div>
      </div>

      {twoFactorEnabled ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <FiShield className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">
                  Two-Factor Authentication is enabled
                </p>
                <p className="text-sm text-green-600">
                  Your account is protected with 2FA
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <FiKey className="h-4 w-4" />
              <span>{backupCodesCount} backup codes remaining</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowDisableForm(!showDisableForm)}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Disable 2FA
            </button>{" "}
            <button
              onClick={() => {
                // Clear any existing backup codes in the Redux store before showing the component
                dispatch(clearBackupCodes());
                setShowBackupCodes(true);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center space-x-2"
            >
              <FiRefreshCw className="h-4 w-4" />
              <span>Generate New Backup Codes</span>
            </button>
          </div>

          {showDisableForm && (
            <OTPVerification
              mode="disable"
              onSuccess={() => {
                setShowDisableForm(false);
                dispatch(get2FAStatus());
                toast.success("2FA disabled successfully");
              }}
              onCancel={() => setShowDisableForm(false)}
            />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiShield className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-800">
                  Two-Factor Authentication is disabled
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  Enable 2FA to add an extra layer of security to your account.
                  You'll need to enter a code from your authenticator app when
                  signing in.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">How it works:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {" "}
              <li className="flex items-start space-x-2">
                <span className="font-medium text-blue-600">1.</span>
                <span>
                  Download an authenticator app like Google Authenticator,
                  Microsoft Authenticator, Authy, or 1Password
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-medium text-blue-600">2.</span>
                <span>Scan the QR code with your authenticator app</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-medium text-blue-600">3.</span>
                <span>Enter the verification code to complete setup</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-medium text-blue-600">4.</span>
                <span>Save your backup codes in a secure location</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleSetup2FA}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
          >
            <FiShield className="h-5 w-5" />
            <span>Enable Two-Factor Authentication</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorDashboard;
