import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useEnvironmentInfo from "@utils/useEnvironmentInfo";
import Spinner from "@components/Spinner";
import SEO from "@components/SEO.jsx";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaServer,
  FaDatabase,
  FaCode,
  FaCog,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaShieldAlt,
  FaMemory,
  FaUser,
  FaKey,
  FaSync,
  FaEye,
  FaArrowRight,
  FaDocker,
} from "react-icons/fa";
import { backend } from "../utils/api";

function Health() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Check if user is admin
  const isAdmin = user?.role === "admin";
  // Organized service states
  const [services, setServices] = useState({
    backend: {
      name: "Backend Service",
      icon: FaServer,
      color: "green",
      status: "unknown",
      uptime: 0,
      message: "",
      mongodb_status: "unknown",
      redis_status: "unknown",
    },
    fastapi: {
      name: "FastAPI AI Service",
      icon: FaCog,
      color: "blue",
      status: "unknown",
      uptime: 0,
      message: "",
      redis_status: "unknown",
    },
    agent: {
      name: "DeployIO Agent",
      icon: FaShieldAlt,
      color: "purple",
      status: "unknown",
      uptime: 0,
      message: "",
      docker_status: "unknown",
      mongodb_status: "unknown",
      version: "unknown",
      purpose: "unknown",
    },
  });

  const envInfo = useEnvironmentInfo();

  // Utility function to format uptime
  const formatUptime = (seconds) => {
    if (!seconds) return "0s";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }; // Get status indicator component
  const StatusIndicator = ({ status, type = "default" }) => {
    let isHealthy = false;

    if (type === "service") {
      isHealthy = status === "ok" || status === "healthy";
    } else {
      // For subservices (mongodb, redis, docker)
      isHealthy =
        status === "connected" || status === "ok" || status === "healthy";
    }

    return (
      <div className="flex items-center">
        {isHealthy ? (
          <FaCheckCircle className="text-green-400 mr-2" />
        ) : (
          <FaTimesCircle className="text-red-400 mr-2" />
        )}
        <span
          className={`capitalize ${
            isHealthy ? "text-green-400" : "text-red-400"
          }`}
        >
          {status || "Unknown"}
        </span>
      </div>
    );
  }; // Component for individual service card
  const ServiceCard = ({ serviceKey, service }) => {
    const IconComponent = service.icon;
    const colorClasses = {
      green: "bg-green-600/20 text-green-400",
      blue: "bg-blue-600/20 text-blue-400",
      purple: "bg-purple-600/20 text-purple-400",
    };

    const serviceNameMap = {
      backend: "backend",
      fastapi: "ai-service",
      agent: "agent",
    };

    const handleDetailClick = () => {
      if (isAdmin && serviceNameMap[serviceKey]) {
        navigate(`/health/${serviceNameMap[serviceKey]}`);
      }
    };

    return (
      <div className="p-4 md:p-5 backdrop-blur-lg rounded-xl border border-neutral-700 body shadow-lg bg-neutral-900/70 hover:bg-neutral-900 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div className="flex items-center">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center mr-3 ${
                colorClasses[service.color]
              }`}
            >
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-white heading truncate">
                {service.name}
              </h3>
              <p className="text-xs text-neutral-400">
                {serviceKey === "backend"
                  ? "Express.js API"
                  : serviceKey === "fastapi"
                  ? "AI Processing Service"
                  : "Container Management"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusIndicator status={service.status} type="service" />
            {isAdmin && (
              <button
                onClick={handleDetailClick}
                className="ml-2 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 hover:text-blue-300 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
                title="View detailed monitoring"
              >
                <FaEye className="h-3 w-3" />
                Details
              </button>
            )}
          </div>
        </div>

        {/* Service-specific status indicators */}
        <div className="space-y-3">
          {" "}
          {/* Database Status - Backend and Agent */}
          {(serviceKey === "backend" || serviceKey === "agent") && (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-neutral-400">
                <FaDatabase className="mr-2 text-neutral-500 flex-shrink-0" />
                <span>Database</span>
              </div>
              <StatusIndicator status={service.mongodb_status} />
            </div>
          )}
          {/* Redis Status - Backend and FastAPI */}
          {(serviceKey === "backend" || serviceKey === "fastapi") && (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-neutral-400">
                <FaMemory className="mr-2 text-neutral-500 flex-shrink-0" />
                <span>Redis Cache</span>
              </div>
              <StatusIndicator status={service.redis_status} />
            </div>
          )}
          {/* Docker Status - Agent only */}
          {serviceKey === "agent" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-neutral-400">
                <FaDocker className="mr-2 text-neutral-500 flex-shrink-0" />
                <span>Docker Engine</span>
              </div>
              <StatusIndicator status={service.docker_status} />
            </div>
          )}
          {/* Agent Version - Agent only */}
          {serviceKey === "agent" && service.version !== "unknown" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-neutral-400">
                <FaCode className="mr-2 text-neutral-500 flex-shrink-0" />
                <span>Version</span>
              </div>
              <div>
                <span className="text-white text-sm bg-neutral-800 px-2 py-1 rounded">
                  v{service.version}
                </span>
              </div>
            </div>
          )}
          {/* Uptime */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-neutral-400">
              <FaClock className="mr-2 text-neutral-500 flex-shrink-0" />
              <span>Uptime</span>
            </div>
            <div>
              <span className="text-white text-sm bg-neutral-800 px-2 py-1 rounded">
                {formatUptime(service.uptime)}
              </span>
            </div>
          </div>
          {/* Response Message or Purpose */}
          <div className="flex items-start justify-between">
            <div className="flex items-center text-sm text-neutral-400">
              <FaCode className="mr-2 text-neutral-500 flex-shrink-0 mt-0.5" />
              <span>{serviceKey === "agent" ? "Purpose" : "Response"}</span>
            </div>
            <div className="text-right max-w-xs">
              <span className="text-white text-sm italic break-words">
                &quot;
                {serviceKey === "agent" && service.purpose !== "unknown"
                  ? service.purpose
                  : service.message}
                &quot;
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const fetchStatuses = useCallback(async () => {
    try {
      const response = await backend.get("/health"); // Backend DB/Redis (from top-level response)
      const backendMongo = response.data.mongodb;
      const backendRedis = response.data.redis;

      // FastAPI
      const aiServiceData = response.data.services?.aiService;

      // Agent
      const agentServiceData = response.data.services?.deploymentAgent;

      setServices((prev) => ({
        backend: {
          ...prev.backend,
          status: response.data.status || "unknown",
          uptime: response.data.uptime || 0,
          message: `${response.data.service || "Backend"} v${
            response.data.version || "unknown"
          } (${response.data.environment || "unknown"})`,
          mongodb_status: backendMongo?.status || "unknown",
          redis_status: backendRedis?.status || "unknown",
        },
        fastapi: {
          ...prev.fastapi,
          status: aiServiceData?.status || "unknown",
          uptime: aiServiceData?.uptime || 0,
          message: `${aiServiceData?.service || "AI Service"} v${
            aiServiceData?.version || "unknown"
          }`,
          redis_status: aiServiceData?.services?.redis?.status || "unknown",
        },
        agent: {
          ...prev.agent,
          status: agentServiceData?.status || "unknown",
          uptime: agentServiceData?.uptime || 0,
          message: `${agentServiceData?.service || "Agent"} v${
            agentServiceData?.version || "unknown"
          }`,
          docker_status:
            agentServiceData?.services?.docker?.status || "unknown",
          mongodb_status:
            agentServiceData?.services?.mongodb?.status || "unknown",
          version: agentServiceData?.version || "unknown",
          purpose:
            agentServiceData?.purpose ||
            "Container management and deployment automation",
        },
      }));

      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Error fetching statuses");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={64} />
      </div>
    );

  return (
    <>
      <SEO page="health" />
      <div className="h-full overflow-auto p-6 body">
        <div className="max-w-6xl mx-auto">
          {" "}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1 heading flex items-center">
                <FaClipboardCheck className="mr-2 text-purple-400" />
                System Health Dashboard
              </h2>
              <p className="text-neutral-400 text-sm">
                Monitor the status and performance of all system components
              </p>
              {lastUpdated && (
                <p className="text-neutral-500 text-xs mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchStatuses(true)}
                disabled={refreshing}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg transition-colors duration-200 flex items-center text-sm"
              >
                <FaSync
                  className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
              {error ? (
                <div className="px-4 py-2 bg-red-900/30 border border-red-700/30 rounded-lg flex items-center">
                  <FaExclamationTriangle className="text-red-400 mr-2" />
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              ) : (
                <div className="px-4 py-2 bg-green-900/30 border border-green-700/30 rounded-lg flex items-center">
                  <FaCheckCircle className="text-green-400 mr-2" />
                  <span className="text-green-300 text-sm">
                    All Systems Operational
                  </span>
                </div>
              )}
            </div>{" "}
          </div>
          {/* Admin Features Banner */}
          {isAdmin && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaShieldAlt className="text-purple-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Admin Dashboard
                    </h3>{" "}
                    <p className="text-neutral-400 text-sm">
                      Advanced monitoring tools available - Click
                      &quot;Details&quot; on any service for comprehensive
                      monitoring
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-purple-400">
                  <FaArrowRight />
                  <span className="text-sm">Enhanced Access</span>
                </div>
              </div>
            </div>
          )}
          {/* Service Status Cards */}
          <div className="grid gap-6 mb-6 md:grid-cols-2">
            {Object.entries(services).map(([key, service]) => (
              <ServiceCard key={key} serviceKey={key} service={service} />
            ))}
          </div>
          {/* Authentication Status Section */}
          <div className="p-5 backdrop-blur-lg rounded-xl border border-neutral-700 body mb-6 bg-neutral-900/70">
            <div className="flex items-center mb-4">
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center mr-3 ${
                  isAuthenticated
                    ? "bg-green-600/20 text-green-400"
                    : "bg-red-600/20 text-red-400"
                }`}
              >
                {isAuthenticated ? (
                  <FaUser className="h-5 w-5" />
                ) : (
                  <FaKey className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white heading">
                  Authentication Status
                </h3>
                <p className="text-xs text-neutral-400">
                  Current user session and authentication state
                </p>
              </div>
              <div className="ml-auto">
                {isAuthenticated ? (
                  <span className="px-3 py-1 text-sm bg-green-900/30 text-green-400 rounded-full border border-green-700/30">
                    ✓ Authenticated
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm bg-red-900/30 text-red-400 rounded-full border border-red-700/30">
                    ✗ Not Authenticated
                  </span>
                )}
              </div>
            </div>

            {isAuthenticated && user ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">User ID</p>
                  <p className="text-sm text-white font-mono">
                    {user._id || user.id}
                  </p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">Username</p>
                  <p className="text-sm text-white font-mono">
                    {user.username}
                  </p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">Email</p>
                  <p className="text-sm text-white font-mono">{user.email}</p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">Role</p>
                  <p className="text-sm text-white font-mono">
                    {user.role || "User"}
                  </p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">
                    Session Active
                  </p>
                  <p className="text-sm text-green-400">✓ Valid Token</p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">Access Level</p>
                  <p className="text-sm text-white font-mono">
                    Protected Endpoints
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700 text-center">
                <p className="text-neutral-400 text-sm">
                  Please log in to view user details and test protected
                  endpoints
                </p>
              </div>
            )}
          </div>{" "}
          {/* Environment Information */}
          <div className="p-5 backdrop-blur-lg rounded-xl border border-neutral-700 body bg-neutral-900/70">
            <h3 className="text-lg font-semibold text-white mb-4 heading flex items-center">
              <FaCode className="mr-2 text-blue-400" />
              Environment Information
            </h3>

            {/* Environment Variables Section */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-white mb-3 flex items-center">
                <FaCog className="mr-2 text-green-400" />
                Environment Variables
              </h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">Environment</p>
                  <p className="text-sm text-white font-mono">
                    {envInfo.environment}
                  </p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">Mode</p>
                  <p className="text-sm text-white font-mono">{envInfo.mode}</p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">Backend URL</p>
                  <p className="text-sm text-white font-mono break-all">
                    {envInfo.backendUrl}
                  </p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">FastAPI URL</p>
                  <p className="text-sm text-white font-mono break-all">
                    {envInfo.fastapiUrl}
                  </p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">Build Version</p>
                  <p className="text-sm text-white font-mono">
                    {envInfo.version}
                  </p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">Build Time</p>
                  <p className="text-sm text-white font-mono">
                    {envInfo.buildTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Runtime Information Section */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-white mb-3 flex items-center">
                <FaServer className="mr-2 text-purple-400" />
                Runtime Information
              </h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">
                    Development Mode
                  </p>
                  <p className="text-sm text-white">
                    {envInfo.isDev ? (
                      <span className="text-yellow-400">✓ Enabled</span>
                    ) : (
                      <span className="text-green-400">✗ Disabled</span>
                    )}
                  </p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">
                    Production Mode
                  </p>
                  <p className="text-sm text-white">
                    {envInfo.isProd ? (
                      <span className="text-green-400">✓ Enabled</span>
                    ) : (
                      <span className="text-yellow-400">✗ Disabled</span>
                    )}
                  </p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">
                    Docker Container
                  </p>
                  <p className="text-sm text-white">
                    {envInfo.inDocker ? (
                      <span className="text-blue-400">✓ Running</span>
                    ) : (
                      <span className="text-neutral-400">✗ Local</span>
                    )}
                  </p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">Hostname</p>
                  <p className="text-sm text-white font-mono">
                    {envInfo.hostname}
                  </p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">Port</p>
                  <p className="text-sm text-white font-mono">
                    {envInfo.port || "Default"}
                  </p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">Protocol</p>
                  <p className="text-sm text-white font-mono">
                    {envInfo.protocol}
                  </p>
                </div>
              </div>
            </div>

            {/* Browser Information Section */}
            <div>
              <h4 className="text-md font-medium text-white mb-3 flex items-center">
                <FaMemory className="mr-2 text-orange-400" />
                Browser Information
              </h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">Platform</p>
                  <p className="text-sm text-white font-mono">
                    {envInfo.platform}
                  </p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  <p className="text-xs text-neutral-400 mb-1">Language</p>
                  <p className="text-sm text-white font-mono">
                    {envInfo.language}
                  </p>
                </div>
                <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700 md:col-span-2 lg:col-span-1">
                  <p className="text-xs text-neutral-400 mb-1">User Agent</p>
                  <p className="text-xs text-white font-mono break-all">
                    {envInfo.userAgent}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Health;
