import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaGoogle,
  FaGithub,
  FaLink,
  FaUnlink,
  FaShieldAlt,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { fetchProviders, unlinkProvider } from "@redux/slices/authSlice";

const OAuthAccountsSection = () => {
  const dispatch = useDispatch();
  const { providers: linkedProviders, providersLoading } = useSelector(
    (state) => state.auth
  );
  const [localLoading, setLocalLoading] = useState({});

  useEffect(() => {
    dispatch(fetchProviders());
  }, [dispatch]);

  const providers = [
    {
      id: "google",
      name: "Google",
      icon: FaGoogle,
      color: "text-red-500",
      bgColor: "bg-gray-500/20",
      borderColor: "border-gray-500/30",
      description: "Connect your Google account for seamless login",
      linkUrl: "/api/v1/auth/link/google",
    },
    {
      id: "github",
      name: "GitHub",
      icon: FaGithub,
      color: "text-gray-300",
      bgColor: "bg-gray-500/20",
      borderColor: "border-gray-500/30",
      description: "Link your GitHub account for repository integration",
      linkUrl: "/api/v1/auth/link/github",
    },
  ];

  const handleUnlink = async (providerId) => {
    if (localLoading[providerId]) return;

    try {
      setLocalLoading((prev) => ({ ...prev, [providerId]: true }));
      await dispatch(unlinkProvider(providerId)).unwrap();
      toast.success(`${providerId} account unlinked successfully`);
      dispatch(fetchProviders());
    } catch (error) {
      toast.error(error.message || `Failed to unlink ${providerId} account`);
    } finally {
      setLocalLoading((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleLink = (provider) => {
    // Redirect to OAuth link endpoint
    window.location.href = `${
      import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000"
    }${provider.linkUrl}`;
  };

  if (providersLoading) {
    return (
      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

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
          <p className="text-sm text-gray-400">
            Link OAuth providers for quick and secure login
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => {
          const isConnected = linkedProviders?.[provider.id];
          const isLoading = localLoading[provider.id];
          const Icon = provider.icon;

          return (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                isConnected
                  ? `${provider.bgColor} ${provider.borderColor} border-2`
                  : "bg-neutral-800/50 border-neutral-700/50 hover:border-neutral-600/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-3 rounded-lg ${provider.bgColor} ${provider.borderColor} border`}
                  >
                    <Icon className={`h-6 w-6 ${provider.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-medium text-white">
                        {provider.name}
                      </h4>
                      {isConnected && (
                        <div className="flex items-center space-x-1">
                          <FaCheck className="h-4 w-4 text-green-400" />
                          <span className="text-xs font-medium text-green-400">
                            Connected
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {provider.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <button
                      onClick={() => handleUnlink(provider.id)}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 text-sm font-medium text-red-400 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors duration-200 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                      ) : (
                        <>
                          <FaUnlink className="h-4 w-4 mr-2" />
                          Disconnect
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLink(provider)}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors duration-200 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <FaLink className="h-4 w-4 mr-2" />
                          Connect
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isConnected && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <FaShieldAlt className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-green-300">
                      <p className="font-medium mb-1">
                        Account secured with {provider.name}
                      </p>
                      <p className="text-green-400/80">
                        You can now sign in using your {provider.name} account
                        without entering a password.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="flex items-start space-x-2">
          <FaExclamationTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-300">
            <p className="font-medium mb-1">Security Notice</p>
            <p className="text-yellow-400/80">
              Connecting OAuth accounts provides additional login options. You
              can always disconnect them as long as you have at least one
              authentication method (password or OAuth account) active.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthAccountsSection;
