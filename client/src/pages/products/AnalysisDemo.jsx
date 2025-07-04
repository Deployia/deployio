import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaGithub,
  FaCode,
  FaBrain,
  FaChartLine,
  FaSpinner,
  FaExclamationTriangle,
  FaArrowRight,
  FaRocket,
  FaCheckCircle,
  FaDownload,
  FaCodeBranch,
  FaCog,
  FaFileCode,
  FaShieldAlt,
  FaCube,
} from "react-icons/fa";
import SEO from "@components/SEO";
import AnalysisResults from "@components/analysis/AnalysisResults";
import api from "@utils/api";
import { useAuthRedirect } from "@utils/authRedirect";
import webSocketService from "@services/websocketService";

const AnalysisDemo = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, checkAuth } = useAuthRedirect(
    "/products/analysis-demo"
  );

  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [generationResults, setGenerationResults] = useState(null);
  const [error, setError] = useState(null);
  const [serviceHealth, setServiceHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [operationId, setOperationId] = useState(null); // eslint-disable-line no-unused-vars
  const [realProgress, setRealProgress] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const progressIntervalRef = useRef(null);
  const progressPollingRef = useRef(null);
  const socketRef = useRef(null);

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

  // WebSocket connection setup
  const setupWebSocketConnection = useCallback(async () => {
    try {
      const socket = await webSocketService.connect("/ai");
      socketRef.current = socket;
      setWsConnected(true);

      // Listen for progress updates
      socket.on("ai:progress", (data) => {
        console.log("Received progress update:", data);
        setRealProgress(data);

        // Map progress to our step system
        const stepMap = {
          Initializing: 0,
          "Fetching Repository": 0,
          "Repository Analysis": 1,
          "Detecting Stack": 1,
          "AI Enhancement": 2,
          "Code Analysis": 3,
          "Quality Analysis": 3, // Fallback mapping
          "Analysis Complete": 3,
          "Configuration Generation": 4,
          "Generating Configs": 4,
          Complete: 5,
        };

        const stepIndex =
          stepMap[data.step_name] !== undefined
            ? stepMap[data.step_name]
            : currentStep;
        setCurrentStep(stepIndex);

        // Stop progress animation when complete or error
        if (data.step_name === "Complete" || data.error) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          if (progressPollingRef.current) {
            clearInterval(progressPollingRef.current);
          }
          setCurrentStep(progressSteps.length - 1);

          // Handle errors from progress updates
          if (data.error) {
            setError(data.error);
            setIsAnalyzing(false);
          }
        }
      });

      // Listen for errors
      socket.on("ai:error", (data) => {
        console.error("WebSocket AI error:", data);
        setError(data.error || "WebSocket connection error");
        setIsAnalyzing(false);
      });

      // Listen for disconnect
      socket.on("disconnect", () => {
        console.log("WebSocket disconnected");
        setWsConnected(false);
      });

      // Listen for reconnect
      socket.on("connect", () => {
        console.log("WebSocket connected/reconnected");
        setWsConnected(true);
      });

      console.log("WebSocket AI connection established");
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      setWsConnected(false);
    }
  }, [currentStep, progressSteps.length]); // Include all dependencies

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !checkAuth()) {
      return; // checkAuth will handle the redirect
    }
  }, [isLoading, checkAuth]);
  // Check service health on mount
  useEffect(() => {
    if (isAuthenticated) {
      checkServiceHealth();
      setupWebSocketConnection();
    }
  }, [isAuthenticated, setupWebSocketConnection]); // Include the memoized function

  // Cleanup on unmount
  useEffect(() => {
    const progressInterval = progressIntervalRef.current;
    const progressPolling = progressPollingRef.current;

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (progressPolling) {
        clearInterval(progressPolling);
      }

      // Cleanup WebSocket connection
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Don't render anything while checking auth or redirecting
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

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

  const checkServiceHealth = async () => {
    try {
      const response = await api.get("/ai/analysis/technologies");
      setServiceHealth({ status: "healthy", data: response.data });
    } catch (err) {
      setServiceHealth({
        status: "unhealthy",
        error: err.response?.data?.message || "Service unavailable",
      });
    } finally {
      setCheckingHealth(false);
    }
  };

  const normalizeRepositoryUrl = (input) => {
    if (!input) return "";

    // If it's already a full URL, return as is
    if (input.startsWith("https://github.com/")) {
      return input;
    }

    // If it's just username/repo format, convert to full URL
    if (input.includes("/") && !input.includes("github.com")) {
      return `https://github.com/${input}`;
    }

    return input;
  };

  const startProgressAnimation = () => {
    setCurrentStep(0);

    // More conservative timing for fallback mode
    progressIntervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        // Don't go past step 5 (before "Complete") in fallback mode
        if (prev < progressSteps.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 3000); // Slower 3-second intervals for fallback
  };
  const handleAnalyze = async () => {
    const normalizedUrl = normalizeRepositoryUrl(repositoryUrl.trim());
    if (!normalizedUrl) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResults(null);
    setGenerationResults(null);
    setRealProgress(null);
    setOperationId(null);

    // Start with fallback animation if WebSocket is not connected
    if (!wsConnected) {
      console.log("WebSocket not connected, using fallback progress animation");
      startProgressAnimation();
    } else {
      // Reset progress for real-time updates
      setCurrentStep(0);
    }

    try {
      const response = await api.post(
        "/ai/analysis/demo/complete-pipeline",
        {
          repositoryUrl: normalizedUrl,
          branch: branch || "main",
          analysisTypes: ["stack", "dependencies", "code"],
          configTypes: ["dockerfile", "github_actions", "docker_compose"],
          autoApprove: true,
        },
        {
          timeout: 120000,
        }
      );

      // --- Handle new API response structure ---
      let data = response.data;
      if (data && data.data) data = data.data;
      // For backward compatibility, check both direct and nested
      setAnalysisResults(data.analysis || data.analysisResults || null);
      setGenerationResults(
        data.configurations || data.generationResults || null
      );
      // Optionally handle other fields (timestamp, demo_mode, etc.)
    } catch (err) {
      console.error("Analysis error:", err);
      // Enhanced error handling with forwarded AI service errors
      let errorMessage = "Failed to analyze repository. Please try again.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (progressPollingRef.current) {
        clearInterval(progressPollingRef.current);
      }
    }
  };

  const handleDownloadReport = async () => {
    if (!analysisResults && !generationResults) return;

    try {
      // Create comprehensive download package
      const reportData = {
        timestamp: new Date().toISOString(),
        generated_by: "DeployIO AI Analysis Engine - Demo",
        demo_mode: true,
      };

      if (analysisResults) {
        reportData.repository = analysisResults.data?.repository_url;
        reportData.branch = analysisResults.data?.branch;
        reportData.analysis = analysisResults.data;
      }

      if (generationResults) {
        reportData.configurations = generationResults.configurations;
        reportData.generation_metadata = {
          config_types: Object.keys(generationResults.configurations || {}),
          optimization_level: generationResults.optimization_level,
          timestamp: generationResults.timestamp,
        };
      }

      // Create a zip-like structure with multiple files
      const downloadFiles = [];

      // Add analysis report
      if (analysisResults) {
        downloadFiles.push({
          name: "analysis-report.json",
          content: JSON.stringify(reportData.analysis, null, 2),
        });
      }

      // Add individual config files
      if (generationResults?.configurations) {
        Object.entries(generationResults.configurations).forEach(
          ([configType, config]) => {
            if (config.files) {
              Object.entries(config.files).forEach(([filename, content]) => {
                downloadFiles.push({
                  name: `configs/${configType}/${filename}`,
                  content: content,
                });
              });
            }
          }
        );
      }

      // For now, download the complete report as JSON
      // TODO: Implement proper multi-file download or zip generation
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const repoName =
        analysisResults?.data?.repository_url?.split("/").pop() ||
        "demo-project";
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

  if (checkingHealth) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Checking AI service health...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Complete DevOps Pipeline Demo - AI Analysis & Config Generation"
        description="Experience our complete AI-powered DevOps workflow: repository analysis, automatic approval, and production-ready configuration generation including Docker, GitHub Actions, and more."
      />

      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden py-16">
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-center mb-6">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium">
                  <FaBrain className="w-4 h-4 mr-2" />
                  AI Code Analysis Engine
                  <div
                    className={`ml-2 w-2 h-2 rounded-full ${
                      serviceHealth?.status === "healthy"
                        ? "bg-green-400 animate-pulse"
                        : "bg-red-400"
                    }`}
                  />
                </div>
                <div
                  className="inline-flex items-center px-3 py-1 rounded-full bg-gray-500/20 border border-gray-500/30 text-gray-300 text-xs font-medium"
                  title={
                    wsConnected
                      ? "Connected to real-time progress updates"
                      : "Using estimated progress - refresh page to retry connection"
                  }
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      wsConnected
                        ? "bg-green-400 animate-pulse"
                        : "bg-orange-400"
                    }`}
                  />
                  {wsConnected ? "Real-time Connected" : "Fallback Mode"}
                </div>
              </div>

              <div className="flex items-center justify-center mb-4">
                <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold rounded-full">
                  🚀 DEMO MODE
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                Complete DevOps
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  {" "}
                  Pipeline Demo
                </span>
              </h1>

              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Experience our unified AI-powered workflow: comprehensive
                repository analysis with automatic LLM enhancement, followed by
                intelligent configuration generation for production-ready
                deployment—all in a single request.
              </p>
            </motion.div>

            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-4xl mx-auto mb-8"
            >
              {/* Hero-style Input Section */}
              <div className="bg-neutral-900/80 backdrop-blur-lg border border-neutral-700/50 rounded-xl p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <FaGithub className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-300 font-medium text-sm">
                    Analyze GitHub Repository
                  </span>
                </div>

                {/* GitHub URL Input with Hero Design */}
                <div className="bg-neutral-800/50 rounded-lg p-3 sm:p-4 border border-neutral-600/30 mb-4">
                  {/* URL Input with Protocol Display */}
                  <div className="flex flex-col sm:flex-row items-center bg-neutral-800/70 rounded-lg p-2 sm:p-3 border border-neutral-600/20 mb-3">
                    <span className="text-gray-500 font-mono text-xs sm:text-sm mr-1 flex-shrink-0">
                      https://github.com/
                    </span>
                    <input
                      type="text"
                      value={repositoryUrl.replace("https://github.com/", "")}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.startsWith("https://github.com/")) {
                          setRepositoryUrl(value);
                        } else {
                          setRepositoryUrl(value);
                        }
                      }}
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

                  {/* Branch Input */}
                  <div className="flex items-center bg-neutral-800/70 rounded-lg p-2 sm:p-3 border border-neutral-600/20">
                    <FaCodeBranch className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />
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
                </div>

                {/* Action Button */}
                <div className="flex justify-center mb-4">
                  <button
                    onClick={handleAnalyze}
                    disabled={!repositoryUrl.trim() || isAnalyzing}
                    className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white font-bold rounded-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative flex items-center justify-center">
                      {isAnalyzing ? (
                        <FaSpinner className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <FaRocket className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                          Analyze Repository
                          <FaArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </span>
                  </button>
                </div>

                {/* Quick Samples */}
                <div className="text-center">
                  <span className="text-gray-400 text-xs mb-2 block">
                    Try these samples:
                  </span>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {sampleRepos.map((repo, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setRepositoryUrl(repo.name);
                          setBranch(repo.branch);
                        }}
                        className="px-2 py-1 text-xs bg-gray-700/50 text-gray-300 rounded hover:bg-gray-600/50 transition-colors border border-gray-600/30 hover:border-gray-500/50"
                        disabled={isAnalyzing}
                      >
                        <div className="flex items-center">
                          <span className="font-mono">
                            {repo.name.split("/")[1]}
                          </span>
                          <span className="text-gray-500 text-xs ml-1">
                            ({repo.branch})
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Analysis Progress */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-4xl mx-auto mb-16"
                >
                  <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Analyzing Repository
                      </h3>
                      <p className="text-gray-400">
                        Our AI is working hard to understand your codebase
                      </p>
                    </div>

                    <div className="space-y-4">
                      {progressSteps.map((step, index) => {
                        const isActive = index <= currentStep;
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;
                        const Icon = step.icon;

                        return (
                          <div
                            key={index}
                            className={`flex items-center p-4 rounded-xl transition-all ${
                              isActive
                                ? "bg-blue-500/20 border border-blue-500/30"
                                : "bg-gray-700/30"
                            }`}
                          >
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                                isCompleted
                                  ? "bg-green-500 text-white"
                                  : isCurrent
                                  ? "bg-blue-500 text-white animate-pulse"
                                  : "bg-gray-600 text-gray-400"
                              }`}
                            >
                              {isCompleted ? (
                                <FaCheckCircle className="w-6 h-6" />
                              ) : (
                                <Icon className="w-6 h-6" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4
                                className={`font-semibold ${
                                  isActive ? "text-white" : "text-gray-400"
                                }`}
                              >
                                {step.label}
                              </h4>
                              <p
                                className={`text-sm ${
                                  isActive ? "text-gray-300" : "text-gray-500"
                                }`}
                              >
                                {isCurrent && realProgress?.message
                                  ? realProgress.message
                                  : isCurrent && !wsConnected
                                  ? `${step.description} (estimated)`
                                  : step.description}
                              </p>
                              {isCurrent && realProgress?.percentage && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Progress</span>
                                    <span>
                                      {Math.round(realProgress.percentage)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-700 rounded-full h-1">
                                    <div
                                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${realProgress.percentage}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            {isCurrent && (
                              <FaSpinner className="w-5 h-5 text-blue-400 animate-spin" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display */}
            <AnimatePresence>
              {error && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-4xl mx-auto mb-16"
                >
                  <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6">
                    <div className="flex items-center">
                      <FaExclamationTriangle className="w-6 h-6 text-red-400 mr-3" />
                      <div>
                        <h3 className="text-red-300 font-semibold">
                          Analysis Failed
                        </h3>
                        <p className="text-red-200">{error}</p>
                        <button
                          onClick={() => setError(null)}
                          className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Display */}
            <AnimatePresence>
              {(analysisResults || generationResults) && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-7xl mx-auto"
                >
                  {/* Analysis Results */}
                  {analysisResults && (
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <FaBrain className="w-6 h-6 mr-3 text-blue-400" />
                        Analysis Results
                      </h3>
                      <AnalysisResults results={analysisResults} />
                    </div>
                  )}

                  {/* Generation Results */}
                  {generationResults && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-white flex items-center">
                          <FaCog className="w-6 h-6 mr-3 text-green-400" />
                          Generated Configurations
                        </h3>
                        <div className="flex items-center text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                          {generationResults.metadata?.processing_time
                            ? `Generated in ${Math.round(
                                generationResults.metadata.processing_time
                              )}s`
                            : "Generated successfully"}
                        </div>
                      </div>

                      {/* Debug: Log generation results structure */}

                      {/* Configuration Stats */}
                      {generationResults.metadata && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6 mb-6"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-400 mb-1">
                                {generationResults.metadata.config_types
                                  ?.length || 0}
                              </div>
                              <div className="text-sm text-gray-400">
                                Config Types
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-400 mb-1">
                                {Object.values(
                                  generationResults.configurations || {}
                                ).reduce((acc, config) => {
                                  // Count files from different possible locations
                                  let fileCount = 0;
                                  if (config.files)
                                    fileCount += Object.keys(
                                      config.files
                                    ).length;
                                  if (config.metadata?.files)
                                    fileCount += Object.keys(
                                      config.metadata.files
                                    ).length;
                                  // Count individual config files
                                  if (config.dockerfile || config.docker_file)
                                    fileCount += 1;
                                  if (
                                    config.docker_compose ||
                                    config.docker_compose_yml
                                  )
                                    fileCount += 1;
                                  if (config.github_actions || config.workflow)
                                    fileCount += 1;
                                  if (config.kubernetes || config.k8s)
                                    fileCount += 1;
                                  if (config.terraform || config.tf)
                                    fileCount += 1;
                                  // Count nested config files
                                  if (config.config?.dockerfile) fileCount += 1;
                                  if (config.config?.docker_compose)
                                    fileCount += 1;
                                  if (config.config?.github_actions)
                                    fileCount += 1;
                                  if (config.config?.files) {
                                    fileCount += Object.keys(
                                      config.config.files
                                    ).length;
                                  }
                                  return acc + fileCount;
                                }, 0)}
                              </div>
                              <div className="text-sm text-gray-400">
                                Files Generated
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-400 mb-1">
                                {generationResults.metadata.llm_enhanced
                                  ? "AI"
                                  : "Rule"}
                              </div>
                              <div className="text-sm text-gray-400">
                                Enhancement
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-400 mb-1">
                                ✓
                              </div>
                              <div className="text-sm text-gray-400">
                                Production Ready
                              </div>
                            </div>
                          </div>

                          {/* Generated Files Summary */}
                          <div className="border-t border-gray-700/30 pt-4">
                            <h4 className="text-sm font-medium text-gray-300 mb-3">
                              Generated Files Overview
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(
                                generationResults.configurations || {}
                              ).map(([configType, config]) => {
                                const getFileNames = (configType, config) => {
                                  const files = [];

                                  // Check for files in different locations
                                  if (config.files) {
                                    files.push(...Object.keys(config.files));
                                  }
                                  if (config.metadata?.files) {
                                    files.push(
                                      ...Object.keys(config.metadata.files)
                                    );
                                  }
                                  if (config.config?.files) {
                                    files.push(
                                      ...Object.keys(config.config.files)
                                    );
                                  }

                                  // Check for specific config type fields with multiple naming patterns
                                  if (config.dockerfile || config.docker_file) {
                                    files.push("Dockerfile");
                                  }
                                  if (
                                    config.docker_compose ||
                                    config.docker_compose_yml
                                  ) {
                                    files.push("docker-compose.yml");
                                  }
                                  if (
                                    config.github_actions ||
                                    config.workflow
                                  ) {
                                    files.push(
                                      config.filename ||
                                        ".github/workflows/deploy.yml"
                                    );
                                  }
                                  if (config.kubernetes || config.k8s) {
                                    files.push("k8s-deployment.yml");
                                  }
                                  if (config.terraform || config.tf) {
                                    files.push("main.tf");
                                  }

                                  // Check nested config
                                  if (config.config?.dockerfile) {
                                    files.push("Dockerfile");
                                  }
                                  if (config.config?.docker_compose) {
                                    files.push("docker-compose.yml");
                                  }
                                  if (config.config?.github_actions) {
                                    files.push(".github/workflows/deploy.yml");
                                  }

                                  // Fallback: if we have content but no specific files, create a generic filename
                                  if (
                                    files.length === 0 &&
                                    (config.content ||
                                      typeof config === "string")
                                  ) {
                                    files.push(`${configType}.yml`);
                                  }

                                  return files;
                                };

                                const files = getFileNames(configType, config);
                                return files.map((filename, i) => (
                                  <span
                                    key={`${configType}-${i}`}
                                    className="text-xs px-2 py-1 bg-gray-700/50 text-gray-300 rounded font-mono"
                                  >
                                    {filename}
                                  </span>
                                ));
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <div className="space-y-6">
                        {generationResults.configurations &&
                          Object.entries(generationResults.configurations).map(
                            ([configType, config], index) => {
                              const getConfigIcon = (type) => {
                                switch (type) {
                                  case "dockerfile":
                                    return "🐳";
                                  case "docker_compose":
                                    return "🔗";
                                  case "github_actions":
                                    return "⚡";
                                  case "kubernetes":
                                    return "☸️";
                                  case "terraform":
                                    return "🏗️";
                                  default:
                                    return "⚙️";
                                }
                              };

                              const getConfigColor = (type) => {
                                switch (type) {
                                  case "dockerfile":
                                    return "blue";
                                  case "docker_compose":
                                    return "green";
                                  case "github_actions":
                                    return "purple";
                                  case "kubernetes":
                                    return "indigo";
                                  case "terraform":
                                    return "orange";
                                  default:
                                    return "gray";
                                }
                              };

                              const color = getConfigColor(configType);

                              return (
                                <motion.div
                                  key={configType}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className={`bg-${color}-500/5 border border-${color}-500/20 rounded-xl p-6 hover:bg-${color}-500/10 transition-all duration-300`}
                                >
                                  <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-xl font-semibold text-white flex items-center">
                                      <span className="text-2xl mr-3">
                                        {getConfigIcon(configType)}
                                      </span>
                                      {configType
                                        .replace(/_/g, " ")
                                        .replace(/\b\w/g, (l) =>
                                          l.toUpperCase()
                                        )}{" "}
                                      Configuration
                                    </h4>
                                    {config.metadata && (
                                      <div
                                        className={`text-xs px-3 py-1 bg-${color}-500/20 text-${color}-300 rounded-full`}
                                      >
                                        {config.metadata.estimated_runtime ||
                                          config.metadata.build_time_estimate ||
                                          config.metadata.size_estimate ||
                                          "Optimized"}
                                      </div>
                                    )}
                                  </div>

                                  {/* Config Features */}
                                  {config.metadata &&
                                    (config.metadata.security_features ||
                                      config.metadata.optimization_features ||
                                      config.metadata.features) && (
                                      <div className="mb-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {config.metadata
                                            .security_features && (
                                            <div>
                                              <h5 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                                                <FaShieldAlt className="w-4 h-4 mr-2 text-green-400" />
                                                Security Features
                                              </h5>
                                              <div className="flex flex-wrap gap-1">
                                                {config.metadata.security_features.map(
                                                  (feature, i) => (
                                                    <span
                                                      key={i}
                                                      className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded"
                                                    >
                                                      {feature}
                                                    </span>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )}
                                          {(config.metadata
                                            .optimization_features ||
                                            config.metadata.features) && (
                                            <div>
                                              <h5 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                                                <FaChartLine className="w-4 h-4 mr-2 text-blue-400" />
                                                {config.metadata
                                                  .optimization_features
                                                  ? "Optimizations"
                                                  : "Features"}
                                              </h5>
                                              <div className="flex flex-wrap gap-1">
                                                {(
                                                  config.metadata
                                                    .optimization_features ||
                                                  config.metadata.features
                                                )?.map((feature, i) => (
                                                  <span
                                                    key={i}
                                                    className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded"
                                                  >
                                                    {feature}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* Files */}
                                  <div className="space-y-4">
                                    {(() => {
                                      // Helper function to extract content from JSON-wrapped strings
                                      const extractContent = (
                                        content,
                                        fallbackKey
                                      ) => {
                                        if (!content) return null;
                                        try {
                                          if (
                                            typeof content === "string" &&
                                            content.startsWith("```json")
                                          ) {
                                            const jsonMatch = content.match(
                                              /```json\n([\s\S]*?)\n```/
                                            );
                                            if (jsonMatch) {
                                              const parsed = JSON.parse(
                                                jsonMatch[1]
                                              );
                                              return (
                                                parsed.content ||
                                                parsed[fallbackKey] ||
                                                parsed.dockerfile_content ||
                                                content
                                              );
                                            }
                                          }
                                          return content;
                                        } catch {
                                          return content;
                                        }
                                      };

                                      // Collect all files from different locations
                                      const allFiles = {};

                                      // From config.files
                                      if (config.files) {
                                        Object.entries(config.files).forEach(
                                          ([filename, content]) => {
                                            const extractedContent =
                                              extractContent(content);
                                            if (
                                              extractedContent &&
                                              !allFiles[filename]
                                            ) {
                                              allFiles[filename] =
                                                extractedContent;
                                            }
                                          }
                                        );
                                      }

                                      // From config.config.files (nested)
                                      if (config.config?.files) {
                                        Object.entries(
                                          config.config.files
                                        ).forEach(([filename, content]) => {
                                          const extractedContent =
                                            extractContent(content);
                                          if (
                                            extractedContent &&
                                            !allFiles[filename]
                                          ) {
                                            allFiles[filename] =
                                              extractedContent;
                                          }
                                        });
                                      }

                                      // From metadata.files
                                      if (config.metadata?.files) {
                                        Object.entries(
                                          config.metadata.files
                                        ).forEach(([filename, content]) => {
                                          const extractedContent =
                                            extractContent(content);
                                          if (
                                            extractedContent &&
                                            !allFiles[filename]
                                          ) {
                                            allFiles[filename] =
                                              extractedContent;
                                          }
                                        });
                                      }

                                      // From specific config fields with multiple naming patterns
                                      if (
                                        config.dockerfile ||
                                        config.docker_file
                                      ) {
                                        const extractedContent = extractContent(
                                          config.dockerfile ||
                                            config.docker_file,
                                          "dockerfile"
                                        );
                                        if (
                                          extractedContent &&
                                          !allFiles["Dockerfile"]
                                        ) {
                                          allFiles["Dockerfile"] =
                                            extractedContent;
                                        }
                                      }
                                      if (
                                        config.docker_compose ||
                                        config.docker_compose_yml
                                      ) {
                                        const extractedContent = extractContent(
                                          config.docker_compose ||
                                            config.docker_compose_yml,
                                          "docker_compose"
                                        );
                                        if (
                                          extractedContent &&
                                          !allFiles["docker-compose.yml"]
                                        ) {
                                          allFiles["docker-compose.yml"] =
                                            extractedContent;
                                        }
                                      }
                                      if (
                                        config.github_actions ||
                                        config.workflow
                                      ) {
                                        const extractedContent = extractContent(
                                          config.github_actions ||
                                            config.workflow,
                                          "github_actions"
                                        );
                                        if (
                                          extractedContent &&
                                          !allFiles[
                                            ".github/workflows/deploy.yml"
                                          ]
                                        ) {
                                          allFiles[
                                            ".github/workflows/deploy.yml"
                                          ] = extractedContent;
                                        }
                                      }

                                      // Handle additional config types
                                      if (config.kubernetes || config.k8s) {
                                        const extractedContent = extractContent(
                                          config.kubernetes || config.k8s,
                                          "kubernetes"
                                        );
                                        if (
                                          extractedContent &&
                                          !allFiles["k8s-deployment.yml"]
                                        ) {
                                          allFiles["k8s-deployment.yml"] =
                                            extractedContent;
                                        }
                                      }

                                      if (config.terraform || config.tf) {
                                        const extractedContent = extractContent(
                                          config.terraform || config.tf,
                                          "terraform"
                                        );
                                        if (
                                          extractedContent &&
                                          !allFiles["main.tf"]
                                        ) {
                                          allFiles["main.tf"] =
                                            extractedContent;
                                        }
                                      }

                                      // Handle direct content (when config is just a string or has content field)
                                      if (
                                        typeof config === "string" &&
                                        config.trim()
                                      ) {
                                        const filename = `${configType}.yml`;
                                        if (!allFiles[filename]) {
                                          allFiles[filename] =
                                            extractContent(config);
                                        }
                                      } else if (
                                        config.content &&
                                        typeof config.content === "string"
                                      ) {
                                        const filename =
                                          config.filename ||
                                          `${configType}.yml`;
                                        if (!allFiles[filename]) {
                                          allFiles[filename] = extractContent(
                                            config.content
                                          );
                                        }
                                      }

                                      // From nested config locations
                                      if (config.config?.dockerfile) {
                                        const extractedContent = extractContent(
                                          config.config.dockerfile,
                                          "dockerfile"
                                        );
                                        if (
                                          extractedContent &&
                                          !allFiles["Dockerfile"]
                                        ) {
                                          allFiles["Dockerfile"] =
                                            extractedContent;
                                        }
                                      }
                                      if (config.config?.docker_compose) {
                                        const extractedContent = extractContent(
                                          config.config.docker_compose,
                                          "docker_compose"
                                        );
                                        if (
                                          extractedContent &&
                                          !allFiles["docker-compose.yml"]
                                        ) {
                                          allFiles["docker-compose.yml"] =
                                            extractedContent;
                                        }
                                      }
                                      if (config.config?.github_actions) {
                                        const extractedContent = extractContent(
                                          config.config.github_actions,
                                          "github_actions"
                                        );
                                        if (
                                          extractedContent &&
                                          !allFiles[
                                            ".github/workflows/deploy.yml"
                                          ]
                                        ) {
                                          allFiles[
                                            ".github/workflows/deploy.yml"
                                          ] = extractedContent;
                                        }
                                      }

                                      // From config.config.files
                                      if (config.config?.files) {
                                        Object.entries(
                                          config.config.files
                                        ).forEach(([filename, content]) => {
                                          const extractedContent =
                                            extractContent(content);
                                          if (
                                            extractedContent &&
                                            !allFiles[filename]
                                          ) {
                                            allFiles[filename] =
                                              extractedContent;
                                          }
                                        });
                                      }

                                      return Object.entries(allFiles)
                                        .map(([filename, content]) => {
                                          if (!content) return null;

                                          const contentString =
                                            typeof content === "string"
                                              ? content
                                              : JSON.stringify(
                                                  content,
                                                  null,
                                                  2
                                                );

                                          return (
                                            <div
                                              key={filename}
                                              className="bg-gray-900/50 rounded-lg border border-gray-700/30 overflow-hidden"
                                            >
                                              <div className="flex items-center justify-between p-4 bg-gray-800/50 border-b border-gray-700/30">
                                                <div className="flex items-center">
                                                  <FaFileCode className="w-4 h-4 text-gray-400 mr-2" />
                                                  <span className="text-sm font-medium text-gray-300">
                                                    {filename}
                                                  </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-xs text-gray-500">
                                                    {
                                                      contentString.split("\n")
                                                        .length
                                                    }{" "}
                                                    lines
                                                  </span>
                                                  <button
                                                    onClick={() =>
                                                      navigator.clipboard.writeText(
                                                        contentString
                                                      )
                                                    }
                                                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                                                  >
                                                    <FaDownload className="w-3 h-3 mr-1" />
                                                    Copy
                                                  </button>
                                                </div>
                                              </div>
                                              <div className="p-4">
                                                <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                                                  <code>{contentString}</code>
                                                </pre>
                                              </div>
                                            </div>
                                          );
                                        })
                                        .filter(Boolean);
                                    })()}
                                  </div>

                                  {/* Additional Metadata */}
                                  {config.metadata && (
                                    <div className="mt-6 space-y-4">
                                      {/* Build Instructions */}
                                      {(config.metadata.build_instructions ||
                                        config.metadata.usage_instructions) && (
                                        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                                          <h5 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                                            <FaRocket className="w-4 h-4 mr-2 text-orange-400" />
                                            Quick Start Instructions
                                          </h5>
                                          <div className="space-y-2">
                                            {(
                                              config.metadata
                                                .build_instructions ||
                                              config.metadata.usage_instructions
                                            )?.map((instruction, i) => (
                                              <div
                                                key={i}
                                                className="flex items-start"
                                              >
                                                <span className="text-xs text-gray-500 mr-2 mt-1">
                                                  {i + 1}.
                                                </span>
                                                <code className="text-xs text-gray-300 bg-gray-900/50 px-2 py-1 rounded font-mono">
                                                  {instruction}
                                                </code>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Environment Variables */}
                                      {config.metadata.environment_variables &&
                                        Object.keys(
                                          config.metadata.environment_variables
                                        ).length > 0 && (
                                          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                                            <h5 className="text-sm font-medium text-blue-300 mb-3 flex items-center">
                                              <FaCog className="w-4 h-4 mr-2" />
                                              Environment Variables
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                              {Object.entries(
                                                config.metadata
                                                  .environment_variables
                                              ).map(([key, value]) => (
                                                <div
                                                  key={key}
                                                  className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded"
                                                >
                                                  <span className="text-xs font-mono text-gray-300">
                                                    {key}
                                                  </span>
                                                  <span className="text-xs font-mono text-blue-300">
                                                    {value}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                      {/* Required Secrets */}
                                      {config.metadata.secrets_required &&
                                        config.metadata.secrets_required
                                          .length > 0 && (
                                          <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                                            <h5 className="text-sm font-medium text-yellow-300 mb-3 flex items-center">
                                              <FaShieldAlt className="w-4 h-4 mr-2" />
                                              Required Secrets
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                              {config.metadata.secrets_required.map(
                                                (secret, i) => (
                                                  <div
                                                    key={i}
                                                    className="text-xs bg-gray-800/50 px-3 py-2 rounded font-mono text-yellow-300"
                                                  >
                                                    {secret}
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}

                                      {/* Service Configuration */}
                                      {(config.metadata.services ||
                                        config.metadata.networks ||
                                        config.metadata.volumes) && (
                                        <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                                          <h5 className="text-sm font-medium text-green-300 mb-3 flex items-center">
                                            <FaCube className="w-4 h-4 mr-2" />
                                            Service Configuration
                                          </h5>
                                          <div className="space-y-3">
                                            {config.metadata.services && (
                                              <div>
                                                <h6 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                                                  Services
                                                </h6>
                                                <div className="space-y-2">
                                                  {Object.entries(
                                                    config.metadata.services
                                                  ).map(
                                                    ([
                                                      serviceName,
                                                      service,
                                                    ]) => (
                                                      <div
                                                        key={serviceName}
                                                        className="bg-gray-800/50 p-3 rounded"
                                                      >
                                                        <div className="flex items-center justify-between mb-1">
                                                          <span className="text-sm font-medium text-green-300">
                                                            {serviceName}
                                                          </span>
                                                          {service.image && (
                                                            <span className="text-xs text-gray-400">
                                                              {service.image}
                                                            </span>
                                                          )}
                                                        </div>
                                                        <p className="text-xs text-gray-300">
                                                          {service.description}
                                                        </p>
                                                        {service.ports && (
                                                          <div className="mt-2 flex flex-wrap gap-1">
                                                            {service.ports.map(
                                                              (port, i) => (
                                                                <span
                                                                  key={i}
                                                                  className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded"
                                                                >
                                                                  {port}
                                                                </span>
                                                              )
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                            {config.metadata.volumes &&
                                              Object.keys(
                                                config.metadata.volumes
                                              ).length > 0 && (
                                                <div>
                                                  <h6 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                                                    Volumes
                                                  </h6>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {Object.entries(
                                                      config.metadata.volumes
                                                    ).map(
                                                      ([
                                                        volumeName,
                                                        volume,
                                                      ]) => (
                                                        <div
                                                          key={volumeName}
                                                          className="bg-gray-800/50 p-2 rounded"
                                                        >
                                                          <span className="text-xs font-medium text-green-300">
                                                            {volumeName}
                                                          </span>
                                                          <p className="text-xs text-gray-400 mt-1">
                                                            {volume.description}
                                                          </p>
                                                        </div>
                                                      )
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Performance Estimates */}
                                      {(config.metadata.estimated_runtime ||
                                        config.metadata.build_time_estimate ||
                                        config.metadata.size_estimate) && (
                                        <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                                          <h5 className="text-sm font-medium text-purple-300 mb-3 flex items-center">
                                            <FaChartLine className="w-4 h-4 mr-2" />
                                            Performance Estimates
                                          </h5>
                                          <div className="grid grid-cols-3 gap-4">
                                            {config.metadata
                                              .estimated_runtime && (
                                              <div className="text-center">
                                                <div className="text-lg font-bold text-purple-300">
                                                  {
                                                    config.metadata
                                                      .estimated_runtime
                                                  }
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                  Runtime
                                                </div>
                                              </div>
                                            )}
                                            {config.metadata
                                              .build_time_estimate && (
                                              <div className="text-center">
                                                <div className="text-lg font-bold text-purple-300">
                                                  {
                                                    config.metadata
                                                      .build_time_estimate
                                                  }
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                  Build Time
                                                </div>
                                              </div>
                                            )}
                                            {config.metadata.size_estimate && (
                                              <div className="text-center">
                                                <div className="text-lg font-bold text-purple-300">
                                                  {
                                                    config.metadata
                                                      .size_estimate
                                                  }
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                  Image Size
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </motion.div>
                              );
                            }
                          )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="text-center mt-12 pt-8 border-t border-gray-700/50">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                      <button
                        onClick={() => {
                          setAnalysisResults(null);
                          setGenerationResults(null);
                          setRepositoryUrl("");
                        }}
                        className="w-full sm:w-auto px-6 py-3 bg-gray-700/50 text-white rounded-xl hover:bg-gray-600/50 transition-colors"
                      >
                        Analyze Another Repository
                      </button>
                      <button
                        onClick={() => navigate("/auth/register")}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center"
                      >
                        <FaRocket className="w-4 h-4 mr-2" />
                        Create Project
                        <FaArrowRight className="w-4 h-4 ml-2" />
                      </button>
                      <button
                        onClick={handleDownloadReport}
                        className="w-full sm:w-auto px-6 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white hover:bg-gray-700 transition-colors flex items-center justify-center"
                      >
                        <FaDownload className="w-4 h-4 mr-2" />
                        Download All Files
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalysisDemo;
