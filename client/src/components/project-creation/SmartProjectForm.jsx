import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
  FaCogs,
  FaProjectDiagram,
  FaTerminal,
  FaPlay,
  FaEnvira,
  FaPlus,
  FaTrash,
  FaBrain,
  FaCheckCircle,
} from "react-icons/fa";
import {
  setProjectConfiguration,
  completeStep,
} from "@redux/slices/projectCreationSlice";

const SmartProjectForm = ({ stepData, onNext, loading }) => {
  const dispatch = useDispatch();
  
  // Form state populated by AI analysis
  const [formData, setFormData] = useState({
    projectName: stepData.projectName || stepData.selectedRepository?.name || '',
    projectDescription: stepData.projectDescription || stepData.selectedRepository?.description || '',
    buildCommands: stepData.buildCommands || [],
    startCommand: stepData.startCommand || '',
    environmentVariables: stepData.environmentVariables || [],
    deploymentSettings: stepData.deploymentSettings || {
      port: 3000,
      healthcheck: '/health',
      replicas: 1,
      resources: {
        cpu: '100m',
        memory: '128Mi',
      },
    },
  });

  // Auto-populate from AI analysis results
  useEffect(() => {
    if (stepData.analysisResults) {
      const results = stepData.analysisResults;
      
      // Auto-populate build commands
      if (results.buildCommands && results.buildCommands.length > 0) {
        setFormData(prev => ({
          ...prev,
          buildCommands: results.buildCommands,
        }));
      }

      // Auto-populate start command
      if (results.startCommand) {
        setFormData(prev => ({
          ...prev,
          startCommand: results.startCommand,
        }));
      }

      // Auto-populate port
      if (results.detectedPort) {
        setFormData(prev => ({
          ...prev,
          deploymentSettings: {
            ...prev.deploymentSettings,
            port: results.detectedPort,
          },
        }));
      }

      // Auto-populate environment variables suggestions
      if (results.suggestedEnvVars) {
        setFormData(prev => ({
          ...prev,
          environmentVariables: results.suggestedEnvVars.map(env => ({
            key: env.key,
            value: env.defaultValue || '',
            description: env.description,
            required: env.required,
          })),
        }));
      }
    }
  }, [stepData.analysisResults]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDeploymentSettingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      deploymentSettings: {
        ...prev.deploymentSettings,
        [field]: value,
      },
    }));
  };

  const handleResourceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      deploymentSettings: {
        ...prev.deploymentSettings,
        resources: {
          ...prev.deploymentSettings.resources,
          [field]: value,
        },
      },
    }));
  };

  const addBuildCommand = () => {
    setFormData(prev => ({
      ...prev,
      buildCommands: [...prev.buildCommands, ''],
    }));
  };

  const updateBuildCommand = (index, value) => {
    setFormData(prev => ({
      ...prev,
      buildCommands: prev.buildCommands.map((cmd, i) => i === index ? value : cmd),
    }));
  };

  const removeBuildCommand = (index) => {
    setFormData(prev => ({
      ...prev,
      buildCommands: prev.buildCommands.filter((_, i) => i !== index),
    }));
  };

  const addEnvironmentVariable = () => {
    setFormData(prev => ({
      ...prev,
      environmentVariables: [
        ...prev.environmentVariables,
        { key: '', value: '', description: '', required: false },
      ],
    }));
  };

  const updateEnvironmentVariable = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      environmentVariables: prev.environmentVariables.map((env, i) => 
        i === index ? { ...env, [field]: value } : env
      ),
    }));
  };

  const removeEnvironmentVariable = (index) => {
    setFormData(prev => ({
      ...prev,
      environmentVariables: prev.environmentVariables.filter((_, i) => i !== index),
    }));
  };

  const handleContinue = () => {
    dispatch(setProjectConfiguration(formData));
    dispatch(completeStep(5));
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCogs className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Project Configuration
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Configure your project settings. Many fields have been auto-populated 
            based on our AI analysis. Review and adjust as needed.
          </p>
        </motion.div>
      </div>

      {/* AI Suggestions Banner */}
      {stepData.analysisResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <FaBrain className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-blue-400 font-medium">AI Suggestions Applied</h3>
              <p className="text-blue-300 text-sm">
                Configuration has been pre-filled based on analysis with {Math.round((stepData.aiConfidence || 0) * 100)}% confidence.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-8">
        {/* Basic Information */}
        <div className="bg-neutral-800/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <FaProjectDiagram className="w-5 h-5 text-blue-500" />
            <span>Basic Information</span>
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                className="w-full p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="my-awesome-project"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Port
              </label>
              <input
                type="number"
                value={formData.deploymentSettings.port}
                onChange={(e) => handleDeploymentSettingChange('port', parseInt(e.target.value))}
                className="w-full p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3000"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.projectDescription}
              onChange={(e) => handleInputChange('projectDescription', e.target.value)}
              rows={3}
              className="w-full p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of your project..."
            />
          </div>
        </div>

        {/* Build Configuration */}
        <div className="bg-neutral-800/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <FaTerminal className="w-5 h-5 text-purple-500" />
            <span>Build Configuration</span>
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-neutral-300">
                  Build Commands
                </label>
                <button
                  onClick={addBuildCommand}
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                >
                  <FaPlus className="w-3 h-3" />
                  <span>Add Command</span>
                </button>
              </div>
              
              {formData.buildCommands.map((command, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => updateBuildCommand(index, e.target.value)}
                    className="flex-1 p-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="npm install"
                  />
                  <button
                    onClick={() => removeBuildCommand(index)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Start Command
              </label>
              <div className="flex items-center space-x-2">
                <FaPlay className="w-4 h-4 text-green-500" />
                <input
                  type="text"
                  value={formData.startCommand}
                  onChange={(e) => handleInputChange('startCommand', e.target.value)}
                  className="flex-1 p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="npm start"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-neutral-800/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <FaEnvira className="w-5 h-5 text-green-500" />
              <span>Environment Variables</span>
            </h3>
            <button
              onClick={addEnvironmentVariable}
              className="flex items-center space-x-1 text-green-400 hover:text-green-300 text-sm"
            >
              <FaPlus className="w-3 h-3" />
              <span>Add Variable</span>
            </button>
          </div>

          <div className="space-y-3">
            {formData.environmentVariables.map((env, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-3">
                  <input
                    type="text"
                    value={env.key}
                    onChange={(e) => updateEnvironmentVariable(index, 'key', e.target.value)}
                    className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="KEY"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={env.value}
                    onChange={(e) => updateEnvironmentVariable(index, 'value', e.target.value)}
                    className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="value"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={env.description}
                    onChange={(e) => updateEnvironmentVariable(index, 'description', e.target.value)}
                    className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Description (optional)"
                  />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <button
                    onClick={() => removeEnvironmentVariable(index)}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {formData.environmentVariables.length === 0 && (
              <p className="text-neutral-500 text-sm text-center py-4">
                No environment variables configured. Click "Add Variable" to add one.
              </p>
            )}
          </div>
        </div>

        {/* Resource Configuration */}
        <div className="bg-neutral-800/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <FaCogs className="w-5 h-5 text-yellow-500" />
            <span>Resource Configuration</span>
          </h3>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                CPU Limit
              </label>
              <input
                type="text"
                value={formData.deploymentSettings.resources?.cpu}
                onChange={(e) => handleResourceChange('cpu', e.target.value)}
                className="w-full p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100m"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Memory Limit
              </label>
              <input
                type="text"
                value={formData.deploymentSettings.resources?.memory}
                onChange={(e) => handleResourceChange('memory', e.target.value)}
                className="w-full p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="128Mi"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Replicas
              </label>
              <input
                type="number"
                value={formData.deploymentSettings?.replicas}
                onChange={(e) => handleDeploymentSettingChange('replicas', parseInt(e.target.value))}
                className="w-full p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleContinue}
          disabled={!formData.projectName || !formData.startCommand || loading}
          className={`
            px-8 py-3 rounded-lg font-medium transition-all inline-flex items-center space-x-2
            ${formData.projectName && formData.startCommand && !loading
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
            }
          `}
        >
          <FaCheckCircle className="w-4 h-4" />
          <span>Review Configuration</span>
        </button>
      </div>
    </div>
  );
};

export default SmartProjectForm;
