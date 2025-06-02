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
          {/* Apply themed text color */}
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            Set Up Two-Factor Authentication
          </h3>
          <button
            onClick={handleBackToSetup}
            // Apply themed text and hover states
            className="text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
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
    // Apply themed background, border, and shadow
    <div className="bg-[rgb(var(--bg-secondary))] rounded-lg shadow-sm border border-[rgb(var(--border-color))] p-6">
      <div className="flex items-center space-x-3 mb-6">
        {/* Apply themed icon color */}
        <FiShield className="h-6 w-6 text-[rgb(var(--accent-primary))]" />
        <div>
          {/* Apply themed text colors */}
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            Two-Factor Authentication
          </h3>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            Add an extra layer of security to your account
          </p>
        </div>
      </div>

      {twoFactorEnabled ? (
        <div className="space-y-4">
          {/* Apply themed background, border, and icon/text colors for enabled state */}
          <div className="flex items-center justify-between p-4 bg-[rgb(var(--accent-primary-faded))] border border-[rgb(var(--accent-primary))] rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-[rgb(var(--accent-primary-hover))] rounded-full flex items-center justify-center">
                <FiShield className="h-4 w-4 text-[rgb(var(--accent-primary))]" />
              </div>
              <div>
                <p className="font-medium text-[rgb(var(--accent-primary-text))]">
                  Two-Factor Authentication is enabled
                </p>
                <p className="text-sm text-[rgb(var(--accent-primary-text-muted))]">
                  Your account is protected with 2FA
                </p>
              </div>
            </div>
            {/* Apply themed icon and text color */}
            <div className="flex items-center space-x-2 text-sm text-[rgb(var(--accent-primary-text-muted))]">
              <FiKey className="h-4 w-4" />
              <span>{backupCodesCount} backup codes remaining</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowDisableForm(!showDisableForm)}
              // Apply themed button styles for danger action
              className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-danger))] bg-[rgb(var(--bg-danger-faded))] border border-[rgb(var(--border-danger))] rounded-lg hover:bg-[rgb(var(--bg-danger-hover))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-danger))] focus:ring-offset-2"
            >
              Disable 2FA
            </button>{" "}
            <button
              onClick={() => {
                // Clear any existing backup codes in the Redux store before showing the component
                dispatch(clearBackupCodes());
                setShowBackupCodes(true);
              }}
              // Apply themed button styles for secondary action
              className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-color))] rounded-lg hover:bg-[rgb(var(--button-secondary-hover-bg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-secondary))] focus:ring-offset-2 flex items-center space-x-2"
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
          {/* Apply themed background, border, and icon/text colors for warning/disabled state */}
          <div className="p-4 bg-[rgb(var(--bg-warning-faded))] border border-[rgb(var(--border-warning))] rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="h-8 w-8 bg-[rgb(var(--bg-warning-hover))] rounded-full flex items-center justify-center flex-shrink-0">
                <FiShield className="h-4 w-4 text-[rgb(var(--text-warning))]" />
              </div>
              <div>
                <p className="font-medium text-[rgb(var(--text-warning-strong))]">
                  Two-Factor Authentication is disabled
                </p>
                <p className="text-sm text-[rgb(var(--text-warning))] mt-1">
                  Enable 2FA to add an extra layer of security to your account.
                  You'll need to enter a code from your authenticator app when
                  signing in.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {/* Apply themed text color */}
            <h4 className="font-medium text-[rgb(var(--text-primary))]">
              How it works:
            </h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-[rgb(var(--text-secondary))]">
              <li>
                When you enable 2FA, you'll be asked to scan a QR code with an
                authenticator app (like Google Authenticator, Authy, etc.).
              </li>
              <li>
                After scanning the QR code, the app will generate time-based
                codes.
              </li>
              <li>
                Enter the code from the app into the website to verify and
                complete the setup.
              </li>
              <li>
                Save the backup codes in a secure place. You'll need these if
                you lose access to your authenticator app.
              </li>
            </ul>
            {/* Apply themed button styles */}
            <button
              onClick={handleSetup2FA}
              disabled={isLoading.generate2FASecret}
              className={`w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-[rgb(var(--accent-primary))] rounded-lg shadow-sm hover:bg-[rgb(var(--accent-secondary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] focus:ring-offset-2 transition-colors duration-200 ${
                isLoading.generate2FASecret
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isLoading.generate2FASecret ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Generating Secret...</span>
                </>
              ) : (
                <>
                  <FiKey className="mr-2 h-5 w-5" />
                  Enable Two-Factor Authentication
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorDashboard;
