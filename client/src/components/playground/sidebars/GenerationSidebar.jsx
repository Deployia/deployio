import { motion } from "framer-motion";
import {
  FiCode,
  FiZap,
  FiPackage,
  FiServer,
  FiGitBranch,
  FiCpu,
  FiCloud,
} from "react-icons/fi";

import { useState } from "react";

const GenerationSidebar = ({ workspace, setWorkspace }) => {
  // Use local state for form fields, only update workspace on submit
  const [localTemplate, setLocalTemplate] = useState(workspace?.activeTemplate || "dockerfile");
  const [localSettings, setLocalSettings] = useState({ ...workspace?.settings } || {});
  const activeTemplate = localTemplate;
  const settings = localSettings;

  const generators = [
    {
      id: "dockerfile",
      label: "Dockerfile",
      icon: FiCode,
      color: "blue",
      description: "Container image definition",
    },
    {
      id: "docker-compose",
      label: "Docker Compose",
      icon: FiPackage,
      color: "green",
      description: "Multi-container applications",
    },
    {
      id: "kubernetes",
      label: "Kubernetes",
      icon: FiServer,
      color: "purple",
      description: "Container orchestration",
    },
    {
      id: "terraform",
      label: "Terraform",
      icon: FiCloud,
      color: "indigo",
      description: "Infrastructure as code",
    },
    {
      id: "github-actions",
      label: "GitHub Actions",
      icon: FiGitBranch,
      color: "yellow",
      description: "CI/CD pipeline",
    },
  ];

  const handleGeneratorSelect = (generatorId) => {
    setLocalTemplate(generatorId);
    setLocalSettings((prev) => ({ ...prev, lastSelected: generatorId }));
  };

  const handleSettingChange = (key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-4 space-y-4">
        {/* Generator Selection */}
        <div className="text-xs text-neutral-400 uppercase tracking-wide font-medium body">
          Select Generator
        </div>

        <div className="space-y-2">
          {generators.map((generator) => {
            const Icon = generator.icon;
            const isActive = activeTemplate === generator.id;

            return (
              <motion.button
                key={generator.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGeneratorSelect(generator.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg border transition-all text-left ${
                  isActive
                    ? `bg-${generator.color}-500/20 border-${generator.color}-500/30 text-${generator.color}-400`
                    : "bg-neutral-900/50 border-neutral-800/50 text-neutral-400 hover:border-neutral-700/50 hover:text-neutral-300"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium heading truncate">
                    {generator.label}
                  </div>
                  <div className="text-xs opacity-75 body truncate">
                    {generator.description}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Configuration Settings */}
        {activeTemplate && (
          <>
            <div className="text-xs text-neutral-400 uppercase tracking-wide font-medium body mt-6">
              Configuration
            </div>

            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white heading mb-3">
                Generator Settings
              </h4>

              {/* Common Settings */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1 body">
                    Environment
                  </label>
                  <select
                    value={settings.environment || "production"}
                    onChange={(e) =>
                      handleSettingChange("environment", e.target.value)
                    }
                    className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 body"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>

                {/* Template-specific settings */}
                {activeTemplate === "dockerfile" && (
                  <>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1 body">
                        Base Image
                      </label>
                      <select
                        value={settings.baseImage || "node:18-alpine"}
                        onChange={(e) =>
                          handleSettingChange("baseImage", e.target.value)
                        }
                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 body"
                      >
                        <option value="node:18-alpine">
                          Node.js 18 Alpine
                        </option>
                        <option value="python:3.11-alpine">
                          Python 3.11 Alpine
                        </option>
                        <option value="golang:1.21-alpine">
                          Go 1.21 Alpine
                        </option>
                        <option value="nginx:alpine">Nginx Alpine</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1 body">
                        Port
                      </label>
                      <input
                        type="number"
                        value={settings.port || 3000}
                        onChange={(e) =>
                          handleSettingChange("port", parseInt(e.target.value))
                        }
                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 body"
                        placeholder="3000"
                      />
                    </div>
                  </>
                )}

                {activeTemplate === "kubernetes" && (
                  <>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1 body">
                        Replicas
                      </label>
                      <input
                        type="number"
                        value={settings.replicas || 3}
                        onChange={(e) =>
                          handleSettingChange(
                            "replicas",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 body"
                        placeholder="3"
                        min="1"
                        max="10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1 body">
                        Namespace
                      </label>
                      <input
                        type="text"
                        value={settings.namespace || "default"}
                        onChange={(e) =>
                          handleSettingChange("namespace", e.target.value)
                        }
                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 body"
                        placeholder="default"
                      />
                    </div>
                  </>
                )}

                {activeTemplate === "terraform" && (
                  <>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1 body">
                        Cloud Provider
                      </label>
                      <select
                        value={settings.cloudProvider || "aws"}
                        onChange={(e) =>
                          handleSettingChange("cloudProvider", e.target.value)
                        }
                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 body"
                      >
                        <option value="aws">Amazon Web Services</option>
                        <option value="azure">Microsoft Azure</option>
                        <option value="gcp">Google Cloud Platform</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1 body">
                        Region
                      </label>
                      <input
                        type="text"
                        value={settings.region || "us-west-2"}
                        onChange={(e) =>
                          handleSettingChange("region", e.target.value)
                        }
                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 body"
                        placeholder="us-west-2"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Only update workspace on submit
                setWorkspace({
                  activeTemplate: localTemplate,
                  settings: localSettings,
                  generatedCode: null, // Clear previous generation
                });
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors body"
            >
              <FiZap className="w-4 h-4" />
              Apply Settings
            </motion.button>
          </>
        )}

        {/* Quick Templates */}
        <div className="text-xs text-neutral-400 uppercase tracking-wide font-medium body mt-6">
          Quick Templates
        </div>

        <div className="space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setWorkspace({
                activeTemplate: "dockerfile",
                settings: {
                  baseImage: "node:18-alpine",
                  port: 3000,
                  environment: "production",
                },
              });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-xs body"
          >
            <FiCode className="w-3 h-3" />
            Node.js App
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setWorkspace({
                activeTemplate: "docker-compose",
                settings: {
                  environment: "production",
                  includeDatabase: true,
                },
              });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-xs body"
          >
            <FiPackage className="w-3 h-3" />
            Full Stack App
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setWorkspace({
                activeTemplate: "kubernetes",
                settings: {
                  replicas: 3,
                  namespace: "production",
                  environment: "production",
                },
              });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors text-xs body"
          >
            <FiServer className="w-3 h-3" />
            K8s Deployment
          </motion.button>
        </div>

        {/* Coming Soon Badge */}
        <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <FiCpu className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400 body">
              AI Engine Integration
            </span>
          </div>
          <p className="text-xs text-yellow-400/75 body">
            Advanced AI-powered generation features coming soon
          </p>
        </div>
      </div>
    </div>
  );
};

export default GenerationSidebar;
