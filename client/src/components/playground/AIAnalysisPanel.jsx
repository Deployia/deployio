import { useState, useEffect, useRef, useCallback } from "react";
import SEO from "@components/SEO";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCpu,
  FiZap,
  FiAlertTriangle,
  FiCheckCircle,
  FiTrendingUp,
  FiShield,
  FiCode,
  FiPlay,
  FiLoader,
  FiChevronRight,
  FiGitBranch,
  FiSettings,
  FiDownload,
  FiRefreshCw,
  FiCopy,
  FiLayers,
  FiActivity,
} from "react-icons/fi";
import {
  FaGithub,
  FaBrain,
  FaCode,
  FaChartLine,
  FaRocket,
  FaCog,
} from "react-icons/fa";
import { analysisApi } from "@utils/api";
import websocketService from "@/services/websocketService";

const AIAnalysisPanel = ({ _workspace, setWorkspace }) => {
  const [activeTab, setActiveTab] = useState("analysis");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [generationResults, setGenerationResults] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [realProgress, setRealProgress] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [operationId, setOperationId] = useState(null);
  const [analysisSettings] = useState({
    stackAnalysis: true,
    dependencyAnalysis: true,
    codeAnalysis: true,
    securityAnalysis: true,
    performanceCheck: true,
    llmEnhancement: true,
    includeInsights: true,
    includeRecommendations: true,
    explainNullFields: false,
    generateDockerfile: true,
    generateDockerCompose: true,
    generateGithubActions: true,
    analysisScope: "full_project",
  });

  const socketRef = useRef(null);
  const progressPollingRef = useRef(null);

  // Handle settings change from sidebar
  // const handleSettingsChange = (newSettings) => {
  //   setAnalysisSettings(newSettings);
  //   if (setWorkspace) {
  //     setWorkspace((prev) => ({
  //       ...prev,
  //       settings: newSettings,
  //     }));
  //   }
  // };

  // Progress steps with icons and descriptions
  const progressSteps = [
    {
      icon: FaGithub,
      label: "Fetching Repository",
      description: "Cloning and accessing repository files",
    },
    {
      icon: FaCode,
      label: "Detecting Stack",
      description: "Analyzing technology stack and dependencies",
    },
    {
      icon: FaBrain,
      label: "AI Enhancement",
      description: "Running LLM analysis for deeper insights",
    },
    {
      icon: FaChartLine,
      label: "Code Analysis",
      description: "Evaluating code quality and architecture patterns",
    },
    {
      icon: FaCog,
      label: "Generating Configs",
      description: "Creating deployment configurations with LLM enhancement",
    },
    {
      icon: FaRocket,
      label: "Complete",
      description: "Unified analysis and configuration generation completed",
    },
  ];

  const tabs = [
    { id: "analysis", label: "Repository Analysis", icon: FaGithub },
    { id: "overview", label: "Overview", icon: FiCpu },
    { id: "technology", label: "Technology Stack", icon: FaCode },
    { id: "dependencies", label: "Dependencies", icon: FiZap },
    { id: "security", label: "Security", icon: FiShield },
    { id: "quality", label: "Code Quality", icon: FiCode },
    { id: "insights", label: "Insights", icon: FaBrain },
    { id: "recommendations", label: "Recommendations", icon: FiTrendingUp },
    { id: "generation", label: "Generate Configs", icon: FiSettings },
  ];

  // Sample repositories for quick testing
  const sampleRepos = [
    {
      name: "vasudevshetty/mern",
      description: "MERN Stack Application",
      branch: "main",
    },
    {
      name: "microsoft/TypeScript-React-Starter",
      description: "TypeScript React Starter",
      branch: "master",
    },
    {
      name: "hagopj13/node-express-boilerplate",
      description: "Node.js Express Boilerplate",
      branch: "master",
    },
  ];

  // WebSocket connection setup
  const setupWebSocketConnection = useCallback(async () => {
    // Check if we already have a connected socket
    if (socketRef.current?.connected) {
      console.log("WebSocket already connected, reusing connection");
      return;
    }

    // Check if websocketService already has a connection to /ai
    const existingSocket = websocketService.getSocket("/ai");
    if (existingSocket && existingSocket.connected) {
      console.log("Reusing existing WebSocket connection");
      socketRef.current = existingSocket;
      setWsConnected(true);
      return;
    }

    try {
      // Use the centralized webSocketService instead of direct io()
      console.log("Creating new WebSocket connection to /ai namespace");
      const socket = await websocketService.connect("/ai");
      socketRef.current = socket;
      setWsConnected(socket.connected);
      setError(null);

      // Setup event handlers for AI namespace
      socket.on("connect", () => {
        setWsConnected(true);
        setError(null);
        console.log("Connected to AI namespace");
      });

      socket.on("disconnect", (reason) => {
        setWsConnected(false);
        console.log("Disconnected from AI namespace:", reason);
      });

      // AI analysis progress events
      socket.on("ai:progress", (data) => {
        console.log("Received progress:", data);
        // Check if this progress is for any active operation (more flexible matching)
        if (!operationId || data.sessionId === operationId || !data.sessionId) {
          setRealProgress(data);

          // Update step based on progress
          const stepIndex = Math.min(
            Math.floor((data.progress / 100) * progressSteps.length),
            progressSteps.length - 1,
          );
          setCurrentStep(stepIndex);
        }
      });

      socket.on("ai:analysis_complete", (data) => {
        console.log("Analysis complete:", data);
        // Check if this completion is for any active operation
        if (!operationId || data.sessionId === operationId || !data.sessionId) {
          setAnalysisResults(data.data || data.results);
          setIsAnalyzing(false);
          setCurrentStep(progressSteps.length - 1);

          // Update workspace if setWorkspace is available
          if (setWorkspace) {
            setWorkspace((prev) => ({
              ...prev,
              analysisResults: data.data || data.results,
              lastAnalysis: new Date().toISOString(),
            }));
          }
        }
      });

      socket.on("ai:generation_complete", (data) => {
        console.log("Generation complete:", data);
        // Check if this completion is for any active operation
        if (!operationId || data.sessionId === operationId || !data.sessionId) {
          setGenerationResults(data.data || data.results);
          setIsGenerating(false);

          // Update workspace if setWorkspace is available
          if (setWorkspace) {
            setWorkspace((prev) => ({
              ...prev,
              generatedConfigs: data.data || data.results,
              lastGeneration: new Date().toISOString(),
            }));
          }

          // Switch to generation tab to show results
          setActiveTab("generation");
        }
      });

      socket.on("ai:error", (data) => {
        console.log("AI service error:", data);
        // Check if this error is for any active operation
        if (!operationId || data.sessionId === operationId || !data.sessionId) {
          setError(data.error);
          setIsAnalyzing(false);
          setIsGenerating(false);
        }
      });

      // AI status events
      socket.on("ai:status", (data) => {
        console.log("AI service status:", data);
      });
    } catch (err) {
      console.error("Failed to connect to AI WebSocket:", err);
      setError("Failed to connect to real-time updates");
    }
  }, [progressSteps.length, setWorkspace]); // Removed operationId from dependencies

  // Setup WebSocket on mount
  useEffect(() => {
    let isMounted = true;

    const initWebSocket = async () => {
      if (!isMounted) return;

      try {
        await setupWebSocketConnection();
      } catch (error) {
        console.error("Failed to setup WebSocket:", error);
      }
    };

    initWebSocket();

    return () => {
      isMounted = false;
      // Use webSocketService to properly disconnect
      if (socketRef.current) {
        websocketService.disconnect("/ai");
        socketRef.current = null;
      }
      if (progressPollingRef.current) {
        clearInterval(progressPollingRef.current);
      }
    };
  }, []); // Empty dependency array to run only on mount

  const normalizeRepositoryUrl = (input) => {
    if (!input) return "";

    // Handle GitHub shorthand (owner/repo)
    if (!input.includes("://") && input.includes("/")) {
      return `https://github.com/${input}`;
    }

    return input;
  };

  const handleAnalyze = async () => {
    if (!repositoryUrl.trim()) {
      setError("Please enter a repository URL");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setCurrentStep(0);
    setRealProgress(null);
    setAnalysisResults(null);
    setGenerationResults(null);
    setOperationId(null);

    // Start with fallback animation if WebSocket is not connected
    if (!wsConnected) {
      // fallback animation (optional)
    } else {
      setCurrentStep(0);
    }

    try {
      const normalizedUrl = normalizeRepositoryUrl(repositoryUrl);

      // Build analysis types based on settings
      const analysisTypes = [];
      if (analysisSettings.stackAnalysis) analysisTypes.push("stack");
      if (analysisSettings.dependencyAnalysis)
        analysisTypes.push("dependencies");
      if (analysisSettings.codeAnalysis) analysisTypes.push("code");

      // Build config types based on settings
      const configTypes = [];
      if (analysisSettings.generateDockerfile) configTypes.push("dockerfile");
      if (analysisSettings.generateDockerCompose)
        configTypes.push("docker_compose");
      if (analysisSettings.generateGithubActions)
        configTypes.push("github_actions");

      const sessionId = `demo_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;
      setOperationId(sessionId);

      // Subscribe before starting the request so progress events are not missed.
      if (socketRef.current?.connected) {
        socketRef.current.emit("subscribe_analysis", { sessionId });
      }

      const response = await analysisApi.post(
        "/ai/analysis/demo/complete-pipeline",
        {
          sessionId,
          repositoryUrl: normalizedUrl,
          branch: branch || "main",
          analysisTypes:
            analysisTypes.length > 0
              ? analysisTypes
              : ["stack", "dependencies", "code"],
          configTypes:
            configTypes.length > 0
              ? configTypes
              : ["dockerfile", "github_actions", "docker_compose"],
          forceLlm: analysisSettings.llmEnhancement,
          includeInsights: analysisSettings.includeInsights,
          includeRecommendations: analysisSettings.includeRecommendations,
          explainNullFields: analysisSettings.explainNullFields,
          autoApprove: true,
        },
        {
          timeout: 120000,
        },
      );

      let data = response.data;
      if (data && data.data) data = data.data;

      // Keep tracking aligned with server-provided session ID if it differs.
      if (data.sessionId && data.sessionId !== sessionId) {
        setOperationId(data.sessionId);
      }

      setAnalysisResults(data.analysis || data.analysisResults || null);
      setGenerationResults(
        data.configurations || data.generationResults || null,
      );

      // Optionally update workspace
      if (setWorkspace) {
        setWorkspace((prev) => ({
          ...prev,
          analysisResults: data.analysis || data.analysisResults || null,
          generationResults:
            data.configurations || data.generationResults || null,
          lastAnalysis: new Date().toISOString(),
        }));
      }
      setIsAnalyzing(false);
      setCurrentStep(progressSteps.length - 1);

      // Auto-switch to overview tab to show results
      if (data.analysis || data.analysisResults) {
        setTimeout(() => setActiveTab("overview"), 500);

        // Show notification if configs were generated
        if (data.configurations || data.generationResults) {
          setTimeout(() => {
            // You could add a toast notification here if you have a toast system
            console.log(
              "✅ Configurations generated! View them in the 'Generate Configs' tab.",
            );
          }, 1000);
        }
      }
    } catch (err) {
      let errorMessage = "Failed to analyze repository. Please try again.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      setError(errorMessage);
      setIsAnalyzing(false);
    }
  };

  // No-op: generation is handled in unified analysis now
  const handleGenerateConfigs = () => {
    setError(
      "Generation is now part of the unified analysis. Please re-run analysis.",
    );
  };

  const handleSampleRepo = (repo) => {
    setRepositoryUrl(`https://github.com/${repo.name}`);
    setBranch(repo.branch);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "analysis":
        return (
          <div className="space-y-4 md:space-y-6">
            {/* Repository Input */}
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-3 md:p-6">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <FaGithub className="w-4 h-4 md:w-5 md:h-5 text-white" />
                <h3 className="text-base md:text-lg font-semibold text-white heading">
                  Repository Analysis
                </h3>
                {wsConnected && (
                  <div className="ml-auto flex items-center gap-1 md:gap-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400 body hidden sm:inline">
                      Live Updates
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs md:text-sm font-medium text-neutral-300 mb-1 md:mb-2 body">
                      Repository URL
                    </label>
                    <input
                      type="url"
                      value={repositoryUrl}
                      onChange={(e) => setRepositoryUrl(e.target.value)}
                      placeholder="https://github.com/username/repository"
                      className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-3 py-2 md:px-4 md:py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 body transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-neutral-300 mb-1 md:mb-2 body">
                      Branch
                    </label>
                    <div className="relative">
                      <FiGitBranch className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-3 h-3 md:w-4 md:h-4" />
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="main"
                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 body transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Sample Repositories */}
                <div>
                  <label className="block text-xs md:text-sm font-medium text-neutral-300 mb-1 md:mb-2 body">
                    Quick Start (Sample Repositories)
                  </label>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    {sampleRepos.map((repo, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSampleRepo(repo)}
                        className="text-left p-2 md:p-3 bg-neutral-800/30 border border-neutral-700/30 rounded-lg hover:bg-neutral-700/50 transition-colors"
                      >
                        <div className="text-xs md:text-sm font-medium text-white body truncate">
                          {repo.name}
                        </div>
                        <div className="text-xs text-neutral-400 body">
                          {repo.description}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-2 md:p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <FiAlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
                    <span className="text-xs md:text-sm text-red-400 body">
                      {error}
                    </span>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  disabled={!repositoryUrl || isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 md:px-6 md:py-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed body text-sm md:text-base"
                >
                  {isAnalyzing ? (
                    <>
                      <FiLoader className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                      Analyzing Repository...
                    </>
                  ) : (
                    <>
                      <FiPlay className="w-3 h-3 md:w-4 md:h-4" />
                      Start Analysis
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Progress Tracking */}
            {isAnalyzing && (
              <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-3 md:p-6">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <FiLoader className="w-4 h-4 md:w-5 md:h-5 text-blue-400 animate-spin" />
                  <h3 className="text-base md:text-lg font-semibold text-white heading">
                    Analysis Progress
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${
                          realProgress?.progress ||
                          (currentStep / progressSteps.length) * 100
                        }%`,
                      }}
                    ></div>
                  </div>

                  {/* Progress Steps */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {progressSteps.map((step, index) => {
                      const StepIcon = step.icon;
                      const isActive = index <= currentStep;
                      const isCurrent = index === currentStep;

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`text-center p-3 rounded-lg transition-all ${
                            isActive
                              ? isCurrent
                                ? "bg-blue-500/20 border border-blue-500/50"
                                : "bg-green-500/20 border border-green-500/50"
                              : "bg-neutral-800/50 border border-neutral-700/50"
                          }`}
                        >
                          <StepIcon
                            className={`w-4 h-4 mx-auto mb-1 ${
                              isActive
                                ? isCurrent
                                  ? "text-blue-400"
                                  : "text-green-400"
                                : "text-neutral-500"
                            }`}
                          />
                          <div
                            className={`text-xs font-medium ${
                              isActive ? "text-white" : "text-neutral-500"
                            }`}
                          >
                            {step.label}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {realProgress && (
                    <div className="text-center">
                      <div className="text-sm text-neutral-300 body">
                        {realProgress.message ||
                          progressSteps[currentStep]?.description}
                      </div>
                      <div className="text-xs text-neutral-500 body mt-1">
                        {realProgress.progress}% complete
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analysis Results Preview */}
            {analysisResults && !isAnalyzing && (
              <div className="space-y-4">
                {/* Quick Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      icon: FiCode,
                      label: "Code Quality",
                      value: `${Math.round(
                        (analysisResults.code_analysis?.quality_score || 0) *
                          100,
                      )}%`,
                      color: "green",
                    },
                    {
                      icon: FiShield,
                      label: "Security",
                      value: `${Math.round(
                        (analysisResults.dependency_analysis?.health_score ||
                          0) * 100,
                      )}%`,
                      color: "yellow",
                    },
                    {
                      icon: FiTrendingUp,
                      label: "Confidence",
                      value: `${Math.round(
                        (analysisResults.confidence_score || 0) * 100,
                      )}%`,
                      color: "blue",
                    },
                    {
                      icon: FiZap,
                      label: "Dependencies",
                      value:
                        analysisResults.dependency_analysis
                          ?.total_dependencies || "N/A",
                      color: "purple",
                    },
                  ].map((metric, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-3">
                        <metric.icon
                          className={`w-5 h-5 text-${metric.color}-400`}
                        />
                        <div>
                          <div className="text-sm text-neutral-400 body">
                            {metric.label}
                          </div>
                          <div className="text-lg font-semibold text-white heading">
                            {metric.value}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-semibold mb-1 heading">
                        Analysis Complete! 🎉
                      </h4>
                      <p className="text-neutral-400 text-sm body">
                        Explore detailed insights, security analysis, and
                        generated configurations in the tabs above.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab("overview")}
                        className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-sm body"
                      >
                        View Overview
                      </motion.button>
                      {generationResults && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab("generation")}
                          className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-sm body"
                        >
                          View Configs
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "overview":
        return (
          <div className="space-y-6">
            {analysisResults ? (
              <>
                {/* Project Summary */}
                <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-3 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 heading">
                    Project Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                    <div className="bg-neutral-800/50 rounded-lg p-2 md:p-4 text-center">
                      <div className="text-lg md:text-2xl font-bold text-blue-400 heading mb-1">
                        {Math.round(
                          (analysisResults.confidence_score || 0) * 100,
                        )}
                        %
                      </div>
                      <div className="text-xs md:text-sm text-neutral-400 body">
                        Confidence
                      </div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-2 md:p-4 text-center">
                      <div className="text-lg md:text-2xl font-bold text-green-400 heading mb-1">
                        {analysisResults.processing_time
                          ? `${analysisResults.processing_time.toFixed(1)}s`
                          : "N/A"}
                      </div>
                      <div className="text-xs md:text-sm text-neutral-400 body">
                        Processing Time
                      </div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-2 md:p-4 text-center">
                      <div className="text-lg md:text-2xl font-bold text-purple-400 heading mb-1">
                        {analysisResults.llm_enhanced ? "Enhanced" : "Standard"}
                      </div>
                      <div className="text-xs md:text-sm text-neutral-400 body">
                        Analysis Type
                      </div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-2 md:p-4 text-center">
                      <div className="text-lg md:text-2xl font-bold text-orange-400 heading mb-1">
                        {analysisResults.files_analyzed || "N/A"}
                      </div>
                      <div className="text-xs md:text-sm text-neutral-400 body">
                        Files Analyzed
                      </div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-400 heading mb-1">
                        {analysisResults.processing_time
                          ? `${analysisResults.processing_time.toFixed(1)}s`
                          : "N/A"}
                      </div>
                      <div className="text-sm text-neutral-400 body">
                        Processing Time
                      </div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-400 heading mb-1">
                        {analysisResults.llm_enhanced ? "Enhanced" : "Standard"}
                      </div>
                      <div className="text-sm text-neutral-400 body">
                        Analysis Type
                      </div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400 heading mb-1">
                        {analysisResults.dependency_analysis
                          ?.total_dependencies || 0}
                      </div>
                      <div className="text-sm text-neutral-400 body">
                        Dependencies
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-semibold mb-1 heading">
                        Explore Detailed Analysis
                      </h4>
                      <p className="text-neutral-400 text-sm body">
                        Navigate to specific sections for in-depth insights and
                        recommendations.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab("technology")}
                        className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-sm body"
                      >
                        Tech Stack
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab("dependencies")}
                        className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors text-sm body"
                      >
                        Dependencies
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab("security")}
                        className="px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors text-sm body"
                      >
                        Security
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab("insights")}
                        className="px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-sm body"
                      >
                        Insights
                      </motion.button>
                      {generationResults && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab("generation")}
                          className="px-3 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-400 hover:bg-orange-500/30 transition-colors text-sm body"
                        >
                          Configs
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-neutral-400 body py-8">
                Run an analysis to see project overview
              </div>
            )}
          </div>
        );

      case "technology":
        return (
          <div className="space-y-6">
            {analysisResults?.technology_stack ? (
              <>
                <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 heading">
                    Technology Stack Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(analysisResults.technology_stack)
                      .filter(
                        ([key, value]) =>
                          value &&
                          value !== "null" &&
                          value !== null &&
                          !["confidence", "detection_method"].includes(key),
                      )
                      .map(([key, value]) => {
                        const displayKey = key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase());
                        const displayValue = Array.isArray(value)
                          ? value.join(", ")
                          : value;

                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/30"
                          >
                            <div className="flex items-center mb-2">
                              <FaCode className="w-4 h-4 text-blue-400 mr-2" />
                              <h4 className="text-neutral-300 font-medium text-sm">
                                {displayKey}
                              </h4>
                            </div>
                            <p className="text-white font-semibold">
                              {displayValue}
                            </p>
                          </motion.div>
                        );
                      })}
                  </div>

                  {/* Detection Confidence */}
                  <div className="mt-6 p-4 bg-neutral-800/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium text-sm">
                          Detection Confidence
                        </h4>
                        <p className="text-neutral-400 text-sm">
                          How confident we are in the technology stack detection
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400 heading">
                          {Math.round(
                            (analysisResults.technology_stack.confidence || 0) *
                              100,
                          )}
                          %
                        </div>
                        <div className="text-xs text-neutral-500 body">
                          {analysisResults.technology_stack.detection_method}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-neutral-400 body py-8">
                Run an analysis to see technology stack details
              </div>
            )}
          </div>
        );

      case "dependencies":
        return (
          <div className="space-y-6">
            {analysisResults?.dependency_analysis ? (
              <>
                {/* Dependencies Overview */}
                <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 heading">
                    Dependencies Analysis
                  </h3>

                  {/* Health Score Banner */}
                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FiCheckCircle className="w-6 h-6 text-green-400 mr-3" />
                        <div>
                          <h4 className="text-white font-semibold">
                            Dependency Health Score
                          </h4>
                          <p className="text-neutral-300 text-sm">
                            Overall project health assessment
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-400 heading">
                          {Math.round(
                            (analysisResults.dependency_analysis.health_score ||
                              0) * 100,
                          )}
                          %
                        </div>
                        <div className="text-sm text-neutral-400">
                          Excellent
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dependency Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400 heading">
                        {analysisResults.dependency_analysis
                          .total_dependencies || 0}
                      </div>
                      <div className="text-sm text-neutral-400 body">Total</div>
                    </div>
                    <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-400 heading">
                        {analysisResults.dependency_analysis
                          .production_dependencies || 0}
                      </div>
                      <div className="text-sm text-neutral-400 body">
                        Production
                      </div>
                    </div>
                    <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-400 heading">
                        {analysisResults.dependency_analysis
                          .development_dependencies || 0}
                      </div>
                      <div className="text-sm text-neutral-400 body">
                        Development
                      </div>
                    </div>
                    <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-red-400 heading">
                        {analysisResults.dependency_analysis.vulnerable_count ||
                          0}
                      </div>
                      <div className="text-sm text-neutral-400 body">
                        Vulnerable
                      </div>
                    </div>
                  </div>

                  {/* Dependencies List */}
                  {analysisResults.dependency_analysis.dependencies &&
                    analysisResults.dependency_analysis.dependencies.length >
                      0 && (
                      <div>
                        <h4 className="text-white font-medium mb-3">
                          Dependencies (
                          {
                            analysisResults.dependency_analysis.dependencies
                              .length
                          }
                          )
                        </h4>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {analysisResults.dependency_analysis.dependencies.map(
                            (dep, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg"
                              >
                                <div className="flex items-center">
                                  <FiZap
                                    className={`w-4 h-4 mr-3 ${
                                      dep.is_vulnerable
                                        ? "text-red-400"
                                        : "text-green-400"
                                    }`}
                                  />
                                  <div>
                                    <div className="text-white font-medium text-sm">
                                      {dep.name}
                                    </div>
                                    <div className="text-neutral-400 text-xs">
                                      v{dep.version} • {dep.manager}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      dep.type === "production"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-yellow-500/20 text-yellow-400"
                                    }`}
                                  >
                                    {dep.type}
                                  </span>
                                  {dep.is_vulnerable && (
                                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                                      Vulnerable
                                    </span>
                                  )}
                                </div>
                              </motion.div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </>
            ) : (
              <div className="text-center text-neutral-400 body py-8">
                Run an analysis to see dependency details
              </div>
            )}
          </div>
        );

      case "insights":
        return (
          <div className="space-y-6">
            {analysisResults?.insights &&
            analysisResults.insights.length > 0 ? (
              <>
                <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 heading">
                    AI-Generated Insights ({analysisResults.insights.length})
                  </h3>
                  <div className="space-y-4">
                    {analysisResults.insights.map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-neutral-800/50 rounded-lg border-l-4 border-l-blue-500"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {insight.category === "security" && (
                              <FiShield className="w-5 h-5 text-red-400" />
                            )}
                            {insight.category === "performance" && (
                              <FiTrendingUp className="w-5 h-5 text-green-400" />
                            )}
                            {insight.category === "technology" && (
                              <FiCpu className="w-5 h-5 text-blue-400" />
                            )}
                            {insight.category === "code_quality" && (
                              <FiCode className="w-5 h-5 text-purple-400" />
                            )}
                            {insight.category === "dependencies" && (
                              <FiZap className="w-5 h-5 text-yellow-400" />
                            )}
                            {![
                              "security",
                              "performance",
                              "technology",
                              "code_quality",
                              "dependencies",
                            ].includes(insight.category) && (
                              <FiCheckCircle className="w-5 h-5 text-green-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-white font-medium">
                                {insight.title}
                              </h4>
                              <div className="flex items-center gap-2 ml-4">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    insight.impact === "high"
                                      ? "bg-red-500/20 text-red-400"
                                      : insight.impact === "medium"
                                        ? "bg-yellow-500/20 text-yellow-400"
                                        : "bg-green-500/20 text-green-400"
                                  }`}
                                >
                                  {insight.impact} impact
                                </span>
                                <span className="text-xs text-neutral-500">
                                  {Math.round((insight.confidence || 0) * 100)}%
                                  confidence
                                </span>
                              </div>
                            </div>
                            <p className="text-neutral-300 text-sm mb-3">
                              {insight.description}
                            </p>
                            {insight.evidence &&
                              insight.evidence.length > 0 && (
                                <div className="text-xs text-neutral-500">
                                  <strong>Evidence:</strong>{" "}
                                  {insight.evidence.join(", ")}
                                </div>
                              )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-neutral-400 body py-8">
                Run an analysis to see AI-generated insights
              </div>
            )}
          </div>
        );

      case "recommendations":
        return (
          <div className="space-y-6">
            {analysisResults?.recommendations &&
            analysisResults.recommendations.length > 0 ? (
              <>
                <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 heading">
                    AI Recommendations ({analysisResults.recommendations.length}
                    )
                  </h3>
                  <div className="space-y-4">
                    {analysisResults.recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 bg-neutral-800/50 rounded-lg border-l-4 ${
                          rec.priority === "high"
                            ? "border-l-red-500"
                            : rec.priority === "medium"
                              ? "border-l-yellow-500"
                              : "border-l-green-500"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-white font-medium">
                            {rec.title}
                          </h4>
                          <span
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              rec.priority === "high"
                                ? "bg-red-500/20 text-red-400"
                                : rec.priority === "medium"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {rec.priority} priority
                          </span>
                        </div>
                        <p className="text-neutral-300 text-sm mb-3">
                          {rec.description}
                        </p>
                        <div className="text-xs text-neutral-500 bg-neutral-900/50 rounded p-3">
                          <strong>Reasoning:</strong> {rec.reasoning}
                        </div>
                        {rec.implementation && (
                          <div className="text-xs text-neutral-400 mt-2">
                            <strong>Implementation:</strong>{" "}
                            {rec.implementation}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-neutral-400 body py-8">
                Run an analysis to see AI recommendations
              </div>
            )}
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            {analysisResults?.dependency_analysis ? (
              <>
                <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 heading">
                    Security Analysis
                  </h3>

                  {/* Vulnerability Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-400 heading">
                        {analysisResults.dependency_analysis
                          .critical_vulnerabilities || 0}
                      </div>
                      <div className="text-sm text-neutral-400 body">
                        Critical
                      </div>
                    </div>
                    <div className="text-center p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-400 heading">
                        {analysisResults.dependency_analysis
                          .high_vulnerabilities || 0}
                      </div>
                      <div className="text-sm text-neutral-400 body">High</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-400 heading">
                        {analysisResults.dependency_analysis
                          .medium_vulnerabilities || 0}
                      </div>
                      <div className="text-sm text-neutral-400 body">
                        Medium
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400 heading">
                        {analysisResults.dependency_analysis
                          .low_vulnerabilities || 0}
                      </div>
                      <div className="text-sm text-neutral-400 body">Low</div>
                    </div>
                  </div>

                  {/* Security Status */}
                  <div
                    className={`p-4 rounded-lg mb-6 ${
                      analysisResults.dependency_analysis.vulnerable_count === 0
                        ? "bg-green-500/10 border border-green-500/20"
                        : "bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {analysisResults.dependency_analysis.vulnerable_count ===
                      0 ? (
                        <FiCheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <FiAlertTriangle className="w-6 h-6 text-red-400" />
                      )}
                      <div>
                        <h4
                          className={`font-semibold ${
                            analysisResults.dependency_analysis
                              .vulnerable_count === 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {analysisResults.dependency_analysis
                            .vulnerable_count === 0
                            ? "No Security Vulnerabilities Found"
                            : `${analysisResults.dependency_analysis.vulnerable_count} Security Issues Found`}
                        </h4>
                        <p className="text-neutral-400 text-sm">
                          Health Score:{" "}
                          {Math.round(
                            (analysisResults.dependency_analysis.health_score ||
                              0) * 100,
                          )}
                          %
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Security Recommendations */}
                  {analysisResults.dependency_analysis
                    .security_recommendations &&
                    analysisResults.dependency_analysis.security_recommendations
                      .length > 0 && (
                      <div>
                        <h4 className="text-white font-medium mb-3">
                          Security Recommendations
                        </h4>
                        <div className="space-y-2">
                          {analysisResults.dependency_analysis.security_recommendations.map(
                            (rec, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-3 bg-neutral-800/50 rounded-lg"
                              >
                                <FiCheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-neutral-300 text-sm">
                                  {rec}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </>
            ) : (
              <div className="text-center text-neutral-400 body py-8">
                Run an analysis to see security insights
              </div>
            )}
          </div>
        );

      case "quality":
        return (
          <div className="space-y-6">
            {analysisResults?.code_analysis ? (
              <>
                <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 heading">
                    Code Quality Analysis
                  </h3>

                  {/* Quality Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-400 heading">
                        {Math.round(
                          (analysisResults.code_analysis.quality_score || 0) *
                            100,
                        )}
                        %
                      </div>
                      <div className="text-sm text-neutral-400 body">
                        Quality Score
                      </div>
                    </div>
                    <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400 heading">
                        {Math.round(
                          (analysisResults.code_analysis
                            .maintainability_score || 0) * 100,
                        )}
                        %
                      </div>
                      <div className="text-sm text-neutral-400 body">
                        Maintainability
                      </div>
                    </div>
                    <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-400 heading">
                        {analysisResults.code_analysis.total_files || 0}
                      </div>
                      <div className="text-sm text-neutral-400 body">
                        Files Analyzed
                      </div>
                    </div>
                    <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-400 heading">
                        {analysisResults.code_analysis.total_lines?.toLocaleString() ||
                          0}
                      </div>
                      <div className="text-sm text-neutral-400 body">
                        Lines of Code
                      </div>
                    </div>
                  </div>

                  {/* Complexity Analysis */}
                  <div className="bg-neutral-800/30 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-white font-medium">
                        Complexity Analysis
                      </h4>
                      <span className="text-neutral-400 text-sm">
                        Score:{" "}
                        {(
                          analysisResults.code_analysis.complexity_score || 0
                        ).toFixed(3)}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-700 rounded-full h-3">
                      <div
                        className="h-3 bg-green-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            (1 -
                              (analysisResults.code_analysis.complexity_score ||
                                0)) *
                              100,
                            100,
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">
                      Lower complexity indicates better maintainability and
                      readability
                    </p>
                  </div>

                  {/* Architecture Patterns */}
                  {analysisResults.code_analysis.architecture_patterns &&
                    analysisResults.code_analysis.architecture_patterns.length >
                      0 && (
                      <div className="mb-6">
                        <h4 className="text-white font-medium mb-3">
                          Architecture Patterns
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisResults.code_analysis.architecture_patterns.map(
                            (pattern, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm"
                              >
                                {pattern}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* Design Patterns */}
                  {analysisResults.code_analysis.patterns_detected &&
                    analysisResults.code_analysis.patterns_detected.length >
                      0 && (
                      <div className="mb-6">
                        <h4 className="text-white font-medium mb-3">
                          Design Patterns
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisResults.code_analysis.patterns_detected.map(
                            (pattern, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm"
                              >
                                {pattern}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* Code Issues */}
                  {analysisResults.code_analysis.code_smells &&
                    analysisResults.code_analysis.code_smells.length > 0 && (
                      <div>
                        <h4 className="text-white font-medium mb-3">
                          Code Issues
                        </h4>
                        <div className="space-y-2">
                          {analysisResults.code_analysis.code_smells
                            .slice(0, 5)
                            .map((smell, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-2 p-3 bg-neutral-800/50 rounded-lg"
                              >
                                <FiAlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                                <div>
                                  <div className="text-neutral-300 text-sm">
                                    {smell.type || smell}
                                  </div>
                                  {smell.description && (
                                    <div className="text-neutral-500 text-xs">
                                      {smell.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              </>
            ) : (
              <div className="text-center text-neutral-400 body py-8">
                Run an analysis to see code quality metrics
              </div>
            )}
          </div>
        );

      case "generation":
        return (
          <div className="space-y-6">
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 heading">
                Configuration Generation
              </h3>
              {analysisResults ? (
                <div className="space-y-4">
                  <div className="text-sm text-neutral-400 body mb-4">
                    Generate deployment configurations based on your analysis
                    results
                  </div>

                  {/* Analysis Summary for Generation */}
                  <div className="bg-neutral-800/50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-white mb-2 heading">
                      Analysis Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-neutral-400">Language:</span>
                        <span className="text-white ml-1">
                          {analysisResults.technology_stack?.language ||
                            "Unknown"}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400">Framework:</span>
                        <span className="text-white ml-1">
                          {analysisResults.technology_stack?.framework ||
                            "None"}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-400">Build Tool:</span>
                        <span className="text-white ml-1">
                          {analysisResults.technology_stack?.build_tool ||
                            "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!generationResults ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGenerateConfigs}
                      disabled={isGenerating}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50 body"
                    >
                      {isGenerating ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin" />
                          Generating Configurations...
                        </>
                      ) : (
                        <>
                          <FiSettings className="w-4 h-4" />
                          Generate Configurations
                          <FiChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  ) : (
                    /* Generation Results */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-white heading">
                          Generated Configurations
                        </h4>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleGenerateConfigs}
                          disabled={isGenerating}
                          className="flex items-center gap-2 px-3 py-2 bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700/50 rounded-lg text-neutral-300 hover:text-white transition-colors text-sm body"
                        >
                          <FiRefreshCw className="w-4 h-4" />
                          Regenerate
                        </motion.button>
                      </div>

                      <div className="grid gap-6">
                        {/* Dockerfile */}
                        {generationResults.dockerfile && (
                          <div className="bg-neutral-800/50 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <FiCode className="w-5 h-5 text-blue-400" />
                                <span className="text-lg font-medium text-white heading">
                                  Dockerfile
                                </span>
                                {generationResults.dockerfile.success && (
                                  <FiCheckCircle className="w-5 h-5 text-green-400" />
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      generationResults.dockerfile.dockerfile ||
                                        generationResults.dockerfile.content,
                                    );
                                  }}
                                  className="p-2 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                  title="Copy to clipboard"
                                >
                                  <FiCopy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const content =
                                      generationResults.dockerfile.dockerfile ||
                                      generationResults.dockerfile.content;
                                    const blob = new Blob([content], {
                                      type: "text/plain",
                                    });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = "Dockerfile";
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="p-2 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                  title="Download file"
                                >
                                  <FiDownload className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="text-sm text-neutral-400 bg-neutral-900/50 rounded-lg p-4 font-mono max-h-80 overflow-y-auto border border-neutral-700/50">
                              <pre className="whitespace-pre-wrap text-neutral-200 leading-relaxed">
                                {generationResults.dockerfile.dockerfile ||
                                  generationResults.dockerfile.content ||
                                  ""}
                              </pre>
                            </div>
                            {generationResults.dockerfile.metadata && (
                              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div className="bg-neutral-900/50 rounded-lg p-3">
                                  <div className="text-neutral-400 mb-1">
                                    Base Image
                                  </div>
                                  <div className="text-white font-semibold">
                                    {
                                      generationResults.dockerfile.metadata
                                        .base_image
                                    }
                                  </div>
                                </div>
                                <div className="bg-neutral-900/50 rounded-lg p-3">
                                  <div className="text-neutral-400 mb-1">
                                    Multi-stage
                                  </div>
                                  <div className="text-white font-semibold">
                                    {generationResults.dockerfile.metadata
                                      .multi_stage
                                      ? "Yes"
                                      : "No"}
                                  </div>
                                </div>
                                <div className="bg-neutral-900/50 rounded-lg p-3">
                                  <div className="text-neutral-400 mb-1">
                                    Estimated Size
                                  </div>
                                  <div className="text-white font-semibold">
                                    {
                                      generationResults.dockerfile.metadata
                                        .size_estimate
                                    }
                                  </div>
                                </div>
                                <div className="bg-neutral-900/50 rounded-lg p-3">
                                  <div className="text-neutral-400 mb-1">
                                    Build Time
                                  </div>
                                  <div className="text-white font-semibold">
                                    {
                                      generationResults.dockerfile.metadata
                                        .build_time_estimate
                                    }
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Docker Compose */}
                        {generationResults.docker_compose && (
                          <div className="bg-neutral-800/50 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <FiLayers className="w-5 h-5 text-purple-400" />
                                <span className="text-lg font-medium text-white heading">
                                  Docker Compose
                                </span>
                                {generationResults.docker_compose.success && (
                                  <FiCheckCircle className="w-5 h-5 text-green-400" />
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      generationResults.docker_compose
                                        .docker_compose ||
                                        generationResults.docker_compose
                                          .content,
                                    );
                                  }}
                                  className="p-2 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                  title="Copy to clipboard"
                                >
                                  <FiCopy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const content =
                                      generationResults.docker_compose
                                        .docker_compose ||
                                      generationResults.docker_compose.content;
                                    const blob = new Blob([content], {
                                      type: "text/plain",
                                    });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = "docker-compose.yml";
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="p-2 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                  title="Download file"
                                >
                                  <FiDownload className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="text-sm text-neutral-400 bg-neutral-900/50 rounded-lg p-4 font-mono max-h-80 overflow-y-auto border border-neutral-700/50">
                              <pre className="whitespace-pre-wrap text-neutral-200 leading-relaxed">
                                {generationResults.docker_compose
                                  .docker_compose ||
                                  generationResults.docker_compose.content ||
                                  ""}
                              </pre>
                            </div>
                            {generationResults.docker_compose.metadata && (
                              <div className="mt-4 text-xs">
                                <div className="text-neutral-400 mb-2">
                                  Services:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {Object.keys(
                                    generationResults.docker_compose.metadata
                                      .services || {},
                                  ).map((service) => (
                                    <span
                                      key={service}
                                      className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs"
                                    >
                                      {service}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* GitHub Actions */}
                        {generationResults.github_actions && (
                          <div className="bg-neutral-800/50 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <FiActivity className="w-5 h-5 text-green-400" />
                                <span className="text-lg font-medium text-white heading">
                                  GitHub Actions CI/CD
                                </span>
                                {generationResults.github_actions.success && (
                                  <FiCheckCircle className="w-5 h-5 text-green-400" />
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      generationResults.github_actions
                                        .github_actions ||
                                        generationResults.github_actions
                                          .content,
                                    );
                                  }}
                                  className="p-2 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                  title="Copy to clipboard"
                                >
                                  <FiCopy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const content =
                                      generationResults.github_actions
                                        .github_actions ||
                                      generationResults.github_actions.content;
                                    const blob = new Blob([content], {
                                      type: "text/plain",
                                    });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = "deploy.yml";
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="p-2 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                  title="Download file"
                                >
                                  <FiDownload className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="text-sm text-neutral-400 bg-neutral-900/50 rounded-lg p-4 font-mono max-h-80 overflow-y-auto border border-neutral-700/50">
                              <pre className="whitespace-pre-wrap text-neutral-200 leading-relaxed">
                                {generationResults.github_actions
                                  .github_actions ||
                                  generationResults.github_actions.content ||
                                  ""}
                              </pre>
                            </div>
                            {generationResults.github_actions.metadata && (
                              <div className="mt-4 text-xs">
                                <div className="text-neutral-400 mb-2">
                                  Pipeline Jobs:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {Object.keys(
                                    generationResults.github_actions.metadata
                                      .jobs || {},
                                  ).map((job) => (
                                    <span
                                      key={job}
                                      className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs"
                                    >
                                      {job}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Generation Metadata */}
                      {generationResults.metadata && (
                        <div className="bg-neutral-800/50 rounded-lg p-4 mt-4">
                          <h4 className="text-sm font-medium text-white mb-2 heading">
                            Generation Details
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div>
                              <span className="text-neutral-400">
                                Processing Time:
                              </span>
                              <span className="text-white ml-1">
                                {generationResults.metadata.processing_time?.toFixed(
                                  2,
                                )}
                                s
                              </span>
                            </div>
                            <div>
                              <span className="text-neutral-400">
                                LLM Enhanced:
                              </span>
                              <span className="text-white ml-1">
                                {generationResults.metadata.llm_enhanced
                                  ? "Yes"
                                  : "No"}
                              </span>
                            </div>
                            <div>
                              <span className="text-neutral-400">
                                Generated:
                              </span>
                              <span className="text-white ml-1">
                                {new Date(
                                  generationResults.metadata.generated_at *
                                    1000,
                                ).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-neutral-400 body py-8">
                  Complete an analysis first to generate optimized
                  configurations
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-neutral-900">
      <SEO title="AI Code Analysis" />
      {/* Header */}
      <div className="p-3 md:p-6 border-b border-neutral-800/50 flex-shrink-0 w-full">
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <FaBrain className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-2xl font-bold text-white heading">
              AI Code Analysis
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 body">
              Analyze your repository with AI-powered insights
            </p>
          </div>
          {analysisResults && (
            <div className="ml-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Download analysis report
                  const blob = new Blob(
                    [JSON.stringify(analysisResults, null, 2)],
                    {
                      type: "application/json",
                    },
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "analysis-report.json";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1 md:gap-2 px-2 py-1.5 md:px-3 md:py-2 bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700/50 rounded-lg text-neutral-300 hover:text-white transition-colors text-xs md:text-sm body"
              >
                <FiDownload className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Export Report</span>
                <span className="sm:hidden">Export</span>
              </motion.button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 md:gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 md:gap-2 px-2 py-1.5 md:px-4 md:py-2 rounded-lg transition-all body text-xs md:text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                }`}
              >
                <Icon className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div
        className="flex-1 w-full overflow-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#525252 #262626",
        }}
      >
        <div className="max-w-5xl mx-auto px-3 md:px-6 py-3 md:py-6 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
