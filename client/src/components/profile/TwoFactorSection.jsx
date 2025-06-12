import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiShield,
  FiKey,
  FiRefreshCw,
  FiDownload,
  FiCopy,
  FiAlertTriangle,
} from "react-icons/fi";
import { motion } from "framer-motion";
import {
  get2FAStatus,
  generate2FASecret,
  clearError,
  clearQRCode,
  clearBackupCodes,
  generateNewBackupCodes,
  disable2FA,
} from "@redux/slices/twoFactorSlice";
import { useModal } from "@context/ModalContext";
import TwoFactorQRCode from "./TwoFactorQRCode";
import PasswordConfirmModal from "./PasswordConfirmModal";
import Spinner from "@components/Spinner";
import toast from "react-hot-toast";

const TwoFactorSection = () => {
  const dispatch = useDispatch();
  const { openModal, closeModal } = useModal();
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
  const [setupStep, setSetupStep] = useState("instructions"); // "instructions", "qr-code"

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
    setSetupStep("qr-code");
    setShowQRCode(true);
  };

  // Reusable function to create backup codes modal content
  const createBackupCodesModal = (title, description) => {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-xs text-gray-400">{description}</p>
        </div>

        {/* Compact Backup Codes Display */}
        <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4">
          {backupCodes && backupCodes.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="bg-neutral-900/50 border border-neutral-600 rounded-md p-2 text-center font-mono text-xs text-gray-300"
                >
                  {code}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Spinner size="sm" />
              <p className="text-gray-400 mt-2 text-xs">
                Generating backup codes...
              </p>
            </div>
          )}
        </div>

        {/* Compact Action Buttons */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={async () => {
              try {
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
                a.download = "deployio-backup-codes.txt";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success("Backup codes downloaded");
              } catch {
                toast.error("Failed to download backup codes");
              }
            }}
            className="flex-1 min-h-[36px] px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex items-center justify-center gap-2 transition-colors duration-200"
          >
            <FiDownload className="h-3 w-3 flex-shrink-0" />
            <span>Download</span>
          </button>
          <button
            onClick={async () => {
              try {
                const codesText = backupCodes.join("\n");
                await navigator.clipboard.writeText(codesText);
                toast.success("Backup codes copied to clipboard");
              } catch {
                toast.error("Failed to copy backup codes");
              }
            }}
            className="flex-1 min-h-[36px] px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500/20 flex items-center justify-center gap-2 transition-colors duration-200"
          >
            <FiCopy className="h-3 w-3 flex-shrink-0" />
            <span>Copy</span>
          </button>
          <button
            onClick={closeModal}
            className="flex-1 min-h-[36px] px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-colors duration-200"
          >
            Done
          </button>
        </div>

        {/* Compact Warning */}
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <FiAlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-300">
              <p className="font-medium">Important:</p>
              <p>Each code can only be used once. Store them securely!</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handle2FAEnabled = () => {
    setSetupStep("instructions");
    setShowQRCode(false);
    dispatch(clearQRCode());
    toast.success("2FA enabled successfully!");

    // Show backup codes in a modal after enabling 2FA
    setTimeout(() => {
      const backupCodesContent = createBackupCodesModal(
        "Save Your Backup Codes",
        "Save these backup codes in a secure location. You can use them to access your account if you lose access to your authenticator app."
      );
      openModal(backupCodesContent);
    }, 100);
  };

  const handleCancelSetup = () => {
    setSetupStep("instructions");
    setShowQRCode(false);
    dispatch(clearQRCode());
    dispatch(clearBackupCodes());
  };
  const handleDisable2FA = () => {
    openModal(
      <PasswordConfirmModal
        title="Disable Two-Factor Authentication"
        description="Enter your password to disable 2FA. This will make your account less secure."
        confirmText="Disable 2FA"
        onConfirm={async (password) => {
          await dispatch(disable2FA(password)).unwrap();
          toast.success("2FA disabled successfully");
          closeModal();
        }}
        onCancel={closeModal}
        type="danger"
      />
    );
  };
  const handleGenerateNewBackupCodes = () => {
    openModal(
      <PasswordConfirmModal
        title="Generate New Backup Codes"
        description="Enter your password to generate new backup codes. This will invalidate all existing backup codes."
        confirmText="Generate New Codes"
        onConfirm={async (password) => {
          await dispatch(generateNewBackupCodes(password)).unwrap();
          toast.success("New backup codes generated");
          closeModal();

          // Show the new backup codes in a modal after a brief delay
          setTimeout(() => {
            const backupCodesContent = createBackupCodesModal(
              "New Backup Codes Generated",
              "Your old backup codes have been invalidated. Save these new codes in a secure location."
            );
            openModal(backupCodesContent);
          }, 100);
        }}
        onCancel={closeModal}
      />
    );
  };

  if (isLoading && !twoFactorEnabled && !showQRCode) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
    >
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
              onClick={handleDisable2FA}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors duration-200"
            >
              Disable 2FA
            </button>
            <button
              onClick={handleGenerateNewBackupCodes}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-500/20 border border-gray-500/30 rounded-lg hover:bg-gray-500/30 focus:outline-none focus:ring-2 focus:ring-gray-500/20 gap-2 transition-colors duration-200"
            >
              <FiRefreshCw className="h-4 w-4 flex-shrink-0" />
              <span>Generate New Backup Codes</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {setupStep === "instructions" && (
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
                      Enable 2FA to add an extra layer of security to your
                      account. You&apos;ll need to enter a code from your
                      authenticator app when signing in.
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
                  </li>{" "}
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
                    <span>
                      Save your backup codes that will be shown in a popup
                    </span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleSetup2FA}
                className="w-full sm:w-auto min-h-[44px] px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex items-center justify-center gap-2 transition-colors duration-200"
              >
                <FiShield className="h-5 w-5 flex-shrink-0" />
                <span>Start Setup</span>
              </button>
            </div>
          )}{" "}
          {setupStep === "qr-code" && showQRCode && qrCode && secret && (
            <div className="space-y-6">
              {" "}
              {/* Step Progress */}
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium text-white">
                    ✓
                  </div>
                  <span className="ml-2 text-sm text-blue-400">
                    Instructions
                  </span>
                </div>
                <div className="w-12 h-0.5 bg-blue-600"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium text-white">
                    2
                  </div>
                  <span className="ml-2 text-sm text-white font-medium">
                    Setup & Verify
                  </span>
                </div>
              </div>{" "}
              <div className="text-center space-y-2">
                <h4 className="text-lg font-semibold text-white">
                  Scan QR Code & Verify
                </h4>
                <p className="text-sm text-gray-400">
                  Scan this QR code with your authenticator app, then enter the
                  verification code. After verification, your backup codes will
                  be shown in a popup.
                </p>
              </div>
              <TwoFactorQRCode
                qrCode={qrCode}
                secret={secret}
                onSuccess={handle2FAEnabled}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCancelSetup}
                  className="px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-500/20 border border-gray-500/30 rounded-lg hover:bg-gray-500/30 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-colors duration-200"
                >
                  Cancel Setup
                </button>
              </div>{" "}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default TwoFactorSection;
