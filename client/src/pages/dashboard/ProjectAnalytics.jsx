import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useOutletContext } from "react-router-dom";
import { FaDownload, FaFilter } from "react-icons/fa";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  fetchDeploymentLogs,
  fetchProjectDeployments,
} from "../../redux/slices/deploymentSlice";
import useDeploymentStream from "../../hooks/useDeploymentStream";

const LEVELS = ["all", "info", "warning", "error"];

const ProjectAnalytics = () => {
  const dispatch = useDispatch();
  const { project } = useOutletContext() || {};
  const projectId = project?._id || project?.id;
  const deployments = useSelector((state) => state.deployments.projectDeployments || []);
  const buildLogs = useSelector((state) => state.deployments.logs || []);
  const logsLoading = useSelector((state) => state.deployments.loading.logs);

  const [mode, setMode] = useState("runtime");
  const [selectedDeploymentId, setSelectedDeploymentId] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [chartPoints, setChartPoints] = useState([]);

  const { connected, liveLogs, liveMetrics } = useDeploymentStream(selectedDeploymentId);

  useEffect(() => {
    if (!projectId) return;
    dispatch(fetchProjectDeployments(projectId));
  }, [dispatch, projectId]);

  useEffect(() => {
    if (!selectedDeploymentId && deployments.length > 0) {
      const firstId =
        deployments[0]._id || deployments[0].id || deployments[0].deploymentId || "";
      setSelectedDeploymentId(firstId);
    }
  }, [deployments, selectedDeploymentId]);

  useEffect(() => {
    if (!selectedDeploymentId || mode !== "build") return;
    dispatch(fetchDeploymentLogs({ deploymentId: selectedDeploymentId, params: { lines: 500 } }));
  }, [dispatch, mode, selectedDeploymentId]);

  useEffect(() => {
    if (!liveMetrics) return;
    setChartPoints((prev) => {
      const point = {
        time: new Date().toLocaleTimeString(),
        cpu: liveMetrics.cpu?.usagePercent || liveMetrics.cpu || 0,
        memory: liveMetrics.memory?.usagePercent || liveMetrics.memory || 0,
      };
      return [...prev.slice(-29), point];
    });
  }, [liveMetrics]);

  const baseLogs = mode === "runtime" ? liveLogs : buildLogs;
  const normalizedLogs = Array.isArray(baseLogs) ? baseLogs : [];
  const filteredLogs = useMemo(
    () =>
      normalizedLogs.filter((item) => {
        const level = String(item.level || "info").toLowerCase();
        const message = String(item.message || "");
        const levelMatch = levelFilter === "all" || level === levelFilter;
        const queryMatch =
          !search.trim() || message.toLowerCase().includes(search.trim().toLowerCase());
        return levelMatch && queryMatch;
      }),
    [levelFilter, normalizedLogs, search],
  );

  const downloadLogs = () => {
    const content = filteredLogs
      .map(
        (log) =>
          `[${new Date(log.timestamp || Date.now()).toISOString()}] ${log.level || "info"} ${log.message || ""}`,
      )
      .join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${selectedDeploymentId || "deployment"}-${mode}-logs.txt`;
    link.click();
    URL.revokeObjectURL(href);
  };

  const projectStats = project?.statistics || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Logs & Metrics</h2>
          <p className="text-gray-400">
            Stream container logs and monitor uptime, CPU, and memory in real time.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("runtime")}
            className={`px-3 py-2 rounded-lg text-sm ${mode === "runtime" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-neutral-800 text-gray-300"}`}
          >
            Runtime Logs
          </button>
          <button
            type="button"
            onClick={() => setMode("build")}
            className={`px-3 py-2 rounded-lg text-sm ${mode === "build" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-neutral-800 text-gray-300"}`}
          >
            Build Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase">Total Deployments</p>
          <p className="text-2xl font-semibold text-white">{projectStats.totalDeployments || 0}</p>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase">Success Rate</p>
          <p className="text-2xl font-semibold text-white">
            {projectStats.totalDeployments
              ? Math.round(
                  ((projectStats.successfulDeployments || 0) / projectStats.totalDeployments) *
                    100,
                )
              : 0}
            %
          </p>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase">Uptime</p>
          <p className="text-2xl font-semibold text-white">{projectStats.uptime || 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <select
              value={selectedDeploymentId}
              onChange={(e) => setSelectedDeploymentId(e.target.value)}
              className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
            >
              {deployments.map((deployment) => {
                const deploymentId =
                  deployment._id || deployment.id || deployment.deploymentId || "";
                return (
                  <option key={deploymentId} value={deploymentId}>
                    {deployment.environment || deployment.config?.environment || "staging"} •{" "}
                    {deployment.status}
                  </option>
                );
              })}
            </select>
            <div className="flex items-center gap-2">
              <FaFilter className="w-3 h-3 text-gray-400" />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-2 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs"
              className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm flex-1 min-w-[140px]"
            />
            <button
              type="button"
              onClick={downloadLogs}
              className="px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm flex items-center gap-2"
            >
              <FaDownload className="w-3 h-3" />
              Download
            </button>
          </div>
          <div className="bg-black/70 border border-neutral-800 rounded-lg p-3 h-[360px] overflow-auto font-mono text-xs">
            {logsLoading && mode === "build" && <div className="text-blue-300">Loading logs...</div>}
            {!filteredLogs.length && !logsLoading && (
              <div className="text-gray-500">No logs available for this deployment.</div>
            )}
            {filteredLogs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">
                  [{new Date(log.timestamp || Date.now()).toLocaleTimeString()}]
                </span>{" "}
                <span className="text-gray-300">{log.message || String(log)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-3">
          <h3 className="text-white font-semibold">Live Status</h3>
          <p className="text-sm text-gray-300">
            WebSocket:{" "}
            <span className={connected ? "text-green-300" : "text-red-300"}>
              {connected ? "Connected" : "Disconnected"}
            </span>
          </p>
          <p className="text-sm text-gray-300">Mode: {mode === "runtime" ? "Container" : "Build"}</p>
          <p className="text-sm text-gray-300">
            Selected Deployment: {selectedDeploymentId || "None"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 h-[300px]">
          <h3 className="text-white font-semibold mb-3">CPU Usage %</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={chartPoints}>
              <XAxis dataKey="time" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="cpu" stroke="#60A5FA" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 h-[300px]">
          <h3 className="text-white font-semibold mb-3">Memory Usage %</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={chartPoints}>
              <XAxis dataKey="time" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="memory"
                stroke="#34D399"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalytics;
