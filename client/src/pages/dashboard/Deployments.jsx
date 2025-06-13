import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaRocket,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaEye,
  FaRedo,
  FaStop,
  FaCode,
  FaCodeBranch,
  FaCalendarAlt,
  FaUser,
  FaFilter,
  FaSearch,
} from "react-icons/fa";
import SEO from "@components/SEO";

const Deployments = () => {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [deployments] = useState([
    {
      id: 1,
      projectName: "E-commerce Platform",
      branch: "main",
      commit: "a1b2c3d",
      commitMessage: "Fix payment gateway integration",
      status: "success",
      environment: "production",
      deployedBy: "John Doe",
      startTime: "2024-01-15 14:30:00",
      duration: "3m 45s",
      url: "https://ecommerce.deployio.app",
    },
    {
      id: 2,
      projectName: "API Gateway Service",
      branch: "develop",
      commit: "e4f5g6h",
      commitMessage: "Add rate limiting middleware",
      status: "running",
      environment: "staging",
      deployedBy: "Jane Smith",
      startTime: "2024-01-15 13:45:00",
      duration: "2m 12s",
      url: "https://api-staging.deployio.app",
    },
    {
      id: 3,
      projectName: "Dashboard Analytics",
      branch: "feature/charts",
      commit: "i7j8k9l",
      commitMessage: "Implement real-time chart updates",
      status: "failed",
      environment: "production",
      deployedBy: "Mike Johnson",
      startTime: "2024-01-15 12:20:00",
      duration: "1m 33s",
      url: null,
    },
    {
      id: 4,
      projectName: "Mobile App Backend",
      branch: "main",
      commit: "m1n2o3p",
      commitMessage: "Update user authentication flow",
      status: "success",
      environment: "development",
      deployedBy: "Sarah Wilson",
      startTime: "2024-01-15 10:15:00",
      duration: "4m 21s",
      url: "https://mobile-dev.deployio.app",
    },
    {
      id: 5,
      projectName: "E-commerce Platform",
      branch: "hotfix/security",
      commit: "q4r5s6t",
      commitMessage: "Security patch for XSS vulnerability",
      status: "pending",
      environment: "production",
      deployedBy: "Admin",
      startTime: "2024-01-15 09:30:00",
      duration: "-",
      url: null,
    },
  ]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <FaCheckCircle className="w-4 h-4 text-green-500" />;
      case "running":
        return <FaClock className="w-4 h-4 text-blue-500 animate-spin" />;
      case "failed":
        return <FaExclamationTriangle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <FaClock className="w-4 h-4 text-yellow-500" />;
      default:
        return <FaClock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "success":
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`;
      case "running":
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
      case "failed":
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`;
      case "pending":
        return `${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    }
  };

  const getEnvironmentBadge = (environment) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (environment) {
      case "production":
        return `${baseClasses} bg-red-500/20 text-red-400`;
      case "staging":
        return `${baseClasses} bg-yellow-500/20 text-yellow-400`;
      case "development":
        return `${baseClasses} bg-blue-500/20 text-blue-400`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400`;
    }
  };

  const filteredDeployments = deployments.filter((deployment) => {
    const matchesFilter = filter === "all" || deployment.status === filter;
    const matchesSearch =
      deployment.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deployment.commitMessage.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      {" "}
      <SEO page="deployments" />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white heading mb-2">
          Deployments
        </h1>
        <p className="text-gray-400 body">
          Track and manage all your deployment activities.
        </p>
      </motion.div>
      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        {/* Search */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search deployments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-500/50 focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400 w-4 h-4" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </motion.div>
      {/* Deployments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {filteredDeployments.map((deployment, index) => (
          <motion.div
            key={deployment.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 hover:border-neutral-700/50 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {getStatusIcon(deployment.status)}
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {deployment.projectName}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    {" "}
                    <div className="flex items-center gap-1">
                      <FaCodeBranch className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-400 text-sm">
                        {deployment.branch}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCode className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-400 text-sm font-mono">
                        {deployment.commit}
                      </span>
                    </div>
                    <span
                      className={getEnvironmentBadge(deployment.environment)}
                    >
                      {deployment.environment}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={getStatusBadge(deployment.status)}>
                  {deployment.status}
                </span>
              </div>
            </div>

            <p className="text-gray-300 mb-4">{deployment.commitMessage}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <FaUser className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400 text-sm">
                  by {deployment.deployedBy}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="w-4 h-4 text-purple-400" />
                <span className="text-gray-400 text-sm">
                  {deployment.startTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="w-4 h-4 text-orange-400" />
                <span className="text-gray-400 text-sm">
                  {deployment.duration}
                </span>
              </div>
            </div>

            {deployment.url && (
              <div className="mb-4 p-3 bg-neutral-800/50 rounded-lg">
                <a
                  href={deployment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm font-mono"
                >
                  {deployment.url}
                </a>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-sm">
                <FaEye className="w-3 h-3" />
                View Logs
              </button>

              {deployment.status === "success" && (
                <button className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-sm">
                  <FaRedo className="w-3 h-3" />
                  Redeploy
                </button>
              )}

              {deployment.status === "running" && (
                <button className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors text-sm">
                  <FaStop className="w-3 h-3" />
                  Cancel
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
      {/* Empty State */}
      {filteredDeployments.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaRocket className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">
            No deployments found
          </h3>
          <p className="text-gray-400 mb-6">
            {searchTerm || filter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Start by deploying your first project."}
          </p>
        </motion.div>
      )}
    </>
  );
};

export default Deployments;
