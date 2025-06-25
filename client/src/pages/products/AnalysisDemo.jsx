import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaGithub,
  FaCode,
  FaLayerGroup,
  FaBrain,
  FaChartLine,
  FaSpinner,
  FaExclamationTriangle,
  FaArrowRight,
  FaRocket,
} from "react-icons/fa";
import SEO from "@components/SEO";
import api from "@utils/api";

const AnalysisDemo = () => {
  const navigate = useNavigate();
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [serviceHealth, setServiceHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(true);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef(null);

  // Sample repositories for quick testing
  const sampleRepos = [
    "vasudevshetty/mern",
    "microsoft/TypeScript-React-Starter",
    "hagopj13/node-express-boilerplate",
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
    setProgress(0);
    const steps = [10, 25, 45, 65, 85, 95];
    let currentStep = 0;

    progressIntervalRef.current = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep]);
        currentStep++;
      }
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
        setProgress(100);
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

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return "text-green-400";
    if (confidence >= 0.7) return "text-yellow-400";
    return "text-red-400";
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

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
            {/* Service Health Status */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div
                className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-medium ${
                  serviceHealth?.status === "healthy"
                    ? "bg-green-500/20 border-green-500/30 text-green-400"
                    : "bg-red-500/20 border-red-500/30 text-red-400"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    serviceHealth?.status === "healthy"
                      ? "bg-green-400"
                      : "bg-red-400"
                  } animate-pulse`}
                />
                AI Engine{" "}
                {serviceHealth?.status === "healthy" ? "Online" : "Offline"}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-6">
                Try Our AI Engine
              </h1>

              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
                Experience real-time AI-powered code analysis. Paste any GitHub
                repository URL and see instant insights into technology stacks,
                dependencies, and code quality.
              </p>

              {/* Input Section */}
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaGithub className="h-6 w-6 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={repositoryUrl}
                    onChange={(e) => setRepositoryUrl(e.target.value)}
                    placeholder="username/repository or https://github.com/username/repository"
                    className="w-full pl-14 pr-4 py-5 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                    disabled={
                      isAnalyzing || serviceHealth?.status !== "healthy"
                    }
                    onKeyPress={(e) => e.key === "Enter" && handleAnalyze()}
                  />
                </div>

                <motion.button
                  onClick={handleAnalyze}
                  disabled={
                    !repositoryUrl.trim() ||
                    isAnalyzing ||
                    serviceHealth?.status !== "healthy"
                  }
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-5 px-8 rounded-2xl transition-all flex items-center justify-center space-x-3 text-lg"
                  whileHover={{
                    scale:
                      repositoryUrl.trim() &&
                      !isAnalyzing &&
                      serviceHealth?.status === "healthy"
                        ? 1.02
                        : 1,
                  }}
                  whileTap={{
                    scale:
                      repositoryUrl.trim() &&
                      !isAnalyzing &&
                      serviceHealth?.status === "healthy"
                        ? 0.98
                        : 1,
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <FaSpinner className="w-5 h-5 animate-spin" />
                      <span>Analyzing Repository...</span>
                    </>
                  ) : (
                    <>
                      <FaBrain className="w-5 h-5" />
                      <span>Analyze with AI</span>
                      <FaArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>

                {/* Quick Samples */}
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-3">Quick samples:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {sampleRepos.map((repo, index) => (
                      <button
                        key={index}
                        onClick={() => setRepositoryUrl(repo)}
                        disabled={isAnalyzing}
                        className="px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {repo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Progress Section */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12"
            >
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Analyzing Repository
                  </h3>
                  <p className="text-gray-400">
                    Our AI is processing your repository...
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="text-center">
                    <span className="text-blue-400 font-medium text-lg">
                      {progress}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8">
                  {[
                    {
                      icon: FaCode,
                      label: "Stack Detection",
                      active: progress >= 20,
                    },
                    {
                      icon: FaLayerGroup,
                      label: "Dependencies",
                      active: progress >= 50,
                    },
                    {
                      icon: FaChartLine,
                      label: "Quality Analysis",
                      active: progress >= 80,
                    },
                  ].map((step, index) => (
                    <div
                      key={index}
                      className={`text-center p-4 rounded-lg transition-all ${
                        step.active
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-gray-700/30 text-gray-500"
                      }`}
                    >
                      <step.icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm">{step.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12"
            >
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                <div className="flex items-center space-x-3">
                  <FaExclamationTriangle className="w-6 h-6 text-red-400" />
                  <div>
                    <h4 className="text-lg font-medium text-red-400">
                      Analysis Failed
                    </h4>
                    <p className="text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Display */}
        <AnimatePresence>
          {analysisResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"
            >
              <div className="space-y-8">
                {/* Overview */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Analysis Complete
                    </h2>
                    <div className="flex items-center space-x-4">
                      <div
                        className={`flex items-center space-x-2 ${getConfidenceColor(
                          analysisResults.confidence_score
                        )}`}
                      >
                        <FaBrain className="w-5 h-5" />
                        <span className="font-semibold">
                          {Math.round(analysisResults.confidence_score * 100)}%
                          Confidence
                        </span>
                      </div>
                      {analysisResults.llm_used && (
                        <div className="flex items-center space-x-2 text-purple-400">
                          <FaRocket className="w-4 h-4" />
                          <span className="text-sm">LLM Enhanced</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400 mb-2">
                        {analysisResults.processing_time?.toFixed(1) || 0}s
                      </div>
                      <div className="text-gray-400">Processing Time</div>
                    </div>
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-400 mb-2">
                        {analysisResults.detected_files?.length || 0}
                      </div>
                      <div className="text-gray-400">Files Analyzed</div>
                    </div>
                    <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-purple-400 mb-2 capitalize">
                        {analysisResults.confidence_level || "Unknown"}
                      </div>
                      <div className="text-gray-400">Confidence Level</div>
                    </div>
                  </div>
                </div>

                {/* Technology Stack */}
                {analysisResults.technology_stack && (
                  <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <FaCode className="w-6 h-6 text-blue-400" />
                      <h3 className="text-xl font-bold text-white">
                        Technology Stack
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(analysisResults.technology_stack)
                        .filter(([_, value]) => value && !Array.isArray(value))
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="bg-gray-700/30 rounded-lg p-4"
                          >
                            <div className="text-sm text-gray-400 capitalize mb-1">
                              {key.replace(/_/g, " ")}
                            </div>
                            <div className="text-lg font-medium text-white">
                              {value}
                            </div>
                          </div>
                        ))}
                    </div>

                    {analysisResults.technology_stack
                      .additional_technologies && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-white mb-3">
                          Additional Technologies
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisResults.technology_stack.additional_technologies.map(
                            (tech, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                              >
                                {tech}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Dependencies */}
                {analysisResults.dependency_analysis && (
                  <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <FaLayerGroup className="w-6 h-6 text-yellow-400" />
                      <h3 className="text-xl font-bold text-white">
                        Dependencies
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          key: "total_dependencies",
                          label: "Total",
                          color: "blue",
                        },
                        {
                          key: "direct_dependencies",
                          label: "Direct",
                          color: "green",
                        },
                        {
                          key: "dev_dependencies",
                          label: "Dev",
                          color: "purple",
                        },
                        {
                          key: "security_vulnerabilities",
                          label: "Vulnerabilities",
                          color: "red",
                        },
                      ].map(({ key, label, color }) => (
                        <div
                          key={key}
                          className="text-center p-4 bg-gray-700/30 rounded-lg"
                        >
                          <div
                            className={`text-2xl font-bold text-${color}-400 mb-1`}
                          >
                            {analysisResults.dependency_analysis[key] || 0}
                          </div>
                          <div className="text-sm text-gray-400">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysisResults.recommendations &&
                  analysisResults.recommendations.length > 0 && (
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
                      <div className="flex items-center space-x-3 mb-6">
                        <FaRocket className="w-6 h-6 text-purple-400" />
                        <h3 className="text-xl font-bold text-white">
                          AI Recommendations
                        </h3>
                      </div>

                      <div className="space-y-4">
                        {analysisResults.recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-3 p-4 bg-gray-700/30 rounded-lg"
                          >
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                              <div className="w-2 h-2 bg-purple-400 rounded-full" />
                            </div>
                            <div className="text-gray-300">
                              {typeof rec === "string"
                                ? rec
                                : rec.description || rec.suggestion}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8 text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Ready to supercharge your development workflow?
                  </h3>
                  <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                    Get unlimited access to our AI analysis engine, automated
                    deployments, real-time monitoring, and comprehensive DevOps
                    automation.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => navigate("/auth/signup")}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-all"
                    >
                      Start Free Trial
                    </button>
                    <button
                      onClick={() => navigate("/products/code-analysis")}
                      className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-semibold py-3 px-8 rounded-xl transition-all"
                    >
                      View Full Product
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default AnalysisDemo;
