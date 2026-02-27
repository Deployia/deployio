import {
  createDeployment,
  fetchProjectById,
  fetchProjectDeployments,
  restartDeployment,
  stopDeployment,
} from "@redux/index";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  FaClock,
  FaCode,
  FaDownload,
  FaExternalLinkAlt,
  FaHistory,
  FaPlay,
  FaPlus,
  FaRocket,
  FaStop,
  FaSync,
  FaTerminal,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

const ProjectDeployments = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const { projectDeployments, loading, error } = useSelector(
    (state) => state.deployments,
  );
  const { currentProject } = useSelector((state) => state.projects);

  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectDeployments(id));
      if (!currentProject || currentProject._id !== id) {
        dispatch(fetchProjectById(id));
      }
    }
  }, [id, dispatch]);

  // Auto-refresh when deployments are in active states (pending, queued, building, deploying)
  const pollRef = useRef(null);
  useEffect(() => {
    const activeStates = ["pending", "queued", "building", "deploying"];
    const hasActive =
      Array.isArray(projectDeployments) &&
      projectDeployments.some((d) => activeStates.includes(d.status));

    if (hasActive && id) {
      pollRef.current = setInterval(() => {
        dispatch(fetchProjectDeployments(id));
      }, 5000);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [projectDeployments, id, dispatch]);
  const filteredDeployments = Array.isArray(projectDeployments)
    ? projectDeployments.filter((deployment) => {
        if (filter === "all") return true;
        return deployment.status === filter;
      })
    : [];

  const handleCreateDeployment = () => {
    if (!currentProject) {
      console.warn("Project not loaded yet, retrying fetch...");
      dispatch(fetchProjectById(id));
      return;
    }
    const deploymentData = {
      environment: "production",
      branch: currentProject.repository?.branch || "main",
      commit: {
        hash: "pipeline",
        message: "Pipeline deployment",
      },
    };
    dispatch(createDeployment({ projectId: id, deploymentData }));
  };

  const handleStopDeployment = (deploymentId) => {
    dispatch(stopDeployment(deploymentId));
  };

  const handleRestartDeployment = (deploymentId) => {
    dispatch(restartDeployment(deploymentId));
  };

  const handleViewLogs = (deployment) => {
    setSelectedDeployment(deployment);
    setShowLogs(true);
  };

  // Keep selectedDeployment in sync with polled data
  useEffect(() => {
    if (selectedDeployment && Array.isArray(projectDeployments)) {
      const updated = projectDeployments.find(
        (d) => d._id === selectedDeployment._id,
      );
      if (updated && updated.status !== selectedDeployment.status) {
        setSelectedDeployment(updated);
      }
    }
  }, [projectDeployments, selectedDeployment]);

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "success":
      case "running":
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`;
      case "failed":
      case "error":
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`;
      case "pending":
      case "queued":
        return `${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
      case "building":
      case "deploying":
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse`;
      case "stopped":
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
      default:
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
      case "running":
        return <FaPlay className="w-3 h-3 text-green-400" />;
      case "failed":
      case "error":
        return <FaStop className="w-3 h-3 text-red-400" />;
      case "pending":
      case "building":
        return <FaSync className="w-3 h-3 text-yellow-400 animate-spin" />;
      case "stopped":
        return <FaStop className="w-3 h-3 text-gray-400" />;
      default:
        return <FaClock className="w-3 h-3 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Deployments
          </h2>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Manage your project deployments
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none text-sm"
          >
            <option value="all">All Deployments</option>
            <option value="success">Successful</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateDeployment}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm"
          >
            <FaPlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Deployment</span>
            <span className="sm:hidden">New</span>
          </motion.button>
        </div>
      </div>

      {/* Deployments List */}
      <div className="space-y-4">
        {loading.fetchProject ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredDeployments.length > 0 ? (
          filteredDeployments.map((deployment, index) => (
            <motion.div
              key={deployment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6 hover:border-neutral-700/50 transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                    <FaRocket className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <h3 className="text-white font-semibold text-sm sm:text-base">
                        {/* {deployment.environment || "production"} */}
                      </h3>
                      <span className={getStatusBadge(deployment.status)}>
                        {getStatusIcon(deployment.status)}
                        <span className="ml-1">{deployment.status}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <FaCode className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {deployment.branch || "main"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaUser className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {deployment.deployedBy?.email || "System"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaClock className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {new Date(deployment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {deployment.buildDuration && (
                        <div className="flex items-center gap-1">
                          <FaHistory className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {Math.round(deployment.buildDuration / 1000)}s
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-2">
                  <button
                    onClick={() => handleViewLogs(deployment)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-xs sm:text-sm"
                  >
                    <FaTerminal className="w-3 h-3" />
                    <span className="hidden sm:inline">Logs</span>
                  </button>

                  {deployment.url && (
                    <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-xs sm:text-sm">
                      <FaExternalLinkAlt className="w-3 h-3" />
                      <span className="hidden sm:inline">Visit</span>
                    </button>
                  )}

                  {deployment.status === "running" && (
                    <button
                      onClick={() => handleStopDeployment(deployment.id)}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors text-xs sm:text-sm"
                    >
                      <FaStop className="w-3 h-3" />
                      <span className="hidden sm:inline">Stop</span>
                    </button>
                  )}

                  {deployment.status === "stopped" && (
                    <button
                      onClick={() => handleRestartDeployment(deployment.id)}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-xs sm:text-sm"
                    >
                      <FaPlay className="w-3 h-3" />
                      <span className="hidden sm:inline">Restart</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Deployment Details */}
              {deployment.commit && (
                <div className="mt-3 sm:mt-4 p-3 bg-neutral-800/50 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <FaCode className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-400">Commit:</span>
                      <span className="text-white font-mono">
                        {deployment.commit.hash?.slice(0, 8) || "N/A"}
                      </span>
                    </div>
                    <span className="text-gray-300 truncate sm:ml-2">
                      {deployment.commit.message || "No commit message"}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 sm:py-16">
            <FaRocket className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50 text-gray-400" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">
              No Deployments Yet
            </h3>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
              {filter === "all"
                ? "Deploy your project to get started"
                : `No deployments with status "${filter}"`}
            </p>
            {filter === "all" && (
              <button
                onClick={handleCreateDeployment}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                <FaPlus className="w-4 h-4 mr-2 inline" />
                Create First Deployment
              </button>
            )}
          </div>
        )}
      </div>

      {/* Logs Modal */}
      {showLogs && selectedDeployment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-4xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden"
          >
            <div className="p-4 sm:p-6 border-b border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    Deployment Logs
                  </h3>
                  <p className="text-gray-400 mt-1 text-sm sm:text-base">
                    {/* {selectedDeployment.environment} -{" "} */}
                    {new Date(selectedDeployment.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowLogs(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] sm:max-h-[60vh]">
              <div className="bg-black/50 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm space-y-1">
                {selectedDeployment.buildLogs &&
                selectedDeployment.buildLogs.length > 0 ? (
                  selectedDeployment.buildLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.level === "error"
                          ? "text-red-400"
                          : log.level === "warning"
                            ? "text-yellow-400"
                            : "text-gray-300"
                      }
                    >
                      <span className="text-gray-600 mr-2 text-xs">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      {log.message}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="text-gray-500">
                      No build logs available yet.
                    </div>
                    {["pending", "queued", "building", "deploying"].includes(
                      selectedDeployment.status,
                    ) && (
                      <div className="text-yellow-400 animate-pulse mt-2">
                        ⏳ Deployment in progress — logs will appear shortly...
                      </div>
                    )}
                    {selectedDeployment.status === "running" && (
                      <div className="text-green-400 mt-2">
                        ✓ Deployment completed successfully!
                      </div>
                    )}
                    {selectedDeployment.status === "failed" && (
                      <div className="text-red-400 mt-2">
                        ✗ Deployment failed
                        {selectedDeployment.error?.message &&
                          `: ${selectedDeployment.error.message}`}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-sm">
                <FaDownload className="w-4 h-4" />
                Download Logs
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-400 hover:bg-gray-500/30 transition-colors text-sm">
                <FaSync className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Error Message */}
      {error.deployments && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-center"
        >
          {error.deployments}
        </motion.div>
      )}
    </div>
  );
};

export default ProjectDeployments;
