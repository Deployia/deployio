import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import logStreamWebSocket from "@services/logStreamWebSocket";
import SEO from "@components/SEO";
import {
  FaArrowLeft,
  FaPlay,
  FaStop,
  FaDownload,
  FaCopy,
  FaTrash,
  FaServer,
  FaShieldAlt,
  FaBrain,
  FaMemory,
  FaNetworkWired,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaChartLine,
  FaTerminal,
  FaSearch,
  FaSyncAlt,
} from "react-icons/fa";
import { backend } from "../utils/api";

const ServiceDetailPage = () => {
  const { serviceName } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Service data state
  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  // Logs state
  const [logs, setLogs] = useState([]);
  const [isLogStreamActive, setIsLogStreamActive] = useState(false);
  const [logFilter, setLogFilter] = useState("");
  const [logLevel, setLogLevel] = useState("all");

  // Metrics state
  const [metrics, setMetrics] = useState(null);

  // Check authentication and admin role
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user?.role !== "admin") {
      navigate("/health");
      return;
    }
  }, [isAuthenticated, user, navigate]); // Valid service names
  const validServices = useMemo(() => ["backend", "ai-service", "agent"], []);

  const fetchServiceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch service details
      const serviceResponse = await backend.get(`/services/${serviceName}`);
      setServiceData(serviceResponse.data.data);

      // Fetch metrics
      const metricsResponse = await backend.get(
        `/services/${serviceName}/metrics`,
        {
          withCredentials: true,
        }
      );
      setMetrics(metricsResponse.data.data);

      // Fetch recent logs
      const logsResponse = await backend.get(
        `/services/${serviceName}/logs?lines=50`,
        {
          withCredentials: true,
        }
      );
      setLogs(logsResponse.data.data.logs || []);

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching service data:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [serviceName]);

  const stopLogStream = () => {
    if (isLogStreamActive) {
      const streamId = `${serviceName}-live`;
      logStreamWebSocket.stopStream(streamId);
      setIsLogStreamActive(false);
    }
  };
  useEffect(() => {
    if (!validServices.includes(serviceName)) {
      navigate("/health");
      return;
    }

    fetchServiceData();
  }, [serviceName, navigate, fetchServiceData, validServices]);

  // Setup WebSocket for real-time logs cleanup
  useEffect(() => {
    return () => {
      if (isLogStreamActive) {
        const streamId = `${serviceName}-live`;
        logStreamWebSocket.stopStream(streamId);
      }
    };
  }, [isLogStreamActive, serviceName]);
  const startLogStream = async () => {
    try {
      if (!logStreamWebSocket.getStatus().isConnected) {
        await logStreamWebSocket.connect();
      }
      const streamId = `${serviceName}-live`;
      logStreamWebSocket.startStream(streamId, serviceName, 0);

      // Listen for real-time logs
      logStreamWebSocket.on("stream_data", (data) => {
        if (data.streamId === streamId) {
          setLogs((prev) =>
            [
              ...prev,
              {
                id: Date.now() + Math.random(),
                timestamp: data.timestamp,
                level: data.data.level || "INFO",
                message: data.data.message || data.raw,
                raw: data.raw,
                source: "realtime",
              },
            ].slice(-1000)
          ); // Keep last 1000 logs
        }
      });

      setIsLogStreamActive(true);
    } catch (error) {
      console.error("Failed to start log stream:", error);
      setError("Failed to start real-time log streaming");
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logText = logs
      .map(
        (log) =>
          `[${new Date(log.timestamp).toISOString()}] [${log.level}] ${
            log.message
          }`
      )
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${serviceName}_logs_${new Date()
      .toISOString()
      .slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyLogs = async () => {
    const logText = logs
      .map(
        (log) =>
          `[${new Date(log.timestamp).toISOString()}] [${log.level}] ${
            log.message
          }`
      )
      .join("\n");

    try {
      await navigator.clipboard.writeText(logText);
    } catch (error) {
      console.error("Failed to copy logs:", error);
    }
  };

  const getServiceIcon = (service) => {
    switch (service) {
      case "backend":
        return FaServer;
      case "agent":
        return FaShieldAlt;
      case "ai-service":
        return FaBrain;
      default:
        return FaServer;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "ok":
        return "text-green-400";
      case "degraded":
      case "warning":
        return "text-yellow-400";
      case "unhealthy":
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "ok":
        return FaCheckCircle;
      case "degraded":
      case "warning":
        return FaExclamationTriangle;
      case "unhealthy":
      case "error":
        return FaTimesCircle;
      default:
        return FaInfoCircle;
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter =
      logFilter === "" ||
      log.message.toLowerCase().includes(logFilter.toLowerCase()) ||
      log.level.toLowerCase().includes(logFilter.toLowerCase());

    const matchesLevel =
      logLevel === "all" || log.level.toLowerCase() === logLevel.toLowerCase();

    return matchesFilter && matchesLevel;
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  if (!validServices.includes(serviceName)) {
    return null;
  }

  const ServiceIcon = getServiceIcon(serviceName);
  const StatusIcon = serviceData
    ? getStatusIcon(serviceData.status)
    : FaInfoCircle;
  return (
    <>
      <SEO
        title={`${serviceName} Service Details`}
        description={`Detailed monitoring view for ${serviceName} service`}
      />
      <div className="h-full overflow-auto p-6 body">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/health")}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-all duration-200 border border-neutral-700"
              >
                <FaArrowLeft size={14} />
                Back to Health
              </button>

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <ServiceIcon className="text-blue-400" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white heading capitalize">
                    {serviceName.replace("-", " ")} Service
                  </h1>
                  <p className="text-neutral-400 text-sm">
                    Detailed monitoring and real-time logs
                  </p>
                  {lastUpdated && (
                    <p className="text-neutral-500 text-xs">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={fetchServiceData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors duration-200"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700/30 rounded-lg flex items-center gap-2">
              <FaExclamationTriangle className="text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-neutral-400">Loading service details...</p>
              </div>
            </div>
          ) : serviceData ? (
            <div className="space-y-6">
              {/* Service Overview Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Card */}
                <div className="p-5 backdrop-blur-lg rounded-xl border border-neutral-700 bg-neutral-900/70">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        serviceData.status === "healthy" ||
                        serviceData.status === "ok"
                          ? "bg-green-600/20 text-green-400"
                          : serviceData.status === "degraded"
                          ? "bg-yellow-600/20 text-yellow-400"
                          : "bg-red-600/20 text-red-400"
                      }`}
                    >
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white heading">
                        Service Status
                      </h2>
                      <p className="text-xs text-neutral-400">
                        Current operational state
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Status</span>
                      <span
                        className={`text-sm font-medium capitalize ${getStatusColor(
                          serviceData.status
                        )}`}
                      >
                        {serviceData.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Version</span>
                      <span className="text-sm text-white bg-neutral-800 px-2 py-1 rounded">
                        v{serviceData.version || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">
                        Environment
                      </span>
                      <span className="text-sm text-white bg-neutral-800 px-2 py-1 rounded capitalize">
                        {serviceData.environment || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">Uptime</span>
                      <span className="text-sm text-white bg-neutral-800 px-2 py-1 rounded">
                        {formatUptime(serviceData.uptime || 0)}
                      </span>
                    </div>
                    {serviceData.responseTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">
                          Response Time
                        </span>
                        <span className="text-sm text-white bg-neutral-800 px-2 py-1 rounded">
                          {serviceData.responseTime}ms
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Memory Usage */}
                {serviceData.memory && (
                  <div className="p-5 backdrop-blur-lg rounded-xl border border-neutral-700 bg-neutral-900/70">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                        <FaMemory className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white heading">
                          Memory Usage
                        </h2>
                        <p className="text-xs text-neutral-400">
                          Current memory allocation
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {typeof serviceData.memory.used === "number" && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-400">Used</span>
                          <span className="text-sm text-white bg-neutral-800 px-2 py-1 rounded">
                            {serviceData.memory.used} MB
                          </span>
                        </div>
                      )}
                      {typeof serviceData.memory.total === "number" && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-400">
                            Total
                          </span>
                          <span className="text-sm text-white bg-neutral-800 px-2 py-1 rounded">
                            {serviceData.memory.total} MB
                          </span>
                        </div>
                      )}
                      {typeof serviceData.memory.heapUsed === "number" && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-400">
                            Heap Used
                          </span>
                          <span className="text-sm text-white bg-neutral-800 px-2 py-1 rounded">
                            {formatBytes(serviceData.memory.heapUsed)}
                          </span>
                        </div>
                      )}
                      {typeof serviceData.memory.heapTotal === "number" && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-400">
                            Heap Total
                          </span>
                          <span className="text-sm text-white bg-neutral-800 px-2 py-1 rounded">
                            {formatBytes(serviceData.memory.heapTotal)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* External Services */}
                {serviceData.services && (
                  <div className="p-5 backdrop-blur-lg rounded-xl border border-neutral-700 bg-neutral-900/70">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-green-600/20 text-green-400 flex items-center justify-center">
                        <FaNetworkWired className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white heading">
                          Dependencies
                        </h2>
                        <p className="text-xs text-neutral-400">
                          External service connections
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(serviceData.services).map(
                        ([service, info]) => (
                          <div
                            key={service}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center text-sm text-neutral-400">
                              <span className="capitalize">{service}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  info.status === "healthy" ||
                                  info.status === "ok"
                                    ? "bg-green-400"
                                    : "bg-red-400"
                                }`}
                              />
                              <span className="text-sm text-white capitalize">
                                {info.status || "unknown"}
                              </span>
                              {info.responseTime && (
                                <span className="text-xs text-neutral-500">
                                  ({info.responseTime}ms)
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>{" "}
              {/* Real-time Logs Section */}
              <div className="p-5 backdrop-blur-lg rounded-xl border border-neutral-700 bg-neutral-900/70">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-600/20 text-green-400 flex items-center justify-center">
                      <FaTerminal className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white heading">
                        Real-time Logs
                      </h2>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isLogStreamActive
                              ? "bg-green-400"
                              : "bg-neutral-400"
                          }`}
                        />
                        <span
                          className={`text-xs ${
                            isLogStreamActive
                              ? "text-green-400"
                              : "text-neutral-400"
                          }`}
                        >
                          {isLogStreamActive
                            ? "Live Stream Active"
                            : "Static Logs"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={logLevel}
                      onChange={(e) => setLogLevel(e.target.value)}
                      className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white"
                    >
                      <option value="all">All Levels</option>
                      <option value="error">Error</option>
                      <option value="warn">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>

                    <div className="relative">
                      <FaSearch
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"
                        size={12}
                      />
                      <input
                        type="text"
                        value={logFilter}
                        onChange={(e) => setLogFilter(e.target.value)}
                        placeholder="Filter logs..."
                        className="pl-8 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white w-48 placeholder-neutral-400"
                      />
                    </div>

                    <button
                      onClick={copyLogs}
                      className="p-2 text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-neutral-800"
                      title="Copy logs"
                    >
                      <FaCopy size={14} />
                    </button>
                    <button
                      onClick={exportLogs}
                      className="p-2 text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-neutral-800"
                      title="Export logs"
                    >
                      <FaDownload size={14} />
                    </button>
                    <button
                      onClick={clearLogs}
                      className="p-2 text-neutral-400 hover:text-red-400 transition-colors rounded-lg hover:bg-neutral-800"
                      title="Clear logs"
                    >
                      <FaTrash size={14} />
                    </button>

                    {!isLogStreamActive ? (
                      <button
                        onClick={startLogStream}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <FaPlay size={12} />
                        Start Live
                      </button>
                    ) : (
                      <button
                        onClick={stopLogStream}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <FaStop size={12} />
                        Stop Stream
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-96 overflow-y-auto bg-black/50 rounded-lg border border-neutral-700 p-4 font-mono text-sm">
                  {filteredLogs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-neutral-500">
                      <FaInfoCircle className="mr-2" />
                      No logs available
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-2 py-1 hover:bg-neutral-800/30 rounded px-2"
                        >
                          <span className="text-neutral-500 text-xs min-w-fit">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span
                            className={`text-xs min-w-fit font-medium uppercase px-2 py-1 rounded ${
                              log.level.toLowerCase() === "error"
                                ? "bg-red-900/50 text-red-400"
                                : log.level.toLowerCase() === "warn"
                                ? "bg-yellow-900/50 text-yellow-400"
                                : log.level.toLowerCase() === "info"
                                ? "bg-blue-900/50 text-blue-400"
                                : log.level.toLowerCase() === "debug"
                                ? "bg-purple-900/50 text-purple-400"
                                : "bg-neutral-800/50 text-neutral-400"
                            }`}
                          >
                            {log.level}
                          </span>
                          <span className="text-neutral-300 flex-1 break-all">
                            {log.message}
                          </span>
                          {log.source === "realtime" && (
                            <span className="text-green-400 text-xs">●</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Additional Metrics */}
              {metrics && (
                <div className="p-5 backdrop-blur-lg rounded-xl border border-neutral-700 bg-neutral-900/70">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-yellow-600/20 text-yellow-400 flex items-center justify-center">
                      <FaChartLine className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white heading">
                        Performance Metrics
                      </h2>
                      <p className="text-xs text-neutral-400">
                        Additional service performance data
                      </p>
                    </div>
                  </div>
                  <pre className="text-xs text-neutral-300 bg-black/30 p-4 rounded-lg border border-neutral-700 overflow-auto">
                    {JSON.stringify(metrics, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-[400px] flex items-center justify-center">
              {" "}
              <div className="text-center">
                <FaExclamationTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-neutral-400">No service data available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ServiceDetailPage;
