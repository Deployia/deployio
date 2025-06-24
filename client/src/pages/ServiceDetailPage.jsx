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
import axios from "axios";

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
      const serviceResponse = await axios.get(
        `http://localhost:3000/health/service/${serviceName}`,
        {
          withCredentials: true,
        }
      );
      setServiceData(serviceResponse.data.data);

      // Fetch metrics
      const metricsResponse = await axios.get(
        `http://localhost:3000/health/service/${serviceName}/metrics`,
        {
          withCredentials: true,
        }
      );
      setMetrics(metricsResponse.data.data);

      // Fetch recent logs
      const logsResponse = await axios.get(
        `http://localhost:3000/health/service/${serviceName}/logs?lines=50`,
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
    <div className="min-h-screen bg-black text-white">
      <SEO
        title={`${serviceName} Service Details`}
        description={`Detailed monitoring view for ${serviceName} service`}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/health")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            <FaArrowLeft size={14} />
            Back to Health
          </button>

          <div className="flex items-center gap-3">
            <ServiceIcon className="text-blue-400" size={32} />
            <div>
              <h1 className="text-3xl font-bold capitalize">
                {serviceName.replace("-", " ")} Service
              </h1>
              <p className="text-gray-400">
                Detailed monitoring and real-time logs
              </p>
            </div>
          </div>

          <button
            onClick={fetchServiceData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors ml-auto"
          >
            <FaSyncAlt />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded text-red-400 flex items-center gap-2">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading service details...</p>
          </div>
        ) : serviceData ? (
          <div className="space-y-8">
            {/* Service Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status Card */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <StatusIcon
                    className={getStatusColor(serviceData.status)}
                    size={24}
                  />
                  <h2 className="text-xl font-semibold">Service Status</h2>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span
                      className={`font-medium capitalize ${getStatusColor(
                        serviceData.status
                      )}`}
                    >
                      {serviceData.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Version:</span>
                    <span>{serviceData.version || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Environment:</span>
                    <span className="capitalize">
                      {serviceData.environment || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Uptime:</span>
                    <span>{formatUptime(serviceData.uptime || 0)}</span>
                  </div>
                  {serviceData.responseTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Response Time:</span>
                      <span>{serviceData.responseTime}ms</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Memory Usage */}
              {serviceData.memory && (
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FaMemory className="text-purple-400" size={24} />
                    <h2 className="text-xl font-semibold">Memory Usage</h2>
                  </div>
                  <div className="space-y-2">
                    {typeof serviceData.memory.used === "number" && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Used:</span>
                        <span>{serviceData.memory.used} MB</span>
                      </div>
                    )}
                    {typeof serviceData.memory.total === "number" && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total:</span>
                        <span>{serviceData.memory.total} MB</span>
                      </div>
                    )}
                    {typeof serviceData.memory.heapUsed === "number" && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Heap Used:</span>
                        <span>{formatBytes(serviceData.memory.heapUsed)}</span>
                      </div>
                    )}
                    {typeof serviceData.memory.heapTotal === "number" && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Heap Total:</span>
                        <span>{formatBytes(serviceData.memory.heapTotal)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* External Services */}
              {serviceData.services && (
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FaNetworkWired className="text-green-400" size={24} />
                    <h2 className="text-xl font-semibold">Dependencies</h2>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(serviceData.services).map(
                      ([service, info]) => (
                        <div
                          key={service}
                          className="flex justify-between items-center"
                        >
                          <span className="text-gray-400 capitalize">
                            {service}:
                          </span>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                info.status === "healthy" ||
                                info.status === "ok"
                                  ? "bg-green-400"
                                  : "bg-red-400"
                              }`}
                            />
                            <span className="text-sm capitalize">
                              {info.status || "unknown"}
                            </span>
                            {info.responseTime && (
                              <span className="text-xs text-gray-500">
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
            </div>

            {/* Real-time Logs Section */}
            <div className="bg-gray-900 rounded-lg border border-gray-800">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaTerminal className="text-green-400" />
                  <h2 className="text-xl font-semibold">Real-time Logs</h2>
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${
                      isLogStreamActive
                        ? "bg-green-900 text-green-400"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isLogStreamActive ? "bg-green-400" : "bg-gray-400"
                      }`}
                    />
                    {isLogStreamActive ? "Live" : "Static"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 mr-4">
                    <select
                      value={logLevel}
                      onChange={(e) => setLogLevel(e.target.value)}
                      className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                    >
                      <option value="all">All Levels</option>
                      <option value="error">Error</option>
                      <option value="warn">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>

                    <div className="relative">
                      <FaSearch
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={12}
                      />
                      <input
                        type="text"
                        value={logFilter}
                        onChange={(e) => setLogFilter(e.target.value)}
                        placeholder="Filter logs..."
                        className="pl-8 pr-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm w-48"
                      />
                    </div>
                  </div>

                  <button
                    onClick={copyLogs}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Copy logs"
                  >
                    <FaCopy size={14} />
                  </button>
                  <button
                    onClick={exportLogs}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Export logs"
                  >
                    <FaDownload size={14} />
                  </button>
                  <button
                    onClick={clearLogs}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Clear logs"
                  >
                    <FaTrash size={14} />
                  </button>

                  {!isLogStreamActive ? (
                    <button
                      onClick={startLogStream}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                    >
                      <FaPlay size={12} />
                      Start Live Stream
                    </button>
                  ) : (
                    <button
                      onClick={stopLogStream}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                    >
                      <FaStop size={12} />
                      Stop Stream
                    </button>
                  )}
                </div>
              </div>

              <div className="h-96 overflow-y-auto bg-black/50 p-4 font-mono text-sm">
                {filteredLogs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <FaInfoCircle className="mr-2" />
                    No logs available
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-2 py-1 hover:bg-gray-800/30"
                      >
                        <span className="text-gray-500 text-xs min-w-fit">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span
                          className={`text-xs min-w-fit font-medium uppercase px-1 rounded ${
                            log.level.toLowerCase() === "error"
                              ? "bg-red-900 text-red-400"
                              : log.level.toLowerCase() === "warn"
                              ? "bg-yellow-900 text-yellow-400"
                              : log.level.toLowerCase() === "info"
                              ? "bg-blue-900 text-blue-400"
                              : log.level.toLowerCase() === "debug"
                              ? "bg-purple-900 text-purple-400"
                              : "bg-gray-800 text-gray-400"
                          }`}
                        >
                          {log.level}
                        </span>
                        <span className="text-gray-300 flex-1 break-all">
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
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaChartLine className="text-yellow-400" />
                  <h2 className="text-xl font-semibold">Performance Metrics</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(metrics).map(([key, value]) => (
                    <div key={key} className="bg-gray-800 rounded p-4">
                      <div className="text-sm text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </div>
                      <div className="text-lg font-semibold">
                        {typeof value === "object"
                          ? JSON.stringify(value, null, 2)
                          : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lastUpdated && (
              <div className="text-center text-gray-500 text-sm">
                Last updated: {lastUpdated.toLocaleString()}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ServiceDetailPage;
