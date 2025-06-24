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
  FaCopy,
  FaEye,
  FaArrowRight,
} from "react-icons/fa";
import axios from "axios";

function Health() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  // Copy feedback state
  const [copyFeedback, setCopyFeedback] = useState({
    show: false,
    message: "",
    type: "success",
  });

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
      protectedData: null,
      protectedError: null,
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
      version: "unknown",
      purpose: "unknown",
    },
  });

  const envInfo = useEnvironmentInfo();
  // Copy to clipboard function
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback({
        show: true,
        message: "JSON copied to clipboard!",
        type: "success",
      });

      // Hide feedback after 3 seconds
      setTimeout(() => {
        setCopyFeedback({ show: false, message: "", type: "success" });
      }, 3000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      setCopyFeedback({
        show: true,
        message: "Failed to copy JSON",
        type: "error",
      });

      // Hide error feedback after 5 seconds
      setTimeout(() => {
        setCopyFeedback({ show: false, message: "", type: "success" });
      }, 5000);
    }
  };

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
      isHealthy = status === "connected" || status === "ok";
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
          {/* Database Status - Only show for backend */}
          {serviceKey === "backend" && (
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
                <FaServer className="mr-2 text-neutral-500 flex-shrink-0" />
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
  const fetchStatuses = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        // Backend health check
        const beHealth = await axios.get("http://localhost:3000/health");

        // Update backend service state
        setServices((prev) => ({
          ...prev,
          backend: {
            ...prev.backend,
            status: beHealth.data.status || "unknown",
            uptime: beHealth.data.uptime || 0,
            message: `${beHealth.data.service || "Backend"} v${
              beHealth.data.version || "unknown"
            } (${beHealth.data.environment || "unknown"})`,
            mongodb_status:
              beHealth.data.services?.database?.status || "unknown",
            redis_status: beHealth.data.services?.redis?.status || "unknown",
            memory: beHealth.data.memory || {},
            version: beHealth.data.version || "unknown",
            responseTime: beHealth.data.responseTime || 0,
          },
        }));

        // Update FastAPI AI Service from backend health response
        const aiServiceData = beHealth.data.services?.aiService;
        if (aiServiceData) {
          setServices((prev) => ({
            ...prev,
            fastapi: {
              ...prev.fastapi,
              status: aiServiceData.status || "unknown",
              uptime: aiServiceData.uptime || 0,
              message: `AI Service v${aiServiceData.version || "unknown"}`,
              redis_status: "unknown", // AI service redis status not reported
              memory: {},
              responseTime: aiServiceData.responseTime || 0,
            },
          }));
        } else {
          setServices((prev) => ({
            ...prev,
            fastapi: {
              ...prev.fastapi,
              status: "unhealthy",
              message: "Service not detected by backend",
              redis_status: "unknown",
            },
          }));
        } // Update DeployIO Agent from backend health response first
        const agentServiceData = beHealth.data.services?.deploymentAgent;
        if (agentServiceData) {
          setServices((prev) => ({
            ...prev,
            agent: {
              ...prev.agent,
              status: agentServiceData.status || "unknown",
              uptime: agentServiceData.uptime || 0,
              message: `Agent v${
                agentServiceData.version || "unknown"
              } (via backend)`,
              docker_status:
                agentServiceData.services?.docker?.status || "unknown",
              version: agentServiceData.version || "unknown",
              purpose: "Container management and deployment automation",
              memory: {},
              responseTime: agentServiceData.responseTime || 0,
              services: agentServiceData.services || {},
            },
          }));
        } else {
          // Try direct connection to agent if backend doesn't have info
          try {
            const agentUrl = "https://agent.deployio.tech";
            const agentResponse = await fetch(`${agentUrl}/agent/v1/health`, {
              method: "GET",
              headers: {
                Accept: "application/json",
                "User-Agent": "DeployIO-Frontend-HealthCheck/1.0",
              },
              signal: AbortSignal.timeout(10000), // 10 second timeout
            });

            if (agentResponse.ok) {
              const agentHealth = await agentResponse.json();
              setServices((prev) => ({
                ...prev,
                agent: {
                  ...prev.agent,
                  status: agentHealth.status || "unknown",
                  uptime: agentHealth.uptime || 0,
                  message: `Agent v${
                    agentHealth.version || "unknown"
                  } (direct)`,
                  docker_status:
                    agentHealth.services?.docker?.status || "unknown",
                  version: agentHealth.version || "unknown",
                  purpose:
                    agentHealth.purpose ||
                    "Container management and deployment automation",
                  memory: agentHealth.memory || {},
                  responseTime: agentHealth.responseTime || 0,
                  services: agentHealth.services || {},
                },
              }));
            } else {
              throw new Error(
                `Agent responded with status ${agentResponse.status}`
              );
            }
          } catch (agentError) {
            console.warn("Agent health check failed:", agentError);
            setServices((prev) => ({
              ...prev,
              agent: {
                ...prev.agent,
                status: "unhealthy",
                message: agentError.message || "Service unavailable",
                docker_status: "unknown",
                purpose: "Container management and deployment automation",
              },
            }));
          }
        } // Test protected endpoints if authenticated
        if (isAuthenticated) {
          // Test Backend protected endpoint
          try {
            const backendProtectedResponse = await axios.get(
              "http://localhost:3000/protected/data"
            );
            setServices((prev) => ({
              ...prev,
              backend: {
                ...prev.backend,
                protectedData: backendProtectedResponse.data,
                protectedError: null,
              },
            }));
          } catch (backendProtectedErr) {
            setServices((prev) => ({
              ...prev,
              backend: {
                ...prev.backend,
                protectedData: null,
                protectedError:
                  backendProtectedErr.response?.data?.message ||
                  backendProtectedErr.message,
              },
            }));
          }
        }

        setLastUpdated(new Date());
      } catch (err) {
        setError(err.message || "Error fetching statuses");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated]
  );

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
          {/* Copy Feedback Notification */}
          {copyFeedback.show && (
            <div
              className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
                copyFeedback.type === "success"
                  ? "bg-green-900/90 border border-green-700/50 text-green-300"
                  : "bg-red-900/90 border border-red-700/50 text-red-300"
              }`}
            >
              <div className="flex items-center">
                {copyFeedback.type === "success" ? (
                  <FaCheckCircle className="mr-2 text-green-400" />
                ) : (
                  <FaExclamationTriangle className="mr-2 text-red-400" />
                )}
                <span className="text-sm font-medium">
                  {copyFeedback.message}
                </span>
              </div>
            </div>
          )}
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
          {/* Protected Endpoint Testing Section */}
          {isAuthenticated && (
            <div className="p-5 backdrop-blur-lg rounded-xl border border-neutral-700 body mb-6 bg-neutral-900/70">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center mr-3 bg-orange-600/20 text-orange-400">
                  <FaShieldAlt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white heading">
                    Protected Endpoint Testing
                  </h3>{" "}
                  <p className="text-xs text-neutral-400">
                    Testing authenticated API access to the Express backend
                    service
                  </p>
                </div>
              </div>{" "}
              {/* Backend Protected Endpoint */}
              <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaServer className="mr-2 text-green-500" />
                    <div>
                      <h4 className="text-md font-medium text-white">
                        Backend Service
                      </h4>
                      <p className="text-xs text-neutral-400">
                        /protected/data
                      </p>
                    </div>
                  </div>
                  <div>
                    {services.backend.protectedError ? (
                      <span className="px-2 py-1 text-xs bg-red-900/30 text-red-400 rounded">
                        ✗ Failed
                      </span>
                    ) : services.backend.protectedData ? (
                      <span className="px-2 py-1 text-xs bg-green-900/30 text-green-400 rounded">
                        ✓ Success
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-neutral-700 text-neutral-400 rounded">
                        Not tested
                      </span>
                    )}
                  </div>
                </div>{" "}
                {services.backend.protectedData && (
                  <div className="space-y-3">
                    {/* JSON Response Display */}
                    <div className="p-3 bg-neutral-900/70 rounded border border-neutral-600">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-green-400 flex items-center">
                          <FaCode className="mr-1" /> JSON Response
                        </p>
                        <div className="flex items-center space-x-2">
                          {" "}
                          <button
                            onClick={() =>
                              copyToClipboard(
                                JSON.stringify(
                                  services.backend.protectedData,
                                  null,
                                  2
                                )
                              )
                            }
                            className="text-xs text-neutral-400 hover:text-green-400 hover:bg-green-900/20 px-2 py-1 rounded transition-all duration-200 flex items-center"
                            title="Copy JSON to clipboard"
                          >
                            <FaCopy className="mr-1" /> Copy
                          </button>
                        </div>
                      </div>
                      <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap overflow-x-auto bg-black/30 p-3 rounded border">
                        {JSON.stringify(
                          services.backend.protectedData,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                )}
                {services.backend.protectedError && (
                  <div className="p-3 bg-red-900/30 rounded border border-red-700/30">
                    <p className="text-xs text-red-400 mb-1 flex items-center">
                      <FaExclamationTriangle className="mr-1" /> Error Details
                    </p>
                    <p className="text-xs text-red-300 font-mono">
                      {services.backend.protectedError}
                    </p>
                  </div>
                )}
              </div>{" "}
              {/* Note about FastAPI being internal */}
              <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-700/30">
                <div className="flex items-center mb-2">
                  <FaCog className="mr-2 text-blue-400" />
                  <p className="text-sm text-blue-300 font-medium">
                    FastAPI AI Service
                  </p>
                </div>
                <p className="text-xs text-blue-200">
                  The FastAPI AI service is now an internal-only microservice
                  and does not expose protected endpoints to the frontend. All
                  AI functionality is accessed through the Express backend with
                  proper internal service authentication.
                </p>
              </div>
            </div>
          )}
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
