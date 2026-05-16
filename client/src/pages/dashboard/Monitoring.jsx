import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaRocket,
  FaProjectDiagram,
  FaBell,
  FaSyncAlt,
  FaSpinner,
  FaArrowRight,
  FaServer,
} from "react-icons/fa";
import SEO from "@components/SEO";
import { LoadingGrid } from "@components/LoadingSpinner";
import {
  fetchUserAnalytics,
  fetchProjects,
  fetchDeployments,
  fetchNotifications,
} from "@redux/index";

const BUILD_STALE_MS = 30 * 60 * 1000;
const LOW_UPTIME_THRESHOLD = 95;

const getDeploymentStatus = (deployment) =>
  deployment?.status || deployment?.deployment?.status || "unknown";

const getDeploymentProjectId = (deployment) => {
  const project = deployment?.project;
  if (project?._id) return String(project._id);
  if (project) return String(project);
  if (deployment?.projectId) return String(deployment.projectId);
  return null;
};

const getDeploymentProjectName = (deployment) =>
  deployment?.project?.name || deployment?.projectName || "Unknown project";

const formatRelativeTime = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const Monitoring = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("7d");
  const [refreshing, setRefreshing] = useState(false);

  const { userAnalytics, loading: analyticsLoading } = useSelector(
    (state) => state.analytics,
  );
  const { projects, loading: projectsLoading } = useSelector(
    (state) => state.projects,
  );
  const { deployments, loading: deploymentsLoading } = useSelector(
    (state) => state.deployments,
  );
  const { notifications, loading: notificationsLoading } = useSelector(
    (state) => state.notifications,
  );

  const loadData = useCallback(async () => {
    await Promise.all([
      dispatch(fetchUserAnalytics(timeRange)),
      dispatch(fetchProjects()),
      dispatch(fetchDeployments()),
      dispatch(fetchNotifications({ page: 1, limit: 10 })),
    ]);
  }, [dispatch, timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const overview = userAnalytics?.data?.overview || userAnalytics?.overview;
  const analyticsData = userAnalytics?.data || userAnalytics;

  const statusBreakdown = useMemo(() => {
    const counts = {
      running: 0,
      inProgress: 0,
      failed: 0,
      stopped: 0,
      other: 0,
    };

    (deployments || []).forEach((deployment) => {
      const status = getDeploymentStatus(deployment);
      if (status === "running" || status === "success" || status === "active") {
        counts.running += 1;
      } else if (
        ["building", "deploying", "pending", "queued"].includes(status)
      ) {
        counts.inProgress += 1;
      } else if (status === "failed" || status === "error") {
        counts.failed += 1;
      } else if (
        ["stopped", "cancelled", "canceled", "archived"].includes(status)
      ) {
        counts.stopped += 1;
      } else {
        counts.other += 1;
      }
    });

    return counts;
  }, [deployments]);

  const totalDeployments = deployments?.length || 0;

  const attentionItems = useMemo(() => {
    const items = [];
    const now = Date.now();

    (deployments || []).forEach((deployment) => {
      const status = getDeploymentStatus(deployment);
      const projectId = getDeploymentProjectId(deployment);
      const projectName = getDeploymentProjectName(deployment);
      const deploymentId =
        deployment._id || deployment.id || deployment.deploymentId;
      const label =
        deployment.subdomain ||
        deployment.config?.subdomain ||
        deploymentId ||
        "deployment";

      if (status === "failed" || status === "error") {
        items.push({
          id: `failed-${deploymentId}`,
          severity: "critical",
          title: `${projectName} — deployment failed`,
          detail: label,
          timestamp: deployment.updatedAt || deployment.createdAt,
          href: projectId
            ? `/dashboard/projects/${projectId}/deployments`
            : "/dashboard/deployments",
        });
        return;
      }

      if (["building", "deploying", "pending", "queued"].includes(status)) {
        const startedAt =
          deployment.buildStartedAt ||
          deployment.deployStartedAt ||
          deployment.createdAt;
        if (startedAt && now - new Date(startedAt).getTime() > BUILD_STALE_MS) {
          items.push({
            id: `stale-${deploymentId}`,
            severity: "warning",
            title: `${projectName} — build taking longer than expected`,
            detail: `${label} (${status})`,
            timestamp: startedAt,
            href: projectId
              ? `/dashboard/projects/${projectId}/deployments`
              : "/dashboard/deployments",
          });
        }
        return;
      }

      if (status === "running") {
        const errorRate = deployment.metrics?.errors?.rate ?? 0;
        const uptime = deployment.metrics?.uptime?.percentage;
        if (errorRate > 0) {
          items.push({
            id: `errors-${deploymentId}`,
            severity: "warning",
            title: `${projectName} — elevated error rate`,
            detail: `${label} (${Number(errorRate).toFixed(2)}% errors)`,
            timestamp: deployment.updatedAt || deployment.createdAt,
            href: projectId
              ? `/dashboard/projects/${projectId}/deployments`
              : "/dashboard/deployments",
          });
        } else if (
          uptime != null &&
          uptime < LOW_UPTIME_THRESHOLD
        ) {
          items.push({
            id: `uptime-${deploymentId}`,
            severity: "warning",
            title: `${projectName} — low uptime`,
            detail: `${label} (${uptime}% uptime)`,
            timestamp: deployment.updatedAt || deployment.createdAt,
            href: projectId
              ? `/dashboard/projects/${projectId}/deployments`
              : "/dashboard/deployments",
          });
        }
      }
    });

    return items
      .sort(
        (a, b) =>
          new Date(b.timestamp || 0).getTime() -
          new Date(a.timestamp || 0).getTime(),
      )
      .slice(0, 8);
  }, [deployments]);

  const projectHealthRows = useMemo(() => {
    const latestByProject = new Map();

    (deployments || []).forEach((deployment) => {
      const projectId = getDeploymentProjectId(deployment);
      if (!projectId) return;

      const ts = new Date(
        deployment.updatedAt || deployment.createdAt || 0,
      ).getTime();
      const existing = latestByProject.get(projectId);
      if (!existing || ts > existing.ts) {
        latestByProject.set(projectId, { deployment, ts });
      }
    });

    return (projects || [])
      .filter((p) => p.status !== "deleted")
      .map((project) => {
        const projectId = String(project._id);
        const latest = latestByProject.get(projectId);
        const latestDeployment = latest?.deployment;
        const deploymentStatus = latestDeployment
          ? getDeploymentStatus(latestDeployment)
          : null;

        return {
          id: projectId,
          name: project.name,
          projectStatus: project.status,
          deploymentStatus,
          lastDeploymentAt:
            latestDeployment?.updatedAt || latestDeployment?.createdAt,
          uptime: latestDeployment?.metrics?.uptime?.percentage,
        };
      })
      .sort((a, b) => {
        const aTime = a.lastDeploymentAt
          ? new Date(a.lastDeploymentAt).getTime()
          : 0;
        const bTime = b.lastDeploymentAt
          ? new Date(b.lastDeploymentAt).getTime()
          : 0;
        return bTime - aTime;
      });
  }, [projects, deployments]);

  const alertNotifications = useMemo(() => {
    const priorityTypes = /deploy|fail|error|alert|warning|build/i;
    return (notifications || [])
      .filter(
        (n) =>
          priorityTypes.test(n.type || "") ||
          priorityTypes.test(n.title || "") ||
          priorityTypes.test(n.message || ""),
      )
      .slice(0, 8);
  }, [notifications]);

  const recentNotifications = useMemo(() => {
    if (alertNotifications.length > 0) return alertNotifications;
    return (notifications || []).slice(0, 8);
  }, [alertNotifications, notifications]);

  const loading =
    analyticsLoading?.user ||
    projectsLoading?.projects ||
    deploymentsLoading?.fetch ||
    notificationsLoading?.fetch;

  const getStatusBadge = (status) => {
    const base = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "running":
      case "success":
      case "active":
        return `${base} bg-green-500/20 text-green-400 border border-green-500/30`;
      case "building":
      case "deploying":
        return `${base} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
      case "failed":
      case "error":
        return `${base} bg-red-500/20 text-red-400 border border-red-500/30`;
      case "pending":
      case "queued":
        return `${base} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
      default:
        return `${base} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "running":
      case "success":
      case "active":
        return <FaCheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
      case "error":
        return <FaExclamationTriangle className="w-4 h-4 text-red-500" />;
      case "building":
      case "deploying":
        return <FaClock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <FaClock className="w-4 h-4 text-gray-500" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const overviewCards = [
    {
      label: "Success rate",
      value: `${overview?.successRate ?? 0}%`,
      icon: FaCheckCircle,
      color: "text-green-400",
      bg: "bg-green-500/20",
    },
    {
      label: "Failed deployments",
      value: overview?.failedDeployments ?? 0,
      icon: FaExclamationTriangle,
      color: "text-red-400",
      bg: "bg-red-500/20",
    },
    {
      label: "Avg uptime",
      value: `${overview?.runtime?.avgUptime ?? analyticsData?.overview?.runtime?.avgUptime ?? 0}%`,
      icon: FaServer,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
    },
    {
      label: "Avg error rate",
      value: `${overview?.runtime?.avgErrorRate ?? analyticsData?.overview?.runtime?.avgErrorRate ?? 0}%`,
      icon: FaChartLine,
      color: "text-purple-400",
      bg: "bg-purple-500/20",
    },
  ];

  const statusSegments = [
    { key: "running", label: "Running", count: statusBreakdown.running, color: "bg-green-500" },
    {
      key: "inProgress",
      label: "In progress",
      count: statusBreakdown.inProgress,
      color: "bg-blue-500",
    },
    { key: "failed", label: "Failed", count: statusBreakdown.failed, color: "bg-red-500" },
    {
      key: "stopped",
      label: "Stopped",
      count: statusBreakdown.stopped,
      color: "bg-gray-500",
    },
  ];

  if (loading && !refreshing) {
    return (
      <div className="dashboard-page">
        <SEO page="monitoring" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white heading mb-2">
            Deployment Health
          </h1>
          <p className="text-gray-400 body">Loading operational status...</p>
        </motion.div>
        <LoadingGrid columns={4} />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <SEO page="monitoring" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3 heading">
              <FaChartLine className="text-blue-400" />
              Deployment Health
            </h1>
            <p className="text-gray-400 mt-2 body">
              Operational status across your projects and deployments
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-neutral-600 rounded-lg bg-neutral-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {refreshing ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaSyncAlt />
              )}
              Refresh
            </button>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {overviewCards.map((card) => (
            <div
              key={card.label}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <span className="text-sm text-gray-400">{card.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 heading">
            <FaRocket className="text-blue-400" />
            Deployment status
            <span className="text-sm font-normal text-gray-500">
              ({totalDeployments} total)
            </span>
          </h2>

          {totalDeployments === 0 ? (
            <p className="text-gray-400 text-sm body">
              No deployments yet. Create a project and deploy to see status here.
            </p>
          ) : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden bg-neutral-800 mb-4">
                {statusSegments.map((segment) =>
                  segment.count > 0 ? (
                    <div
                      key={segment.key}
                      className={`${segment.color} transition-all`}
                      style={{
                        width: `${(segment.count / totalDeployments) * 100}%`,
                      }}
                      title={`${segment.label}: ${segment.count}`}
                    />
                  ) : null,
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {statusSegments.map((segment) => (
                  <div
                    key={segment.key}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${segment.color}`}
                    />
                    <span>
                      {segment.label}:{" "}
                      <span className="text-white font-medium">
                        {segment.count}
                      </span>
                    </span>
                  </div>
                ))}
                {statusBreakdown.other > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-500" />
                    <span>
                      Other:{" "}
                      <span className="text-white font-medium">
                        {statusBreakdown.other}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            variants={itemVariants}
            className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 heading">
              <FaExclamationTriangle className="text-yellow-400" />
              Needs attention
            </h2>
            {attentionItems.length === 0 ? (
              <div className="flex items-center gap-3 text-green-400 text-sm">
                <FaCheckCircle />
                <span>All deployments look healthy</span>
              </div>
            ) : (
              <ul className="space-y-3">
                {attentionItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => navigate(item.href)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors hover:border-neutral-600 ${
                        item.severity === "critical"
                          ? "border-red-500/30 bg-red-500/10"
                          : "border-yellow-500/30 bg-yellow-500/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {item.detail}
                          </p>
                        </div>
                        <FaArrowRight className="w-3 h-3 text-gray-500 flex-shrink-0 mt-1" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatRelativeTime(item.timestamp)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 heading">
              <FaBell className="text-purple-400" />
              Recent alerts
            </h2>
            {recentNotifications.length === 0 ? (
              <p className="text-gray-400 text-sm body">No recent notifications.</p>
            ) : (
              <ul className="space-y-3">
                {recentNotifications.map((notification) => {
                  const id = notification._id || notification.id;
                  return (
                    <li
                      key={id}
                      className="p-3 rounded-lg border border-neutral-700/50 bg-neutral-800/30"
                    >
                      <p className="text-sm font-medium text-white">
                        {notification.title || notification.type || "Notification"}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(
                            notification.createdAt || notification.timestamp,
                          )}
                        </span>
                        {notification.action?.url && (
                          <a
                            href={notification.action.url}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        </div>

        <motion.div
          variants={itemVariants}
          className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 overflow-x-auto"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 heading">
            <FaProjectDiagram className="text-green-400" />
            Project health
          </h2>

          {projectHealthRows.length === 0 ? (
            <p className="text-gray-400 text-sm body">
              No projects yet.{" "}
              <button
                type="button"
                onClick={() => navigate("/dashboard/projects/create")}
                className="text-blue-400 hover:text-blue-300"
              >
                Create a project
              </button>
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-neutral-800">
                  <th className="pb-3 font-medium">Project</th>
                  <th className="pb-3 font-medium">Latest deployment</th>
                  <th className="pb-3 font-medium">Last activity</th>
                  <th className="pb-3 font-medium">Uptime</th>
                </tr>
              </thead>
              <tbody>
                {projectHealthRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/dashboard/projects/${row.id}`)}
                    className="border-b border-neutral-800/50 hover:bg-neutral-800/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <span className="text-white font-medium">{row.name}</span>
                      {row.projectStatus && row.projectStatus !== "active" && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({row.projectStatus})
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {row.deploymentStatus ? (
                        <span className="inline-flex items-center gap-1.5">
                          {getStatusIcon(row.deploymentStatus)}
                          <span className={getStatusBadge(row.deploymentStatus)}>
                            {row.deploymentStatus}
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-500">No deployments</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-400">
                      {formatRelativeTime(row.lastDeploymentAt)}
                    </td>
                    <td className="py-3 text-gray-300">
                      {row.uptime != null ? `${row.uptime}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Monitoring;
