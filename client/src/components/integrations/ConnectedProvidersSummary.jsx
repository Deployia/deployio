import { motion } from "framer-motion";
import {
  FaPlug,
  FaGithub,
  FaGitlab,
  FaSyncAlt,
  FaExclamationTriangle,
  FaArrowRight,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import {
  selectConnectedProviders,
  selectUI,
} from "@redux/slices/gitProviderSlice";

const ConnectedProvidersSummary = ({ onManageClick }) => {
  const connectedProviders = useSelector(selectConnectedProviders);
  const { connectionsLoading } = useSelector(selectUI);

  // Calculate summary stats
  const totalConnected = connectedProviders.length;
  const totalRepositories = connectedProviders.reduce(
    (sum, provider) => sum + (provider.repositories?.count || 0),
    0
  );

  // Get most recent sync
  const lastSync = connectedProviders.reduce((latest, provider) => {
    if (!provider.lastSync) return latest;
    const syncDate = new Date(provider.lastSync);
    return !latest || syncDate > latest ? syncDate : latest;
  }, null);

  const formatLastSync = (date) => {
    if (!date) return "Never";
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case "github":
        return FaGithub;
      case "gitlab":
        return FaGitlab;
      default:
        return FaPlug;
    }
  };

  if (connectionsLoading) {
    return (
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 animate-pulse"
            >
              <div className="h-4 bg-neutral-800/50 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-neutral-800/50 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-neutral-800/50 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Connected Providers */}
        <div
          className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 hover:border-neutral-700/50 transition-colors cursor-pointer group"
          onClick={onManageClick}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
              <FaPlug className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium">
              Connected Providers
            </h3>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{totalConnected}</p>

          {totalConnected > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                {connectedProviders.slice(0, 3).map((provider) => {
                  const Icon = getProviderIcon(provider.provider);
                  return (
                    <div
                      key={provider.provider}
                      className="w-6 h-6 bg-neutral-800/80 rounded-full flex items-center justify-center border-2 border-neutral-900"
                    >
                      <Icon className="w-3 h-3 text-gray-300" />
                    </div>
                  );
                })}
                {connectedProviders.length > 3 && (
                  <div className="w-6 h-6 bg-neutral-800/80 rounded-full flex items-center justify-center border-2 border-neutral-900">
                    <span className="text-xs text-gray-400">
                      +{connectedProviders.length - 3}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 ml-2 text-xs text-blue-400">
                <span>Manage</span>
                <FaArrowRight className="w-3 h-3" />
              </div>
            </div>
          )}

          {totalConnected === 0 && (
            <div className="text-xs text-gray-500 mt-2">
              No providers connected
            </div>
          )}
        </div>

        {/* Total Repositories */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <FaGithub className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium">
              Total Repositories
            </h3>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {totalRepositories}
          </p>
          <div className="text-xs text-green-400 mt-2">
            Available for deployment
          </div>
        </div>

        {/* Last Sync */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FaSyncAlt className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium">Last Sync</h3>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatLastSync(lastSync)}
          </p>

          {lastSync ? (
            <div className="text-xs text-purple-400 mt-2">
              All providers synced
            </div>
          ) : totalConnected > 0 ? (
            <div className="flex items-center gap-1 text-xs text-yellow-400 mt-2">
              <FaExclamationTriangle className="w-3 h-3" />
              <span>Sync needed</span>
            </div>
          ) : (
            <div className="text-xs text-gray-500 mt-2">
              Connect a provider to sync
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ConnectedProvidersSummary;
