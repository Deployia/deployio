import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import SEO from "@components/SEO";
import { LoadingGrid } from "@components/LoadingSpinner";
import { useModal } from "@context/ModalContext.jsx";
import {
  fetchDeployments,
  stopDeployment,
  restartDeployment,
  cancelDeployment,
  fetchDeploymentLogs,
  clearDeploymentError,
  clearDeploymentSuccess,
} from "@redux/index";

const Deployments = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();

  // Redux state
  const { deployments, loading, error, success, logs } = useSelector(
    (state) => state.deployments
  );
  // Local state
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  // Fetch deployments on component mount
  useEffect(() => {
    // Only fetch if we don't have deployments or if the list is empty
    if (!deployments || deployments.length === 0) {
      dispatch(fetchDeployments());
    }
  }, [dispatch, deployments]);

  // Clear success/error messages after some time
  useEffect(() => {
    if (success.deploy) {
      setTimeout(
        () => dispatch(clearDeploymentSuccess({ field: "deploy" })),
        3000
      );
    }
    if (success.stop) {
      setTimeout(
        () => dispatch(clearDeploymentSuccess({ field: "stop" })),
        3000
      );
    }
    if (success.delete) {
      setTimeout(
        () => dispatch(clearDeploymentSuccess({ field: "delete" })),
        3000
      );
    }
    if (error.deployments) {
      setTimeout(
        () => dispatch(clearDeploymentError({ field: "deployments" })),
        5000
      );
    }
  }, [success, error, dispatch]);
  // Filter and search deployments
  const filteredDeployments = Array.isArray(deployments)
    ? deployments.filter((deployment) => {
        const matchesFilter =
          filter === "all" ||
          deployment.status === filter ||
          deployment.deployment?.status === filter;
        const matchesSearch =
          searchTerm === "" ||
          deployment.project?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          deployment.commit?.message
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          deployment.deployment?.commit?.message
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
      })
    : []; // Handle deployment actions
  const handleStop = (deploymentId) => {
    dispatch(stopDeployment(deploymentId));
  };

  const handleRestart = (deploymentId) => {
    dispatch(restartDeployment(deploymentId));
  };

  const handleViewLogs = (deployment) => {
    dispatch(fetchDeploymentLogs({ deploymentId: deployment._id }));

    const logsContent = (
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">
            Deployment Logs - {deployment.project?.name}
          </h3>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-black/50 rounded-lg p-4 max-h-96 overflow-y-auto">
          {loading.logs ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-400">Loading logs...</span>
            </div>
          ) : logs && logs.length > 0 ? (
            <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-500">{log.timestamp}</span>{" "}
                  {log.message}
                </div>
              ))}
            </pre>
          ) : (
            <p className="text-gray-400 text-center py-4">No logs available</p>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );

    openModal(logsContent);
  };

  const handleDeleteConfirm = (deployment) => {
    const deleteContent = (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">
            Delete Deployment
          </h3>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-300 mb-6">
          Are you sure you want to delete the deployment for{" "}
          <span className="font-semibold text-white">
            {deployment.project?.name}
          </span>
          ? This action cannot be undone.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>{" "}
          <button
            onClick={() => {
              dispatch(
                cancelDeployment({
                  projectId: deployment.projectId,
                  deploymentId: deployment._id,
                })
              );
              closeModal();
            }}
            disabled={loading.cancel}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading.cancel ? "Canceling..." : "Cancel Deployment"}
          </button>
        </div>
      </div>
    );

    openModal(deleteContent);
  };

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
        {" "}
        {loading.fetch ? (
          <LoadingGrid columns={1} rows={3} />
        ) : filteredDeployments.length > 0 ? (
          filteredDeployments.map((deployment, index) => (
            <motion.div
              key={deployment._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 hover:border-neutral-700/50 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                {" "}
                <div className="flex items-center gap-4">
                  {getStatusIcon(
                    deployment.deployment?.status ||
                      deployment.status ||
                      "pending"
                  )}
                  <div>
                    <h3
                      className="text-white font-semibold text-lg cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() =>
                        navigate(
                          `/dashboard/projects/${
                            deployment.project?._id || deployment.projectId
                          }`
                        )
                      }
                    >
                      {deployment.project?.name || "Unknown Project"}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <FaCodeBranch className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-400 text-sm">
                          {deployment.deployment?.branch ||
                            deployment.branch ||
                            "main"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaCode className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-400 text-sm font-mono">
                          {(
                            deployment.deployment?.commit?.hash ||
                            deployment.commit?.hash ||
                            "N/A"
                          ).substring(0, 7)}
                        </span>
                      </div>
                      <span
                        className={getEnvironmentBadge(
                          deployment.deployment?.environment ||
                            deployment.environment ||
                            "development"
                        )}
                      >
                        {deployment.deployment?.environment ||
                          deployment.environment ||
                          "development"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {" "}
                  <span
                    className={getStatusBadge(
                      deployment.deployment?.status ||
                        deployment.status ||
                        "pending"
                    )}
                  >
                    {deployment.deployment?.status ||
                      deployment.status ||
                      "pending"}
                  </span>
                </div>{" "}
              </div>{" "}
              <p className="text-gray-300 mb-4">
                {deployment.deployment?.commit?.message ||
                  deployment.commit?.message ||
                  "No commit message"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <FaUser className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400 text-sm">
                    by{" "}
                    {deployment.deployedBy?.name ||
                      deployment.deployedBy?.email ||
                      "Unknown"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-400 text-sm">
                    {new Date(deployment.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaClock className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-400 text-sm">
                    {deployment.deployment?.duration || "N/A"}
                  </span>
                </div>
              </div>{" "}
              {deployment.deployment?.url && (
                <div className="mb-4 p-3 bg-neutral-800/50 rounded-lg">
                  <a
                    href={deployment.deployment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm font-mono"
                  >
                    {deployment.deployment.url}
                  </a>
                </div>
              )}{" "}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewLogs(deployment)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
                >
                  <FaEye className="w-3 h-3" />
                  View Logs
                </button>

                {deployment.deployment?.status === "success" && (
                  <button
                    onClick={() => handleRestart(deployment._id)}
                    disabled={loading.restart}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-sm disabled:opacity-50"
                  >
                    <FaRedo className="w-3 h-3" />
                    {loading.restart ? "Restarting..." : "Redeploy"}
                  </button>
                )}

                {deployment.deployment?.status === "running" && (
                  <button
                    onClick={() => handleStop(deployment._id)}
                    disabled={loading.stop}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50"
                  >
                    <FaStop className="w-3 h-3" />
                    {loading.stop ? "Stopping..." : "Cancel"}
                  </button>
                )}

                <button
                  onClick={() => handleDeleteConfirm(deployment)}
                  disabled={loading.delete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50"
                >
                  <FaTrash className="w-3 h-3" />
                  {loading.delete ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          ))
        ) : (
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
              {filter === "all"
                ? "No deployments yet. Deploy your first project to get started."
                : `No deployments with status "${filter}".`}
            </p>
          </motion.div>
        )}
      </motion.div>
      {/* Error Message */}
      {error.deployments && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-center mt-6"
        >
          {error.deployments}
        </motion.div>
      )}
      {/* Success Messages */}
      {(success.deploy || success.stop || success.delete) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400 text-center mt-6"
        >
          {success.deploy && "Deployment started successfully!"}
          {success.stop && "Deployment stopped successfully!"}{" "}
          {success.delete && "Deployment deleted successfully!"}
        </motion.div>
      )}
    </>
  );
};

export default Deployments;
