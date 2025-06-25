import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  FaGoogle,
  FaGithub,
  FaGitlab,
  FaMicrosoft,
  FaBitbucket,
  FaLink,
  FaUnlink,
  FaShieldAlt,
  FaCheck,
  FaExclamationTriangle,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const OAuthAccountsSection = ({ linkedProviders = {} }) => {
  const { user: authUser } = useSelector((state) => state.auth);
  const [localLoading, setLocalLoading] = useState({});

  // Extract provider connection status from user data
  const providerStatus = useMemo(() => {
    if (!authUser) return {};

    const status = {};

    // Check git providers
    if (authUser.gitProviders) {
      status.github = {
        connected: authUser.gitProviders.github?.isConnected || false,
        data: authUser.gitProviders.github,
      };
      status.gitlab = {
        connected: authUser.gitProviders.gitlab?.isConnected || false,
        data: authUser.gitProviders.gitlab,
      };
      status.azureDevOps = {
        connected: authUser.gitProviders.azureDevOps?.isConnected || false,
        data: authUser.gitProviders.azureDevOps,
      };
      status.bitbucket = {
        connected: authUser.gitProviders.bitbucket?.isConnected || false,
        data: authUser.gitProviders.bitbucket,
      };
    }

    // Check Google OAuth
    status.google = {
      connected: !!authUser.google?.email,
      data: authUser.google,
    };

    return status;
  }, [authUser]);

  const providers = [
    {
      id: "google",
      name: "Google",
      icon: FaGoogle,
      color: "text-red-500",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-500/30",
      description: "Connect your Google account for seamless authentication",
      linkUrl: "/api/v1/users/auth/google",
    },
    {
      id: "github",
      name: "GitHub",
      icon: FaGithub,
      color: "text-gray-300",
      bgColor: "bg-gray-500/20",
      borderColor: "border-gray-500/30",
      description: "Link your GitHub account for repository access",
      linkUrl: "/api/v1/git/connect/github",
    },
    {
      id: "gitlab",
      name: "GitLab",
      icon: FaGitlab,
      color: "text-orange-500",
      bgColor: "bg-orange-500/20",
      borderColor: "border-orange-500/30",
      description: "Connect to GitLab for project management",
      linkUrl: "/api/v1/git/connect/gitlab",
    },
    {
      id: "azureDevOps",
      name: "Azure DevOps",
      icon: FaMicrosoft,
      color: "text-blue-500",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30",
      description: "Link Azure DevOps for enterprise workflows",
      linkUrl: "/api/v1/git/connect/azure-devops",
    },
    {
      id: "bitbucket",
      name: "Bitbucket",
      icon: FaBitbucket,
      color: "text-blue-400",
      bgColor: "bg-blue-400/20",
      borderColor: "border-blue-400/30",
      description: "Connect Bitbucket for team collaboration",
      linkUrl: "/api/v1/git/connect/bitbucket",
    },
  ];

  const handleLink = (provider) => {
    // Redirect to OAuth link endpoint
    const baseUrl =
      import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000";
    window.location.href = `${baseUrl}${provider.linkUrl}`;
  };

  const handleUnlink = async (providerId) => {
    if (localLoading[providerId]) return;

    // Show confirmation
    if (
      !confirm(`Are you sure you want to unlink your ${providerId} account?`)
    ) {
      return;
    }

    try {
      setLocalLoading((prev) => ({ ...prev, [providerId]: true }));

      // For now, show a warning that unlinking needs to be implemented
      toast.error("Unlinking is not yet implemented. Please contact support.");
    } catch (error) {
      toast.error(error.message || `Failed to unlink ${providerId} account`);
    } finally {
      setLocalLoading((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  return (
    <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <FaLink className="h-6 w-6 text-blue-400" />
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

      <div className="space-y-4">
        {providers.map((provider) => {
          const status = providerStatus[provider.id];
          const isConnected = status?.connected || false;
          const isLoading = localLoading[provider.id] || false;
          const connectionData = status?.data;

          return (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${
                isConnected
                  ? "border-green-500/30 bg-green-500/10"
                  : provider.borderColor + " " + provider.bgColor
              } transition-colors`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-3 rounded-full ${
                      isConnected
                        ? "bg-green-500/20 text-green-400"
                        : provider.bgColor + " " + provider.color
                    }`}
                  >
                    <provider.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-white">
                        {provider.name}
                      </h4>
                      {isConnected && (
                        <FaCheck className="h-4 w-4 text-green-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {provider.description}
                    </p>
                    {isConnected && connectionData && (
                      <div className="mt-2 text-xs text-gray-500">
                        {connectionData.username && (
                          <span>Connected as: {connectionData.username}</span>
                        )}
                        {connectionData.email && (
                          <span>Email: {connectionData.email}</span>
                        )}
                        {connectionData.connectedAt && (
                          <span className="block">
                            Connected:{" "}
                            {new Date(
                              connectionData.connectedAt
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <>
                      <div className="flex items-center space-x-1 text-green-400 text-sm">
                        <FaShieldAlt className="h-4 w-4" />
                        <span>Connected</span>
                      </div>
                      <button
                        onClick={() => handleUnlink(provider.id)}
                        disabled={isLoading}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                        title={`Unlink ${provider.name}`}
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                        ) : (
                          <FaUnlink className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleLink(provider)}
                      disabled={isLoading}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                        provider.color.includes("red")
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : provider.color.includes("blue")
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : provider.color.includes("orange")
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "bg-gray-600 hover:bg-gray-700 text-white"
                      }`}
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <FaExternalLinkAlt className="h-4 w-4" />
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

      {Object.values(providerStatus).filter((status) => status.connected)
        .length === 0 && (
        <div className="mt-6 p-4 border border-yellow-500/30 bg-yellow-500/10 rounded-lg">
          <div className="flex items-center space-x-2 text-yellow-400">
            <FaExclamationTriangle className="h-5 w-5" />
            <span className="font-medium">No accounts connected</span>
          </div>
          <p className="text-sm text-yellow-300 mt-1">
            Connect your accounts to enable enhanced security features and
            streamlined workflows.
          </p>
        </div>
      )}
    </div>
  );
};

export default OAuthAccountsSection;
