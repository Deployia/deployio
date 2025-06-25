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
} from "react-icons/fa";
import SEO from "@components/SEO";
import AnalysisResults from "@components/analysis/AnalysisResults";
import api from "@utils/api";

const AnalysisDemo = () => {
  const navigate = useNavigate();
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [serviceHealth, setServiceHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const progressIntervalRef = useRef(null);

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
    { name: "vasudevshetty/mern", description: "MERN Stack Application" },
    {
      name: "microsoft/TypeScript-React-Starter",
      description: "TypeScript React Starter",
    },
    {
      name: "hagopj13/node-express-boilerplate",
      description: "Node.js Express Boilerplate",
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
    startProgressAnimation();

    try {
      const response = await api.post(
        "/ai/analysis/demo",
        {
          repositoryUrl: normalizedUrl,
          branch: "main",
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
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        setCurrentStep(progressSteps.length - 1);
        setAnalysisResults(response.data.data);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to analyze repository. Please check the URL and try again."
      );
    } finally {
      setIsAnalyzing(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
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
              className="max-w-4xl mx-auto mb-16"
            >
              <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8">
                <div className="flex items-center mb-6">
                  <FaGithub className="w-6 h-6 text-gray-400 mr-3" />
                  <span className="text-gray-300 font-medium">
                    Enter GitHub Repository URL
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={repositoryUrl}
                      onChange={(e) => setRepositoryUrl(e.target.value)}
                      placeholder="https://github.com/username/repository or username/repository"
                      className="w-full px-6 py-4 bg-gray-900/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-gray-900/70 transition-all"
                      disabled={isAnalyzing}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !isAnalyzing) {
                          handleAnalyze();
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={!repositoryUrl.trim() || isAnalyzing}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                  >
                    {isAnalyzing ? (
                      <FaSpinner className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <FaRocket className="w-5 h-5 mr-2" />
                        Analyze
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Samples */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-gray-400 text-sm mr-2">
                    Try these samples:
                  </span>
                  {sampleRepos.map((repo, index) => (
                    <button
                      key={index}
                      onClick={() => setRepositoryUrl(repo.name)}
                      className="px-3 py-1 text-sm bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 transition-colors"
                      disabled={isAnalyzing}
                    >
                      {repo.name}
                    </button>
                  ))}
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
                                {step.description}
                              </p>
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
