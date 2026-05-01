import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import {
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaExternalLinkAlt,
  FaInfoCircle,
  FaPlay,
  FaPlus,
  FaRocket,
  FaSpinner,
  FaStop,
  FaSync,
  FaTerminal,
  FaTimes,
  FaTimesCircle,
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchDeploymentLogs,
  fetchProjectDeployments,
  stopDeployment,
  restartDeployment,
  cancelDeployment,
  clearLogs,
  deleteDeployment,
  probeDeployment,
} from "../../redux/slices/deploymentSlice";
import useDeploymentStream from "../../hooks/useDeploymentStream";

const ProjectDeployments = () => {
  const { onOpenDeployModal, project } = useOutletContext() || {};
  const location = useLocation();
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
  const deploymentProbe = useSelector((state) => state.deployments.probe);

  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("pipeline");
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const [iframeFailed, setIframeFailed] = useState(false);
  const dispatch = useDispatch();
  const logEndRef = useRef(null);
  const stageOrder = ["queued", "cloning", "detecting", "building", "deploying", "running"];

  const filteredDeployments = Array.isArray(projectDeployments)
    ? filter === "all"
      ? projectDeployments
      : projectDeployments.filter((d) => d.status === filter)
    : [];

  const handleViewLogs = useCallback((deployment) => {
    setSelectedDeployment(deployment);
    setActiveDetailTab("pipeline");
    setShowPanel(true);
    setIframeFailed(false);
  }, []);

  const selectedDeploymentId = useMemo(
    () =>
      selectedDeployment?._id ||
      selectedDeployment?.id ||
      selectedDeployment?.deploymentId,
    [selectedDeployment],
  );
  const { connected, liveLogs, liveStatus } = useDeploymentStream(selectedDeploymentId);
  const selectedProbe = deploymentProbe?.deploymentId === selectedDeploymentId ? deploymentProbe : null;

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

  const handleDelete = useCallback(
    async (deployment) => {
      await withActionLoading(
        deployment,
        (id) => dispatch(deleteDeployment(id)),
        "delete",
      );
      setShowPanel(false);
      setSelectedDeployment(null);
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
    if (!showPanel || !selectedDeploymentId) return undefined;
    loadDeploymentLogs(selectedDeploymentId);
    dispatch(probeDeployment(selectedDeploymentId));
    return undefined;
  }, [dispatch, showPanel, selectedDeploymentId, loadDeploymentLogs]);

  useEffect(() => {
    if (!showPanel || !selectedDeploymentId) return undefined;
    if (!["pending", "queued", "building", "deploying"].includes(selectedDeployment?.status)) {
      return undefined;
    }
    const timer = setInterval(() => {
      loadDeploymentLogs(selectedDeploymentId);
    }, 4000);
    return () => clearInterval(timer);
  }, [showPanel, selectedDeploymentId, selectedDeployment?.status, loadDeploymentLogs]);

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

  useEffect(() => {
    if (!showPanel || activeDetailTab !== "logs") return;
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [showPanel, activeDetailTab, liveLogs, deploymentLogs]);

  useEffect(() => () => {
    dispatch(clearLogs());
  }, [dispatch]);

  const getStatusBadge = (status) => {
    const baseClasses =
      "inline-flex items-center justify-center min-w-[112px] px-3 py-1 rounded-full text-xs font-medium";
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

  const deriveStageFromLogs = useMemo(() => {
    const allLogs = [...formatLogs(deploymentLogs), ...liveLogs];
    const lastLogs = allLogs.slice(-120);
    const contains = (needle) =>
      lastLogs.some((log) =>
        String(log.message || "")
          .toLowerCase()
          .includes(needle),
      );

    if (contains("cloning") || contains("repository cloned")) return "cloning";
    if (contains("detect") || contains("using repository dockerfile")) return "detecting";
    if (
      contains("running build command") ||
      contains("[build] step") ||
      contains("sending build context")
    ) {
      return "building";
    }
    if (
      contains("starting deployment") ||
      contains("starting container") ||
      contains("container started")
    ) {
      return "deploying";
    }
    if (contains("container is running") || contains("deployment completed")) return "running";
    return null;
  }, [deploymentLogs, formatLogs, liveLogs]);

  const effectivePipelineStage =
    deriveStageFromLogs ||
    String(liveStatus?.status || selectedDeployment?.status || "").toLowerCase();

  useEffect(() => {
    if (!location.state?.openLatestDeploymentPanel || showPanel) return;
    if (!Array.isArray(projectDeployments) || projectDeployments.length === 0) return;

    const inProgress = projectDeployments.find((deployment) =>
      ["pending", "queued", "cloning", "detecting", "building", "deploying"].includes(
        String(deployment.status || "").toLowerCase(),
      ),
    );
    const latest = inProgress || projectDeployments[0];
    if (!latest) return;

    setSelectedDeployment(latest);
    setActiveDetailTab("pipeline");
    setShowPanel(true);
  }, [location.state, projectDeployments, showPanel]);

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
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 hover:border-neutral-700/50 transition-all duration-200"
            >
              <div className="flex flex-col xl:flex-row xl:items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0 mt-0.5">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs sm:text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <FaInfoCircle className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {deployment.subdomain || deployment.networking?.subdomain || "No subdomain"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaClock className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {new Date(deployment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="sm:col-span-2 text-xs text-gray-400 break-all">
                          URL: {deployment.url || deployment.networking?.fullUrl || "Not available"}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <button
                          onClick={() => handleViewLogs(deployment)}
                          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-xs sm:text-sm"
                        >
                          <FaTerminal className="w-3 h-3" />
                          <span className="hidden sm:inline">View Details</span>
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
                      </div>
                    </div>
                  </div>
                </div>
                {(deployment.status === "running" || deployment.status === "success") &&
                  (deployment.url || deployment.networking?.fullUrl) && (
                    <div className="w-full xl:w-[360px] xl:ml-auto">
                      <div className="w-full rounded-lg border border-neutral-800 bg-neutral-950/70 p-2">
                        <div className="text-xs text-gray-400 px-1 pb-2">Live Preview</div>
                        <div className="h-40 rounded overflow-hidden bg-black/40">
                          <iframe
                            title={`card-preview-${deployment._id || deployment.deploymentId || deployment.id}`}
                            src={deployment.url || deployment.networking?.fullUrl}
                            sandbox="allow-same-origin allow-scripts allow-forms"
                            className="w-full h-full border-0"
                          />
                        </div>
                      </div>
                    </div>
                  )}
              </div>
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

      {/* Deployment detail panel */}
      {showPanel && selectedDeployment && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            className="flex-1 bg-black/50"
            onClick={() => setShowPanel(false)}
          />
          <motion.div
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-full max-w-3xl bg-neutral-950 border-l border-neutral-800 overflow-y-auto"
          >
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Deployment Details</h3>
                <p className="text-sm text-gray-400">
                  {(selectedDeployment.environment || selectedDeployment.config?.environment || "staging")} · {selectedDeployment.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPanel(false)}
                className="text-gray-300 hover:text-white"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pt-4 flex gap-2 border-b border-neutral-800">
              {["pipeline", "preview", "logs", "controls"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveDetailTab(tab)}
                  className={`px-3 py-2 text-sm border-b-2 capitalize ${
                    activeDetailTab === tab
                      ? "border-blue-500 text-blue-300"
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-5">
              {activeDetailTab === "pipeline" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 text-sm">
                    <div className="bg-neutral-900/60 rounded-lg p-2">
                      <span className="text-gray-400">Deployment ID: </span>
                      <span className="text-white">{selectedDeployment.deploymentId || selectedDeployment.id}</span>
                    </div>
                    <div className="bg-neutral-900/60 rounded-lg p-2">
                      <span className="text-gray-400">Health: </span>
                      <span className="text-white">{selectedDeployment.healthStatus || "unknown"}</span>
                    </div>
                    <div className="bg-neutral-900/60 rounded-lg p-2">
                      <span className="text-gray-400">Branch: </span>
                      <span className="text-white">{selectedDeployment.branch || "main"}</span>
                    </div>
                    <div className="bg-neutral-900/60 rounded-lg p-2">
                      <span className="text-gray-400">Deployed by: </span>
                      <span className="text-white">{selectedDeployment.deployedBy?.email || "system"}</span>
                    </div>
                    <div className="bg-neutral-900/60 rounded-lg p-2 md:col-span-2">
                      <span className="text-gray-400">Commit: </span>
                      <span className="text-white">
                        {(selectedDeployment.commit?.hash || "N/A").slice(0, 8)}{" "}
                        {selectedDeployment.commit?.message
                          ? `- ${selectedDeployment.commit.message}`
                          : ""}
                      </span>
                    </div>
                  </div>
                  {stageOrder.map((stage, index) => {
                    const currentStage = String(effectivePipelineStage || "").toLowerCase();
                    const stageIndex = stageOrder.indexOf(currentStage);
                    const isDone = stageIndex > index || currentStage === "running";
                    const isActive = stage === currentStage;
                    const failed = currentStage === "failed";
                    return (
                      <div
                        key={stage}
                        className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {failed && isActive ? (
                            <FaTimesCircle className="w-4 h-4 text-red-400" />
                          ) : isDone ? (
                            <FaCheckCircle className="w-4 h-4 text-green-400" />
                          ) : isActive ? (
                            <FaSpinner className="w-4 h-4 text-blue-400 animate-spin" />
                          ) : (
                            <FaClock className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="text-white capitalize">{stage}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {isDone ? "done" : isActive ? "running" : "pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeDetailTab === "preview" && (
                <div className="space-y-3">
                  <div className="text-xs text-yellow-200 bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                    Some deployments block iframe embedding via CSP/X-Frame-Options. If preview is blocked,
                    open the URL directly.
                  </div>
                  {(selectedProbe?.probe?.preview?.contentType || "").includes(
                    "application/json",
                  ) ? (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                      <div className="text-sm text-gray-300 mb-2">
                        Status code: {selectedProbe?.probe?.statusCode || "N/A"}
                      </div>
                      <pre className="text-xs text-gray-200 whitespace-pre-wrap max-h-[360px] overflow-auto">
                        {typeof selectedProbe?.probe?.preview?.body === "string"
                          ? selectedProbe.probe.preview.body
                          : JSON.stringify(selectedProbe?.probe?.preview?.body || {}, null, 2)}
                      </pre>
                    </div>
                  ) : selectedDeployment?.status === "running" &&
                    !iframeFailed &&
                    (selectedDeployment.url || selectedDeployment.networking?.fullUrl) ? (
                    <div className="h-[420px] rounded-lg overflow-hidden border border-neutral-800">
                      <iframe
                        title="deployment-preview"
                        src={selectedDeployment.url || selectedDeployment.networking?.fullUrl}
                        sandbox="allow-same-origin allow-scripts allow-forms"
                        className="w-full h-full border-0"
                        onError={() => setIframeFailed(true)}
                      />
                    </div>
                  ) : (
                    <a
                      href={selectedDeployment.url || selectedDeployment.networking?.fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 underline break-all"
                    >
                      {selectedDeployment.url || selectedDeployment.networking?.fullUrl || "URL not available"}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => dispatch(probeDeployment(selectedDeploymentId))}
                    className="px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm"
                  >
                    Refresh Probe
                  </button>
                </div>
              )}

              {activeDetailTab === "logs" && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-400">
                    {connected ? "Live stream connected" : "Live stream disconnected"}
                  </div>
                  <div className="bg-black/70 border border-neutral-800 rounded-lg p-3 font-mono text-xs h-[420px] overflow-auto">
                    {[...formatLogs(deploymentLogs), ...liveLogs].map((log, idx) => (
                      <div key={idx} className="mb-1 text-gray-300">
                        [{new Date(log.timestamp || Date.now()).toLocaleTimeString()}]{" "}
                        {log.message || ""}
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadLogs}
                    className="px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm flex items-center gap-2"
                  >
                    <FaDownload className="w-3 h-3" /> Download Logs
                  </button>
                </div>
              )}

              {activeDetailTab === "controls" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleStop(selectedDeployment)}
                      className="px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300"
                    >
                      Stop
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRestart(selectedDeployment)}
                      className="px-3 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-300"
                    >
                      Restart
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(selectedDeployment)}
                      className="px-3 py-2 rounded-lg bg-gray-500/20 border border-gray-500/30 text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedDeployment)}
                      className="px-3 py-2 rounded-lg bg-red-900/40 border border-red-500/30 text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
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
