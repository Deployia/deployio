import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCogs,
  FaCode,
  FaShieldAlt,
  FaRocket,
  FaChartLine,
} from "react-icons/fa";
import {
  analyzeRepository,
  updateAnalysisProgress,
  completeStep,
  startAnalysisPolling,
  stopAnalysisPolling,
} from "@redux/slices/projectCreationSlice";

const AnalysisProgress = ({ stepData, onNext, loading: _loading }) => {
  const dispatch = useDispatch();
  const [analysisLogs, setAnalysisLogs] = useState([]);

  // Start analysis when component mounts
  useEffect(() => {
    if (
      !stepData.analysisId &&
      stepData.selectedRepository &&
      stepData.selectedBranch
    ) {
      const repositoryData = {
        repository: stepData.selectedRepository,
        branch: stepData.selectedBranch,
        settings: stepData.analysisSettings,
      };

      dispatch(
        analyzeRepository({
          sessionId: stepData.sessionId,
          repositoryData,
        })
      );
    }
  }, [dispatch, stepData]);

  // Polling for analysis progress
  useEffect(() => {
    let interval;

    if (stepData.analysisStatus === "running" && stepData.analysisId) {
      dispatch(startAnalysisPolling());

      interval = setInterval(() => {
        // This would make an API call to check progress
        // For now, simulate progress
        const currentProgress = stepData.analysisProgress;
        if (currentProgress < 100) {
          const newProgress = Math.min(
            currentProgress + Math.random() * 15,
            100
          );
          dispatch(
            updateAnalysisProgress({
              progress: newProgress,
              status: newProgress >= 100 ? "completed" : "running",
            })
          );

          // Add log entries
          if (newProgress > 20 && newProgress < 25) {
            setAnalysisLogs((prev) => [
              ...prev,
              {
                message: "Analyzing repository structure...",
                timestamp: new Date(),
                type: "info",
              },
            ]);
          }
          if (newProgress > 40 && newProgress < 45) {
            setAnalysisLogs((prev) => [
              ...prev,
              {
                message: "Detecting technology stack...",
                timestamp: new Date(),
                type: "info",
              },
            ]);
          }
          if (newProgress > 60 && newProgress < 65) {
            setAnalysisLogs((prev) => [
              ...prev,
              {
                message: "Analyzing dependencies...",
                timestamp: new Date(),
                type: "info",
              },
            ]);
          }
          if (newProgress > 80 && newProgress < 85) {
            setAnalysisLogs((prev) => [
              ...prev,
              {
                message: "Generating deployment configuration...",
                timestamp: new Date(),
                type: "info",
              },
            ]);
          }
          if (newProgress >= 100) {
            setAnalysisLogs((prev) => [
              ...prev,
              {
                message: "Analysis completed successfully!",
                timestamp: new Date(),
                type: "success",
              },
            ]);
          }
        }
      }, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
        dispatch(stopAnalysisPolling());
      }
    };
  }, [
    dispatch,
    stepData.analysisStatus,
    stepData.analysisId,
    stepData.analysisProgress,
  ]);

  const handleContinue = () => {
    if (stepData.analysisStatus === "completed") {
      dispatch(completeStep(4));
      onNext();
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <FaCheckCircle className="w-6 h-6 text-green-500" />;
      case "failed":
        return <FaExclamationTriangle className="w-6 h-6 text-red-500" />;
      case "running":
      default:
        return <FaSpinner className="w-6 h-6 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      case "running":
      default:
        return "text-blue-400";
    }
  };

  const analysisSteps = [
    {
      id: "repository",
      name: "Repository Analysis",
      description: "Scanning repository structure and files",
      icon: FaCode,
      color: "text-blue-500",
      threshold: 25,
    },
    {
      id: "stack",
      name: "Stack Detection",
      description: "Identifying frameworks and technologies",
      icon: FaCogs,
      color: "text-purple-500",
      threshold: 50,
    },
    {
      id: "dependencies",
      name: "Dependency Analysis",
      description: "Analyzing package dependencies",
      icon: FaShieldAlt,
      color: "text-green-500",
      threshold: 75,
    },
    {
      id: "optimization",
      name: "Configuration Generation",
      description: "Creating deployment configuration",
      icon: FaRocket,
      color: "text-yellow-500",
      threshold: 100,
    },
  ];

  const getStepStatus = (threshold) => {
    if (stepData.analysisProgress >= threshold) return "completed";
    if (stepData.analysisProgress >= threshold - 25) return "running";
    return "pending";
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            {getStatusIcon(stepData.analysisStatus)}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            AI Analysis in Progress
          </h2>
          <p
            className={`max-w-2xl mx-auto px-2 text-sm sm:text-base ${getStatusColor(
              stepData.analysisStatus
            )}`}
          >
            {stepData.analysisStatus === "completed"
              ? "Analysis completed! Your project configuration is ready."
              : stepData.analysisStatus === "failed"
              ? "Analysis failed. Please try again or configure manually."
              : "Our AI is analyzing your repository to generate the optimal deployment configuration."}
          </p>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-medium text-neutral-300">
            Overall Progress
          </span>
          <span className="text-xs sm:text-sm text-neutral-400">
            {Math.round(stepData.analysisProgress)}%
          </span>
        </div>
        <div className="w-full bg-neutral-800 rounded-full h-2 sm:h-3">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 sm:h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${stepData.analysisProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Analysis Steps */}
      <div className="grid gap-4 mb-8">
        {analysisSteps.map((step, index) => {
          const status = getStepStatus(step.threshold);
          const Icon = step.icon;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                p-4 rounded-lg border transition-all duration-300
                ${
                  status === "completed"
                    ? "bg-green-500/10 border-green-500/30"
                    : status === "running"
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-neutral-800/50 border-neutral-700"
                }
              `}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`
                  p-3 rounded-full transition-colors
                  ${
                    status === "completed"
                      ? "bg-green-500/20"
                      : status === "running"
                      ? "bg-blue-500/20"
                      : "bg-neutral-700"
                  }
                `}
                >
                  {status === "completed" ? (
                    <FaCheckCircle className="w-5 h-5 text-green-500" />
                  ) : status === "running" ? (
                    <FaSpinner className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : (
                    <Icon className={`w-5 h-5 ${step.color}`} />
                  )}
                </div>

                <div className="flex-1">
                  <h3
                    className={`
                    font-medium transition-colors
                    ${
                      status === "completed"
                        ? "text-green-400"
                        : status === "running"
                        ? "text-blue-400"
                        : "text-neutral-300"
                    }
                  `}
                  >
                    {step.name}
                  </h3>
                  <p className="text-sm text-neutral-400 mt-1">
                    {step.description}
                  </p>
                </div>

                {status === "running" && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Analysis Logs */}
      {analysisLogs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <FaChartLine className="w-5 h-5 text-blue-500" />
            <span>Analysis Log</span>
          </h3>
          <div className="bg-neutral-900/50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {analysisLogs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start space-x-3 py-2"
                >
                  <div
                    className={`
                    w-2 h-2 rounded-full mt-2 flex-shrink-0
                    ${log.type === "success" ? "bg-green-500" : "bg-blue-500"}
                  `}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-neutral-300">{log.message}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {log.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Results Preview */}
      {stepData.analysisStatus === "completed" && stepData.analysisResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-green-500/10 border border-green-500/20 rounded-lg"
        >
          <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center space-x-2">
            <FaCheckCircle className="w-5 h-5" />
            <span>Analysis Complete</span>
          </h3>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {stepData.analysisResults.detectedFrameworks?.length || 0}
              </div>
              <div className="text-sm text-green-300">Frameworks Detected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {stepData.analysisResults.dependencies?.length || 0}
              </div>
              <div className="text-sm text-green-300">
                Dependencies Analyzed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Math.round((stepData.aiConfidence || 0) * 100)}%
              </div>
              <div className="text-sm text-green-300">AI Confidence</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Button */}
      <div className="text-center">
        {stepData.analysisStatus === "completed" ? (
          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
          >
            <FaCheckCircle className="w-4 h-4" />
            <span>Continue to Configuration</span>
          </button>
        ) : stepData.analysisStatus === "failed" ? (
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Retry Analysis
            </button>
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
            >
              Configure Manually
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-3 text-neutral-400">
            <FaSpinner className="w-5 h-5 animate-spin" />
            <span>Analysis in progress... Please wait</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisProgress;
