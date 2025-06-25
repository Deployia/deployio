import React from "react";
import { motion } from "framer-motion";
import {
  FaGithub,
  FaCode,
  FaLayerGroup,
  FaBrain,
  FaChartLine,
  FaShieldAlt,
  FaCheckCircle,
  FaCube,
  FaServer,
  FaTools,
  FaLightbulb,
  FaStar,
  FaFileCode,
  FaArrowRight,
  FaRocket,
} from "react-icons/fa";

const AnalysisResults = ({ results }) => {
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return "text-green-400";
    if (confidence >= 0.7) return "text-yellow-400";
    return "text-red-400";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "performance":
        return FaRocket;
      case "security":
        return FaShieldAlt;
      case "optimization":
        return FaChartLine;
      case "best_practice":
        return FaCheckCircle;
      case "tooling":
        return FaTools;
      case "deployment":
        return FaServer;
      default:
        return FaLightbulb;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-lg border border-gray-600/30 rounded-2xl p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center mb-4">
              <FaGithub className="w-8 h-8 text-blue-400 mr-3" />
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Analysis Complete
                </h2>
                <p className="text-gray-400">AI-powered repository insights</p>
              </div>
            </div>
            <p className="text-gray-300 font-mono text-sm break-all bg-gray-900/50 px-4 py-2 rounded-lg">
              {results.repository_url}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="text-center bg-gray-900/50 rounded-xl p-4">
              <div
                className={`text-2xl font-bold ${getConfidenceColor(
                  results.confidence_score
                )}`}
              >
                {Math.round(results.confidence_score * 100)}%
              </div>
              <div className="text-gray-400 text-sm">Confidence</div>
            </div>
            <div className="text-center bg-gray-900/50 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(results.processing_time)}s
              </div>
              <div className="text-gray-400 text-sm">Processing Time</div>
            </div>
            <div className="text-center bg-gray-900/50 rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-400">
                {results.llm_used ? "Enhanced" : "Standard"}
              </div>
              <div className="text-gray-400 text-sm">Analysis Type</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Technology Stack */}
      {results.technology_stack && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/30 backdrop-blur-lg border border-gray-600/30 rounded-2xl p-8"
        >
          <div className="flex items-center mb-6">
            <FaLayerGroup className="w-6 h-6 text-blue-400 mr-3" />
            <h3 className="text-2xl font-bold text-white">Technology Stack</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {" "}
            {Object.entries(results.technology_stack)
              .filter(
                ([_key, value]) => value && value !== "null" && value !== null
              )
              .map(([key, value]) => {
                const displayKey = key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase());
                const displayValue = Array.isArray(value)
                  ? value.join(", ")
                  : value;

                return (
                  <div
                    key={key}
                    className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-6 border border-gray-600/20"
                  >
                    <div className="flex items-center mb-3">
                      <FaCode className="w-5 h-5 text-blue-400 mr-2" />
                      <h4 className="text-gray-300 font-medium">
                        {displayKey}
                      </h4>
                    </div>
                    <p className="text-white font-semibold text-lg">
                      {displayValue}
                    </p>
                  </div>
                );
              })}
          </div>
        </motion.div>
      )}

      {/* Dependencies Overview */}
      {results.dependency_analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/30 backdrop-blur-lg border border-gray-600/30 rounded-2xl p-8"
        >
          <div className="flex items-center mb-6">
            <FaCube className="w-6 h-6 text-green-400 mr-3" />
            <h3 className="text-2xl font-bold text-white">
              Dependencies Analysis
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {results.dependency_analysis.total_dependencies}
              </div>
              <div className="text-gray-400 text-sm">Total Dependencies</div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {results.dependency_analysis.direct_dependencies}
              </div>
              <div className="text-gray-400 text-sm">Direct</div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {results.dependency_analysis.outdated_dependencies}
              </div>
              <div className="text-gray-400 text-sm">Outdated</div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-400">
                {results.dependency_analysis.security_vulnerabilities}
              </div>
              <div className="text-gray-400 text-sm">Vulnerabilities</div>
            </div>
          </div>

          {results.dependency_analysis.dependencies &&
            results.dependency_analysis.dependencies.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">
                  Key Dependencies
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {results.dependency_analysis.dependencies
                    .slice(0, 9)
                    .map((dep, index) => (
                      <div
                        key={index}
                        className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/20"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">
                            {dep.name}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {dep.package_manager}
                          </span>
                        </div>
                        <div className="text-gray-300 text-sm mt-1">
                          {dep.version !== "unknown"
                            ? dep.version
                            : "Version not specified"}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </motion.div>
      )}

      {/* Recommendations */}
      {results.recommendations && results.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/30 backdrop-blur-lg border border-gray-600/30 rounded-2xl p-8"
        >
          <div className="flex items-center mb-6">
            <FaChartLine className="w-6 h-6 text-purple-400 mr-3" />
            <h3 className="text-2xl font-bold text-white">Recommendations</h3>
          </div>

          <div className="space-y-4">
            {results.recommendations.map((rec, index) => {
              const Icon = getTypeIcon(rec.type);
              return (
                <div
                  key={index}
                  className="bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-xl p-6 border-l-4 border-purple-500"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 text-purple-400 mr-3" />
                      <span className="text-purple-400 font-semibold capitalize">
                        {rec.type.replace("_", " ")}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                        rec.priority
                      )}`}
                    >
                      {rec.priority} priority
                    </span>
                  </div>
                  <h4 className="text-white font-semibold mb-2">
                    {rec.suggestion}
                  </h4>
                  <p className="text-gray-300">{rec.reason}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* AI Insights */}
      {results.insights && results.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/30 backdrop-blur-lg border border-gray-600/30 rounded-2xl p-8"
        >
          <div className="flex items-center mb-6">
            <FaBrain className="w-6 h-6 text-yellow-400 mr-3" />
            <h3 className="text-2xl font-bold text-white">AI Insights</h3>
          </div>

          <div className="space-y-6">
            {results.insights.map((insight, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-yellow-300 font-bold text-lg">
                    {insight.title}
                  </h4>
                  <div className="flex items-center">
                    <span className="text-yellow-400 text-sm capitalize mr-3">
                      {insight.category}
                    </span>
                    <div className="flex items-center">
                      <FaStar className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-yellow-400 text-sm">
                        {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-200 mb-3">{insight.description}</p>
                <p className="text-gray-400 text-sm italic">
                  {insight.reasoning}
                </p>
                {insight.evidence && insight.evidence.length > 0 && (
                  <div className="mt-3">
                    <span className="text-yellow-400 text-sm font-medium">
                      Evidence:{" "}
                    </span>
                    <span className="text-gray-300 text-sm">
                      {insight.evidence.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Detected Files */}
      {results.detected_files && results.detected_files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800/30 backdrop-blur-lg border border-gray-600/30 rounded-2xl p-8"
        >
          <div className="flex items-center mb-6">
            <FaFileCode className="w-6 h-6 text-indigo-400 mr-3" />
            <h3 className="text-2xl font-bold text-white">Detected Files</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {results.detected_files.map((file, index) => (
              <div
                key={index}
                className="bg-gray-700/30 rounded-lg px-3 py-2 border border-gray-600/20"
              >
                <span className="text-gray-300 font-mono text-sm">{file}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-blue-500/30 rounded-2xl p-8 text-center"
      >
        <h3 className="text-2xl font-bold text-white mb-4">Ready to Deploy?</h3>{" "}
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          Take your repository analysis to the next level with DeployIO&apos;s
          full platform. Get automated deployments, monitoring, and much more.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center">
            <FaRocket className="w-5 h-5 mr-2" />
            Deploy This Repository
            <FaArrowRight className="w-5 h-5 ml-2" />
          </button>
          <button className="px-8 py-3 bg-gray-700/50 text-white font-semibold rounded-xl hover:bg-gray-600/50 transition-all">
            Download Analysis Report
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalysisResults;
