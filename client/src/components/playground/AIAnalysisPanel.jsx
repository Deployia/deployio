import { useState } from "react";
import { motion } from "framer-motion";
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
} from "react-icons/fi";
import { FaGithub, FaBrain } from "react-icons/fa";

const AIAnalysisPanel = () => {
  const [activeTab, setActiveTab] = useState("analysis");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const tabs = [
    { id: "analysis", label: "Repository Analysis", icon: FaGithub },
    { id: "overview", label: "Overview", icon: FiCpu },
    { id: "security", label: "Security", icon: FiShield },
    { id: "performance", label: "Performance", icon: FiTrendingUp },
    { id: "quality", label: "Code Quality", icon: FiCode },
  ];

  const mockAnalysisData = {
    overview: {
      score: 85,
      language: "JavaScript/Node.js",
      framework: "Express.js",
      dependencies: 42,
      issues: 3
    },
    security: {
      vulnerabilities: 2,
      securityScore: 78,
      recommendations: [
        "Update vulnerable dependencies",
        "Add security headers",
        "Implement rate limiting"
      ]
    },
    performance: {
      score: 92,
      recommendations: [
        "Enable gzip compression",
        "Optimize database queries",
        "Add caching layer"
      ]
    },
    quality: {
      score: 88,
      coverage: 75,
      complexity: "Medium",
      maintainability: "Good"
    }
  };

  const handleAnalysis = () => {
    setIsAnalyzing(true);
    // Simulate analysis process
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "analysis":
        return (
          <div className="space-y-6">
            {/* Repository Input */}
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaGithub className="w-5 h-5 text-white" />
                <h3 className="text-lg font-semibold text-white heading">Repository Analysis</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2 body">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    value={repositoryUrl}
                    onChange={(e) => setRepositoryUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 body transition-all"
                  />
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalysis}
                  disabled={!repositoryUrl || isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed body"
                >
                  {isAnalyzing ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      Analyzing Repository...
                    </>
                  ) : (
                    <>
                      <FiPlay className="w-4 h-4" />
                      Start Analysis
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Quick Analysis Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: FiCode, label: "Code Quality", value: "88%", color: "green" },
                { icon: FiShield, label: "Security", value: "78%", color: "yellow" },
                { icon: FiTrendingUp, label: "Performance", value: "92%", color: "blue" },
                { icon: FiZap, label: "Maintainability", value: "Good", color: "purple" }
              ].map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <metric.icon className={`w-5 h-5 text-${metric.color}-400`} />
                    <div>
                      <div className="text-sm text-neutral-400 body">{metric.label}</div>
                      <div className="text-lg font-semibold text-white heading">{metric.value}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "overview":
        return (
          <div className="space-y-6">
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 heading">Project Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-300 body">Overall Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-neutral-700 rounded-full">
                      <div className="w-4/5 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-white font-semibold">{mockAnalysisData.overview.score}%</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-300 body">Language</span>
                  <span className="text-white body">{mockAnalysisData.overview.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-300 body">Framework</span>
                  <span className="text-white body">{mockAnalysisData.overview.framework}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-300 body">Dependencies</span>
                  <span className="text-white body">{mockAnalysisData.overview.dependencies}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 heading">Security Analysis</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiAlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400 body">
                    {mockAnalysisData.security.vulnerabilities} vulnerabilities found
                  </span>
                </div>
                <div className="space-y-2">
                  {mockAnalysisData.security.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-neutral-800/50 rounded">
                      <FiShield className="w-3 h-3 text-blue-400" />
                      <span className="text-sm text-neutral-300 body">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "performance":
        return (
          <div className="space-y-6">
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 heading">Performance Analysis</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiCheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400 body">
                    Score: {mockAnalysisData.performance.score}%
                  </span>
                </div>
                <div className="space-y-2">
                  {mockAnalysisData.performance.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-neutral-800/50 rounded">
                      <FiTrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-sm text-neutral-300 body">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "quality":
        return (
          <div className="space-y-6">
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 heading">Code Quality</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-white heading">{mockAnalysisData.quality.score}%</div>
                  <div className="text-sm text-neutral-400 body">Overall Score</div>
                </div>
                <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-white heading">{mockAnalysisData.quality.coverage}%</div>
                  <div className="text-sm text-neutral-400 body">Test Coverage</div>
                </div>
                <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                  <div className="text-sm font-medium text-white heading">{mockAnalysisData.quality.complexity}</div>
                  <div className="text-sm text-neutral-400 body">Complexity</div>
                </div>
                <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                  <div className="text-sm font-medium text-white heading">{mockAnalysisData.quality.maintainability}</div>
                  <div className="text-sm text-neutral-400 body">Maintainability</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Header */}
      <div className="p-6 border-b border-neutral-800/50">
        <div className="flex items-center gap-3 mb-4">
          <FaBrain className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-white heading">AI Code Analysis</h2>
            <p className="text-neutral-400 body">
              Analyze your repository with AI-powered insights
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all body ${
                  activeTab === tab.id
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
