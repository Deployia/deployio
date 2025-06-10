import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { QRCodeSVG } from "qrcode.react";
import { FiCopy, FiEye, FiEyeOff } from "react-icons/fi";
import { enable2FA } from "@redux/slices/twoFactorSlice";
import Spinner from "../Spinner";
import toast from "react-hot-toast";

const TwoFactorQRCode = ({ qrCode, secret, onSuccess }) => {
  const dispatch = useDispatch();
  const { isEnabling, error } = useSelector((state) => state.twoFactor);

  const [verificationCode, setVerificationCode] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      toast.success("Secret copied to clipboard");
    } catch {
      toast.error("Failed to copy secret");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit verification code");
      return;
    }
    try {
      await dispatch(
        enable2FA({
          token: verificationCode,
          secret,
        })
      ).unwrap();
      onSuccess();
    } catch {
      // Error is already handled by Redux slice
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Instructions */}
      <div className="text-center space-y-2">
        <h4 className="font-semibold text-white">Step 1: Scan QR Code</h4>
        <p className="text-sm text-gray-400">
          Open your authenticator app and scan this QR code
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center p-6 bg-white border-2 border-neutral-600 rounded-lg">
        <QRCodeSVG value={qrCode} size={200} level="M" includeMargin={true} />
      </div>

      {/* Manual Entry Option */}
      <div className="space-y-3">
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm text-blue-400 hover:text-blue-300 rounded-lg hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 gap-1 transition-colors duration-200"
          >
            {showSecret ? (
              <FiEyeOff className="h-4 w-4 flex-shrink-0" />
            ) : (
              <FiEye className="h-4 w-4 flex-shrink-0" />
            )}
            <span>{showSecret ? "Hide" : "Show"} manual entry key</span>
          </button>
        </div>
        {showSecret && (
          <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Manual Entry Key:
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-3 py-2 text-sm font-mono bg-neutral-900/50 border border-neutral-600 rounded-lg break-all text-gray-300">
                  {secret}
                </code>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="min-h-[44px] px-3 py-2 text-gray-400 hover:text-white border border-neutral-600 rounded-lg hover:bg-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-colors duration-200"
                  title="Copy secret"
                >
                  <FiCopy className="h-4 w-4" />
                </button>
              </div>{" "}
              <p className="text-xs text-gray-500">
                Enter this key manually if you cannot scan the QR code
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Verification Form */}
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h4 className="font-semibold text-white">
            Step 2: Enter Verification Code
          </h4>
          <p className="text-sm text-gray-400">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(
                  e.target.value.replace(/\D/g, "").slice(0, 6)
                )
              }
              className="w-full px-4 py-3 text-center text-lg font-mono border border-neutral-600 bg-neutral-800/50 text-white rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 placeholder-gray-500"
              maxLength={6}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 text-center bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isEnabling || verificationCode.length !== 6}
            className="w-full min-h-[44px] px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors duration-200"
          >
            {isEnabling ? (
              <>
                <Spinner size="sm" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify and Enable 2FA</span>
            )}
          </button>
        </form>
      </div>

      {/* Help Text */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>Popular authenticator apps:</p>
        <p>Google Authenticator, Authy, Microsoft Authenticator</p>
      </div>
    </div>
  );
};

export default TwoFactorQRCode;
