import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
  FaRocket,
  FaCheckCircle,
  FaGithub,
  FaCodeBranch,
  FaCogs,
  FaTerminal,
  FaEnvira,
  FaServer,
  FaEdit,
  FaExclamationTriangle,
  FaHeartbeat,
} from "react-icons/fa";
import { updateStep } from "@redux/slices/projectCreationSlice";

const ProjectReview = ({ stepData, onComplete, loading, error }) => {
  const dispatch = useDispatch();

  const handleEdit = (step) => {
    dispatch(updateStep({ step }));
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case "github":
        return <FaGithub className="w-4 h-4" />;
      case "gitlab":
        return <FaGithub className="w-4 h-4" />; // Using GitHub icon as placeholder
      case "azure-devops":
        return <FaGithub className="w-4 h-4" />; // Using GitHub icon as placeholder
      default:
        return <FaGithub className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <FaRocket className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Review & Create Project
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto px-2">
            Review all project settings. Your project will be created with these
            settings and be ready for deployment.
          </p>
        </motion.div>
      </div>

      <div className="space-y-6">
        {/* Repository Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-800/30 rounded-lg p-3 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              {getProviderIcon(stepData.selectedProvider)}
              <span>Repository</span>
            </h3>
            <button
              onClick={() => handleEdit(2)}
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
            >
              <FaEdit className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-neutral-400">Repository</p>
              <p className="text-white font-medium">
                {stepData.selectedRepository?.fullName ||
                  `${stepData.selectedRepository?.owner}/${stepData.selectedRepository?.name}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Branch</p>
              <p className="text-white font-medium flex items-center space-x-2">
                <FaCodeBranch className="w-3 h-3" />
                <span>{stepData.selectedBranch?.name}</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Stack</p>
              <p className="text-white font-medium uppercase">
                {stepData.analysisResults?.stack || "Unknown"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Project Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-800/30 rounded-lg p-3 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <FaCogs className="w-5 h-5 text-green-500" />
              <span>Project Details</span>
            </h3>
            <button
              onClick={() => handleEdit(6)}
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
            >
              <FaEdit className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-neutral-400">Project Name</p>
              <p className="text-white font-medium">{stepData.projectName}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Port</p>
              <p className="text-white font-medium">{stepData.port}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-neutral-400">Description</p>
              <p className="text-white">
                {stepData.projectDescription || "No description provided"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Build Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-neutral-800/30 rounded-lg p-3 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <FaTerminal className="w-5 h-5 text-purple-500" />
              <span>Build Configuration</span>
            </h3>
            <button
              onClick={() => handleEdit(6)}
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
            >
              <FaEdit className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <div>
              <p className="text-sm text-neutral-400">Node Version</p>
              <p className="text-white font-medium">
                Node {stepData.build?.nodeVersion}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Build Timeout</p>
              <p className="text-white font-medium">
                {stepData.build?.buildTimeout}s
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Output Directory</p>
              <p className="text-white font-medium">
                {stepData.build?.outputDir}
              </p>
            </div>
          </div>

          <div className="border-t border-neutral-700 pt-4 space-y-3">
            <div>
              <p className="text-sm text-neutral-400 mb-2">Install Command</p>
              <code className="text-sm text-green-400 bg-neutral-900/50 px-3 py-2 rounded block overflow-x-auto">
                {stepData.build?.commands?.install}
              </code>
            </div>

            <div>
              <p className="text-sm text-neutral-400 mb-2">Build Command</p>
              <code className="text-sm text-green-400 bg-neutral-900/50 px-3 py-2 rounded block overflow-x-auto">
                {stepData.build?.commands?.build}
              </code>
            </div>

            <div>
              <p className="text-sm text-neutral-400 mb-2">Start Command</p>
              <code className="text-sm text-green-400 bg-neutral-900/50 px-3 py-2 rounded block overflow-x-auto">
                {stepData.build?.commands?.start}
              </code>
            </div>

            {stepData.build?.commands?.test && (
              <div>
                <p className="text-sm text-neutral-400 mb-2">Test Command</p>
                <code className="text-sm text-blue-400 bg-neutral-900/50 px-3 py-2 rounded block overflow-x-auto">
                  {stepData.build?.commands?.test}
                </code>
              </div>
            )}
          </div>
        </motion.div>

        {/* Runtime Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-neutral-800/30 rounded-lg p-3 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <FaServer className="w-5 h-5 text-yellow-500" />
              <span>Runtime Configuration</span>
            </h3>
            <button
              onClick={() => handleEdit(6)}
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
            >
              <FaEdit className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <div className="text-center p-3 bg-neutral-900/30 rounded">
              <p className="text-sm text-neutral-400">CPU</p>
              <p className="text-lg font-medium text-white">
                {stepData.runtime?.cpu} vCPU
              </p>
            </div>
            <div className="text-center p-3 bg-neutral-900/30 rounded">
              <p className="text-sm text-neutral-400">Memory</p>
              <p className="text-lg font-medium text-white">
                {stepData.runtime?.memory}
              </p>
            </div>
            <div className="text-center p-3 bg-neutral-900/30 rounded">
              <p className="text-sm text-neutral-400">Instances</p>
              <p className="text-lg font-medium text-white">
                {stepData.runtime?.instances}
              </p>
            </div>
          </div>

          {/* Health Check */}
          <div className="border-t border-neutral-700 pt-4">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
              <FaHeartbeat className="w-4 h-4 text-red-500" />
              <span>Health Check</span>
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-2 bg-neutral-900/30 rounded">
                <p className="text-xs text-neutral-400">Path</p>
                <p className="text-sm text-white font-mono">
                  {stepData.runtime?.healthCheck?.path}
                </p>
              </div>
              <div className="p-2 bg-neutral-900/30 rounded">
                <p className="text-xs text-neutral-400">Interval</p>
                <p className="text-sm text-white font-mono">
                  {stepData.runtime?.healthCheck?.interval}s
                </p>
              </div>
              <div className="p-2 bg-neutral-900/30 rounded">
                <p className="text-xs text-neutral-400">Timeout</p>
                <p className="text-sm text-white font-mono">
                  {stepData.runtime?.healthCheck?.timeout}s
                </p>
              </div>
              <div className="p-2 bg-neutral-900/30 rounded">
                <p className="text-xs text-neutral-400">Retries</p>
                <p className="text-sm text-white font-mono">
                  {stepData.runtime?.healthCheck?.retries}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dockerfile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-neutral-800/30 rounded-lg p-3 sm:p-6"
        >
          <motion.div layout className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <FaTerminal className="w-5 h-5 text-blue-500" />
              <span>Dockerfile</span>
            </h3>
            <button
              onClick={() => handleEdit(4)}
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
            >
              <FaEdit className="w-3 h-3" />
              <span>Change</span>
            </button>
          </motion.div>
          <p className="text-sm text-neutral-400">Path (locked for this project)</p>
          <code className="text-white text-sm break-all">
            {stepData.selectedDockerfile?.path ||
              stepData.dockerfilePath ||
              "Dockerfile"}
          </code>
          {stepData.selectedDockerfile?.suggestedName && (
            <p className="text-xs text-neutral-500 mt-2">
              Service name: {stepData.selectedDockerfile.suggestedName}
            </p>
          )}
        </motion.div>

        {/* Environment Variables */}
        {(() => {
          const envVars = stepData.environmentVariables;
          const development = envVars?.development || [];
          const staging = envVars?.staging || [];
          const production = envVars?.production || [];
          const legacyList = Array.isArray(envVars) ? envVars : [];
          const hasEnv =
            development.length > 0 ||
            staging.length > 0 ||
            production.length > 0 ||
            legacyList.length > 0;

          const renderList = (title, list) =>
            list.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-neutral-300 mb-2">{title}</h4>
                <div className="space-y-2">
                  {list.map((env, index) => (
                    <div
                      key={`${title}-${index}`}
                      className="flex items-center justify-between p-2 bg-neutral-900/30 rounded text-sm"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <code className="text-sm text-blue-400">{env.key}</code>
                        <span className="text-neutral-500">=</span>
                        <code className="text-sm text-green-400 truncate">
                          {env.isSecret ? "***" : env.value || "(not set)"}
                        </code>
                        {env.required && (
                          <span className="text-xs text-amber-400">required</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );

          if (!hasEnv) return null;

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-neutral-800/30 rounded-lg p-3 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <FaEnvira className="w-5 h-5 text-green-500" />
                  <span>Environment Variables</span>
                </h3>
                <button
                  onClick={() => handleEdit(6)}
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                >
                  <FaEdit className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
              {development.length || staging.length || production.length ? (
                <>
                  {renderList("Development", development)}
                  {renderList("Staging", staging)}
                  {renderList("Production", production)}
                </>
              ) : (
                renderList("All", legacyList)
              )}
            </motion.div>
          );
        })()}
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <FaExclamationTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-red-400 font-medium">Error Creating Project</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Info Note */}
      <div className="mt-8">
        <p className="text-sm text-neutral-400 text-center">
          This will create your project and make it ready for deployment. You
          can always modify the configuration later.
        </p>
      </div>
    </div>
  );
};

export default ProjectReview;
