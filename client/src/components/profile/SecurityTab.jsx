import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FaShieldAlt,
  FaKey,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTrash,
  FaPlus,
  FaCopy,
} from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import TwoFactorDashboard from "@components/auth/TwoFactorDashboard";
import OAuthAccountsSection from "./OAuthAccountsSection";
import { createApiKey, deleteApiKey } from "@redux/slices/userSlice";
import activityLogger from "@/utils/activityLogger";

const SecurityTab = ({
  passwordForm: _passwordForm,
  setPasswordForm: _setPasswordForm,
  twoFAEnabled: _twoFAEnabled,
  setTwoFAEnabled: _setTwoFAEnabled,
  apiKeys = [],
  linkedProviders = {},
  loading: _loading = false,
  securityScore = 0,
  onRefresh,
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showCreateApiKey, setShowCreateApiKey] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [generatedApiKey, setGeneratedApiKey] = useState(null);

  const generateApiKey = async () => {
    if (!newApiKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    try {
      const result = await dispatch(createApiKey({ name: newApiKeyName }));
      if (createApiKey.fulfilled.match(result)) {
        setGeneratedApiKey(result.payload.key);
        setNewApiKeyName("");
        setShowCreateApiKey(false);
        toast.success("API key generated successfully");
        // Log activity
        activityLogger.apiKeyGenerated();

        // Refresh data through parent component
        if (onRefresh) await onRefresh();
      }
    } catch {
      toast.error("Failed to generate API key");
    }
  };
  const handleDeleteApiKey = (keyId) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <span>Are you sure you want to delete this API key?</span>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  await dispatch(deleteApiKey(keyId));
                  toast.success("API key deleted"); // Log activity
                  activityLogger.apiKeyRevoked(keyId);

                  // Refresh data through parent component
                  if (onRefresh) await onRefresh();
                } catch {
                  toast.error("Failed to delete API key");
                }
                toast.dismiss(t.id);
              }}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getSecurityScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getSecurityScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  return (
    <div className="space-y-6">
      {/* Security Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Security Score</h3>
          <div className="flex items-center gap-2">
            <FaShieldAlt
              className={`text-2xl ${getSecurityScoreColor(securityScore)}`}
            />
            <span
              className={`text-2xl font-bold ${getSecurityScoreColor(
                securityScore
              )}`}
            >
              {securityScore}%
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Overall Security</span>
            <span
              className={`font-medium ${getSecurityScoreColor(securityScore)}`}
            >
              {getSecurityScoreLabel(securityScore)}
            </span>
          </div>
          <div className="w-full bg-neutral-700 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${securityScore}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-3 rounded-full ${
                securityScore >= 80
                  ? "bg-green-500"
                  : securityScore >= 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
          </div>
        </div>

        {/* Security Recommendations */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-300">
            Recommendations:
          </h4>{" "}
          {!user?.twoFactorEnabled && (
            <div className="flex items-center gap-2 text-sm text-orange-400">
              <FaExclamationTriangle />
              <span>Enable two-factor authentication for better security</span>
            </div>
          )}
          {(!linkedProviders ||
            Object.values(linkedProviders).filter(Boolean).length === 0) && (
            <div className="flex items-center gap-2 text-sm text-orange-400">
              <FaExclamationTriangle />
              <span>Connect OAuth accounts for additional login options</span>
            </div>
          )}
          {securityScore < 60 && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <FaExclamationTriangle />
              <span>Your account security needs improvement</span>
            </div>
          )}
          {securityScore >= 80 && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <FaCheckCircle />
              <span>Your account has excellent security</span>
            </div>
          )}
        </div>
      </motion.div>{" "}
      {/* Two-Factor Authentication */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <TwoFactorDashboard />
      </motion.div>
      {/* OAuth Connected Accounts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <OAuthAccountsSection />
      </motion.div>
      {/* API Keys Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">API Keys</h3>
            <p className="text-gray-400">
              Manage your API keys for programmatic access
            </p>
          </div>
          <button
            onClick={() => setShowCreateApiKey(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            Create Key
          </button>
        </div>
        {/* Generated API Key Display */}
        {generatedApiKey && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <FaCheckCircle className="text-green-400" />
              <span className="text-green-400 font-medium">
                API Key Generated!
              </span>
            </div>{" "}
            <p className="text-gray-300 text-sm mb-3">
              Please save this key securely. You won&apos;t be able to see it
              again.
            </p>
            <div className="flex items-center gap-2 p-3 bg-neutral-800 rounded border">
              <code className="flex-1 text-green-400 font-mono text-sm">
                {generatedApiKey}
              </code>
              <button
                onClick={() => copyToClipboard(generatedApiKey)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Copy to clipboard"
              >
                <FaCopy />
              </button>
            </div>
            <button
              onClick={() => setGeneratedApiKey(null)}
              className="mt-3 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
        {/* Create API Key Form */}
        {showCreateApiKey && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4 mb-6"
          >
            <h4 className="text-lg font-semibold text-white mb-4">
              Create New API Key
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newApiKeyName}
                  onChange={(e) => setNewApiKeyName(e.target.value)}
                  placeholder="e.g., Production API, Development"
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={generateApiKey}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate Key
                </button>
                <button
                  onClick={() => setShowCreateApiKey(false)}
                  className="px-4 py-2 border border-neutral-600 text-gray-300 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}{" "}
        {/* API Keys List */}
        <div className="space-y-4">
          {apiKeys &&
            apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg hover:border-neutral-600/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-white">{apiKey.name}</h4>
                    <div className="flex gap-1">
                      {apiKey.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <code className="font-mono">{apiKey.key}</code>
                    <span>
                      Created: {new Date(apiKey.created).toLocaleDateString()}
                    </span>
                    {apiKey.lastUsed && (
                      <span>
                        Last used:{" "}
                        {new Date(apiKey.lastUsed).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      copyToClipboard(apiKey.key.replace(/\*/g, ""))
                    }
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Copy key"
                  >
                    <FaCopy />
                  </button>
                  <button
                    onClick={() => handleDeleteApiKey(apiKey.id)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    title="Delete key"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
        </div>
        {(!apiKeys || apiKeys.length === 0) && !showCreateApiKey && (
          <div className="text-center py-8">
            <FaKey className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No API keys created yet</p>
            <p className="text-sm text-gray-500">
              Create your first API key to get started
            </p>{" "}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SecurityTab;
