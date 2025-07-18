import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { FaArrowLeft, FaExternalLinkAlt } from "react-icons/fa";
import SEO from "@components/SEO";
import { RepositorySection } from "@components/integrations";
import {
  fetchConnectedProviders,
  selectConnectedProviders,
  selectRepositories,
  selectUI,
} from "@redux/slices/gitProviderSlice";
import {
  getProviderIcon,
  getProviderDisplayName,
  getProviderColor,
  getProviderBgColor,
} from "@utils/providerUtils";

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

  const ProviderIcon = getProviderIcon(provider);
  const providerColor = getProviderColor(provider);
  const providerBgColor = getProviderBgColor(provider);
  const providerDisplayName = getProviderDisplayName(provider);

  // Loading state
  if (ui.connectionsLoading) {
    return (
      <div className="dashboard-page">
        <SEO
          title={`${getProviderDisplayName(provider)} Integration - DeployIO`}
          description={`Manage your ${getProviderDisplayName(
            provider
          )} integration and repositories`}
        />

        {/* Header Skeleton */}
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <div className="w-6 h-6 bg-neutral-700/50 rounded animate-pulse"></div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-700/50 rounded-lg animate-pulse"></div>
            <div>
              <div className="h-6 sm:h-8 bg-neutral-700/50 rounded w-48 sm:w-64 mb-1 animate-pulse"></div>
              <div className="h-4 bg-neutral-700/50 rounded w-32 sm:w-40 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-6 sm:h-8 bg-neutral-700/50 rounded w-12 mx-auto mb-1 animate-pulse"></div>
                <div className="h-3 bg-neutral-700/50 rounded w-20 mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Repository Section Skeleton */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-700/50 rounded-lg animate-pulse"></div>
              <div>
                <div className="h-5 bg-neutral-700/50 rounded w-40 mb-1 animate-pulse"></div>
                <div className="h-3 bg-neutral-700/50 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-lg p-3 sm:p-4"
              >
                <div className="animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-neutral-700/50 rounded animate-pulse"></div>
                        <div className="h-4 bg-neutral-700/50 rounded w-32 animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-neutral-700/50 rounded w-full mb-1 animate-pulse"></div>
                      <div className="h-3 bg-neutral-700/50 rounded w-3/4 mb-3 animate-pulse"></div>
                      <div className="flex items-center gap-3">
                        <div className="h-3 bg-neutral-700/50 rounded w-16 animate-pulse"></div>
                        <div className="h-3 bg-neutral-700/50 rounded w-8 animate-pulse"></div>
                        <div className="h-3 bg-neutral-700/50 rounded w-8 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <div className="w-6 h-6 bg-neutral-700/50 rounded animate-pulse"></div>
                      <div className="w-16 h-6 bg-neutral-700/50 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            {providerDisplayName} Integration
          </h1>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 sm:p-8 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExternalLinkAlt className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 heading">
            {providerDisplayName} Not Connected
          </h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base body">
            You need to connect your {providerDisplayName} account to view
            repositories.
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

  return (
    <div className="dashboard-page">
      <SEO
        title={`${providerDisplayName} Integration - DeployIO`}
        description={`Manage your ${providerDisplayName} integration and repositories`}
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
          <div className={`p-2 sm:p-3 ${providerBgColor} rounded-lg`}>
            <ProviderIcon
              className={`w-5 h-5 sm:w-6 sm:h-6 ${providerColor}`}
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white heading">
              {providerDisplayName} Integration
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
          showViewAllButton={false}
          className="h-full"
        />
      </motion.div>
    </div>
  );
};

export default IntegrationsDetail;
