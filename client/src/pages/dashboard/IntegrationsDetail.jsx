import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaGithub,
  FaGitlab,
  FaBitbucket,
  FaMicrosoft,
  FaExternalLinkAlt,
} from "react-icons/fa";
import SEO from "@components/SEO";
import LoadingSpinner from "@components/LoadingSpinner";
import { RepositorySection } from "@components/integrations";
import {
  fetchConnectedProviders,
  selectConnectedProviders,
  selectRepositories,
  selectUI,
} from "@redux/slices/gitProviderSlice";

const IntegrationsDetail = () => {
  const { provider } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const connectedProviders = useSelector(selectConnectedProviders);
  const repositories = useSelector(selectRepositories);
  const ui = useSelector(selectUI);

  // Find the specific provider
  const currentProvider = connectedProviders.find(
    (p) => p.provider === provider
  );

  useEffect(() => {
    if (connectedProviders.length === 0) {
      dispatch(fetchConnectedProviders());
    }
  }, [dispatch, connectedProviders.length]);

  const getProviderIcon = (providerName) => {
    switch (providerName) {
      case "github":
        return FaGithub;
      case "gitlab":
        return FaGitlab;
      case "bitbucket":
        return FaBitbucket;
      case "azure":
      case "azuredevops":
        return FaMicrosoft;
      default:
        return FaExternalLinkAlt;
    }
  };

  const getProviderDisplayName = (providerName) => {
    switch (providerName) {
      case "github":
        return "GitHub";
      case "gitlab":
        return "GitLab";
      case "bitbucket":
        return "Bitbucket";
      case "azure":
      case "azuredevops":
        return "Azure DevOps";
      default:
        return (
          providerName?.charAt(0).toUpperCase() + providerName?.slice(1) ||
          "Unknown"
        );
    }
  };

  const getProviderColor = (providerName) => {
    switch (providerName) {
      case "github":
        return "text-gray-300";
      case "gitlab":
        return "text-orange-400";
      case "bitbucket":
        return "text-blue-400";
      case "azure":
      case "azuredevops":
        return "text-blue-500";
      default:
        return "text-gray-400";
    }
  };

  // Loading state
  if (ui.connectionsLoading) {
    return (
      <div className="dashboard-page">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  // Provider not found or not connected
  if (!currentProvider) {
    return (
      <div className="dashboard-page">
        <SEO
          title={`${getProviderDisplayName(provider)} Integration - DeployIO`}
          description={`Manage your ${getProviderDisplayName(
            provider
          )} integration and repositories`}
        />

        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => navigate("/dashboard/integrations")}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white heading">
            {getProviderDisplayName(provider)} Integration
          </h1>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 sm:p-8 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExternalLinkAlt className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 heading">
            {getProviderDisplayName(provider)} Not Connected
          </h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base body">
            You need to connect your {getProviderDisplayName(provider)} account
            to view repositories.
          </p>
          <button
            onClick={() => navigate("/dashboard/integrations")}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium"
          >
            Go to Integrations
          </button>
        </div>
      </div>
    );
  }

  const ProviderIcon = getProviderIcon(provider);
  const providerColor = getProviderColor(provider);

  return (
    <div className="dashboard-page">
      <SEO
        title={`${getProviderDisplayName(provider)} Integration - DeployIO`}
        description={`Manage your ${getProviderDisplayName(
          provider
        )} integration and repositories`}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6 sm:mb-8"
      >
        <button
          onClick={() => navigate("/dashboard/integrations")}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-neutral-800/50 rounded-lg">
            <ProviderIcon
              className={`w-5 h-5 sm:w-6 sm:h-6 ${providerColor}`}
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white heading">
              {getProviderDisplayName(provider)} Integration
            </h1>
            <p className="text-gray-400 text-sm sm:text-base body">
              Connected as {currentProvider.username || currentProvider.email}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Provider Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-white mb-1">
              {repositories[provider]?.data?.length || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-400">
              Repositories Loaded
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-white mb-1">
              {currentProvider.connectedAt
                ? new Date(currentProvider.connectedAt).toLocaleDateString()
                : "N/A"}
            </div>
            <div className="text-xs sm:text-sm text-gray-400">
              Connected Since
            </div>
          </div>
          <div className="text-center sm:col-span-2 lg:col-span-1">
            <div className="text-xl sm:text-2xl font-bold text-white mb-1">
              {currentProvider.lastUsed
                ? new Date(currentProvider.lastUsed).toLocaleDateString()
                : "Never"}
            </div>
            <div className="text-xs sm:text-sm text-gray-400">Last Used</div>
          </div>
        </div>
      </motion.div>

      {/* Repository Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <RepositorySection
          connectedProviders={[currentProvider]}
          repositories={repositories}
          maxHeight="600px"
          showViewAllButton={false}
          className="h-full"
        />
      </motion.div>
    </div>
  );
};

export default IntegrationsDetail;
