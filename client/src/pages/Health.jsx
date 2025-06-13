import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "@utils/api";
import fastapi from "@utils/fastapi";
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
} from "react-icons/fa";

function Health() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      name: "FastAPI Service",
      icon: FaCog,
      color: "blue",
      status: "unknown",
      uptime: 0,
      message: "",
      mongodb_status: "unknown",
      redis_status: "unknown",
      protectedData: null,
      protectedError: null,
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
  };

  // Get status indicator component
  const StatusIndicator = ({ status, type = "default" }) => {
    let isHealthy = false;

    if (type === "service") {
      isHealthy = status === "ok";
    } else {
      isHealthy = status === "connected";
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
  };

  // Component for individual service card
  const ServiceCard = ({ serviceKey, service }) => {
    const IconComponent = service.icon;
    const colorClasses = {
      green: "bg-green-600/20 text-green-400",
      blue: "bg-blue-600/20 text-blue-400",
    };

    return (
      <div className="p-5 backdrop-blur-lg rounded-xl border border-neutral-700 body shadow-lg bg-neutral-900/70 hover:bg-neutral-900 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center mr-3 ${
                colorClasses[service.color]
              }`}
            >
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white heading">
                {service.name}
              </h3>
              <p className="text-xs text-neutral-400">
                {serviceKey === "backend"
                  ? "Express.js API"
                  : "Python microservice"}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <StatusIndicator status={service.status} type="service" />
          </div>
        </div>

        {/* Database Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-neutral-400">
            <FaDatabase className="mr-2 text-neutral-500" />
            Database
          </div>
          <StatusIndicator status={service.mongodb_status} />
        </div>

        {/* Redis Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-neutral-400">
            <FaMemory className="mr-2 text-neutral-500" />
            Redis Cache
          </div>
          <StatusIndicator status={service.redis_status} />
        </div>

        {/* Uptime */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-neutral-400">
            <FaClock className="mr-2 text-neutral-500" />
            Uptime
          </div>
          <div>
            <span className="text-white text-sm bg-neutral-800 px-2 py-1 rounded">
              {formatUptime(service.uptime)}
            </span>
          </div>
        </div>

        {/* Response Message */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-neutral-400">
            <FaCode className="mr-2 text-neutral-500" />
            Response
          </div>
          <div>
            <span className="text-white text-sm italic">
              &quot;{service.message}&quot;
            </span>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    async function fetchStatuses() {
      try {
        // Backend greeting + health
        const beHello = await api.get("/hello");
        const beHealth = await api.get("/health");

        // FastAPI greeting + health
        const faHello = await fastapi.get("/hello");
        const faHealth = await fastapi.get("/health");

        // Update services state
        setServices((prev) => ({
          backend: {
            ...prev.backend,
            status: beHealth.data.status,
            uptime: beHello.data.uptime,
            message: beHello.data.message,
            mongodb_status: beHealth.data.mongodb_status,
            redis_status: beHealth.data.redis_status,
          },
          fastapi: {
            ...prev.fastapi,
            status: faHealth.data.status,
            uptime: faHello.data.uptime,
            message: faHello.data.message,
            mongodb_status: faHealth.data.mongodb_status,
            redis_status: faHealth.data.redis_status,
            protectedData: null,
            protectedError: null,
          },
        }));

        // Test FastAPI protected endpoint if authenticated
        if (isAuthenticated) {
          try {
            const protectedResponse = await fastapi.get("/protected/data");
            setServices((prev) => ({
              ...prev,
              fastapi: {
                ...prev.fastapi,
                protectedData: protectedResponse.data,
                protectedError: null,
              },
            }));
          } catch (protectedErr) {
            setServices((prev) => ({
              ...prev,
              fastapi: {
                ...prev.fastapi,
                protectedData: null,
                protectedError:
                  protectedErr.response?.data?.detail || protectedErr.message,
              },
            }));
          }
        }
      } catch (err) {
        setError(err.message || "Error fetching statuses");
      } finally {
        setLoading(false);
      }
    }

    fetchStatuses();
  }, [isAuthenticated]);

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1 heading flex items-center">
                <FaClipboardCheck className="mr-2 text-purple-400" />
                System Health Dashboard
              </h2>
              <p className="text-neutral-400 text-sm">
                Monitor the status and performance of all system components
              </p>
            </div>
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
          </div>

          {/* Service Status Cards */}
          <div className="grid gap-6 mb-6 md:grid-cols-2">
            {Object.entries(services).map(([key, service]) => (
              <ServiceCard key={key} serviceKey={key} service={service} />
            ))}
          </div>

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
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Testing authenticated API access
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-neutral-400">
                  <FaShieldAlt className="mr-2 text-neutral-500" />
                  Protected Data Request
                </div>
                <div>
                  {services.fastapi.protectedError ? (
                    <span className="text-red-400 text-sm">
                      {services.fastapi.protectedError}
                    </span>
                  ) : services.fastapi.protectedData ? (
                    <span className="text-green-400 text-sm">✓ Success</span>
                  ) : (
                    <span className="text-neutral-400 text-sm">Not tested</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Environment Information */}
          <div className="p-5 backdrop-blur-lg rounded-xl border border-neutral-700 body bg-neutral-900/70">
            <h3 className="text-lg font-semibold text-white mb-3 heading flex items-center">
              <FaCode className="mr-2 text-blue-400" />
              Environment Information
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                <p className="text-sm text-neutral-400 flex items-center justify-between">
                  <span>Environment</span>
                  <span className="text-white">{envInfo.environment}</span>
                </p>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                <p className="text-sm text-neutral-400 flex items-center justify-between">
                  <span>Backend URL</span>
                  <span className="text-white">{envInfo.backendUrl}</span>
                </p>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                <p className="text-sm text-neutral-400 flex items-center justify-between">
                  <span>FastAPI URL</span>
                  <span className="text-white">{envInfo.fastapiUrl}</span>
                </p>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                <p className="text-sm text-neutral-400 flex items-center justify-between">
                  <span>Build Version</span>
                  <span className="text-white">{envInfo.version}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Health;
