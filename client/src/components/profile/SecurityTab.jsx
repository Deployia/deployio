import { useState, useEffect, useMemo } from "react";
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
import TwoFactorSection from "./TwoFactorSection";
import OAuthAccountsSection from "./OAuthAccountsSection";
import PasswordSection from "./PasswordSection";
import ProfileErrorBoundary from "./ProfileErrorBoundary";
import { FormSectionSkeleton, StatsGridSkeleton } from "./LoadingState";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import {
  createApiKey,
  deleteApiKey,
  fetchApiKeys,
  selectApiKeys,
  selectApiKeyLoading,
  selectNewlyCreatedKey,
  clearNewlyCreatedKey,
} from "@redux/slices/apiKeySlice";
import { get2FAStatus } from "@redux/slices/twoFactorSlice";
import { useModal } from "@context/ModalContext";
import {
  calculateSecurityScore,
  getSecurityScoreColor,
  getSecurityScoreLabel,
  getSecurityScoreBarColor,
} from "@utils/securityScore";

const SecurityTab = () => {
  const dispatch = useDispatch();
  const { openModal, closeModal } = useModal(); // Get all required data from Redux state
  const { user: authUser } = useSelector((state) => state.auth);
  const apiKeys = useSelector(selectApiKeys);
  const apiKeyLoading = useSelector(selectApiKeyLoading);
  const newlyCreatedKey = useSelector(selectNewlyCreatedKey);
  const { twoFactorEnabled } = useSelector((state) => state.twoFactor); // Local state
  const [showCreateApiKey, setShowCreateApiKey] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [generatedApiKey, setGeneratedApiKey] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  // Compute loading states
  const isCreatingKey = apiKeyLoading.create;

  // Extract OAuth providers from user data (new structure)
  const linkedProviders = useMemo(() => {
    if (!authUser) return {};

    const providers = {};

    // Check git providers
    if (authUser.gitProviders) {
      providers.github = authUser.gitProviders.github?.isConnected || false;
      providers.gitlab = authUser.gitProviders.gitlab?.isConnected || false;
      providers.azureDevOps =
        authUser.gitProviders.azureDevOps?.isConnected || false;
      providers.bitbucket =
        authUser.gitProviders.bitbucket?.isConnected || false;
    }

    // Check Google OAuth
    if (authUser.googleId) {
      providers.google = true;
    }
    if (authUser.githubId) {
      providers.github = true;
    }

    return providers;
  }, [authUser]);

  // Calculate security score using utility
  const securityScore = calculateSecurityScore({
    authUser,
    twoFactorEnabled,
    apiKeys,
    linkedProviders,
  });

  // Initial data loading ONLY
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.allSettled([
          dispatch(fetchApiKeys()),
          dispatch(get2FAStatus()),
        ]);
      } catch (error) {
        console.error("Error loading security data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadData();
  }, [dispatch]); // Check for newly created key and handle display
  useEffect(() => {
    if (newlyCreatedKey) {
      setGeneratedApiKey(newlyCreatedKey.key || newlyCreatedKey.fullKey);
      // Clear the newly created key from Redux after displaying
      const timer = setTimeout(() => {
        dispatch(clearNewlyCreatedKey());
      }, 30000); // Clear after 30 seconds for security

      return () => clearTimeout(timer);
    }
  }, [newlyCreatedKey, dispatch]);
  const generateApiKey = async () => {
    if (!newApiKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }
    try {
      const result = await dispatch(createApiKey({ name: newApiKeyName }));
      if (createApiKey.fulfilled.match(result)) {
        setNewApiKeyName("");
        setShowCreateApiKey(false);

        // Show success feedback
        toast.success("API key generated successfully");
      }
    } catch (error) {
      toast.error("Failed to generate API key");
      console.error("API key generation error:", error);
    }
  };
  const handleDeleteApiKey = (keyId, keyName) => {
    openModal(
      <ConfirmDeleteModal
        title="Delete API Key"
        description="This action cannot be undone. This will permanently delete the API key and revoke all access associated with it."
        itemName={keyName}
        onConfirm={async () => {
          try {
            await dispatch(deleteApiKey(keyId));
            toast.success("API key deleted successfully");
            closeModal();
          } catch (error) {
            toast.error("Failed to delete API key");
            console.error("API key deletion error:", error);
          }
        }}
        onCancel={closeModal}
      />
    );
  };
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }; // Show loading state during initial load
  if (isInitialLoading) {
    return (
      <div className="space-y-8">
        <StatsGridSkeleton columns={3} />
        <FormSectionSkeleton rows={4} />
        <FormSectionSkeleton rows={3} />
      </div>
    );
  }

  return (
    <ProfileErrorBoundary fallbackMessage="Failed to load security settings">
      <div className="space-y-6">
        {/* Security Score Card */}
        <motion.div
          id="security-score"
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
                className={`font-medium ${getSecurityScoreColor(
                  securityScore
                )}`}
              >
                {getSecurityScoreLabel(securityScore)}
              </span>
            </div>
            <div className="w-full bg-neutral-700 rounded-full h-3">
              {" "}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${securityScore}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-3 rounded-full ${getSecurityScoreBarColor(
                  securityScore
                )}`}
              />
            </div>
          </div>

          {/* Security Recommendations */}
          <div className="space-y-2">
            {" "}
            <h4 className="text-sm font-semibold text-gray-300">
              Recommendations:
            </h4>{" "}
            {!authUser?.twoFactorEnabled && (
              <div className="flex items-center gap-2 text-sm text-orange-400">
                <FaExclamationTriangle />
                <span>
                  Enable two-factor authentication for better security
                </span>
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
        </motion.div>

        {/* Password Management */}
        {/* Password Section */}
        <motion.div
          id="security-password"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PasswordSection />
        </motion.div>

        {/* Two-Factor Authentication */}
        <div id="security-2fa">
          <TwoFactorSection />
        </div>

        {/* OAuth Connected Accounts */}
        <motion.div
          id="security-oauth"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <OAuthAccountsSection />
        </motion.div>
        {/* API Keys Management */}
        <motion.div
          id="security-api-keys"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                API Keys
              </h3>
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
                  {" "}
                  <button
                    onClick={generateApiKey}
                    disabled={isCreatingKey || !newApiKeyName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isCreatingKey ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      "Generate Key"
                    )}
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
            {apiKeyLoading.fetch ? (
              // Skeleton loading for API keys
              <div className="space-y-3">
                {[...Array(2)].map((_, index) => (
                  <div
                    key={index}
                    className="p-4 bg-neutral-800/30 border border-neutral-700/30 rounded-lg animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 bg-neutral-700/50 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-neutral-700/30 rounded w-48"></div>
                      </div>
                      <div className="h-8 bg-neutral-700/50 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : apiKeys && Array.isArray(apiKeys) && apiKeys.length > 0 ? (
              apiKeys.map((apiKey) => (
                <motion.div
                  key={apiKey._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="group p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg hover:border-neutral-600/50 hover:bg-neutral-800/70 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <FaKey className="text-blue-400 text-sm" />
                          <h4 className="font-medium text-white truncate">
                            {apiKey.name || "Unnamed Key"}
                          </h4>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full border ${
                              apiKey.isActive !== false &&
                              apiKey.status !== "inactive"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                            }`}
                          >
                            {apiKey.isActive !== false &&
                            apiKey.status !== "inactive"
                              ? "active"
                              : "inactive"}
                          </span>

                          {/* Usage indicator */}
                          {apiKey.lastUsed && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                              Recently used
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Permissions */}
                      {apiKey.permissions && apiKey.permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {apiKey.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-md border border-purple-500/30"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Key details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Created:</span>
                          <span className="text-gray-300">
                            {apiKey.created || apiKey.createdAt
                              ? new Date(
                                  apiKey.created || apiKey.createdAt
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>

                        {(apiKey.lastUsed || apiKey.usage?.lastUsed) && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Last used:</span>
                            <span className="text-gray-300">
                              {new Date(
                                apiKey.lastUsed || apiKey.usage.lastUsed
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {apiKey.usage && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Usage:</span>
                            <span className="text-gray-300">
                              {apiKey.usage.totalRequests || 0} requests
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Key preview (partial) */}
                      <div className="p-2 bg-neutral-900/50 border border-neutral-700/50 rounded-md">
                        <div className="flex items-center justify-between">
                          <code className="text-xs text-gray-400 font-mono truncate">
                            {apiKey.maskedKey && apiKey.maskedKey.includes("*")
                              ? apiKey.maskedKey
                              : apiKey.maskedKey && apiKey.maskedKey.length > 16
                              ? apiKey.maskedKey.slice(0, 12) +
                                "..." +
                                apiKey.maskedKey.slice(-4)
                              : apiKey.keyPrefix
                              ? `${apiKey.keyPrefix}${"*".repeat(8)}...${(
                                  apiKey._id || ""
                                )
                                  .toString()
                                  .slice(-4)}`
                              : `dp_****...${(apiKey._id || "")
                                  .toString()
                                  .slice(-4)}`}
                          </code>
                          <span className="text-xs text-gray-500 ml-2">
                            ID: {(apiKey._id || "").toString().slice(-8)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() =>
                          copyToClipboard(apiKey.key || apiKey._id)
                        }
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors tooltip"
                        title={apiKey.key ? "Copy API Key" : "Copy Key ID"}
                        disabled={apiKey.key && apiKey.key.includes("*")}
                      >
                        <FaCopy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteApiKey(apiKey._id, apiKey.name)
                        }
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors tooltip"
                        title="Delete API Key"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              // Empty state
              <div className="text-center py-12 border border-neutral-700/50 rounded-lg bg-neutral-800/30">
                <FaKey className="mx-auto text-5xl text-gray-500 mb-4" />
                <h4 className="text-lg font-medium text-gray-300 mb-2">
                  No API Keys Created
                </h4>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  API keys allow you to authenticate with our services
                  programmatically. Create your first key to get started with
                  our API.
                </p>
                <button
                  onClick={() => setShowCreateApiKey(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPlus className="w-4 h-4" />
                  Create Your First Key
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </ProfileErrorBoundary>
  );
};

export default SecurityTab;
