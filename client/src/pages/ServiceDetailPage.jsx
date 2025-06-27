import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import ServiceLogs from "@components/ServiceLogs";
import ServiceMetrics from "@components/ServiceMetrics";
import SEO from "@components/SEO";
import { LoadingState, InlineSpinner } from "@components/ui/Spinner";
import {
  FaArrowLeft,
  FaServer,
  FaShieldAlt,
  FaBrain,
  FaMemory,
  FaNetworkWired,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
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
  // Logs state for initial load
  const [logs, setLogs] = useState([]);

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

      // Fetch all data in parallel for better performance
      const requests = [
        // Service details
        backend
          .get(`/health/services/${serviceName}`)
          .then((response) => {
            setServiceData(response.data.data);
            return response;
          })
          .catch((err) => {
            throw err;
          }),

        // Recent logs
        backend
          .get(`/health/services/${serviceName}/logs?lines=50`, {
            withCredentials: true,
          })
          .then((response) => {
            setLogs(response.data.data.logs || []);
            return response;
          })
          .catch((err) => {
            console.warn(`Failed to fetch logs for ${serviceName}:`, err);
            return null; // Don't fail the whole request for logs
          }),
      ];

      // Wait for the main service data (required), but don't block on metrics/logs
      await requests[0];

      // Continue with other requests in background
      Promise.allSettled(requests.slice(1));

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching service data:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [serviceName]);

  useEffect(() => {
    if (!validServices.includes(serviceName)) {
      navigate("/health");
      return;
    }

    fetchServiceData();
  }, [serviceName, navigate, fetchServiceData, validServices]);

  // Add custom CSS for scrollbar styling (needed for the components)
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(31, 31, 31, 0.8);
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #525252;
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #737373;
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #525252 rgba(31, 31, 31, 0.8);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
            </div>{" "}
            <button
              onClick={fetchServiceData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors duration-200"
            >
              {loading ? (
                <InlineSpinner size="sm" color="white" />
              ) : (
                <FaSyncAlt />
              )}
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700/30 rounded-lg flex items-center gap-2">
              <FaExclamationTriangle className="text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
          )}{" "}
          {loading && !serviceData ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <LoadingState
                text="Loading service details..."
                size="lg"
                color="blue"
              />
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
                      {typeof serviceData.memory.usage === "number" && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-400">
                            Usage
                          </span>
                          <span className="text-sm text-white bg-neutral-800 px-2 py-1 rounded">
                            {serviceData.memory.usage}%
                          </span>
                        </div>
                      )}
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
                      {typeof serviceData.memory.available === "number" && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-400">
                            Available
                          </span>
                          <span className="text-sm text-white bg-neutral-800 px-2 py-1 rounded">
                            {serviceData.memory.available} MB
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
              <ServiceLogs
                serviceName={serviceName}
                initialLogs={logs}
                onLogsChange={setLogs}
              />{" "}
              {/* Real-time Metrics */}
              <ServiceMetrics
                serviceName={serviceName}
                formatUptime={formatUptime}
              />
            </div>
          ) : (
            <div className="min-h-[400px] flex items-center justify-center">
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
