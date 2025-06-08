import { useEffect, useState } from "react";
import axios from "axios";
import Spinner from "../components/Spinner";

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

  useEffect(() => {
    async function fetchStatuses() {
      try {
        // Backend greeting + health
        const beHello = await axios.get("/api/v1/hello");
        setBackendHello(beHello.data.message);
        setBackendUptime(beHello.data.uptime);
        const beHealth = await axios.get("/api/v1/health");
        setBackendStatus(beHealth.data.status);
        setBackendDb(beHealth.data.mongodb_status);

        // FastAPI greeting + health
        const faHello = await axios.get("/service/v1/hello");
        setFastapiHello(faHello.data.message);
        setFastapiUptime(faHello.data.uptime);
        const faHealth = await axios.get("/service/v1/health");
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
        <div className="grid md:grid-cols-2 gap-6">
          {/* Backend Card */}
          <div className="p-4 backdrop-blur-lg rounded-xl border border-neutral-700 body">
            <h3 className="text-lg font-semibold text-white mb-2 heading">
              Backend Service
            </h3>
            <p className="text-sm text-neutral-400">
              Message: <span className="text-white">{backendHello}</span>
            </p>
            <p className="text-sm text-neutral-400">
              Status: <span className="text-white">{backendStatus}</span>
            </p>
            <p className="text-sm text-neutral-400">
              MongoDB: <span className="text-white">{backendDb}</span>
            </p>
            <p className="text-sm text-neutral-400">
              Uptime:{" "}
              <span className="text-white">{Math.round(backendUptime)}s</span>
            </p>
          </div>
          {/* FastAPI Card */}
          <div className="p-4 backdrop-blur-lg rounded-xl border border-neutral-700 body">
            <h3 className="text-lg font-semibold text-white mb-2 heading">
              FastAPI Service
            </h3>
            <p className="text-sm text-neutral-400">
              Message: <span className="text-white">{fastapiHello}</span>
            </p>
            <p className="text-sm text-neutral-400">
              Status: <span className="text-white">{fastapiStatus}</span>
            </p>
            <p className="text-sm text-neutral-400">
              MongoDB: <span className="text-white">{fastapiDb}</span>
            </p>
            <p className="text-sm text-neutral-400">
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
