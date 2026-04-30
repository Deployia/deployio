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
  FaHeartbeat,
} from "react-icons/fa";
import {
  setProjectConfiguration,
  completeStep,
} from "@redux/slices/projectCreationSlice";

const SmartProjectForm = ({ stepData, onNext, loading }) => {
  const dispatch = useDispatch();

  // Form state - comprehensive, mapping to Project model structure
  // Get defaults from analysis results when available
  const getInitialFormData = () => {
    const results =
      stepData.analysisResults || stepData.analysis?.results || {};
    const detectedConfig = results.detectedConfig || {};
    const buildConfig = results.buildConfiguration || {};
    const deployConfig = results.deploymentConfiguration || {};

    return {
      // Basic info
      projectName:
        stepData.projectName || stepData.selectedRepository?.name || "",
      projectDescription:
        stepData.projectDescription ||
        stepData.selectedRepository?.description ||
        "",

      // Build Configuration - use analysis results, fallback to empty/smart defaults
      build: {
        commands: {
          install:
            stepData.buildInstallCommand ||
            detectedConfig.installCommand ||
            buildConfig.installCommand ||
            "",
          build:
            stepData.buildCommand ||
            detectedConfig.buildCommand ||
            buildConfig.buildCommand ||
            "",
          start:
            stepData.startCommand ||
            detectedConfig.startCommand ||
            buildConfig.startCommand ||
            "",
          test: stepData.testCommand || buildConfig.testCommand || "",
        },
        outputDir: stepData.outputDir || detectedConfig.outputDir || "",
        nodeVersion: stepData.nodeVersion || "", // No hardcoded default
        buildTimeout: stepData.buildTimeout || buildConfig.buildTimeout || 600,
      },

      // Runtime Configuration - use analysis defaults, fallback to reasonable values
      runtime: {
        memory: stepData.runtimeMemory || deployConfig.memory || "512MB",
        cpu: stepData.runtimeCpu || deployConfig.cpu || "0.5",
        instances: stepData.instances || deployConfig.instances || 1,
        healthCheck: {
          path:
            stepData.healthCheckPath ||
            deployConfig.healthCheck?.path ||
            "/health",
          interval:
            stepData.healthCheckInterval ||
            deployConfig.healthCheck?.interval ||
            30,
          timeout:
            stepData.healthCheckTimeout ||
            deployConfig.healthCheck?.timeout ||
            10,
          retries:
            stepData.healthCheckRetries ||
            deployConfig.healthCheck?.retries ||
            3,
        },
      },

      // Port (kept at top level for easy access)
      port: stepData.port || detectedConfig.port || 8000,

      // Environment Variables
      environmentVariables: stepData.environmentVariables || [],
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  // Auto-populate from analysis results
  useEffect(() => {
    const results =
      stepData.analysisResults ||
      stepData.analysis?.results ||
      stepData.analysis;

    if (results) {
      const technologyStack = results.technologyStack || {};
      const buildConfiguration = results.buildConfiguration || {};
      const detectedConfig = results.detectedConfig || {};
      const deploymentConfiguration = results.deploymentConfiguration || {};

      setFormData((prev) => {
        const updated = { ...prev };

        // Auto-populate build commands
        if (detectedConfig.buildCommand) {
          updated.build.commands.build = detectedConfig.buildCommand;
        }
        if (detectedConfig.installCommand) {
          updated.build.commands.install = detectedConfig.installCommand;
        }
        if (detectedConfig.startCommand) {
          updated.build.commands.start = detectedConfig.startCommand;
        }

        if (buildConfiguration?.build_commands?.default) {
          updated.build.commands.build =
            buildConfiguration.build_commands.default;
        }
        if (buildConfiguration?.start_commands?.default) {
          updated.build.commands.start =
            buildConfiguration.start_commands.default;
        }
        if (buildConfiguration?.install_commands?.default) {
          updated.build.commands.install =
            buildConfiguration.install_commands.default;
        }
        if (buildConfiguration?.exposed_ports?.[0]) {
          updated.port = buildConfiguration.exposed_ports[0];
        }

        if (technologyStack?.version) {
          updated.build.nodeVersion =
            technologyStack.version.replace(">=", "").replace("+", "") ||
            prev.build.nodeVersion;
        }

        if (results.stack === "nextjs" && !updated.build.outputDir) {
          updated.build.outputDir = ".next";
        }

        if (results.stack === "fastapi" && !updated.build.nodeVersion) {
          updated.build.nodeVersion = "18";
        }

        if (deploymentConfiguration?.health_check_path) {
          updated.runtime.healthCheck.path =
            deploymentConfiguration.health_check_path;
        }

        // Auto-populate port
        if (detectedConfig.port) {
          updated.port = detectedConfig.port;
        }

        // Auto-populate environment variables
        const envVars =
          detectedConfig.environmentVariables ||
          buildConfiguration.environment_variables ||
          deploymentConfiguration.environment_variables ||
          [];

        if (envVars.length) {
          updated.environmentVariables = envVars.map((env) => ({
            key: env.key,
            value: env.value || "",
            description: env.description || "",
            isSecret: env.isSecret || false,
          }));
        }

        return updated;
      });
    }
  }, [stepData.analysisResults, stepData.analysis]);

  // Generic input handler for nested objects
  const handleNestedChange = (path, value) => {
    setFormData((prev) => {
      const keys = path.split(".");
      const updated = { ...prev };
      let current = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const addEnvironmentVariable = () => {
    setFormData((prev) => ({
      ...prev,
      environmentVariables: [
        ...prev.environmentVariables,
        { key: "", value: "", description: "", isSecret: false },
      ],
    }));
  };

  const updateEnvironmentVariable = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      environmentVariables: prev.environmentVariables.map((env, i) =>
        i === index ? { ...env, [field]: value } : env,
      ),
    }));
  };

  const removeEnvironmentVariable = (index) => {
    setFormData((prev) => ({
      ...prev,
      environmentVariables: prev.environmentVariables.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  // Helper to determine if field is relevant for detected stack
  const getRelevantFieldsForStack = (stack) => {
    const stackLower = (stack || "").toLowerCase();
    return {
      showNodeVersion:
        !stackLower.includes("fastapi") && !stackLower.includes("python"),
      showOutputDir: !stackLower.includes("fastapi"),
      isPythonStack:
        stackLower.includes("fastapi") || stackLower.includes("python"),
    };
  };

  const detectedStack = stepData.analysisResults?.stack || "";
  const { showNodeVersion, showOutputDir } =
    getRelevantFieldsForStack(detectedStack);

  const handleContinue = () => {
    dispatch(setProjectConfiguration(formData));

    dispatch(completeStep(5));
    onNext();
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <FaCogs className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Project Configuration
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto px-2">
            Configure your project settings. Fields have been auto-populated
            based on repository analysis. Review and adjust as needed.
          </p>
        </motion.div>
      </div>

      {/* Analysis Banner */}
      {stepData.analysisResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <FaBrain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            <div>
              <h3 className="text-blue-400 font-medium text-sm sm:text-base">
                Configuration Auto-Populated
              </h3>
              <p className="text-blue-300 text-xs sm:text-sm">
                Detected stack:{" "}
                <span className="font-semibold uppercase">
                  {stepData.analysisResults?.stack}
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-6 sm:space-y-8">
        {/* Basic Information */}
        <div className="bg-neutral-800/30 rounded-lg p-3 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <FaProjectDiagram className="w-5 h-5 text-blue-500" />
            <span>Basic Information</span>
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) =>
                  handleNestedChange("projectName", e.target.value)
                }
                className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="my-awesome-project"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Application Port *
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) =>
                  handleNestedChange("port", parseInt(e.target.value))
                }
                className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              onChange={(e) =>
                handleNestedChange("projectDescription", e.target.value)
              }
              rows={3}
              className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of your project..."
            />
          </div>
        </div>

        {/* Build Configuration */}
        <div className="bg-neutral-800/30 rounded-lg p-3 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <FaTerminal className="w-5 h-5 text-purple-500" />
            <span>Build Configuration</span>
          </h3>

          <div className="grid gap-4 md:grid-cols-2 mb-4">
            {showNodeVersion && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Node Version
                </label>
                <select
                  value={formData.build.nodeVersion}
                  onChange={(e) =>
                    handleNestedChange("build.nodeVersion", e.target.value)
                  }
                  className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select version...</option>
                  <option value="16">Node 16</option>
                  <option value="18">Node 18</option>
                  <option value="20">Node 20</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Build Timeout (seconds)
              </label>
              <input
                type="number"
                value={formData.build.buildTimeout}
                onChange={(e) =>
                  handleNestedChange(
                    "build.buildTimeout",
                    parseInt(e.target.value),
                  )
                }
                className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="60"
                max="3600"
              />
            </div>

            {showOutputDir && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Output Directory
                </label>
                <input
                  type="text"
                  value={formData.build.outputDir}
                  onChange={(e) =>
                    handleNestedChange("build.outputDir", e.target.value)
                  }
                  className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="dist"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Install Command *
              </label>
              <input
                type="text"
                value={formData.build.commands.install}
                onChange={(e) =>
                  handleNestedChange("build.commands.install", e.target.value)
                }
                className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="npm install"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Build Command *
              </label>
              <input
                type="text"
                value={formData.build.commands.build}
                onChange={(e) =>
                  handleNestedChange("build.commands.build", e.target.value)
                }
                className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="npm run build"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Start Command *
              </label>
              <div className="flex items-center space-x-2">
                <FaPlay className="w-4 h-4 text-green-500" />
                <input
                  type="text"
                  value={formData.build.commands.start}
                  onChange={(e) =>
                    handleNestedChange("build.commands.start", e.target.value)
                  }
                  className="flex-1 p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="npm start"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Test Command (Optional)
              </label>
              <input
                type="text"
                value={formData.build.commands.test}
                onChange={(e) =>
                  handleNestedChange("build.commands.test", e.target.value)
                }
                className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="npm test"
              />
            </div>
          </div>
        </div>

        {/* Runtime Configuration */}
        <div className="bg-neutral-800/30 rounded-lg p-3 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <FaCogs className="w-5 h-5 text-yellow-500" />
            <span>Runtime Configuration</span>
          </h3>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                CPU Allocation
              </label>
              <select
                value={formData.runtime.cpu}
                onChange={(e) =>
                  handleNestedChange("runtime.cpu", e.target.value)
                }
                className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0.25">0.25 vCPU</option>
                <option value="0.5">0.5 vCPU</option>
                <option value="1">1 vCPU</option>
                <option value="2">2 vCPU</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Memory Allocation
              </label>
              <select
                value={formData.runtime.memory}
                onChange={(e) =>
                  handleNestedChange("runtime.memory", e.target.value)
                }
                className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="256MB">256 MB</option>
                <option value="512MB">512 MB</option>
                <option value="1GB">1 GB</option>
                <option value="2GB">2 GB</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Instances
              </label>
              <input
                type="number"
                value={formData.runtime.instances}
                onChange={(e) =>
                  handleNestedChange(
                    "runtime.instances",
                    parseInt(e.target.value),
                  )
                }
                className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="5"
              />
            </div>
          </div>

          {/* Health Check Configuration */}
          <div className="border-t border-neutral-700 pt-4">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center space-x-2">
              <FaHeartbeat className="w-4 h-4 text-red-500" />
              <span>Health Check</span>
            </h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Health Check Path
                </label>
                <input
                  type="text"
                  value={formData.runtime.healthCheck.path}
                  onChange={(e) =>
                    handleNestedChange(
                      "runtime.healthCheck.path",
                      e.target.value,
                    )
                  }
                  className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/health"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Interval (seconds)
                </label>
                <input
                  type="number"
                  value={formData.runtime.healthCheck.interval}
                  onChange={(e) =>
                    handleNestedChange(
                      "runtime.healthCheck.interval",
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="5"
                  max="300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={formData.runtime.healthCheck.timeout}
                  onChange={(e) =>
                    handleNestedChange(
                      "runtime.healthCheck.timeout",
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Retries
                </label>
                <input
                  type="number"
                  value={formData.runtime.healthCheck.retries}
                  onChange={(e) =>
                    handleNestedChange(
                      "runtime.healthCheck.retries",
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full p-2 sm:p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-neutral-800/30 rounded-lg p-3 sm:p-6">
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
              <span className="hidden sm:inline">Add Variable</span>
            </button>
          </div>

          <div className="space-y-3">
            {formData.environmentVariables.map((env, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-3">
                  <input
                    type="text"
                    value={env.key}
                    onChange={(e) =>
                      updateEnvironmentVariable(index, "key", e.target.value)
                    }
                    className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="KEY"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type={env.isSecret ? "password" : "text"}
                    value={env.value}
                    onChange={(e) =>
                      updateEnvironmentVariable(index, "value", e.target.value)
                    }
                    className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="value"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={env.description}
                    onChange={(e) =>
                      updateEnvironmentVariable(
                        index,
                        "description",
                        e.target.value,
                      )
                    }
                    className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Description"
                  />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <label className="flex items-center space-x-1 text-xs">
                    <input
                      type="checkbox"
                      checked={env.isSecret || false}
                      onChange={(e) =>
                        updateEnvironmentVariable(
                          index,
                          "isSecret",
                          e.target.checked,
                        )
                      }
                      className="rounded"
                    />
                    <span className="text-neutral-400 hidden sm:inline">
                      Secret
                    </span>
                  </label>
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
                No environment variables configured. Click &quot;Add
                Variable&quot; to add one.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 sm:mt-8 flex items-center justify-center gap-4">
        <button
          onClick={handleContinue}
          disabled={
            !formData.projectName || !formData.build.commands.start || loading
          }
          className={`
            px-6 sm:px-8 py-3 rounded-lg font-medium transition-all inline-flex items-center space-x-2 text-sm sm:text-base
            ${
              formData.projectName && formData.build.commands.start && !loading
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
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
