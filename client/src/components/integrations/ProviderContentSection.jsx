import { motion } from "framer-motion";
import {
  FaFolder,
  FaCloud,
  FaUsers,
  FaProjectDiagram,
  FaComments,
  FaRocket,
  FaPlus,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { RepositorySection } from "./";
import { getProviderCategory } from "@utils/providerUtils";

const ProviderContentSection = ({
  provider,
  connectedProviders,
  repositories,
  className = "",
}) => {
  const providerCategory = getProviderCategory(provider);

  // Source Control - Show repositories
  if (providerCategory === "scm") {
    // Filter to only show the specific provider
    const specificProvider = connectedProviders.find(
      (p) => p.provider === provider
    );
    const filteredProviders = specificProvider ? [specificProvider] : [];

    return (
      <div className={className}>
        <RepositorySection
          connectedProviders={filteredProviders}
          repositories={repositories}
          showViewAllButton={false}
          className="!bg-transparent !border-0 !rounded-none"
        />
      </div>
    );
  }

  // Cloud Providers - Show deployment options
  if (providerCategory === "cloud") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl ${className}`}
      >
        <div className="p-4 sm:p-6 border-b border-neutral-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FaCloud className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white heading">
                Cloud Services
              </h2>
              <p className="text-sm text-gray-400 body">
                Manage your cloud infrastructure and deployment targets
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="text-center py-8 sm:py-12">
            <FaRocket className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Cloud Integration Coming Soon
            </h3>
            <p className="text-gray-400 text-sm sm:text-base mb-6">
              Cloud provider integrations are currently being developed.
              You&apos;ll be able to deploy to your cloud infrastructure
              directly from DeployIO.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button className="px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                <FaPlus className="w-4 h-4 inline mr-2" />
                Configure Services
              </button>
              <button className="px-4 py-2 bg-neutral-700/50 text-white rounded-lg hover:bg-neutral-600/50 transition-colors text-sm font-medium border border-neutral-600/50">
                <FaExternalLinkAlt className="w-4 h-4 inline mr-2" />
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Communication Providers - Show notification channels
  if (providerCategory === "communication") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl ${className}`}
      >
        <div className="p-4 sm:p-6 border-b border-neutral-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FaComments className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white heading">
                Communication Channels
              </h2>
              <p className="text-sm text-gray-400 body">
                Configure notifications and team communication settings
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="text-center py-8 sm:py-12">
            <FaUsers className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Communication Integration Coming Soon
            </h3>
            <p className="text-gray-400 text-sm sm:text-base mb-6">
              Stay connected with your team through integrated notifications and
              alerts for deployments, errors, and project updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button className="px-4 py-2 bg-purple-600/80 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium">
                <FaPlus className="w-4 h-4 inline mr-2" />
                Setup Notifications
              </button>
              <button className="px-4 py-2 bg-neutral-700/50 text-white rounded-lg hover:bg-neutral-600/50 transition-colors text-sm font-medium border border-neutral-600/50">
                <FaExternalLinkAlt className="w-4 h-4 inline mr-2" />
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Project Management - Show project tracking
  if (providerCategory === "project") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl ${className}`}
      >
        <div className="p-4 sm:p-6 border-b border-neutral-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <FaProjectDiagram className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white heading">
                Project Management
              </h2>
              <p className="text-sm text-gray-400 body">
                Track deployment progress and link with your project management
                tools
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="text-center py-8 sm:py-12">
            <FaProjectDiagram className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Project Management Integration Coming Soon
            </h3>
            <p className="text-gray-400 text-sm sm:text-base mb-6">
              Connect your project management tools to automatically update
              tickets, track releases, and manage deployment workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button className="px-4 py-2 bg-green-600/80 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium">
                <FaPlus className="w-4 h-4 inline mr-2" />
                Link Projects
              </button>
              <button className="px-4 py-2 bg-neutral-700/50 text-white rounded-lg hover:bg-neutral-600/50 transition-colors text-sm font-medium border border-neutral-600/50">
                <FaExternalLinkAlt className="w-4 h-4 inline mr-2" />
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default fallback
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl ${className}`}
    >
      <div className="p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <FaFolder className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Integration Details
          </h3>
          <p className="text-gray-400 text-sm sm:text-base">
            This integration type is not yet supported.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProviderContentSection;
