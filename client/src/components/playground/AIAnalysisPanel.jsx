import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCpu,
  FiZap,
  FiAlertTriangle,
  FiCheckCircle,
  FiTrendingUp,
  FiShield,
  FiCode,
  FiSettings,
  FiDownload,
  FiEye,
  FiGitBranch,
  FiPlay,
  FiLoader,
} from "react-icons/fi";
import { FaGithub, FaBrain, FaRocket, FaSpinner } from "react-icons/fa";
import api from "@utils/api";
import webSocketService from "@services/websocketService";
import AnalysisResults from "@components/analysis/AnalysisResults";
import SmartConfigCodeBlock from "@components/common/SmartConfigCodeBlock";
import ConfigMetadata from "@components/common/ConfigMetadata";

const AIAnalysisPanel = ({
  workspace: _workspace,
  aiState: _aiState,
  setAiState: _setAiState,
}) => {
  const [activeTab, setActiveTab] = useState("analysis");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [generationResults, setGenerationResults] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const socketRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const tabs = [
    { id: "analysis", label: "Repository Analysis", icon: FaGithub },
    { id: "overview", label: "Overview", icon: FiCpu },
    { id: "security", label: "Security", icon: FiShield },
    { id: "performance", label: "Performance", icon: FiTrendingUp },
    { id: "quality", label: "Code Quality", icon: FiCode },
  ];

  // Analysis progress steps
  const progressSteps = [
    {
      icon: FiGitBranch,
      label: "Fetching Repository",
      description: "Cloning and analyzing repository structure",
    },
    {
      icon: FiCode,
      label: "Detecting Stack",
      description: "Analyzing technology stack and dependencies",
    },
    {
      icon: FaBrain,
      label: "AI Enhancement",
      description: "Running LLM analysis for deeper insights",
    },
    {
      icon: FiTrendingUp,
      label: "Code Analysis",
      description: "Evaluating code quality and architecture patterns",
    },
    {
      icon: FiSettings,
      label: "Generating Configs",
      description: "Creating deployment configurations with LLM enhancement",
    },
    {
      icon: FaRocket,
      label: "Complete",
      description: "Unified analysis and configuration generation completed",
    },
  ];

  // WebSocket connection setup
  const setupWebSocketConnection = useCallback(async () => {
    try {
      const socket = await webSocketService.connect("/ai");
      socketRef.current = socket;
      setWsConnected(true);

      socket.on("ai:progress", (data) => {
        console.log("WebSocket progress:", data);
        if (data.step !== undefined) {
          setCurrentStep(data.step);
        }
      });

      socket.on("ai:complete", (data) => {
        console.log("Analysis complete:", data);
        setIsAnalyzing(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      });

      socket.on("ai:error", (data) => {
        console.error("Analysis error:", data);
        setError(data.message || "Analysis failed");
        setIsAnalyzing(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      });
    } catch (error) {
      console.error("WebSocket connection failed:", error);
      setWsConnected(false);
    }
  }, []);

  useEffect(() => {
    setupWebSocketConnection();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [setupWebSocketConnection]);

  const normalizeRepositoryUrl = (input) => {
    if (!input) return "";

    if (input.startsWith("https://github.com/")) {
      return input;
    }

    if (input.includes("/") && !input.includes("github.com")) {
      return `https://github.com/${input}`;
    }

    return input;
  };

  const startProgressAnimation = () => {
    setCurrentStep(0);

    progressIntervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < progressSteps.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 3000);
  };

  const handleAnalyze = async () => {
    const normalizedUrl = normalizeRepositoryUrl(repositoryUrl.trim());
    if (!normalizedUrl) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResults(null);
    setGenerationResults(null);
    setCurrentStep(0);

    startProgressAnimation();

    try {
      const response = await api.post("/ai/analysis/demo-complete-pipeline", {
        repositoryUrl: normalizedUrl,
        branch: branch || "main",
        analysisTypes: ["comprehensive"],
        configTypes: ["dockerfile", "docker_compose", "github_actions"],
        options: {
          forceLlm: true,
          includeReasoning: true,
          trackProgress: true,
        },
      });

      setAnalysisResults(response.data);
      if (response.data.data?.configurations) {
        setGenerationResults(response.data.data);
      }

      setCurrentStep(progressSteps.length - 1);
    } catch (err) {
      console.error("Analysis error:", err);
      let errorMessage = "Failed to analyze repository. Please try again.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };

  const handleDownloadReport = async () => {
    if (!analysisResults && !generationResults) return;

    try {
      const reportData = {
        timestamp: new Date().toISOString(),
        generated_by: "DeployIO Playground - AI Analysis",
        repository: analysisResults?.data?.repository_url,
        branch: analysisResults?.data?.branch,
        analysis: analysisResults?.data,
        configurations: generationResults?.configurations,
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const repoName =
        analysisResults?.data?.repository_url?.split("/").pop() ||
        "playground-analysis";
      a.download = `deployio-${repoName}-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
      setError("Failed to generate report download. Please try again.");
    }
  };

  const renderAnalysisTab = () => (
    <div className="space-y-4">
      {/* Repository Input */}
      <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50">
        <div className="flex items-center mb-3">
          <FaGithub className="w-5 h-5 text-gray-400 mr-2" />
          <span className="text-gray-300 font-medium text-sm">
            Repository Analysis
          </span>
        </div>

        {/* URL Input */}
        <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-600/30 mb-3">
          <div className="flex flex-col sm:flex-row items-center">
            <span className="text-gray-500 font-mono text-xs sm:text-sm mr-1 flex-shrink-0">
              https://github.com/
            </span>
            <input
              type="text"
              value={repositoryUrl.replace("https://github.com/", "")}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              placeholder="username/repository"
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-xs sm:text-sm font-mono"
              disabled={isAnalyzing}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !isAnalyzing) {
                  handleAnalyze();
                }
              }}
            />
          </div>
        </div>

        {/* Branch Input */}
        <div className="flex items-center bg-neutral-800/70 rounded-lg p-2 sm:p-3 border border-neutral-600/20 mb-4">
          <FiGitBranch className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />
          <span className="text-gray-400 text-xs mr-2 flex-shrink-0">
            Branch:
          </span>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-xs font-mono"
            disabled={isAnalyzing}
          />
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!repositoryUrl.trim() || isAnalyzing}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <FaSpinner className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FiPlay className="w-4 h-4" />
              Analyze Repository
            </>
          )}
        </button>
      </div>

      {/* Progress Indicator */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Analysis Progress</h3>
            <div className="flex items-center gap-2 text-yellow-400">
              <div
                className={`w-2 h-2 rounded-full ${
                  wsConnected ? "bg-green-400" : "bg-yellow-400"
                } animate-pulse`}
              />
              <span className="text-xs">
                {wsConnected ? "Real-time" : "Fallback"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {progressSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 ${
                  index <= currentStep ? "text-white" : "text-gray-500"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    index < currentStep
                      ? "bg-green-500/20 text-green-400"
                      : index === currentStep
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-gray-500/20 text-gray-500"
                  }`}
                >
                  <step.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{step.label}</div>
                  <div className="text-xs text-gray-400">
                    {step.description}
                  </div>
                </div>
                {index < currentStep && (
                  <FiCheckCircle className="w-5 h-5 text-green-400" />
                )}
                {index === currentStep && (
                  <FiLoader className="w-5 h-5 animate-spin text-blue-400" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <FiAlertTriangle className="w-4 h-4" />
            <span className="font-medium">Analysis Failed</span>
          </div>
          <p className="text-sm text-red-300">{error}</p>
        </motion.div>
      )}

      {/* Analysis Results */}
      {analysisResults && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Analysis Complete</h3>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-sm"
            >
              <FiDownload className="w-4 h-4" />
              Download Report
            </button>
          </div>

          <AnalysisResults data={analysisResults.data} isDemo={true} />
        </motion.div>
      )}

      {/* Generated Configurations */}
      {generationResults?.configurations && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50"
        >
          <h3 className="text-white font-medium mb-4">
            Generated Configurations
          </h3>
          <div className="space-y-4">
            {Object.entries(generationResults.configurations).map(
              ([configType, config]) => {
                if (!config || configType === "metadata") return null;

                let configValue = config;
                if (config?.dockerfile_content)
                  configValue = config.dockerfile_content;
                else if (config?.docker_compose_content)
                  configValue = config.docker_compose_content;
                else if (config?.workflow_content)
                  configValue = config.workflow_content;
                else if (config?.terraform_content)
                  configValue = config.terraform_content;

                if (typeof configValue !== "string" || !configValue.trim())
                  return null;

                return (
                  <div
                    key={configType}
                    className="border border-neutral-700/50 rounded-lg"
                  >
                    <div className="p-3 border-b border-neutral-700/50 bg-neutral-800/30">
                      <h4 className="text-sm font-medium text-white capitalize">
                        {configType.replace(/_/g, " ")}
                      </h4>
                    </div>
                    <div className="p-3">
                      <SmartConfigCodeBlock
                        value={configValue}
                        title={config.filename || configType}
                      />
                      {config.metadata && (
                        <div className="mt-3">
                          <ConfigMetadata
                            metadata={config.metadata}
                            configType={configType.replace(/_/g, " ")}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-4">
      {analysisResults ? (
        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50">
          <h3 className="text-lg font-medium text-white mb-4">
            Analysis Overview
          </h3>
          <AnalysisResults data={analysisResults.data} isDemo={true} />
        </div>
      ) : (
        <div className="text-center py-8">
          <FaGithub className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            Run an analysis to see overview results
          </p>
        </div>
      )}
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-4">
      {analysisResults?.data?.analysis?.security ? (
        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50">
          <h3 className="text-lg font-medium text-white mb-4">
            Security Analysis
          </h3>
          <div className="text-center py-4">
            <FiShield className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-gray-400">
              Security analysis details will be displayed here
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <FiShield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            Run an analysis to see security results
          </p>
        </div>
      )}
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-4">
      {analysisResults?.data?.analysis?.performance ? (
        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50">
          <h3 className="text-lg font-medium text-white mb-4">
            Performance Analysis
          </h3>
          <div className="text-center py-4">
            <FiTrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-gray-400">
              Performance analysis details will be displayed here
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <FiTrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            Run an analysis to see performance results
          </p>
        </div>
      )}
    </div>
  );

  const renderQuality = () => (
    <div className="space-y-4">
      {analysisResults?.data?.analysis?.quality ? (
        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50">
          <h3 className="text-lg font-medium text-white mb-4">
            Code Quality Analysis
          </h3>
          <div className="text-center py-4">
            <FiCode className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-gray-400">
              Code quality analysis details will be displayed here
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <FiCode className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            Run an analysis to see code quality results
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-neutral-900/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-white">AI Analysis</h2>
          <div className="flex items-center gap-2">
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <FiCpu className="w-4 h-4 animate-pulse" />
                <span>Analyzing...</span>
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg hover:bg-neutral-800/50 text-gray-400 hover:text-white transition-colors"
            >
              <FiSettings className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-neutral-800/30 rounded-lg p-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-gray-400 hover:text-white hover:bg-neutral-700/50"
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "analysis" && renderAnalysisTab()}
            {activeTab === "overview" && renderOverview()}
            {activeTab === "security" && renderSecurity()}
            {activeTab === "performance" && renderPerformance()}
            {activeTab === "quality" && renderQuality()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-neutral-800/50 bg-neutral-900/30">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAnalyze}
            disabled={isAnalyzing || !repositoryUrl.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
          >
            <FiZap className="w-4 h-4" />
            <span>{isAnalyzing ? "Analyzing..." : "Run Analysis"}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadReport}
            disabled={!analysisResults}
            className="p-2 rounded-lg hover:bg-neutral-800/50 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Download Report"
          >
            <FiDownload className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg hover:bg-neutral-800/50 text-gray-400 hover:text-white transition-colors"
            title="View Details"
          >
            <FiEye className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
