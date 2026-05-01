import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
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
import { useSelector, useDispatch } from "react-redux";
import {
  fetchDeploymentLogs,
  fetchProjectDeployments,
  stopDeployment,
  restartDeployment,
  cancelDeployment,
  clearLogs,
} from "../../redux/slices/deploymentSlice";

const ProjectDeployments = () => {
  const { onOpenDeployModal, project } = useOutletContext() || {};
  // Get deployments from Outlet context or Redux
  const projectDeployments = useSelector(
    (state) => state.deployments.projectDeployments,
  );
  const loadingFetchProject = useSelector(
    (state) => state.deployments.loading.fetchProject,
  );
  const errorDeployments = useSelector(
    (state) => state.deployments.error.fetchProject,
  );
  const logsLoading = useSelector((state) => state.deployments.loading.logs);
  const deploymentLogs = useSelector((state) => state.deployments.logs);

  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("status");
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const dispatch = useDispatch();

  const filteredDeployments = Array.isArray(projectDeployments)
    ? filter === "all"
      ? projectDeployments
      : projectDeployments.filter((d) => d.status === filter)
    : [];

  const handleViewLogs = useCallback((deployment) => {
    setSelectedDeployment(deployment);
    setActiveDetailTab("status");
    setShowLogs(true);
  }, []);

  const selectedDeploymentId = useMemo(
    () =>
      selectedDeployment?._id ||
      selectedDeployment?.id ||
      selectedDeployment?.deploymentId,
    [selectedDeployment],
  );

  const formatLogs = useCallback((logsPayload) => {
    if (!logsPayload) return [];
    if (Array.isArray(logsPayload)) return logsPayload;
    if (Array.isArray(logsPayload.logs)) return logsPayload.logs;
    if (Array.isArray(logsPayload.data?.logs)) return logsPayload.data.logs;
    return [];
  }, []);

  const loadDeploymentLogs = useCallback(
    async (deploymentId) => {
      if (!deploymentId) return;
      await dispatch(
        fetchDeploymentLogs({
          deploymentId,
          params: { lines: 200 },
        }),
      );
    },
    [dispatch],
  );

  const withActionLoading = useCallback(async (deployment, actionFn, key) => {
    const id = deployment?._id || deployment?.id || deployment?.deploymentId;
    if (!id) return;
    if (actionLoading[id]) return;

    setActionLoading((prev) => ({ ...prev, [id]: key }));
    try {
      await actionFn(id).unwrap();
      if (project?._id || project?.id) {
        await dispatch(fetchProjectDeployments(project._id || project.id));
      }
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, [actionLoading, dispatch, project]);

  const handleStop = useCallback(
    async (deployment) => {
      await withActionLoading(deployment, (id) => dispatch(stopDeployment(id)), "stop");
    },
    [dispatch, withActionLoading],
  );

  const handleRestart = useCallback(
    async (deployment) => {
      await withActionLoading(
        deployment,
        (id) => dispatch(restartDeployment(id)),
        "restart",
      );
    },
    [dispatch, withActionLoading],
  );

  const handleCancel = useCallback(
    async (deployment) => {
      await withActionLoading(
        deployment,
        (id) => dispatch(cancelDeployment(id)),
        "cancel",
      );
    },
    [dispatch, withActionLoading],
  );

  const handleDownloadLogs = useCallback(() => {
    if (!selectedDeploymentId) return;
    const logs = formatLogs(deploymentLogs);
    const contents = logs
      .map((log) => `[${new Date(log.timestamp).toISOString()}] ${log.level || "info"} ${log.message || ""}`)
      .join("\n");
    const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedDeploymentId}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [deploymentLogs, formatLogs, selectedDeploymentId]);

  useEffect(() => {
    if (!showLogs || !selectedDeploymentId) return undefined;
    loadDeploymentLogs(selectedDeploymentId);
    return undefined;
  }, [showLogs, selectedDeploymentId, loadDeploymentLogs]);

  useEffect(() => {
    if (!showLogs || !selectedDeploymentId) return undefined;
    if (!["pending", "queued", "building", "deploying"].includes(selectedDeployment?.status)) {
      return undefined;
    }
    const timer = setInterval(() => {
      loadDeploymentLogs(selectedDeploymentId);
    }, 4000);
    return () => clearInterval(timer);
  }, [showLogs, selectedDeploymentId, selectedDeployment?.status, loadDeploymentLogs]);

  useEffect(() => {
    if (!selectedDeploymentId || !Array.isArray(projectDeployments)) return;
    const updated = projectDeployments.find(
      (item) =>
        (item._id || item.id || item.deploymentId) === selectedDeploymentId,
    );
    if (updated) {
      setSelectedDeployment(updated);
    }
  }, [projectDeployments, selectedDeploymentId]);

  useEffect(() => () => {
    dispatch(clearLogs());
  }, [dispatch]);

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
      case "queued":
      case "building":
      case "deploying":
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
            View project deployment history
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenDeployModal}
            className="px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-sm w-full sm:w-auto"
          >
            <FaPlus className="w-4 h-4 mr-2 inline" />
            Create Deployment
          </button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none text-sm w-full sm:w-48"
          >
            <option value="all">All Deployments</option>
            <option value="success">Successful</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
          </select>
        </div>
      </div>

      {/* Deployments List */}
      <div className="space-y-4">
        {loadingFetchProject ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredDeployments.length > 0 ? (
          filteredDeployments.map((deployment, index) => (
            <motion.div
              key={deployment._id || deployment.deploymentId || deployment.id}
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
                    {(() => {
                      const environment =
                        deployment?.config?.environment ||
                        deployment?.environment ||
                        "staging";

                      return (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <h3 className="text-white font-semibold text-sm sm:text-base">
                            {environment}
                          </h3>
                          <span className={getStatusBadge(deployment.status)}>
                            {getStatusIcon(deployment.status)}
                            <span className="ml-1">{deployment.status}</span>
                          </span>
                        </div>
                      );
                    })()}
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

                  {(deployment.url || deployment.networking?.fullUrl) && (
                    <a
                      href={deployment.url || deployment.networking?.fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-xs sm:text-sm"
                    >
                      <FaExternalLinkAlt className="w-3 h-3" />
                      <span className="hidden sm:inline">Visit</span>
                    </a>
                  )}
                  {/* Action buttons: Retry / Start / Stop / Restart / Cancel */}
                  {deployment.status === "queued" && (
                    <button
                      onClick={() => handleRestart(deployment)}
                      disabled={Boolean(actionLoading[deployment._id || deployment.id || deployment.deploymentId])}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors text-xs sm:text-sm"
                    >
                      <FaSync className="w-3 h-3" />
                      <span className="hidden sm:inline">Retry</span>
                    </button>
                  )}

                  {deployment.status === "pending" && (
                    <button
                      onClick={() => handleRestart(deployment)}
                      disabled={Boolean(actionLoading[deployment._id || deployment.id || deployment.deploymentId])}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-xs sm:text-sm"
                    >
                      <FaPlay className="w-3 h-3" />
                      <span className="hidden sm:inline">Start</span>
                    </button>
                  )}

                  {deployment.status === "running" && (
                    <>
                      <button
                        onClick={() => handleStop(deployment)}
                        disabled={Boolean(actionLoading[deployment._id || deployment.id || deployment.deploymentId])}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors text-xs sm:text-sm"
                      >
                        <FaStop className="w-3 h-3" />
                        <span className="hidden sm:inline">Stop</span>
                      </button>
                      <button
                        onClick={() => handleRestart(deployment)}
                        disabled={Boolean(actionLoading[deployment._id || deployment.id || deployment.deploymentId])}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors text-xs sm:text-sm"
                      >
                        <FaSync className="w-3 h-3" />
                        <span className="hidden sm:inline">Restart</span>
                      </button>
                    </>
                  )}

                  {deployment.status === "stopped" && (
                    <button
                      onClick={() => handleRestart(deployment)}
                      disabled={Boolean(actionLoading[deployment._id || deployment.id || deployment.deploymentId])}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-xs sm:text-sm"
                    >
                      <FaPlay className="w-3 h-3" />
                      <span className="hidden sm:inline">Start</span>
                    </button>
                  )}

                  {["pending", "queued", "building", "deploying"].includes(
                    deployment.status,
                  ) && (
                    <button
                      onClick={() => handleCancel(deployment)}
                      disabled={Boolean(actionLoading[deployment._id || deployment.id || deployment.deploymentId])}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-gray-700/20 border border-gray-600/30 rounded-lg text-gray-300 hover:bg-gray-700/30 transition-colors text-xs sm:text-sm"
                    >
                      <FaTimes className="w-3 h-3" />
                      <span className="hidden sm:inline">Cancel</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Deployment Details */}
              {deployment.config?.commit && (
                <div className="mt-3 sm:mt-4 p-3 bg-neutral-800/50 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <FaCode className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-400">Commit:</span>
                      <span className="text-white font-mono">
                        {deployment.config?.commit?.hash?.slice(0, 8) || "N/A"}
                      </span>
                    </div>
                    <span className="text-gray-300 truncate sm:ml-2">
                      {deployment.config?.commit?.message ||
                        "No commit message"}
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
                onClick={onOpenDeployModal}
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
            <div className="px-4 sm:px-6 pt-4">
              <div className="flex items-center gap-2 border-b border-neutral-800">
                {["status", "logs", "metrics", "controls"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveDetailTab(tab)}
                    className={`px-3 py-2 text-sm capitalize border-b-2 transition-colors ${
                      activeDetailTab === tab
                        ? "border-blue-500 text-blue-300"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] sm:max-h-[60vh]">
              {activeDetailTab === "status" && (
                <div className="space-y-3 text-sm">
                  <div className="bg-neutral-800/50 rounded-lg p-3">
                    <div className="text-gray-400">Status</div>
                    <div className="text-white font-medium mt-1">{selectedDeployment.status}</div>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg p-3">
                    <div className="text-gray-400">Live URL</div>
                    <a
                      href={selectedDeployment.url || selectedDeployment.networking?.fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 break-all"
                    >
                      {selectedDeployment.url || selectedDeployment.networking?.fullUrl || "Not available yet"}
                    </a>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg p-3">
                    <div className="text-gray-400">Environment</div>
                    <div className="text-white mt-1">
                      {selectedDeployment.environment || selectedDeployment.config?.environment || "staging"}
                    </div>
                  </div>
                </div>
              )}
              {activeDetailTab === "logs" && (
                <div className="bg-black/50 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm space-y-1">
                  {logsLoading && (
                    <div className="text-blue-300 mb-2">Loading latest logs...</div>
                  )}
                  {formatLogs(deploymentLogs).length > 0 ? (
                    formatLogs(deploymentLogs).map((log, idx) => (
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
              )}
              {activeDetailTab === "metrics" && (
                <div className="space-y-3 text-sm">
                  <div className="bg-neutral-800/50 rounded-lg p-3">
                    <div className="text-gray-400">Requests (total)</div>
                    <div className="text-white mt-1">{selectedDeployment.metrics?.requests ?? 0}</div>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg p-3">
                    <div className="text-gray-400">Errors (total)</div>
                    <div className="text-white mt-1">{selectedDeployment.metrics?.errors ?? 0}</div>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg p-3">
                    <div className="text-gray-400">Uptime</div>
                    <div className="text-white mt-1">{selectedDeployment.metrics?.uptime ?? 0}%</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Live container metrics streaming will populate this tab as backend metrics events are completed.
                  </div>
                </div>
              )}
              {activeDetailTab === "controls" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={!["running"].includes(selectedDeployment.status)}
                    onClick={() => handleStop(selectedDeployment)}
                    className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 disabled:opacity-40"
                  >
                    Stop
                  </button>
                  <button
                    type="button"
                    disabled={!["running", "stopped", "failed", "queued", "pending"].includes(selectedDeployment.status)}
                    onClick={() => handleRestart(selectedDeployment)}
                    className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-300 disabled:opacity-40"
                  >
                    Restart
                  </button>
                  <button
                    type="button"
                    disabled={!["pending", "queued", "building", "deploying"].includes(selectedDeployment.status)}
                    onClick={() => handleCancel(selectedDeployment)}
                    className="px-4 py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-200 disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="p-4 sm:p-6 border-t border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <button
                onClick={handleDownloadLogs}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
              >
                <FaDownload className="w-4 h-4" />
                Download Logs
              </button>
              <button
                onClick={() => loadDeploymentLogs(selectedDeploymentId)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-400 hover:bg-gray-500/30 transition-colors text-sm"
              >
                <FaSync className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Error Message */}
      {errorDeployments && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-center"
        >
          {errorDeployments}
        </motion.div>
      )}
    </div>
  );
};

export default ProjectDeployments;
