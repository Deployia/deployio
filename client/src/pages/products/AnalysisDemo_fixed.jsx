import React, { useState, useEffect, useRef } from "react";
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
} from "react-icons/fa";
import SEO from "@components/SEO";
import AnalysisResults from "@components/analysis/AnalysisResults";
import api from "@utils/api";

const AnalysisDemo = () => {
  const navigate = useNavigate();
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [serviceHealth, setServiceHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [operationId, setOperationId] = useState(null);
  const [realProgress, setRealProgress] = useState(null);
  const progressIntervalRef = useRef(null);
  const progressPollingRef = useRef(null);

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
      label: "Quality Analysis",
      description: "Evaluating code quality and security",
    },
    {
      icon: FaRocket,
      label: "Generating Results",
      description: "Compiling comprehensive analysis report",
    },
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

  // Check service health on mount
  useEffect(() => {
    checkServiceHealth();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (progressPollingRef.current) {
        clearInterval(progressPollingRef.current);
      }
    };
  }, []);

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

  const pollProgress = async (operationId) => {
    try {
      const response = await api.get(
        `/ai/analysis/demo/progress/${operationId}`
      );
      if (response.data.success) {
        const progressData = response.data.data;
        setRealProgress(progressData);

        // Map progress to our step system
        if (progressData.step_name) {
          const stepMap = {
            Initialization: 0,
            "Repository Fetch": 0,
            "Stack Detection": 1,
            "Dependency Analysis": 1,
            "Code Analysis": 2,
            "Insight Generation": 3,
            Finalization: 4,
          };

          const stepIndex = stepMap[progressData.step_name] || 0;
          setCurrentStep(stepIndex);
        }

        // Stop polling if completed or failed
        if (
          progressData.status === "COMPLETED" ||
          progressData.status === "FAILED"
        ) {
          if (progressPollingRef.current) {
            clearInterval(progressPollingRef.current);
          }
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        }
      }
    } catch (error) {
      console.error("Error polling progress:", error);
      // Continue with fallback animation if progress polling fails
    }
  };

  const startRealProgressTracking = (operationId) => {
    setOperationId(operationId);
    setCurrentStep(0);
    setRealProgress(null);

    // Clear any existing intervals
    if (progressPollingRef.current) {
      clearInterval(progressPollingRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Start polling for real progress immediately
    pollProgress(operationId);
    progressPollingRef.current = setInterval(() => {
      pollProgress(operationId);
    }, 1500); // Poll every 1.5 seconds

    // Fallback animation in case real progress is not available
    progressIntervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < progressSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 4000); // Slower fallback animation (4 seconds per step)
  };

  const startProgressAnimation = () => {
    setCurrentStep(0);

    progressIntervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < progressSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);
  };

  const handleAnalyze = async () => {
    const normalizedUrl = normalizeRepositoryUrl(repositoryUrl.trim());
    if (!normalizedUrl) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResults(null);
    setRealProgress(null);
    setOperationId(null);

    // Start with fallback animation
    startProgressAnimation();

    try {
      const response = await api.post(
        "/ai/analysis/demo",
        {
          repositoryUrl: normalizedUrl,
          branch: branch || "main",
          analysisTypes: ["stack", "dependencies", "quality"],
          forceLlm: true,
          includeReasoning: true,
          includeRecommendations: true,
          includeInsights: true,
          explainNullFields: true,
          trackProgress: true,
        },
        {
          timeout: 60000, // 60 second timeout for analysis
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
        setAnalysisResults(response.data.data);

        // If we have an operation ID, start real progress tracking
        if (response.data.data?.operation_id) {
          startRealProgressTracking(response.data.data.operation_id);
        }

        // Store operation ID for future reference
        if (response.data.data?.data?.analysis_id) {
          setOperationId(response.data.data.data.analysis_id);
        }
      }
    } catch (err) {
      console.error("Analysis error:", err);

      // Enhanced error handling with forwarded AI service errors
      let errorMessage = "Failed to analyze repository. Please try again.";

      // The backend now forwards AI service errors properly
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
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
    if (!analysisResults) return;

    try {
      // For now, generate a JSON download until backend PDF generation is implemented
      const reportData = {
        repository: analysisResults.data.repository_url,
        branch: analysisResults.data.branch,
        timestamp: new Date().toISOString(),
        analysis: analysisResults.data,
        generated_by: "DeployIO AI Analysis Engine",
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analysis-report-${analysisResults.data.repository_url
        .split("/")
        .pop()}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // TODO: Replace with backend API call for PDF generation:
      // const response = await api.post('/ai/analysis/generate-report', {
      //   analysisId: analysisResults.data.analysis_id,
      //   format: 'pdf'
      // });
      // window.open(response.data.downloadUrl, '_blank');
    } catch (error) {
      console.error("Error downloading report:", error);
      setError("Failed to generate report download. Please try again.");
    }
  };

  if (checkingHealth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
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
        title="AI Code Analysis Demo - Try Our Engine Live"
        description="Experience our AI-powered code analysis engine. Analyze any GitHub repository instantly with technology stack detection, dependency analysis, and code quality assessment."
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
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-6">
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

              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                Analyze Any
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  {" "}
                  GitHub Repository
                </span>
              </h1>

              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Get instant insights into technology stack, dependencies, code
                quality, and architecture patterns with our AI-powered analysis
                engine.
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
                  <div className="flex items-center bg-neutral-800/70 rounded-lg p-2 sm:p-3 border border-neutral-600/20 mb-3">
                    <span className="text-gray-500 font-mono text-xs sm:text-sm mr-2 flex-shrink-0">
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
              {analysisResults && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-7xl mx-auto"
                >
                  <AnalysisResults results={analysisResults} />

                  {/* Action Buttons */}
                  <div className="text-center mt-12 pt-8 border-t border-gray-700/50">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={() => {
                          setAnalysisResults(null);
                          setRepositoryUrl("");
                        }}
                        className="px-6 py-3 bg-gray-700/50 text-white rounded-xl hover:bg-gray-600/50 transition-colors"
                      >
                        Analyze Another Repository
                      </button>
                      <button
                        onClick={() => navigate("/auth/register")}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center"
                      >
                        <FaRocket className="w-4 h-4 mr-2" />
                        Get Full Access
                        <FaArrowRight className="w-4 h-4 ml-2" />
                      </button>
                      <button
                        onClick={handleDownloadReport}
                        className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white hover:bg-gray-700 transition-colors flex items-center justify-center"
                      >
                        <FaDownload className="w-4 h-4 mr-2" />
                        Download Report
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
