import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaTrash,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaStar,
  FaEye,
} from "react-icons/fa";
import {
  getProviderIcon,
  getProviderColor,
  getProviderBgColor,
} from "@utils/providerUtils";

const ProviderCard = ({
  provider,
  connection,
  onConnect,
  onDisconnect,
  onManage: _onManage, // Keep for backward compatibility but unused
  isRefreshing,
}) => {
  const navigate = useNavigate();

  const Icon = getProviderIcon(provider.id);
  const color = getProviderColor(provider.id);
  const bgColor = getProviderBgColor(provider.id);
  const isConnected = connection?.connected;
  const isComingSoon = provider.comingSoon;
  const isEnabled = provider.enabled && !isComingSoon;

  const formatLastSync = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
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

  const handleAction = () => {
    if (isComingSoon) {
      // Show coming soon modal
      return;
    }

    if (isConnected) {
      // Navigate to detailed integration page for connected providers
      navigate(`/dashboard/integrations/${provider.id}`);
    } else {
      onConnect(provider);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        bg-neutral-900/50 backdrop-blur-md border rounded-xl p-4 sm:p-6 transition-all duration-200
        ${
          isEnabled && !isComingSoon
            ? "border-neutral-800/50 hover:border-neutral-700/50 cursor-pointer group"
            : "border-neutral-800/30 opacity-75"
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`
            p-2 sm:p-3 rounded-lg transition-colors flex-shrink-0
            ${`${bgColor} group-hover:bg-opacity-80`}
          `}
          >
            <Icon
              className={`
              w-5 h-5 sm:w-6 sm:h-6 
              ${color}
            `}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                {provider.name}
              </h3>
              {provider.popular && (
                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30 flex-shrink-0">
                  <FaStar className="w-2 h-2 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">Popular</span>
                </div>
              )}
            </div>
            <p className="text-gray-400 text-xs sm:text-sm line-clamp-2">
              {provider.description}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {isComingSoon && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
              <FaClock className="w-2 h-2 sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">Q3 2025</span>
              <span className="sm:hidden">Soon</span>
            </div>
          )}

          {isConnected && !isComingSoon && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
              <FaCheckCircle className="w-2 h-2 sm:w-3 sm:h-3" />
              <span>Connected</span>
            </div>
          )}

          {!isEnabled && !isComingSoon && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full border border-gray-500/30">
              <FaExclamationTriangle className="w-2 h-2 sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">Disabled</span>
              <span className="sm:hidden">Off</span>
            </div>
          )}
        </div>
      </div>

      {/* Connection Info */}
      {isConnected && connection && (
        <div className="mb-4 p-3 bg-neutral-800/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {connection.avatar && (
                <img
                  src={connection.avatar}
                  alt={connection.username}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex-shrink-0"
                />
              )}
              <span className="text-white text-xs sm:text-sm font-medium truncate">
                {connection.username}
              </span>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatLastSync(connection.lastSync)}
            </span>
          </div>
        </div>
      )}

      {/* Features */}
      {provider.features && provider.features.length > 0 && (
        <div className="mb-4">
          <h4 className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">
            Features
          </h4>
          <div className="flex flex-wrap gap-1">
            {provider.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-neutral-800/50 text-gray-300 text-xs rounded-md"
              >
                {feature}
              </span>
            ))}
            {provider.features.length > 3 && (
              <span className="px-2 py-1 bg-neutral-800/50 text-gray-400 text-xs rounded-md">
                +{provider.features.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isComingSoon ? (
          <button
            onClick={handleAction}
            className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-500/20 text-blue-400 text-xs sm:text-sm font-medium rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
          >
            <FaClock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Coming Soon</span>
          </button>
        ) : !isConnected ? (
          <button
            onClick={handleAction}
            disabled={!isEnabled}
            className={`
              flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors
              ${
                isEnabled
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-neutral-800/50 text-neutral-500 cursor-not-allowed"
              }
            `}
          >
            <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Connect</span>
          </button>
        ) : (
          <>
            <button
              onClick={handleAction}
              disabled={isRefreshing}
              className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <FaEye className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">View Details</span>
              <span className="sm:hidden">View</span>
            </button>

            <button
              onClick={() => onDisconnect(provider)}
              disabled={isRefreshing}
              className="px-3 sm:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs sm:text-sm rounded-lg transition-colors disabled:opacity-50 border border-red-500/30"
              title="Disconnect"
            >
              <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ProviderCard;
