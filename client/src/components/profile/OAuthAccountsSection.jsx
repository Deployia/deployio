import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  FaGoogle,
  FaGithub,
  FaLink,
  FaUnlink,
  FaShieldAlt,
  FaCheck,
  FaExclamationTriangle,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const OAuthAccountsSection = () => {
  const { user: authUser } = useSelector((state) => state.auth);
  const [localLoading, setLocalLoading] = useState({});

  // Extract provider connection status from user data
  const providerStatus = useMemo(() => {
    if (!authUser) return {};

    return {
      // Google OAuth (for authentication)
      google: {
        connected: !!authUser.google?.email || !!authUser.googleId,
        data: authUser.google || {},
      },
      // GitHub OAuth (for both auth and git integration)
      github: {
        connected:
          !!authUser.githubId || !!authUser.gitProviders?.github?.isConnected,
        data: authUser.gitProviders?.github || authUser.github || {},
      },
    };
  }, [authUser]);

  const providers = [
    {
      id: "google",
      name: "Google",
      icon: FaGoogle,
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-500/30",
      buttonColor: "bg-red-600 hover:bg-red-700",
      description: "Sign in with Google for seamless authentication",
      linkUrl: "/api/v1/users/auth/google",
    },
    {
      id: "github",
      name: "GitHub",
      icon: FaGithub,
      color: "text-gray-300",
      bgColor: "bg-gray-500/20",
      borderColor: "border-gray-500/30",
      buttonColor: "bg-gray-600 hover:bg-gray-700",
      description: "Connect GitHub for authentication and repository access",
      linkUrl: "/api/v1/users/auth/github",
    },
  ];

  const handleLink = (provider) => {
    setLocalLoading((prev) => ({ ...prev, [provider.id]: true }));

    const baseUrl =
      import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000";
    window.location.href = `${baseUrl}${provider.linkUrl}`;
  };

  const handleUnlink = async (providerId) => {
    if (localLoading[providerId]) return;

    const confirmed = window.confirm(
      `Are you sure you want to unlink your ${providerId} account? This will remove access to related features.`
    );

    if (!confirmed) return;

    try {
      setLocalLoading((prev) => ({ ...prev, [providerId]: true }));

      // TODO: Implement unlinking API call
      toast.error(
        "Account unlinking is not yet implemented. Please contact support if needed."
      );
    } catch (error) {
      toast.error(error.message || `Failed to unlink ${providerId} account`);
    } finally {
      setLocalLoading((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const connectedCount = Object.values(providerStatus).filter(
    (status) => status.connected
  ).length;

  return (
    <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <FaLink className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">
            Connected Accounts
          </h3>
          <p className="text-gray-400 text-sm">
            Link your accounts for enhanced security and convenience
          </p>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="space-y-4">
        {providers.map((provider) => {
          const status = providerStatus[provider.id] || {};
          const isConnected = status.connected || false;
          const isLoading = localLoading[provider.id] || false;
          const connectionData = status.data || {};

          return (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                isConnected
                  ? "border-green-500/30 bg-green-500/10 hover:border-green-500/50"
                  : `${provider.borderColor} ${provider.bgColor} hover:border-neutral-600/50`
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Provider Info */}
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`p-3 rounded-full transition-colors ${
                      isConnected
                        ? "bg-green-500/20 text-green-400"
                        : `${provider.bgColor} ${provider.color}`
                    }`}
                  >
                    <provider.icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white">
                        {provider.name}
                      </h4>
                      {isConnected && (
                        <FaCheck className="w-4 h-4 text-green-400" />
                      )}
                    </div>

                    <p className="text-sm text-gray-400 mb-2">
                      {provider.description}
                    </p>

                    {/* Connection Details */}
                    {isConnected &&
                      (connectionData.username || connectionData.email) && (
                        <div className="text-xs text-gray-500 space-y-1">
                          {connectionData.username && (
                            <div>
                              Connected as:{" "}
                              <span className="text-gray-400">
                                {connectionData.username}
                              </span>
                            </div>
                          )}
                          {connectionData.email &&
                            connectionData.username !==
                              connectionData.email && (
                              <div>
                                Email:{" "}
                                <span className="text-gray-400">
                                  {connectionData.email}
                                </span>
                              </div>
                            )}
                        </div>
                      )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <div className="flex items-center gap-1 text-green-400 text-sm px-2 py-1 bg-green-500/20 rounded-md">
                        <FaShieldAlt className="w-3 h-3" />
                        <span>Connected</span>
                      </div>
                      <button
                        onClick={() => handleUnlink(provider.id)}
                        disabled={isLoading}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Unlink ${provider.name}`}
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-red-400" />
                        ) : (
                          <FaUnlink className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleLink(provider)}
                      disabled={isLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white ${provider.buttonColor}`}
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white" />
                      ) : (
                        <>
                          <FaExternalLinkAlt className="w-4 h-4" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Warning for no connections */}
      {connectedCount === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 border border-yellow-500/30 bg-yellow-500/10 rounded-lg"
        >
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <FaExclamationTriangle className="w-5 h-5" />
            <span className="font-medium">No accounts connected</span>
          </div>
          <p className="text-sm text-yellow-300">
            Connect your accounts to enable enhanced security features and
            streamlined authentication.
          </p>
        </motion.div>
      )}

      {/* Success message for connections */}
      {connectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 border border-green-500/30 bg-green-500/10 rounded-lg"
        >
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <FaShieldAlt className="w-5 h-5" />
            <span className="font-medium">
              {connectedCount} account{connectedCount > 1 ? "s" : ""} connected
            </span>
          </div>
          <p className="text-sm text-green-300">
            Your connected accounts provide secure authentication options and
            enhanced platform features.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default OAuthAccountsSection;
