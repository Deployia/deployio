import { useEffect, useState } from "react";
import api from "../utils/api";
import fastapi from "../utils/fastapi";
import useEnvironmentInfo from "../utils/useEnvironmentInfo";
import Spinner from "../components/Spinner";
import { FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";

function Health() {
  const [loading, setLoading] = useState(true);
  const [backendHello, setBackendHello] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);
  const [backendDb, setBackendDb] = useState(null);
  const [backendUptime, setBackendUptime] = useState(null);
  const [fastapiHello, setFastapiHello] = useState(null);
  const [fastapiStatus, setFastapiStatus] = useState(null);
  const [fastapiDb, setFastapiDb] = useState(null);
  const [fastapiUptime, setFastapiUptime] = useState(null);
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
      } catch (err) {
        setError(err.message || "Error fetching statuses");
      } finally {
        setLoading(false);
      }
    }
    fetchStatuses();
  }, []);

  if (loading) return <Spinner fullScreen={true} />;
  return (
    <>
      <div className="h-full overflow-auto p-6 body">
        <h2 className="text-2xl font-bold text-white mb-4 heading">
          Health Check
        </h2>
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        {/* Environment Debug Section */}
        <div className="p-4 backdrop-blur-lg rounded-xl border border-neutral-700 body mb-4">
          <h3 className="text-lg font-semibold text-white heading mb-2">
            Environment Variables
          </h3>
          <p className="text-sm text-neutral-400">
            ENV: <span className="text-white">{envInfo.env}</span>
          </p>
          <p className="text-sm text-neutral-400">
            Backend URL:{" "}
            <span className="text-white">{envInfo.backendUrl}</span>
          </p>
          <p className="text-sm text-neutral-400">
            FastAPI URL:{" "}
            <span className="text-white">{envInfo.fastapiUrl}</span>
          </p>
          <p className="text-sm text-neutral-400">
            Mode: <span className="text-white">{envInfo.mode}</span>
            (isDev: <span className="text-white">{String(envInfo.isDev)}</span>,
            isProd: <span className="text-white">{String(envInfo.isProd)}</span>
            )
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Backend Card */}
          <div className="p-4 backdrop-blur-lg rounded-xl border border-neutral-700 body">
            <div className="flex items-center mb-2">
              {backendStatus === "ok" ? (
                <FaCheckCircle className="text-green-400 mr-2" />
              ) : (
                <FaTimesCircle className="text-red-400 mr-2" />
              )}
              <span className="text-lg font-semibold text-white heading">
                Backend Service
              </span>
            </div>
            <p className="text-sm text-neutral-400">
              Message: <span className="text-white">{backendHello}</span>
            </p>
            <p className="text-sm text-neutral-400">
              Status: <span className="text-white">{backendStatus}</span>
            </p>
            <p className="text-sm text-neutral-400">
              MongoDB: <span className="text-white">{backendDb}</span>
            </p>
            <p className="text-sm text-neutral-400 flex items-center">
              <FaClock className="text-yellow-300 mr-1" />
              Uptime:{" "}
              <span className="text-white">{Math.round(backendUptime)}s</span>
            </p>
          </div>
          {/* FastAPI Card */}
          <div className="p-4 backdrop-blur-lg rounded-xl border border-neutral-700 body">
            <div className="flex items-center mb-2">
              {fastapiStatus === "ok" ? (
                <FaCheckCircle className="text-green-400 mr-2" />
              ) : (
                <FaTimesCircle className="text-red-400 mr-2" />
              )}
              <span className="text-lg font-semibold text-white heading">
                FastAPI Service
              </span>
            </div>
            <p className="text-sm text-neutral-400">
              Message: <span className="text-white">{fastapiHello}</span>
            </p>
            <p className="text-sm text-neutral-400">
              Status: <span className="text-white">{fastapiStatus}</span>
            </p>
            <p className="text-sm text-neutral-400">
              MongoDB: <span className="text-white">{fastapiDb}</span>
            </p>
            <p className="text-sm text-neutral-400 flex items-center">
              <FaClock className="text-yellow-300 mr-1" />
              Uptime:{" "}
              <span className="text-white">{Math.round(fastapiUptime)}s</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Health;
