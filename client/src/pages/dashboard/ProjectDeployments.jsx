import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
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
  FaBan,
  FaTrash,
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { useModal } from "@context/ModalContext.jsx";
import DangerConfirmModal from "@components/common/DangerConfirmModal";
import {
  fetchDeploymentLogs,
  fetchProjectDeployments,
  stopDeployment,
  restartDeployment,
  cancelDeployment,
  clearLogs,
  deleteDeployment,
  probeDeployment,
  updateDeploymentStatus,
} from "../../redux/slices/deploymentSlice";
import useDeploymentStream from "../../hooks/useDeploymentStream";
import {
  DEPLOYMENT_POLL_STATUSES,
  PIPELINE_STAGE_ORDER,
  getDeploymentEnvironmentBadge,
  getDeploymentEnvironmentLabel,
  getDeploymentStatusBadge,
  isDeploymentActionAllowed,
  isDeploymentBuildPhase,
  isPipelineStageStatus,
  resolvePipelineStage,
} from "../../utils/deploymentConstants";
import DeploymentPreviewIframe from "../../components/deployments/DeploymentPreviewIframe";
import { getDeploymentUrl, isLiveForPreview } from "../../utils/deploymentPreview";

const ProjectDeployments = () => {
  const { onOpenDeployModal, project, isArchived } = useOutletContext() || {};
  const canDeploy = Boolean(onOpenDeployModal) && !isArchived;
  const location = useLocation();
  const navigate = useNavigate();
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
  const [filter, setFilter] = useState("all");
  const [envFilter, setEnvFilter] = useState("all");
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [iframeFailed, setIframeFailed] = useState(false);
  const lastPanelOpenIntentRef = useRef(null);
  const busyActionIdsRef = useRef(new Set());
  const prevShowPanelRef = useRef(false);
  const dispatch = useDispatch();
  const { openModal, closeModal } = useModal();
  const logScrollContainerRef = useRef(null);
  const stageOrder = PIPELINE_STAGE_ORDER;

  const IN_FLIGHT_FILTER_STATUSES = new Set([
    "pending",
    "queued",
    "cloning",
    "detecting",
    "building",
    "deploying",
  ]);

  const filteredDeployments = useMemo(() => {
    if (!Array.isArray(projectDeployments)) return [];
    return projectDeployments.filter((d) => {
      const status = String(d.status || "").toLowerCase();
      const environment =
        d.environment || d.config?.environment || "staging";

      if (envFilter !== "all" && environment !== envFilter) {
        return false;
      }

      if (filter === "all") return true;
      if (filter === "in_progress") return IN_FLIGHT_FILTER_STATUSES.has(status);
      if (filter === "success") return status === "success" || status === "running";
      return status === filter;
    });
  }, [projectDeployments, filter, envFilter]);

  const getDeploymentEnv = (deployment) =>
    deployment?.environment || deployment?.config?.environment || "staging";

  const isActionBusy = (deployment) => {
    const id = deployment?._id || deployment?.id || deployment?.deploymentId;
    return id ? !!actionLoading[id] : false;
  };

  const openDeploymentDetail = useCallback((deployment) => {
    if (!deployment) return;
    setSelectedDeployment(deployment);
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
  /** Prefer runtime dep_* id for logs, probe, and WebSocket rooms. */
  const selectedIdForApi = useMemo(
    () =>
      selectedDeployment?.deploymentId ||
      selectedDeployment?._id ||
      selectedDeployment?.id,
    [selectedDeployment],
  );
  const selectedDeploymentRuntimeId = useMemo(
    () => selectedDeployment?.deploymentId || selectedDeploymentId,
    [selectedDeployment?.deploymentId, selectedDeploymentId],
  );
  const streamBuildOnly = isDeploymentBuildPhase(
    selectedDeployment?.status,
  );
  const { connected, liveLogs, liveStatus, liveMetrics } = useDeploymentStream(
    showPanel ? selectedDeploymentRuntimeId : null,
    { buildOnly: streamBuildOnly },
  );
  const selectedProbe =
    deploymentProbe?.deploymentId === selectedDeploymentRuntimeId ||
    deploymentProbe?.deploymentId === selectedDeploymentId
      ? deploymentProbe
      : null;

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
    if (!id) return null;
    if (busyActionIdsRef.current.has(String(id))) return null;

    busyActionIdsRef.current.add(String(id));
    setActionLoading((prev) => ({ ...prev, [id]: key }));
    try {
      setActionError(null);
      await actionFn(id).unwrap();
      if (project?._id || project?.id) {
        const r = await dispatch(fetchProjectDeployments(project._id || project.id));
        return { deployments: r.payload?.deployments ?? null, actionId: id };
      }
      return { deployments: null, actionId: id };
    } catch (err) {
      const message =
        err?.message ||
        err?.error ||
        (typeof err === "string" ? err : "Action failed. Please try again.");
      setActionError(message);
      return null;
    } finally {
      busyActionIdsRef.current.delete(String(id));
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, [dispatch, project]);

  const resolveFreshDeployment = useCallback(
    (list, deployment, actionId) => {
      const needle = String(actionId ?? "");
      if (Array.isArray(list) && list.length) {
        const hit = list.find((d) =>
          [d._id, d.id, d.deploymentId].some((v) => v != null && String(v) === needle),
        );
        if (hit) return hit;
      }
      return deployment;
    },
    [],
  );

  const handleStop = useCallback(
    async (deployment) => {
      const res = await withActionLoading(deployment, (id) => dispatch(stopDeployment(id)), "stop");
      if (res) openDeploymentDetail(resolveFreshDeployment(res.deployments, deployment, res.actionId));
    },
    [dispatch, openDeploymentDetail, resolveFreshDeployment, withActionLoading],
  );

  const handleRestart = useCallback(
    async (deployment) => {
      const res = await withActionLoading(
        deployment,
        (id) => dispatch(restartDeployment(id)),
        "restart",
      );
      if (res) openDeploymentDetail(resolveFreshDeployment(res.deployments, deployment, res.actionId));
    },
    [dispatch, openDeploymentDetail, resolveFreshDeployment, withActionLoading],
  );

  const handleCancel = useCallback(
    async (deployment) => {
      const res = await withActionLoading(
        deployment,
        (id) => dispatch(cancelDeployment(id)),
        "cancel",
      );
      if (res) openDeploymentDetail(resolveFreshDeployment(res.deployments, deployment, res.actionId));
    },
    [dispatch, openDeploymentDetail, resolveFreshDeployment, withActionLoading],
  );

  const runDeleteDeployment = useCallback(
    async (deployment) => {
      const res = await withActionLoading(
        deployment,
        (id) => dispatch(deleteDeployment(id)),
        "delete",
      );
      if (!res) return;
      const deletedKey = String(res.actionId ?? "");
      const selectedKey = String(
        selectedDeployment?._id || selectedDeployment?.id || selectedDeployment?.deploymentId || "",
      );
      if (selectedKey && deletedKey === selectedKey) {
        setShowPanel(false);
        setSelectedDeployment(null);
      }
    },
    [dispatch, selectedDeployment, withActionLoading],
  );

  const handleDelete = useCallback(
    (deployment) => {
      const env = getDeploymentEnv(deployment);
      const deploymentId =
        deployment._id || deployment.id || deployment.deploymentId;
      const label = deployment.subdomain || deploymentId || "this deployment";

      openModal(
        <DangerConfirmModal
          title="Delete deployment"
          confirmLabel="Delete permanently"
          cancelLabel="Cancel"
          confirmDisabled={isActionBusy(deployment)}
          onCancel={closeModal}
          onConfirm={async () => {
            closeModal();
            await runDeleteDeployment(deployment);
          }}
        >
          <p>
            Permanently delete the{" "}
            <span className="font-medium text-white">{env}</span> deployment{" "}
            <span className="font-mono text-neutral-200">{label}</span>? The
            container will be removed and this record cannot be recovered.
          </p>
        </DangerConfirmModal>,
      );
    },
    [closeModal, isActionBusy, openModal, runDeleteDeployment],
  );

  const handleDownloadLogs = useCallback(() => {
    if (!selectedIdForApi) return;
    const logs = [...formatLogs(deploymentLogs), ...liveLogs].sort(
      (a, b) =>
        new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime(),
    );
    const contents = logs
      .map((log) => {
        const raw = log?.message;
        const msg =
          raw == null
            ? ""
            : typeof raw === "string"
              ? raw
              : (() => {
                  try {
                    return JSON.stringify(raw);
                  } catch {
                    return String(raw);
                  }
                })();
        return `[${new Date(log.timestamp).toISOString()}] ${log.level || "info"} ${msg}`;
      })
      .join("\n");
    const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedIdForApi}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [deploymentLogs, formatLogs, liveLogs, selectedIdForApi]);

  useEffect(() => {
    if (!showPanel || !selectedIdForApi) return undefined;
    loadDeploymentLogs(selectedIdForApi);
    dispatch(probeDeployment(selectedIdForApi));
    return undefined;
  }, [dispatch, showPanel, selectedIdForApi, loadDeploymentLogs]);

  useEffect(() => {
    if (!showPanel || !selectedIdForApi) return undefined;
    const st = String(selectedDeployment?.status || "").toLowerCase();
    if (!DEPLOYMENT_POLL_STATUSES.has(st)) {
      return undefined;
    }
    const timer = setInterval(() => {
      loadDeploymentLogs(selectedIdForApi);
    }, 4000);
    return () => clearInterval(timer);
  }, [
    showPanel,
    selectedIdForApi,
    selectedDeployment?.status,
    loadDeploymentLogs,
  ]);

  useEffect(() => {
    if (!liveStatus?.status) return;
    const targetId =
      liveStatus.deploymentId || selectedDeploymentRuntimeId;
    if (!targetId) return;
    dispatch(
      updateDeploymentStatus({
        deploymentId: targetId,
        status: liveStatus.status,
      }),
    );
  }, [
    dispatch,
    liveStatus?.deploymentId,
    liveStatus?.status,
    selectedDeploymentRuntimeId,
  ]);

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

  const getStatusBadge = getDeploymentStatusBadge;

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
      case "cloning":
      case "detecting":
      case "building":
      case "deploying":
      case "stopping":
        return <FaSync className="w-3 h-3 text-orange-400 animate-spin" />;
      case "stopped":
      case "cancelled":
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

  const normalizedStatus = String(
    liveStatus?.status || selectedDeployment?.status || "",
  ).toLowerCase();
  const isBuildPhase = isDeploymentBuildPhase(normalizedStatus);
  const isRuntimeLive = normalizedStatus === "running";

  const streamLiveLogs = useMemo(() => {
    if (!isBuildPhase) return liveLogs;
    return liveLogs.filter((log) => log.source !== "runtime");
  }, [isBuildPhase, liveLogs]);

  const mergedPanelLogs = useMemo(() => {
    const persisted = formatLogs(deploymentLogs);
    const persistedFiltered = isBuildPhase
      ? persisted.filter(
          (log) =>
            !log.source || log.source === "build" || log.source === "deploy",
        )
      : persisted;
    const rows = [...persistedFiltered, ...streamLiveLogs];
    return rows.sort(
      (a, b) =>
        new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime(),
    );
  }, [deploymentLogs, streamLiveLogs, formatLogs, isBuildPhase]);

  useEffect(() => {
    const wasOpen = prevShowPanelRef.current;
    prevShowPanelRef.current = showPanel;
    if (!showPanel || wasOpen) return;
    requestAnimationFrame(() => {
      const el = logScrollContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [showPanel]);

  useEffect(() => {
    if (!showPanel) return;
    const el = logScrollContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;
    if (nearBottom || scrollHeight <= clientHeight + 1) {
      el.scrollTop = scrollHeight;
    }
  }, [showPanel, mergedPanelLogs]);

  const terminalOrStableStatus = new Set([
    "running",
    "stopped",
    "failed",
    "error",
    "cancelled",
    "deleted",
  ]);
  const effectivePipelineStage = useMemo(() => {
    const resolved = resolvePipelineStage(normalizedStatus);
    if (terminalOrStableStatus.has(resolved)) return resolved;
    if (isPipelineStageStatus(normalizedStatus)) return resolved;
    return deriveStageFromLogs || resolved || "queued";
  }, [normalizedStatus, deriveStageFromLogs]);

  useEffect(() => {
    if (!location.state?.openLatestDeploymentPanel) return;

    const seq = location.state?.openDeploymentsSeq;
    const intentSignature =
      seq != null ? `seq:${seq}` : `${location.key}|${location.state?.focusDeploymentId || ""}`;
    if (lastPanelOpenIntentRef.current === intentSignature) return;

    const pid = project?._id || project?.id;
    if (pid) {
      dispatch(fetchProjectDeployments(pid));
    }

    const focusId = location.state?.focusDeploymentId;
    const pin = location.state?.pinDeployment;
    const list = Array.isArray(projectDeployments) ? projectDeployments : [];

    const matchesFocus = (d) =>
      Boolean(focusId) &&
      [d._id, d.id, d.deploymentId].some((v) => v != null && String(v) === String(focusId));

    const matchesPin = (d) =>
      Boolean(pin) &&
      ([d._id, d.id].some((v) => v != null && String(v) === String(pin._id || pin.id)) ||
        (pin.deploymentId &&
          d.deploymentId &&
          String(d.deploymentId) === String(pin.deploymentId)));

    let chosen =
      list.find((d) => matchesFocus(d)) ||
      list.find((d) => matchesPin(d)) ||
      list.find((d) =>
        ["pending", "queued", "cloning", "detecting", "building", "deploying"].includes(
          String(d.status || "").toLowerCase(),
        ),
      ) ||
      list[0] ||
      pin ||
      null;

    if (!chosen) return;

    lastPanelOpenIntentRef.current = intentSignature;
    setSelectedDeployment(chosen);
    setShowPanel(true);
    setIframeFailed(false);
    navigate(location.pathname, { replace: true, state: {} });
  }, [
    dispatch,
    location.key,
    location.pathname,
    location.state?.focusDeploymentId,
    location.state?.openDeploymentsSeq,
    location.state?.openLatestDeploymentPanel,
    location.state?.pinDeployment,
    navigate,
    project,
    projectDeployments,
  ]);

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
            onClick={canDeploy ? onOpenDeployModal : undefined}
            disabled={!canDeploy}
            className={`px-3 py-2 border rounded-lg text-sm w-full sm:w-auto transition-colors ${
              canDeploy
                ? "bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
                : "bg-gray-500/20 border-gray-500/30 text-gray-500 cursor-not-allowed"
            }`}
          >
            <FaPlus className="w-4 h-4 mr-2 inline" />
            Create Deployment
          </button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none text-sm w-full sm:w-48"
          >
            <option value="all">All statuses</option>
            <option value="in_progress">In progress</option>
            <option value="running">Running</option>
            <option value="success">Successful</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="queued">Queued</option>
            <option value="building">Building</option>
            <option value="deploying">Deploying</option>
            <option value="stopping">Stopping</option>
            <option value="stopped">Stopped</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none text-sm w-full sm:w-40"
          >
            <option value="all">All environments</option>
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-start justify-between gap-3">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-300 hover:text-white shrink-0"
            aria-label="Dismiss error"
          >
            <FaTimes className="w-4 h-4" />
          </button>
          </div>
        )}

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
                        const environment = getDeploymentEnv(deployment);

                        return (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <h3 className="text-white font-semibold text-sm sm:text-base capitalize">
                              {environment}
                            </h3>
                            <span className={getDeploymentEnvironmentBadge(environment)}>
                              {getDeploymentEnvironmentLabel(environment)}
                            </span>
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
                          type="button"
                          onClick={() => openDeploymentDetail(deployment)}
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
                        {isDeploymentActionAllowed(deployment, "restart") && (
                          <button
                            type="button"
                            onClick={() => handleRestart(deployment)}
                            disabled={isActionBusy(deployment)}
                            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-300 hover:bg-yellow-500/30 transition-colors text-xs sm:text-sm disabled:opacity-60"
                          >
                            <FaSync className="w-3 h-3" />
                            <span className="hidden sm:inline">Restart</span>
                          </button>
                        )}
                        {isDeploymentActionAllowed(deployment, "stop") && (
                          <button
                            type="button"
                            onClick={() => handleStop(deployment)}
                            disabled={isActionBusy(deployment)}
                            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 hover:bg-red-500/30 transition-colors text-xs sm:text-sm disabled:opacity-60"
                          >
                            <FaStop className="w-3 h-3" />
                            <span className="hidden sm:inline">Stop</span>
                          </button>
                        )}
                        {isDeploymentActionAllowed(deployment, "cancel") && (
                          <button
                            type="button"
                            onClick={() => handleCancel(deployment)}
                            disabled={isActionBusy(deployment)}
                            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-200 hover:bg-gray-500/30 transition-colors text-xs sm:text-sm disabled:opacity-60"
                          >
                            <FaBan className="w-3 h-3" />
                            <span className="hidden sm:inline">Cancel</span>
                          </button>
                        )}
                        {isDeploymentActionAllowed(deployment, "delete") && (
                          <button
                            type="button"
                            onClick={() => handleDelete(deployment)}
                            disabled={isActionBusy(deployment)}
                            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 bg-red-900/40 border border-red-500/30 rounded-lg text-red-200 hover:bg-red-900/60 transition-colors text-xs sm:text-sm disabled:opacity-60"
                          >
                            <FaTrash className="w-3 h-3" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {isLiveForPreview(deployment.status) && getDeploymentUrl(deployment) && (
                    <div className="w-full xl:w-[360px] xl:ml-auto">
                      <div className="w-full rounded-lg border border-neutral-800 bg-neutral-950/70 p-2">
                        <div className="text-xs text-gray-400 px-1 pb-2">Live Preview</div>
                        <div className="h-40 rounded overflow-hidden bg-black/40">
                          <DeploymentPreviewIframe
                            deployment={deployment}
                            variant="mini"
                            pointerEventsNone
                            title={`card-preview-${deployment._id || deployment.deploymentId || deployment.id}`}
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
                onClick={canDeploy ? onOpenDeployModal : undefined}
                disabled={!canDeploy}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                  canDeploy
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                <FaPlus className="w-4 h-4 mr-2 inline" />
                {isArchived ? "Unarchive to deploy" : "Create First Deployment"}
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
                  {(selectedDeployment.environment || selectedDeployment.config?.environment || "staging")} ·{" "}
                  <span className="text-gray-300">
                    {liveStatus?.status || selectedDeployment.status}
                  </span>
                  {liveStatus?.message ? (
                    <span className="block text-xs text-gray-500 mt-1 truncate">
                      {liveStatus.message}
                    </span>
                  ) : null}
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

            <div className="px-5 py-3 border-b border-neutral-800 flex flex-wrap gap-2">
              {isDeploymentActionAllowed(selectedDeployment, "restart") && (
                <button
                  type="button"
                  onClick={() => handleRestart(selectedDeployment)}
                  disabled={isActionBusy(selectedDeployment)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-300 text-xs disabled:opacity-50"
                >
                  <FaSync className="w-3 h-3" /> Restart
                </button>
              )}
              {isDeploymentActionAllowed(selectedDeployment, "stop") && (
                <button
                  type="button"
                  onClick={() => handleStop(selectedDeployment)}
                  disabled={isActionBusy(selectedDeployment)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-xs disabled:opacity-50"
                >
                  <FaStop className="w-3 h-3" /> Stop
                </button>
              )}
              {isDeploymentActionAllowed(selectedDeployment, "cancel") && (
                <button
                  type="button"
                  onClick={() => handleCancel(selectedDeployment)}
                  disabled={isActionBusy(selectedDeployment)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-200 text-xs disabled:opacity-50"
                >
                  <FaBan className="w-3 h-3" /> Cancel
                </button>
              )}
              {isDeploymentActionAllowed(selectedDeployment, "delete") && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedDeployment)}
                  disabled={isActionBusy(selectedDeployment)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-900/40 border border-red-500/30 rounded-lg text-red-200 text-xs disabled:opacity-50"
                >
                  <FaTrash className="w-3 h-3" /> Delete
                </button>
              )}
              <button
                type="button"
                onClick={handleDownloadLogs}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 text-xs"
              >
                <FaDownload className="w-3 h-3" /> Download
              </button>
              {(selectedDeployment.url || selectedDeployment.networking?.fullUrl) && (
                <a
                  href={selectedDeployment.url || selectedDeployment.networking?.fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-xs"
                >
                  <FaExternalLinkAlt className="w-3 h-3" /> Open site
                </a>
              )}
            </div>

            <div className="p-5 space-y-5">
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="bg-neutral-900/60 rounded-lg p-2">
                    <span className="text-gray-400">Deployment ID: </span>
                    <span className="text-white font-mono text-xs break-all">
                      {selectedDeployment.deploymentId || selectedDeployment.id}
                    </span>
                  </div>
                  <div className="bg-neutral-900/60 rounded-lg p-2">
                    <span className="text-gray-400">Health: </span>
                    <span className="text-white">
                      {isBuildPhase
                        ? "—"
                        : selectedDeployment.healthStatus === "unknown" && isRuntimeLive
                          ? "healthy"
                          : selectedDeployment.healthStatus || "—"}
                    </span>
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

                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Pipeline</h4>
                  <div className="space-y-2">
                    {(() => {
                      const currentStage = resolvePipelineStage(
                        effectivePipelineStage || "",
                      );
                      const stageIndex = stageOrder.indexOf(currentStage);
                      const isTerminalFailure = currentStage === "failed" || currentStage === "error";
                      const isCancelled = currentStage === "cancelled";
                      // For terminal failure we mark every stage that ran as done and
                      // the last known active stage as failed.
                      const lastActiveIdx = isTerminalFailure
                        ? (stageIndex >= 0 ? stageIndex : stageOrder.indexOf(
                            String(deriveStageFromLogs || "").toLowerCase()
                          ))
                        : -1;

                      return stageOrder.map((stage, index) => {
                        const isDone =
                          currentStage === "running"
                            ? true
                            : isTerminalFailure
                            ? index < (lastActiveIdx >= 0 ? lastActiveIdx : stageOrder.length)
                            : stageIndex > index;
                        const isFailedStage =
                          isTerminalFailure &&
                          (lastActiveIdx >= 0
                            ? index === lastActiveIdx
                            : index === stageOrder.length - 2);
                        const isActive = !isTerminalFailure && !isCancelled && stage === currentStage;

                        return (
                          <div
                            key={stage}
                            className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              {isFailedStage ? (
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
                            <span className={`text-xs ${isFailedStage ? "text-red-400" : "text-gray-400"}`}>
                              {isFailedStage ? "failed" : isDone ? "done" : isActive ? "running" : "pending"}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {isRuntimeLive && liveMetrics && !liveMetrics.unavailable && (
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Runtime Metrics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {liveMetrics.cpu_percent != null && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">CPU</span>
                            <span className="text-white">{Number(liveMetrics.cpu_percent).toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, liveMetrics.cpu_percent)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {liveMetrics.memory_percent != null && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">Memory</span>
                            <span className="text-white">{Number(liveMetrics.memory_percent).toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, liveMetrics.memory_percent)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {liveMetrics.uptime_seconds != null && (
                      <p className="text-xs text-gray-500 mt-2">
                        Uptime: {Math.floor(liveMetrics.uptime_seconds / 3600)}h {Math.floor((liveMetrics.uptime_seconds % 3600) / 60)}m
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-white">
                      {isBuildPhase ? "Build logs" : "Activity"}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {connected
                        ? isBuildPhase
                          ? "Build stream · connected"
                          : "Live · connected"
                        : "Disconnected"}
                    </span>
                  </div>
                  {isBuildPhase ? (
                    <p className="text-xs text-gray-500 mb-2">
                      Runtime metrics and container logs are on Analytics after deploy finishes.
                    </p>
                  ) : null}
                  <div
                    ref={logScrollContainerRef}
                    className="bg-black/70 border border-neutral-800 rounded-lg p-3 font-mono text-xs min-h-[280px] max-h-[48vh] overflow-y-auto overflow-x-hidden"
                  >
                    {logsLoading && (
                      <div className="text-blue-300 text-xs mb-2">Loading saved logs…</div>
                    )}
                    {!mergedPanelLogs.length && !logsLoading ? (
                      <div className="text-gray-500">
                        {isBuildPhase
                          ? "Build output will stream here while the image is built."
                          : "No activity yet."}
                      </div>
                    ) : null}
                    {mergedPanelLogs.map((log, idx) => {
                      const raw = log?.message;
                      const text =
                        raw == null
                          ? ""
                          : typeof raw === "string"
                            ? raw
                            : (() => {
                                try {
                                  return JSON.stringify(raw);
                                } catch {
                                  return String(raw);
                                }
                              })();
                      return (
                        <div key={`${idx}-${log.timestamp}`} className="mb-1 text-gray-300">
                          [{new Date(log.timestamp || Date.now()).toLocaleTimeString()}] {text}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {isRuntimeLive &&
                  (selectedDeployment.url || selectedDeployment.networking?.fullUrl) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white">Preview</h4>
                        <button
                          type="button"
                          onClick={() => dispatch(probeDeployment(selectedIdForApi))}
                          className="text-xs text-blue-300 hover:underline"
                        >
                          Refresh probe
                        </button>
                      </div>
                      <p className="text-xs text-yellow-200/90 bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                        Some apps block iframes (CSP). Use Open site if this stays blank.
                      </p>
                      {(selectedProbe?.probe?.preview?.contentType || "").includes("application/json") ? (
                        <pre className="text-xs text-gray-200 whitespace-pre-wrap max-h-[200px] overflow-auto border border-neutral-800 rounded p-2">
                          {typeof selectedProbe?.probe?.preview?.body === "string"
                            ? selectedProbe.probe.preview.body
                            : JSON.stringify(selectedProbe?.probe?.preview?.body || {}, null, 2)}
                        </pre>
                      ) : !iframeFailed ? (
                        <div className="h-64 sm:h-72 rounded-lg overflow-hidden border border-neutral-800 bg-black/40">
                          <DeploymentPreviewIframe
                            deployment={selectedDeployment}
                            liveStatus={liveStatus}
                            variant="fill"
                            className="w-full h-full min-h-[16rem] border-0"
                            title="deployment-preview-inline"
                            onError={() => setIframeFailed(true)}
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Preview unavailable in-frame.</p>
                      )}
                    </div>
                  )}
              </div>
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
