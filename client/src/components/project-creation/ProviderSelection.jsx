import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  FaGithub,
  FaGitlab,
  FaMicrosoft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaPlug,
  FaShieldAlt,
} from "react-icons/fa";
import {
  fetchGitProviders,
  setSelectedProvider,
  completeStep,
} from "@redux/slices/projectCreationSlice";

const ProviderSelection = ({ stepData, onNext, loading }) => {
  const dispatch = useDispatch();
  const [selectedProvider, setLocalSelectedProvider] = useState(stepData.selectedProvider);

  // Fetch connected providers on component mount
  useEffect(() => {
    dispatch(fetchGitProviders());
  }, [dispatch]);

  // Provider configurations
  const providers = [
    {
      id: "github",
      name: "GitHub",
      icon: FaGithub,
      color: "text-white",
      bgColor: "bg-gray-800 hover:bg-gray-700",
      borderColor: "border-gray-600 hover:border-gray-500",
      description: "Connect to GitHub repositories",
      features: ["Public & Private repos", "Organizations", "Advanced permissions"],
    },
    {
      id: "gitlab",
      name: "GitLab",
      icon: FaGitlab,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10 hover:bg-orange-500/20",
      borderColor: "border-orange-500/30 hover:border-orange-500/50",
      description: "Connect to GitLab repositories",
      features: ["Self-hosted support", "CI/CD integration", "Advanced DevOps"],
    },
    {
      id: "azure-devops",
      name: "Azure DevOps",
      icon: FaMicrosoft,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10 hover:bg-blue-500/20",
      borderColor: "border-blue-500/30 hover:border-blue-500/50",
      description: "Connect to Azure DevOps repositories",
      features: ["Enterprise integration", "Work item tracking", "Azure services"],
    },
  ];

  const handleProviderSelect = (providerId) => {
    setLocalSelectedProvider(providerId);
    dispatch(setSelectedProvider(providerId));
  };

  const handleContinue = () => {
    if (selectedProvider) {
      dispatch(completeStep(1));
      onNext();
    }
  };

  const getProviderStatus = (providerId) => {
    const providerData = stepData.connectedProviders?.[providerId];
    if (!providerData) return "disconnected";
    if (providerData.connected && providerData.hasRepoAccess) return "connected";
    if (providerData.connected) return "limited";
    return "disconnected";
  };

  const renderProviderStatus = (status) => {
    switch (status) {
      case "connected":
        return (
          <div className="flex items-center space-x-2 text-green-400">
            <FaCheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Connected</span>
          </div>
        );
      case "limited":
        return (
          <div className="flex items-center space-x-2 text-yellow-400">
            <FaExclamationTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Limited Access</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 text-neutral-400">
            <FaPlug className="w-4 h-4" />
            <span className="text-sm font-medium">Not Connected</span>
          </div>
        );
    }
  };

  const handleConnect = (providerId) => {
    // This would trigger OAuth flow
    const authUrl = `/api/v1/auth/oauth/${providerId}?redirect=${encodeURIComponent(window.location.href)}`;
    window.location.href = authUrl;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaGithub className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Choose Your Git Provider
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Select the Git provider where your project repository is hosted. 
            We'll use this to analyze your code and configure deployment settings.
          </p>
        </motion.div>
      </div>

      {/* Provider Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {providers.map((provider, index) => {
          const status = getProviderStatus(provider.id);
          const isSelected = selectedProvider === provider.id;
          const Icon = provider.icon;

          return (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative p-6 rounded-lg border-2 transition-all duration-300 cursor-pointer
                ${isSelected 
                  ? `${provider.bgColor} ${provider.borderColor} ring-2 ring-blue-500/20` 
                  : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'
                }
              `}
              onClick={() => handleProviderSelect(provider.id)}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <FaCheckCircle className="w-4 h-4 text-white" />
                </motion.div>
              )}

              {/* Provider Icon */}
              <div className="flex items-center justify-center mb-4">
                <div className={`w-12 h-12 rounded-lg ${provider.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${provider.color}`} />
                </div>
              </div>

              {/* Provider Info */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {provider.name}
                </h3>
                <p className="text-sm text-neutral-400 mb-4">
                  {provider.description}
                </p>

                {/* Connection Status */}
                <div className="mb-4">
                  {renderProviderStatus(status)}
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {provider.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm text-neutral-300">
                      <FaShieldAlt className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connect Button */}
              {status === "disconnected" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConnect(provider.id);
                  }}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Connect {provider.name}
                </button>
              )}

              {status === "limited" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConnect(provider.id);
                  }}
                  className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                >
                  Grant Full Access
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Help Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
      >
        <div className="flex items-start space-x-3">
          <FaShieldAlt className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-400 font-medium mb-1">Security & Privacy</h4>
            <p className="text-blue-300 text-sm leading-relaxed">
              We only request the minimum permissions needed to analyze your repositories and create deployments. 
              Your code and data remain secure and are never stored permanently on our servers.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="mt-8 text-center">
        <button
          onClick={handleContinue}
          disabled={!selectedProvider || loading}
          className={`
            px-8 py-3 rounded-lg font-medium transition-all inline-flex items-center space-x-2
            ${selectedProvider && !loading
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
            }
          `}
        >
          {loading ? (
            <>
              <FaSpinner className="w-4 h-4 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <span>Continue with {providers.find(p => p.id === selectedProvider)?.name || 'Selected Provider'}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProviderSelection;
