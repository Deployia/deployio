import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../utils/api";
import fastapi from "../utils/fastapi";
import useEnvironmentInfo from "../utils/useEnvironmentInfo";
import Spinner from "../components/Spinner";
import SEO from "../components/SEO.jsx";
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
  FaDocker,
  FaNetworkWired,
  FaCodeBranch,
  FaInfoCircle,
  FaShieldAlt,
} from "react-icons/fa";

function Health() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [backendHello, setBackendHello] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);
  const [backendDb, setBackendDb] = useState(null);
  const [backendUptime, setBackendUptime] = useState(null);
  const [fastapiHello, setFastapiHello] = useState(null);
  const [fastapiStatus, setFastapiStatus] = useState(null);
  const [fastapiDb, setFastapiDb] = useState(null);
  const [fastapiUptime, setFastapiUptime] = useState(null);
  const [fastapiProtectedData, setFastapiProtectedData] = useState(null);
  const [fastapiProtectedError, setFastapiProtectedError] = useState(null);
  const [error, setError] = useState(null);
  const envInfo = useEnvironmentInfo();
  useEffect(() => {
    async function fetchStatuses() {
      try {
        // Backend greeting + health
        const beHello = await api.get("/hello");
        setBackendHello(beHello.data.message);
        setBackendUptime(beHello.data.uptime);
        const beHealth = await api.get("/health");
        setBackendStatus(beHealth.data.status);
        setBackendDb(beHealth.data.mongodb_status);

        // FastAPI greeting + health
        const faHello = await fastapi.get("/hello");
        setFastapiHello(faHello.data.message);
        setFastapiUptime(faHello.data.uptime);
        const faHealth = await fastapi.get("/health");
        setFastapiStatus(faHealth.data.status);
        setFastapiDb(faHealth.data.mongodb_status);

        // Test FastAPI protected endpoint if authenticated
        if (isAuthenticated) {
          try {
            const protectedResponse = await fastapi.get("/protected/data");
            setFastapiProtectedData(protectedResponse.data);
            setFastapiProtectedError(null);
          } catch (protectedErr) {
            setFastapiProtectedError(
              protectedErr.response?.data?.detail || protectedErr.message
            );
            setFastapiProtectedData(null);
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
      <div className="h-full flex items-center justify-center">
        <Spinner size={64} />
      </div>
    );
  return (
    <>
      <SEO page="health" />
      <div className="h-full overflow-auto p-6 body ">
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
              <div className="px-4 py-2 bg-green-900/20 border border-green-700/30 rounded-lg flex items-center">
                <FaCheckCircle className="text-green-400 mr-2" />
                <span className="text-green-300 text-sm">
                  All systems operational
                </span>
              </div>
            )}
          </div>{" "}
          {/* Service Status Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Backend Card */}
            <div className="p-5 backdrop-blur-lg rounded-xl border border-neutral-700 body shadow-lg bg-neutral-900/70 hover:bg-neutral-900 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center mr-3 ${
                      backendStatus === "ok"
                        ? "bg-green-600/20 text-green-400"
                        : "bg-red-600/20 text-red-400"
                    }`}
                  >
                    <FaServer className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white heading">
                      Backend Service
                    </h3>
                    <p className="text-xs text-neutral-400">Express.js API</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {backendStatus === "ok" ? (
                    <span className="px-2 py-1 text-xs bg-green-900/30 text-green-300 rounded-full border border-green-700/30">
                      Online
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-red-900/30 text-red-300 rounded-full border border-red-700/30">
                      Issue Detected
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 mt-4 border-t border-neutral-800 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-neutral-400">
                    <FaInfoCircle className="mr-2 text-neutral-500" />
                    Status
                  </div>
                  <div className="flex items-center">
                    {backendStatus === "ok" ? (
                      <FaCheckCircle className="text-green-400 mr-2" />
                    ) : (
                      <FaTimesCircle className="text-red-400 mr-2" />
                    )}
                    <span
                      className={
                        backendStatus === "ok"
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {backendStatus || "Unknown"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-neutral-400">
                    <FaDatabase className="mr-2 text-neutral-500" />
                    Database
                  </div>
                  <div className="flex items-center">
                    {backendDb === "connected" ? (
                      <FaCheckCircle className="text-green-400 mr-2" />
                    ) : (
                      <FaTimesCircle className="text-red-400 mr-2" />
                    )}
                    <span
                      className={
                        backendDb === "connected"
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {backendDb || "Unknown"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-neutral-400">
                    <FaClock className="mr-2 text-neutral-500" />
                    Uptime
                  </div>
                  <div>
                    <span className="text-white text-sm bg-neutral-800 px-2 py-1 rounded">
                      {Math.round(backendUptime)}s
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-neutral-400">
                    <FaCode className="mr-2 text-neutral-500" />
                    Response
                  </div>
                  <div>
                    {" "}
                    <span className="text-white text-sm italic">
                      &quot;{backendHello}&quot;
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* FastAPI Card */}
            <div className="p-5 backdrop-blur-lg rounded-xl border border-neutral-700 body shadow-lg bg-neutral-900/70 hover:bg-neutral-900 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center mr-3 ${
                      fastapiStatus === "ok"
                        ? "bg-blue-600/20 text-blue-400"
                        : "bg-red-600/20 text-red-400"
                    }`}
                  >
                    <FaCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white heading">
                      FastAPI Service
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Python microservice
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {fastapiStatus === "ok" ? (
                    <span className="px-2 py-1 text-xs bg-blue-900/30 text-blue-300 rounded-full border border-blue-700/30">
                      Online
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-red-900/30 text-red-300 rounded-full border border-red-700/30">
                      Issue Detected
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 mt-4 border-t border-neutral-800 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-neutral-400">
                    <FaInfoCircle className="mr-2 text-neutral-500" />
                    Status
                  </div>
                  <div className="flex items-center">
                    {fastapiStatus === "ok" ? (
                      <FaCheckCircle className="text-blue-400 mr-2" />
                    ) : (
                      <FaTimesCircle className="text-red-400 mr-2" />
                    )}
                    <span
                      className={
                        fastapiStatus === "ok"
                          ? "text-blue-400"
                          : "text-red-400"
                      }
                    >
                      {fastapiStatus || "Unknown"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-neutral-400">
                    <FaDatabase className="mr-2 text-neutral-500" />
                    Database
                  </div>
                  <div className="flex items-center">
                    {fastapiDb === "connected" ? (
                      <FaCheckCircle className="text-blue-400 mr-2" />
                    ) : (
                      <FaTimesCircle className="text-red-400 mr-2" />
                    )}
                    <span
                      className={
                        fastapiDb === "connected"
                          ? "text-blue-400"
                          : "text-red-400"
                      }
                    >
                      {fastapiDb || "Unknown"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-neutral-400">
                    <FaClock className="mr-2 text-neutral-500" />
                    Uptime
                  </div>
                  <div>
                    <span className="text-white text-sm bg-neutral-800 px-2 py-1 rounded">
                      {Math.round(fastapiUptime)}s
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-neutral-400">
                    <FaCode className="mr-2 text-neutral-500" />
                    Response
                  </div>{" "}
                  <div>
                    <span className="text-white text-sm italic">
                      &quot;{fastapiHello}&quot;
                    </span>
                  </div>
                </div>{" "}
              </div>
            </div>
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
                    Testing FastAPI protected routes with authentication
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-neutral-400">
                    <FaShieldAlt className="mr-2 text-neutral-500" />
                    Authentication Status
                  </div>
                  <div className="flex items-center">
                    <FaCheckCircle className="text-green-400 mr-2" />
                    <span className="text-green-400">Authenticated</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-neutral-400">
                    <FaCode className="mr-2 text-neutral-500" />
                    Protected Data Request
                  </div>
                  <div className="flex items-center">
                    {fastapiProtectedError ? (
                      <>
                        <FaTimesCircle className="text-red-400 mr-2" />
                        <span className="text-red-400 text-xs">
                          {fastapiProtectedError}
                        </span>
                      </>
                    ) : fastapiProtectedData ? (
                      <>
                        <FaCheckCircle className="text-green-400 mr-2" />
                        <span className="text-green-400 text-xs">Success</span>
                      </>
                    ) : (
                      <span className="text-yellow-400 text-xs">
                        Testing...
                      </span>
                    )}
                  </div>
                </div>

                {fastapiProtectedData && (
                  <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
                    <div className="text-xs text-neutral-400 mb-2">
                      Response Data:
                    </div>
                    <pre className="text-xs text-green-400 overflow-x-auto">
                      {JSON.stringify(fastapiProtectedData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Environment Debug Section */}
          <div className="p-5 backdrop-blur-lg rounded-xl border border-neutral-700 body mb-4 bg-neutral-900/70">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center mr-3 bg-purple-600/20 text-purple-400">
                <FaCog className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white heading">
                  Environment Configuration
                </h3>
                <p className="text-xs text-neutral-400">
                  System environment settings and deployment info
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                <div className="flex items-center mb-2">
                  <FaCodeBranch className="text-purple-400 mr-2" />
                  <h4 className="text-sm font-medium text-neutral-200">
                    Environment
                  </h4>
                </div>
                <p className="text-sm text-neutral-400 flex items-center justify-between">
                  <span>ENV:</span>
                  <span className="text-white bg-neutral-700 px-2 py-0.5 rounded text-xs">
                    {envInfo.env}
                  </span>
                </p>
                <p className="text-sm text-neutral-400 flex items-center justify-between mt-1">
                  <span>Mode:</span>
                  <span className="text-white bg-neutral-700 px-2 py-0.5 rounded text-xs">
                    {envInfo.mode}
                  </span>
                </p>
              </div>

              <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                <div className="flex items-center mb-2">
                  <FaNetworkWired className="text-purple-400 mr-2" />
                  <h4 className="text-sm font-medium text-neutral-200">
                    API Endpoints
                  </h4>
                </div>
                <p className="text-sm text-neutral-400 flex items-center justify-between">
                  <span>Backend:</span>
                  <span className="text-white bg-neutral-700 px-2 py-0.5 rounded text-xs font-mono">
                    {envInfo.backendUrl}
                  </span>
                </p>
                <p className="text-sm text-neutral-400 flex items-center justify-between mt-1">
                  <span>FastAPI:</span>
                  <span className="text-white bg-neutral-700 px-2 py-0.5 rounded text-xs font-mono">
                    {envInfo.fastapiUrl}
                  </span>
                </p>
              </div>

              <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                <div className="flex items-center mb-2">
                  <FaDocker className="text-purple-400 mr-2" />
                  <h4 className="text-sm font-medium text-neutral-200">
                    Container Status
                  </h4>
                </div>
                <p className="text-sm text-neutral-400 flex items-center justify-between">
                  <span>In Docker Container:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      envInfo.inDocker
                        ? "bg-green-900/30 text-green-300 border border-green-700/30"
                        : "bg-yellow-900/30 text-yellow-300 border border-yellow-700/30"
                    }`}
                  >
                    {String(envInfo.inDocker)}
                  </span>
                </p>
              </div>

              <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                <div className="flex items-center mb-2">
                  <FaInfoCircle className="text-purple-400 mr-2" />
                  <h4 className="text-sm font-medium text-neutral-200">
                    Build Info
                  </h4>
                </div>
                <p className="text-sm text-neutral-400 flex items-center justify-between">
                  <span>Dev Mode:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      envInfo.isDev
                        ? "bg-blue-900/30 text-blue-300 border border-blue-700/30"
                        : "bg-neutral-700/50 text-neutral-300"
                    }`}
                  >
                    {String(envInfo.isDev)}
                  </span>
                </p>
                <p className="text-sm text-neutral-400 flex items-center justify-between mt-1">
                  <span>Production Mode:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      envInfo.isProd
                        ? "bg-purple-900/30 text-purple-300 border border-purple-700/30"
                        : "bg-neutral-700/50 text-neutral-300"
                    }`}
                  >
                    {String(envInfo.isProd)}
                  </span>
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
