import { useState } from "react";
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
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  createProjectFromSession,
  updateStep,
} from "@redux/slices/projectCreationSlice";

const ProjectReview = ({ stepData, onComplete, loading, error }) => {
  const dispatch = useDispatch();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    setIsCreating(true);
    try {
      await dispatch(createProjectFromSession(stepData.sessionId));
      onComplete();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (step) => {
    dispatch(updateStep({ step }));
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'github':
        return <FaGithub className="w-4 h-4" />;
      case 'gitlab':
        return <FaGithub className="w-4 h-4" />; // Using GitHub icon as placeholder
      case 'azure-devops':
        return <FaGithub className="w-4 h-4" />; // Using GitHub icon as placeholder
      default:
        return <FaGithub className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaRocket className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Review & Deploy
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Review your project configuration and deploy. Your project will be created 
            and made ready for deployment with the settings shown below.
          </p>
        </motion.div>
      </div>

      {/* AI Confidence Score */}
      {stepData.aiConfidence && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <FaCheckCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-blue-400 font-medium">AI Configuration Confidence</h3>
                <p className="text-blue-300 text-sm">
                  Based on repository analysis and best practices
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getConfidenceColor(stepData.aiConfidence)}`}>
                {Math.round(stepData.aiConfidence * 100)}%
              </div>
              <div className={`text-sm ${getConfidenceColor(stepData.aiConfidence)}`}>
                {getConfidenceLabel(stepData.aiConfidence)} Confidence
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Repository Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-800/30 rounded-lg p-6"
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
          </div>
        </motion.div>

        {/* Project Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-800/30 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <FaCogs className="w-5 h-5 text-green-500" />
              <span>Project Configuration</span>
            </h3>
            <button
              onClick={() => handleEdit(5)}
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
              <p className="text-white font-medium">{stepData.deploymentSettings?.port}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-neutral-400">Description</p>
              <p className="text-white">{stepData.projectDescription || 'No description provided'}</p>
            </div>
          </div>
        </motion.div>

        {/* Build Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-neutral-800/30 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <FaTerminal className="w-5 h-5 text-purple-500" />
              <span>Build Configuration</span>
            </h3>
            <button
              onClick={() => handleEdit(5)}
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
            >
              <FaEdit className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-400 mb-2">Build Commands</p>
              {stepData.buildCommands && stepData.buildCommands.length > 0 ? (
                <div className="space-y-1">
                  {stepData.buildCommands.map((command, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-neutral-500 text-xs">{index + 1}.</span>
                      <code className="text-sm text-green-400 bg-neutral-900/50 px-2 py-1 rounded">
                        {command}
                      </code>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-sm">No build commands configured</p>
              )}
            </div>

            <div>
              <p className="text-sm text-neutral-400 mb-2">Start Command</p>
              <code className="text-sm text-green-400 bg-neutral-900/50 px-2 py-1 rounded">
                {stepData.startCommand || 'Not configured'}
              </code>
            </div>
          </div>
        </motion.div>

        {/* Environment Variables */}
        {stepData.environmentVariables && stepData.environmentVariables.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-neutral-800/30 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <FaEnvira className="w-5 h-5 text-green-500" />
                <span>Environment Variables</span>
              </h3>
              <button
                onClick={() => handleEdit(5)}
                className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
              >
                <FaEdit className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <div className="space-y-2">
              {stepData.environmentVariables.map((env, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-neutral-900/30 rounded">
                  <div className="flex items-center space-x-3">
                    <code className="text-sm text-blue-400">{env.key}</code>
                    <span className="text-neutral-500">=</span>
                    <code className="text-sm text-green-400">{env.value || '(not set)'}</code>
                  </div>
                  {env.description && (
                    <span className="text-xs text-neutral-400">{env.description}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Resource Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-neutral-800/30 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <FaServer className="w-5 h-5 text-yellow-500" />
              <span>Resource Configuration</span>
            </h3>
            <button
              onClick={() => handleEdit(5)}
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
            >
              <FaEdit className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <p className="text-sm text-neutral-400">CPU Limit</p>
              <p className="text-lg font-medium text-white">
                {stepData.deploymentSettings?.resources?.cpu || '100m'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-neutral-400">Memory Limit</p>
              <p className="text-lg font-medium text-white">
                {stepData.deploymentSettings?.resources?.memory || '128Mi'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-neutral-400">Replicas</p>
              <p className="text-lg font-medium text-white">
                {stepData.deploymentSettings?.replicas || 1}
              </p>
            </div>
          </div>
        </motion.div>
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

      {/* Action Buttons */}
      <div className="mt-8 text-center">
        <button
          onClick={handleCreateProject}
          disabled={isCreating || loading}
          className={`
            px-8 py-3 rounded-lg font-medium transition-all inline-flex items-center space-x-2
            ${!isCreating && !loading
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-green-600/50 text-white cursor-not-allowed'
            }
          `}
        >
          {isCreating || loading ? (
            <>
              <FaSpinner className="w-4 h-4 animate-spin" />
              <span>Creating Project...</span>
            </>
          ) : (
            <>
              <FaRocket className="w-4 h-4" />
              <span>Create Project</span>
            </>
          )}
        </button>

        <p className="text-sm text-neutral-400 mt-4">
          This will create your project and make it ready for deployment. 
          You can always modify the configuration later.
        </p>
      </div>
    </div>
  );
};

export default ProjectReview;
