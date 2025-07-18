import { motion, AnimatePresence } from "framer-motion";
import { LoadingGrid } from "@components/LoadingSpinner";
import ProviderCard from "./ProviderCard";

const IntegrationsGrid = ({
  providers,
  connections,
  loading,
  error,
  refreshingProvider,
  onConnect,
  onDisconnect,
  onManage,
}) => {
  // Use providers directly as they're already filtered by parent
  const filteredProviders = providers || [];

  // Group providers by category for better organization
  const groupedProviders = filteredProviders.reduce((groups, provider) => {
    const category = provider.category || "other";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(provider);
    return groups;
  }, {});

  const getCategoryTitle = (category) => {
    switch (category) {
      case "scm":
        return "Source Control Management";
      case "cloud":
        return "Cloud Providers";
      case "communication":
        return "Communication Tools";
      case "project":
        return "Project Management";
      default:
        return "Other Integrations";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (loading) {
    return (
      <div className="mb-6 sm:mb-8">
        <LoadingGrid columns={3} className="gap-4 sm:gap-6" />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 sm:p-8 text-center">
          <div className="text-red-400 text-base sm:text-lg font-medium mb-2">
            Failed to Load Integrations
          </div>
          <p className="text-red-300 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  if (filteredProviders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8 sm:p-12 text-center">
          <div className="text-gray-400 text-base sm:text-lg font-medium mb-2">
            No Integrations Found
          </div>
          <p className="text-gray-500 text-sm">
            No integrations available for the selected category.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mb-6 sm:mb-8">
      <AnimatePresence mode="wait">
        {Object.keys(groupedProviders).length > 1 ? (
          // Show grouped view when multiple categories are present
          <motion.div
            key="grouped"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-6 sm:space-y-8"
          >
            {Object.entries(groupedProviders).map(
              ([category, categoryProviders]) => (
                <motion.div key={category} variants={itemVariants}>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 heading">
                    {getCategoryTitle(category)}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {categoryProviders.map((provider) => (
                      <ProviderCard
                        key={provider.id}
                        provider={provider}
                        connection={connections[provider.id]}
                        onConnect={onConnect}
                        onDisconnect={onDisconnect}
                        onManage={onManage}
                        isRefreshing={refreshingProvider === provider.id}
                      />
                    ))}
                  </div>
                </motion.div>
              )
            )}
          </motion.div>
        ) : (
          // Show flat grid view for single category or simple view
          <motion.div
            key="flat"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {filteredProviders.map((provider) => (
              <motion.div key={provider.id} variants={itemVariants}>
                <ProviderCard
                  provider={provider}
                  connection={connections[provider.id]}
                  onConnect={onConnect}
                  onDisconnect={onDisconnect}
                  onManage={onManage}
                  isRefreshing={refreshingProvider === provider.id}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntegrationsGrid;
