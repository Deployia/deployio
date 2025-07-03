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
  FaCloudUploadAlt,
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
          analysisTypes: ["stack", "dependencies", "code"], // Fixed: Use 'code' instead of 'quality'
          configTypes: ["dockerfile", "github_actions", "docker_compose"],
          autoApprove: true,
        },
        {
          timeout: 120000, // 2 minute timeout for complete pipeline
        }
      );

      if (response.data.success) {
        // Clean up progress tracking
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        if (progressPollingRef.current) {
          clearInterval(progressPollingRef.current);
        }

        setCurrentStep(progressSteps.length - 1);

        // Extract analysis and generation results
        const pipelineData = response.data.data;
        
        // Handle both unified and separate response structures
        if (pipelineData.analysis) {
          setAnalysisResults(pipelineData.analysis);
        } else if (pipelineData.data?.analysis) {
          setAnalysisResults(pipelineData.data.analysis);
        } else {
          // Fallback: use the response as analysis results
          setAnalysisResults(pipelineData);
        }

        if (pipelineData.generation?.configurations) {
          setGenerationResults(pipelineData.generation);
        } else if (pipelineData.configurations) {
          setGenerationResults({ configurations: pipelineData.configurations });
        }

        // Store operation ID for future reference
        if (pipelineData.sessionId) {
          setOperationId(pipelineData.sessionId);

          // Subscribe to WebSocket progress updates for this session
          if (socketRef.current) {
            socketRef.current.emit("subscribe_analysis", {
              sessionId: pipelineData.sessionId,
            });
          }
        }
      }
    } catch (err) {
      console.error("Analysis error:", err);

      // Enhanced error handling with forwarded AI service errors
      let errorMessage = "Failed to analyze repository. Please try again.";

      // The backend now forwards AI service errors properly
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 400) {
        if (err.response.data?.message?.includes("analysis type")) {
          errorMessage = "Invalid analysis configuration. Please refresh the page and try again.";
        } else if (err.response.data?.message?.includes("Repository data")) {
          errorMessage = "Repository data validation failed. Please try a different repository.";
        } else {
          errorMessage = err.response.data?.message || "Invalid request. Please check the repository URL.";
        }
      } else if (err.response?.status === 404) {
        if (err.response.data?.message?.includes("Branch")) {
          errorMessage = `Branch '${branch}' not found in repository. Try 'main' or 'master' instead.`;
        } else {
          errorMessage =
            "Repository not found. Please check the URL and ensure it's publicly accessible.";
        }
      } else if (err.response?.status === 403) {
        errorMessage =
          "Repository is private or access is restricted. Please use a public repository.";
      } else if (err.response?.status === 422) {
        errorMessage =
          "Repository format not supported. Please try a different repository.";
      } else if (err.response?.status === 429) {
        errorMessage =
          "Rate limit exceeded. Please wait a moment and try again.";
      } else if (err.response?.status >= 500) {
        errorMessage =
          "Analysis service is temporarily unavailable. Please try again later.";
      } else if (err.code === "ECONNABORTED") {
        errorMessage =
          "Analysis timed out. The repository might be too large or complex.";
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
                Experience our unified AI-powered workflow: comprehensive repository analysis 
                with automatic LLM enhancement, followed by intelligent configuration generation 
                for production-ready deployment—all in a single request.
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
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <FaCog className="w-6 h-6 mr-3 text-green-400" />
                        Generated Configurations
                      </h3>
                      <div className="space-y-6">
                        {generationResults.configurations &&
                          Object.entries(generationResults.configurations).map(
                            ([configType, config]) => (
                              <motion.div
                                key={configType}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50"
                              >
                                <h4 className="text-lg font-semibold text-white mb-4 capitalize flex items-center">
                                  <FaCloudUploadAlt className="w-5 h-5 mr-2 text-green-400" />
                                  {configType.replace("_", " ")} Configuration
                                </h4>
                                <div className="space-y-4">
                                  {config.files &&
                                    Object.entries(config.files).map(
                                      ([filename, content]) => (
                                        <div
                                          key={filename}
                                          className="bg-gray-900/50 rounded-lg p-4"
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-300">
                                              {filename}
                                            </span>
                                            <button
                                              onClick={() =>
                                                navigator.clipboard.writeText(
                                                  content
                                                )
                                              }
                                              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                            >
                                              Copy
                                            </button>
                                          </div>
                                          <pre className="text-xs text-gray-300 overflow-x-auto">
                                            <code>{content}</code>
                                          </pre>
                                        </div>
                                      )
                                    )}
                                </div>
                              </motion.div>
                            )
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
