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
  FaExclamationTriangle,
  FaDownload,
  FaCog,
} from "react-icons/fa";

const AnalysisResults = ({ results }) => {
  // Debug: Log the results structure
  console.log("AnalysisResults received:", results);

  if (!results) {
    return <div className="text-white">No results to display</div>;
  }

  // Handle potential nested data structure
  const data = results.data || results;
  const getConfidenceColor = (confidence) => {
    if (confidence == null) return "text-gray-400";
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
    <div className="space-y-2">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-lg border border-gray-600/30 rounded-xl p-3"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <FaGithub className="w-4 h-4 text-blue-400 mr-2" />
              <div>
                <h2 className="text-base font-bold text-white">
                  Analysis Complete
                </h2>
                <p className="text-gray-400 text-xs">
                  AI-powered repository insights
                </p>
              </div>
            </div>
            <p className="text-gray-300 font-mono text-xs bg-gray-900/50 px-2 py-1 rounded truncate">
              {data.repository_url}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="text-center bg-gray-900/50 rounded-lg p-2 min-w-0 flex-1 sm:flex-none">
              <div
                className={`text-base sm:text-lg font-bold ${getConfidenceColor(
                  data.confidence_score
                )}`}
              >
                {data.confidence_score != null
                  ? `${Math.round(data.confidence_score * 100)}%`
                  : "N/A"}
              </div>
              <div className="text-gray-400 text-xs">Confidence</div>
            </div>
            <div className="text-center bg-gray-900/50 rounded-lg p-2 min-w-0 flex-1 sm:flex-none">
              <div className="text-base sm:text-lg font-bold text-blue-400">
                {data.processing_time != null
                  ? `${Math.round(data.processing_time)}s`
                  : "N/A"}
              </div>
              <div className="text-gray-400 text-xs">Processing Time</div>
            </div>
            <div className="text-center bg-gray-900/50 rounded-lg p-2 min-w-0 flex-1 sm:flex-none">
              <div className="text-base sm:text-lg font-bold text-purple-400">
                {data.llm_used ? "Enhanced" : "Standard"}
              </div>
              <div className="text-gray-400 text-xs">Analysis Type</div>
            </div>
          </div>
        </div>
      </motion.div>{" "}
      {/* Technology Stack */}
      {data.technology_stack && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/30 backdrop-blur-lg border border-gray-600/30 rounded-xl p-3"
        >
          <div className="flex items-center mb-3">
            <FaLayerGroup className="w-4 h-4 text-blue-400 mr-2" />
            <h3 className="text-base font-bold text-white">Technology Stack</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(data.technology_stack)
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
                    className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-lg p-3 border border-gray-600/20"
                  >
                    <div className="flex items-center mb-2">
                      <FaCode className="w-4 h-4 text-blue-400 mr-2" />
                      <h4 className="text-gray-300 font-medium text-sm">
                        {displayKey}
                      </h4>
                    </div>
                    <p className="text-white font-semibold text-sm">
                      {displayValue}
                    </p>
                  </div>
                );
              })}
          </div>
        </motion.div>
      )}{" "}
      {/* Dependencies Overview */}
      {data.dependency_analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/30 backdrop-blur-lg border border-gray-600/30 rounded-xl p-3"
        >
          <div className="flex items-center mb-3">
            <FaCube className="w-4 h-4 text-green-400 mr-2" />
            <h3 className="text-base font-bold text-white">
              Dependencies Analysis
            </h3>
          </div>

          {/* Health Score Banner */}
          {data.dependency_analysis.health_score && (
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaCheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <div>
                    <h4 className="text-white font-semibold text-sm">
                      Dependency Health Score
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Overall project health assessment
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-400">
                    {Math.round(data.dependency_analysis.health_score * 100)}%
                  </div>
                  <div className="text-sm text-gray-400">Excellent</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-400">
                {data.dependency_analysis.total_dependencies || 0}
              </div>
              <div className="text-gray-400 text-xs sm:text-sm">Total</div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-400">
                {data.dependency_analysis.production_dependencies || 0}
              </div>
              <div className="text-gray-400 text-xs sm:text-sm">Production</div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-400">
                {data.dependency_analysis.development_dependencies || 0}
              </div>
              <div className="text-gray-400 text-xs sm:text-sm">
                Development
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-red-400">
                {data.dependency_analysis.vulnerable_count || 0}
              </div>
              <div className="text-gray-400 text-xs sm:text-sm">
                Vulnerabilities
              </div>
            </div>
          </div>

          {/* Security Overview */}
          {(data.dependency_analysis.critical_vulnerabilities ||
            data.dependency_analysis.high_vulnerabilities ||
            data.dependency_analysis.medium_vulnerabilities ||
            data.dependency_analysis.low_vulnerabilities) && (
            <div className="bg-gray-900/50 rounded-xl p-4 mb-6">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                <FaShieldAlt className="w-5 h-5 text-red-400 mr-2" />
                Security Analysis
              </h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-500">
                    {data.dependency_analysis.critical_vulnerabilities || 0}
                  </div>
                  <div className="text-xs text-gray-400">Critical</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-500">
                    {data.dependency_analysis.high_vulnerabilities || 0}
                  </div>
                  <div className="text-xs text-gray-400">High</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-500">
                    {data.dependency_analysis.medium_vulnerabilities || 0}
                  </div>
                  <div className="text-xs text-gray-400">Medium</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-500">
                    {data.dependency_analysis.low_vulnerabilities || 0}
                  </div>
                  <div className="text-xs text-gray-400">Low</div>
                </div>
              </div>
            </div>
          )}

          {/* Dependencies List */}
          {data.dependency_analysis.dependencies &&
            data.dependency_analysis.dependencies.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                  <span>
                    Dependencies ({data.dependency_analysis.dependencies.length}
                    )
                  </span>
                  <span className="text-sm text-gray-400">
                    Latest versions checked
                  </span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.dependency_analysis.dependencies
                    .slice(0, 12)
                    .map((dep, index) => (
                      <div
                        key={index}
                        className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/20 hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium text-sm truncate">
                            {dep.name}
                          </span>
                          <div className="flex items-center space-x-1">
                            {dep.type === "production" ? (
                              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">
                                Prod
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                                Dev
                              </span>
                            )}
                            {dep.is_vulnerable && (
                              <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded">
                                ⚠️
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-gray-300 text-sm">
                          v{dep.version || "unknown"}
                        </div>
                        {dep.manager && (
                          <div className="text-gray-500 text-xs mt-1">
                            via {dep.manager}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
                {data.dependency_analysis.dependencies.length > 12 && (
                  <div className="text-center mt-4">
                    <span className="text-gray-400 text-sm">
                      +{data.dependency_analysis.dependencies.length - 12} more
                      dependencies...
                    </span>
                  </div>
                )}
              </div>
            )}

          {/* Recommendations */}
          {data.dependency_analysis.security_recommendations &&
            data.dependency_analysis.security_recommendations.length > 0 && (
              <div className="mt-6 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <h5 className="text-sm font-medium text-blue-300 mb-2 flex items-center">
                  <FaLightbulb className="w-4 h-4 mr-2" />
                  Security Recommendations
                </h5>
                <div className="space-y-1">
                  {data.dependency_analysis.security_recommendations.map(
                    (rec, i) => (
                      <div
                        key={i}
                        className="text-sm text-gray-300 flex items-start"
                      >
                        <span className="text-blue-400 mr-2">•</span>
                        {rec}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {data.dependency_analysis.optimization_suggestions &&
            data.dependency_analysis.optimization_suggestions.length > 0 && (
              <div className="mt-4 bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                <h5 className="text-sm font-medium text-green-300 mb-2 flex items-center">
                  <FaChartLine className="w-4 h-4 mr-2" />
                  Optimization Suggestions
                </h5>
                <div className="space-y-1">
                  {data.dependency_analysis.optimization_suggestions.map(
                    (sug, i) => (
                      <div
                        key={i}
                        className="text-sm text-gray-300 flex items-start"
                      >
                        <span className="text-green-400 mr-2">•</span>
                        {sug}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </motion.div>
      )}{" "}
      {/* Recommendations */}
      {data.recommendations &&
        data.recommendations.length > 0 &&
        data.recommendations.some(
          (rec) => rec.suggestion && rec.suggestion.trim()
        ) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/30 backdrop-blur-lg border border-gray-600/30 rounded-xl p-3"
          >
            <div className="flex items-center mb-3">
              <FaChartLine className="w-4 h-4 text-purple-400 mr-2" />
              <h3 className="text-base font-bold text-white">
                Recommendations
              </h3>
            </div>
            <div className="space-y-2">
              {data.recommendations
                .filter((rec) => rec.suggestion && rec.suggestion.trim())
                .slice(0, 2)
                .map((rec, index) => {
                  const Icon = getTypeIcon(rec.type);
                  return (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-lg p-3 border-l-2 border-purple-500"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center">
                          <Icon className="w-3 h-3 text-purple-400 mr-1" />
                          <span className="text-purple-400 font-medium text-xs capitalize">
                            {rec.type ? rec.type.replace("_", " ") : "general"}
                          </span>
                        </div>
                        {rec.priority && (
                          <span
                            className={`px-1 py-0.5 rounded text-xs ${getPriorityColor(
                              rec.priority
                            )}`}
                          >
                            {rec.priority}
                          </span>
                        )}
                      </div>
                      <h4 className="text-white font-medium text-xs mb-1 truncate">
                        {rec.suggestion}
                      </h4>
                      {rec.reason && (
                        <p className="text-gray-300 text-xs truncate">
                          {rec.reason}
                        </p>
                      )}
                    </div>
                  );
                })}
              {data.recommendations.filter(
                (rec) => rec.suggestion && rec.suggestion.trim()
              ).length > 2 && (
                <div className="text-xs text-gray-500 text-center py-0.5">
                  +
                  {data.recommendations.filter(
                    (rec) => rec.suggestion && rec.suggestion.trim()
                  ).length - 2}{" "}
                  more recommendations
                </div>
              )}
            </div>
          </motion.div>
        )}
      {/* AI Insights */}
      {data.insights && data.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/30 backdrop-blur-lg border border-gray-600/30 rounded-xl p-3"
        >
          <div className="flex items-center mb-3">
            <FaBrain className="w-4 h-4 text-purple-400 mr-2" />
            <h3 className="text-base font-bold text-white">AI Insights</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {data.insights.map((insight, index) => {
              const getInsightIcon = (category) => {
                switch (category) {
                  case "technology":
                    return FaCode;
                  case "framework":
                    return FaLayerGroup;
                  case "security":
                    return FaShieldAlt;
                  case "dependencies":
                    return FaCube;
                  case "build":
                    return FaTools;
                  case "code_quality":
                    return FaCheckCircle;
                  case "complexity":
                    return FaChartLine;
                  case "design_patterns":
                    return FaBrain;
                  case "health":
                    return FaCheckCircle;
                  case "project_health":
                    return FaStar;
                  case "code_structure":
                    return FaFileCode;
                  default:
                    return FaLightbulb;
                }
              };

              const getInsightColor = (impact) => {
                switch (impact) {
                  case "high":
                    return "red";
                  case "medium":
                    return "yellow";
                  case "low":
                    return "green";
                  default:
                    return "blue";
                }
              };

              const color = getInsightColor(insight.impact);
              const Icon = getInsightIcon(insight.category);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`bg-${color}-500/5 border border-${color}-500/20 rounded-lg p-3 hover:bg-${color}-500/10 transition-all duration-300`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <div
                        className={`w-6 h-6 bg-${color}-500/20 rounded flex items-center justify-center mr-2`}
                      >
                        <Icon className={`w-3 h-3 text-${color}-400`} />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-sm truncate">
                          {insight.title}
                        </h4>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <span
                            className={`text-xs px-1 py-0.5 bg-${color}-500/20 text-${color}-300 rounded capitalize`}
                          >
                            {insight.category.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                    {insight.confidence && (
                      <div className={`text-${color}-400 font-bold text-xs`}>
                        {Math.round(insight.confidence * 100)}%
                      </div>
                    )}
                  </div>

                  <p className="text-gray-300 text-xs mb-2 line-clamp-2">
                    {insight.description}
                  </p>

                  {insight.evidence && insight.evidence.length > 0 && (
                    <div className="space-y-1">
                      <div className="space-y-0.5">
                        {insight.evidence.slice(0, 1).map((evidence, i) => (
                          <div
                            key={i}
                            className="text-xs text-gray-400 flex items-start"
                          >
                            <span className="text-gray-500 mr-1">•</span>
                            <span className="font-mono truncate">
                              {evidence}
                            </span>
                          </div>
                        ))}
                        {insight.evidence.length > 1 && (
                          <div className="text-xs text-gray-500">
                            +{insight.evidence.length - 1} more...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}{" "}
      {/* Detected Files */}
      {data.detected_files && data.detected_files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800/30 backdrop-blur-lg border border-gray-600/30 rounded-xl p-3"
        >
          <div className="flex items-center mb-3">
            <FaFileCode className="w-4 h-4 text-indigo-400 mr-2" />
            <h3 className="text-base font-bold text-white">Detected Files</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
            {data.detected_files.map((file, index) => (
              <div
                key={index}
                className="bg-gray-700/30 rounded p-1 border border-gray-600/20"
              >
                <span className="text-gray-300 font-mono text-xs">{file}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Code Analysis */}
      {data.code_analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gray-800/30 backdrop-blur-lg border border-gray-600/30 rounded-xl p-3"
        >
          <div className="flex items-center mb-3">
            <FaCode className="w-4 h-4 text-purple-400 mr-2" />
            <h3 className="text-base font-bold text-white">Code Analysis</h3>
          </div>

          {/* Quality Score and Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div className="bg-gray-700/50 rounded-lg p-2 text-center">
              <div className="text-base font-bold text-purple-400">
                {data.code_analysis.quality_score
                  ? Math.round(data.code_analysis.quality_score * 100) + "%"
                  : "N/A"}
              </div>
              <div className="text-gray-400 text-xs">Quality</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-2 text-center">
              <div className="text-base font-bold text-blue-400">
                {data.code_analysis.total_files || 0}
              </div>
              <div className="text-gray-400 text-xs">Files</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-2 text-center">
              <div className="text-base font-bold text-green-400">
                {data.code_analysis.total_lines || 0}
              </div>
              <div className="text-gray-400 text-xs">Lines</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-2 text-center">
              <div className="text-base font-bold text-yellow-400">
                {data.code_analysis.complexity_score
                  ? Math.round(data.code_analysis.complexity_score * 100) / 10
                  : "N/A"}
              </div>
              <div className="text-gray-400 text-xs">Complexity</div>
            </div>
          </div>

          {/* Code Smells */}
          {data.code_analysis.code_smells?.length > 0 && (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-2 mb-3">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-medium text-orange-300 flex items-center">
                  <FaExclamationTriangle className="w-3 h-3 mr-1" />
                  Issues ({data.code_analysis.code_smells.length})
                </h5>
                <div className="flex gap-1 text-xs">
                  {(() => {
                    const severityCounts =
                      data.code_analysis.code_smells.reduce((acc, smell) => {
                        const severity = smell.severity || "medium";
                        acc[severity] = (acc[severity] || 0) + 1;
                        return acc;
                      }, {});
                    return Object.entries(severityCounts)
                      .slice(0, 2)
                      .map(([severity, count]) => (
                        <span
                          key={severity}
                          className={`px-1 py-0.5 rounded text-xs ${
                            severity === "high"
                              ? "bg-red-500/20 text-red-300"
                              : severity === "medium"
                              ? "bg-orange-500/20 text-orange-300"
                              : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {count}
                        </span>
                      ));
                  })()}
                </div>
              </div>

              <div className="space-y-1">
                {data.code_analysis.code_smells.slice(0, 2).map((smell, i) => (
                  <div key={i} className="bg-gray-800/30 rounded p-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 truncate flex-1">
                        {smell.type || "Issue"}{" "}
                        {smell.file && `in ${smell.file.split("/").pop()}`}
                      </span>
                      {smell.count && smell.count > 1 && (
                        <span className="text-orange-400 ml-1">
                          ({smell.count})
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {data.code_analysis.code_smells.length > 2 && (
                  <div className="text-xs text-gray-500 text-center py-0.5">
                    +{data.code_analysis.code_smells.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
      {/* Build Configuration */}
      {data.build_configuration && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gray-800/30 backdrop-blur-lg border border-gray-600/30 rounded-xl p-3"
        >
          <div className="flex items-center mb-3">
            <FaTools className="w-4 h-4 text-orange-400 mr-2" />
            <h3 className="text-base font-bold text-white">
              Build Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Build Commands */}
            {data.build_configuration.build_commands &&
              Object.keys(data.build_configuration.build_commands).length >
                0 && (
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-gray-300 mb-2 flex items-center">
                    <FaCode className="w-3 h-3 mr-1 text-orange-400" />
                    Build Commands
                  </h4>
                  <div className="space-y-1">
                    {Object.entries(
                      data.build_configuration.build_commands
                    ).map(([key, command]) => (
                      <div
                        key={key}
                        className="bg-gray-900/50 px-2 py-1 rounded"
                      >
                        <div className="text-xs text-gray-400 uppercase">
                          {key}
                        </div>
                        <code className="text-xs text-gray-300 font-mono">
                          {command}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Install Commands */}
            {data.build_configuration.install_commands &&
              Object.keys(data.build_configuration.install_commands).length >
                0 && (
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-gray-300 mb-2 flex items-center">
                    <FaDownload className="w-3 h-3 mr-1 text-green-400" />
                    Install Commands
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(
                      data.build_configuration.install_commands
                    ).map(([key, command]) => (
                      <div
                        key={key}
                        className="bg-gray-900/50 px-3 py-2 rounded"
                      >
                        <div className="text-xs text-gray-400 uppercase">
                          {key}
                        </div>
                        <code className="text-xs text-gray-300 font-mono">
                          {command}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Start Commands */}
            {data.build_configuration.start_commands &&
              Object.keys(data.build_configuration.start_commands).length >
                0 && (
                <div className="bg-gray-700/30 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                    <FaRocket className="w-4 h-4 mr-2 text-blue-400" />
                    Start Commands
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(
                      data.build_configuration.start_commands
                    ).map(([key, command]) => (
                      <div
                        key={key}
                        className="bg-gray-900/50 px-3 py-2 rounded"
                      >
                        <div className="text-xs text-gray-400 uppercase">
                          {key}
                        </div>
                        <code className="text-xs text-gray-300 font-mono">
                          {command}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Test Commands */}
            {data.build_configuration.test_commands &&
              Object.keys(data.build_configuration.test_commands).length >
                0 && (
                <div className="bg-gray-700/30 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                    <FaCheckCircle className="w-4 h-4 mr-2 text-purple-400" />
                    Test Commands
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(data.build_configuration.test_commands).map(
                      ([key, command]) => (
                        <div
                          key={key}
                          className="bg-gray-900/50 px-3 py-2 rounded"
                        >
                          <div className="text-xs text-gray-400 uppercase">
                            {key}
                          </div>
                          <code className="text-xs text-gray-300 font-mono">
                            {command}
                          </code>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Additional Build Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entry Points */}
            {data.build_configuration.main_entry_points &&
              data.build_configuration.main_entry_points.length > 0 && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-blue-300 mb-3 flex items-center">
                    <FaFileCode className="w-4 h-4 mr-2" />
                    Entry Points
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {data.build_configuration.main_entry_points.map(
                      (entry, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded font-mono"
                        >
                          {entry}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Config Files */}
            {data.build_configuration.config_files &&
              data.build_configuration.config_files.length > 0 && (
                <div className="bg-gray-500/5 border border-gray-500/20 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                    <FaCog className="w-4 h-4 mr-2" />
                    Configuration Files
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {data.build_configuration.config_files.map((file, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-gray-500/20 text-gray-300 rounded font-mono"
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Environment Variables */}
          {data.build_configuration.environment_variables &&
            Object.keys(data.build_configuration.environment_variables).length >
              0 && (
              <div className="mt-4 bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                <h4 className="text-sm font-medium text-green-300 mb-3 flex items-center">
                  <FaServer className="w-4 h-4 mr-2" />
                  Environment Variables
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(
                    data.build_configuration.environment_variables
                  ).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded"
                    >
                      <span className="text-xs font-mono text-gray-300">
                        {key}
                      </span>
                      <span className="text-xs font-mono text-green-300">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Exposed Ports */}
          {data.build_configuration.exposed_ports &&
            data.build_configuration.exposed_ports.length > 0 && (
              <div className="mt-4 bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                <h4 className="text-sm font-medium text-purple-300 mb-3 flex items-center">
                  <FaServer className="w-4 h-4 mr-2" />
                  Exposed Ports
                </h4>
                <div className="flex flex-wrap gap-1">
                  {data.build_configuration.exposed_ports.map((port, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded font-mono"
                    >
                      {port}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </motion.div>
      )}
      {/* Deployment Configuration */}
      {data.deployment_configuration && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/30 backdrop-blur-lg border border-gray-600/30 rounded-xl p-3"
        >
          <div className="flex items-center mb-3">
            <FaServer className="w-4 h-4 text-indigo-400 mr-2" />
            <h3 className="text-base font-bold text-white">
              Deployment Configuration
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div className="bg-gray-700/50 rounded-lg p-2 text-center">
              <div className="text-sm font-bold text-indigo-400">
                {data.deployment_configuration.service_name || "N/A"}
              </div>
              <div className="text-gray-400 text-xs sm:text-sm">
                Service Name
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-400">
                {data.deployment_configuration.service_type || "N/A"}
              </div>
              <div className="text-gray-400 text-xs sm:text-sm">
                Service Type
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-green-400">
                {data.deployment_configuration.min_instances || 0}
              </div>
              <div className="text-gray-400 text-xs sm:text-sm">
                Min Instances
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-yellow-400">
                {data.deployment_configuration.max_instances || 0}
              </div>
              <div className="text-gray-400 text-xs sm:text-sm">
                Max Instances
              </div>
            </div>
          </div>

          {/* Resource Requirements */}
          {(data.deployment_configuration.cpu_requirements ||
            data.deployment_configuration.memory_requirements) && (
            <div className="bg-gray-900/50 rounded-xl p-4 mb-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                <FaChartLine className="w-5 h-5 text-indigo-400 mr-2" />
                Resource Requirements
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {data.deployment_configuration.cpu_requirements && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-indigo-400">
                      {data.deployment_configuration.cpu_requirements}
                    </div>
                    <div className="text-sm text-gray-400">CPU</div>
                  </div>
                )}
                {data.deployment_configuration.memory_requirements && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-indigo-400">
                      {data.deployment_configuration.memory_requirements}
                    </div>
                    <div className="text-sm text-gray-400">Memory</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Health Checks */}
          {(data.deployment_configuration.health_check_path ||
            data.deployment_configuration.readiness_probe_path) && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
              <h4 className="text-sm font-medium text-green-300 mb-3 flex items-center">
                <FaCheckCircle className="w-4 h-4 mr-2" />
                Health Checks
              </h4>
              <div className="space-y-2">
                {data.deployment_configuration.health_check_path && (
                  <div className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded">
                    <span className="text-xs text-gray-300">Health Check</span>
                    <code className="text-xs font-mono text-green-300">
                      {data.deployment_configuration.health_check_path}
                    </code>
                  </div>
                )}
                {data.deployment_configuration.readiness_probe_path && (
                  <div className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded">
                    <span className="text-xs text-gray-300">
                      Readiness Probe
                    </span>
                    <code className="text-xs font-mono text-green-300">
                      {data.deployment_configuration.readiness_probe_path}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
      
    </div>
  );
};

export default AnalysisResults;
