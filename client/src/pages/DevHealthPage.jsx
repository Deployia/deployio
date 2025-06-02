import { useState, useEffect } from "react";
import axios from "axios";

const DevHealthPage = () => {
  const [nodeStatus, setNodeStatus] = useState(null);
  const [fastApiStatus, setFastApiStatus] = useState(null);

  useEffect(() => {
    // Fetch Node.js server health
    axios
      .get("/api/v1/health") // Ensure this path is correct as per your server setup
      .then((response) => {
        setNodeStatus(response.data);
      })
      .catch((error) => {
        console.error("Error fetching Node.js health:", error);
        setNodeStatus({
          service_name: "Node.js Server",
          status: "error",
          error: error.message,
          mongodb_status: "unknown",
        });
      });

    // Fetch FastAPI server health
    axios
      .get("/services/v1/health") // Ensure this path is correct as per your server setup & Nginx proxy
      .then((response) => {
        setFastApiStatus(response.data);
      })
      .catch((error) => {
        console.error("Error fetching FastAPI health:", error);
        setFastApiStatus({
          service_name: "FastAPI Service",
          status: "error",
          error: error.message,
          mongodb_status: "unknown",
        });
      });
  }, []);

  const renderStatusCard = (service) => {
    if (!service) {
      return (
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 mb-6 animate-pulse border border-gray-700">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
      );
    }

    const statusColor =
      service.status === "ok" ? "text-green-400" : "text-red-400";
    const mongoStatusColor =
      service.mongodb_status === "connected"
        ? "text-green-400"
        : "text-red-400";

    return (
      <div className="bg-gray-800 shadow-lg rounded-lg p-6 mb-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-3">
          {service.service_name}
        </h3>
        <p className="text-gray-300 mb-1">
          Service Status:{" "}
          <span className={`font-medium ${statusColor}`}>{service.status}</span>
        </p>
        <p className="text-gray-300">
          MongoDB Status:{" "}
          <span className={`font-medium ${mongoStatusColor}`}>
            {service.mongodb_status}
          </span>
        </p>
        {service.status === "error" && (
          <p className="text-red-400 mt-2">Error: {service.error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-900 text-gray-100 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">
          Development Health Dashboard
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {renderStatusCard(nodeStatus)}
          {renderStatusCard(fastApiStatus)}
        </div>
      </div>
    </div>
  );
};

export default DevHealthPage;
