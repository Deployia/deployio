import { useCallback } from "react";
import { useMetricsStream } from "@hooks/useMetricsStream";
import MetricsChart from "@components/MetricsChart";
import { FaChartLine, FaPlay, FaStop } from "react-icons/fa";

const ServiceMetrics = ({
  serviceName,
  className = "",
  formatUptime = (seconds) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  },
}) => {
  const {
    startMetricsStream,
    stopMetricsStream,
    getStreamMetrics,
    getLatestMetrics,
    isStreamActive: isMetricsStreamActive,
    isConnected: metricsConnected,
  } = useMetricsStream();

  // Manual control functions
  const handleStartMetrics = useCallback(async () => {
    try {
      console.log("Manual start metrics for:", serviceName);
      await startMetricsStream(serviceName, 5000);
    } catch (error) {
      console.error("Failed to start metrics stream:", error);
    }
  }, [startMetricsStream, serviceName]);

  const handleStopMetrics = useCallback(async () => {
    try {
      console.log("Manual stop metrics for:", serviceName);
      await stopMetricsStream(serviceName);
    } catch (error) {
      console.error("Failed to stop metrics stream:", error);
    }
  }, [stopMetricsStream, serviceName]);

  // Safe getter for metrics data
  const getMetricsData = useCallback(
    (serviceName) => {
      try {
        return getStreamMetrics(serviceName) || [];
      } catch (error) {
        console.warn("Failed to get stream metrics:", error);
        return [];
      }
    },
    [getStreamMetrics]
  );

  // Safe getter for latest metrics
  const getLatestMetricsData = useCallback(
    (serviceName) => {
      try {
        return getLatestMetrics(serviceName);
      } catch (error) {
        console.warn("Failed to get latest metrics:", error);
        return null;
      }
    },
    [getLatestMetrics]
  );

  return (
    <div
      className={`p-5 backdrop-blur-lg rounded-xl border border-neutral-700 bg-neutral-900/70 ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-yellow-600/20 text-yellow-400 flex items-center justify-center">
            <FaChartLine className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white heading">
              Real-time Metrics
            </h2>
            <p className="text-xs text-neutral-400">
              Live performance monitoring
            </p>
          </div>
        </div>

        {/* Connection Status and Controls */}
        <div className="flex items-center gap-3">
          {/* Manual Controls */}
          <div className="flex items-center gap-2">
            {isMetricsStreamActive(serviceName) ? (
              <button
                onClick={handleStopMetrics}
                className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-2 rounded-lg transition-colors text-sm"
              >
                <FaStop className="h-3 w-3" />
                Stop
              </button>
            ) : (
              <button
                onClick={handleStartMetrics}
                className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-2 rounded-lg transition-colors text-sm"
              >
                <FaPlay className="h-3 w-3" />
                Start
              </button>
            )}
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                metricsConnected ? "bg-green-400" : "bg-red-400"
              }`}
            ></span>
            <span className="text-neutral-400">
              {metricsConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Charts */}
      {!metricsConnected && !isMetricsStreamActive(serviceName) && (
        <div className="mb-4 p-4 bg-blue-900/30 border border-blue-700/30 rounded-lg">
          <p className="text-blue-400 text-sm">
            📊 Click &ldquo;Start&rdquo; to begin real-time metrics monitoring
            for {serviceName}.
          </p>
        </div>
      )}

      {!metricsConnected && isMetricsStreamActive(serviceName) && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700/30 rounded-lg">
          <p className="text-yellow-400 text-sm">
            ⚠️ Metrics WebSocket disconnected. Charts may not update in
            real-time.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Memory Usage Chart */}
        <MetricsChart
          data={getMetricsData(serviceName).map((m) => ({
            timestamp: m.timestamp,
            value: (() => {
              // Handle different memory formats across services
              if (serviceName === "backend") {
                // Backend uses absolute MB values
                return m.memory?.used || 0;
              } else {
                // AI-service and agent use percentage
                return m.memory?.usage || 0;
              }
            })(),
          }))}
          title="Memory Usage"
          dataKey="value"
          color="#10B981"
          type="area"
          unit={serviceName === "backend" ? "MB" : "%"}
          height={250}
          compact={true}
          formatValue={(value) => {
            const unit = serviceName === "backend" ? "MB" : "%";
            return `${Math.round(value)}${unit}`;
          }}
          formatTime={(time) => new Date(time).toLocaleTimeString()}
        />

        {/* CPU Usage Chart */}
        <MetricsChart
          data={getMetricsData(serviceName).map((m) => ({
            timestamp: m.timestamp,
            value: m.cpu?.usage || m.cpu?.process_usage || 0,
          }))}
          title="CPU Usage"
          dataKey="value"
          color="#3B82F6"
          type="line"
          unit="%"
          height={250}
          compact={true}
          formatValue={(value) => `${Math.round(value)}%`}
          formatTime={(time) => new Date(time).toLocaleTimeString()}
        />

        {/* Uptime Chart */}
        <MetricsChart
          data={getMetricsData(serviceName).map((m) => ({
            timestamp: m.timestamp,
            value: m.uptime || 0,
          }))}
          title="Uptime"
          dataKey="value"
          color="#8B5CF6"
          type="line"
          unit="s"
          height={250}
          compact={true}
          formatValue={(value) => {
            const hours = Math.floor(value / 3600);
            const minutes = Math.floor((value % 3600) / 60);
            return `${hours}h ${minutes}m`;
          }}
          formatTime={(time) => new Date(time).toLocaleTimeString()}
        />

        {/* Active Connections / Docker Containers / Response Time */}
        <MetricsChart
          data={getMetricsData(serviceName).map((m) => ({
            timestamp: m.timestamp,
            value:
              serviceName === "agent"
                ? m.system?.docker?.containers || m.docker?.containers || 0
                : serviceName === "ai-service"
                ? m.system?.responseTime || m.responseTime || 0
                : m.system?.activeRequests || m.activeHandles || 0,
          }))}
          title={
            serviceName === "agent"
              ? "Docker Containers"
              : serviceName === "ai-service"
              ? "Response Time"
              : "Active Connections"
          }
          dataKey="value"
          color="#F59E0B"
          type="area"
          unit={serviceName === "ai-service" ? "ms" : ""}
          height={250}
          compact={true}
          formatValue={(value) =>
            serviceName === "ai-service"
              ? `${Math.round(value)}ms`
              : `${Math.round(value)}`
          }
          formatTime={(time) => new Date(time).toLocaleTimeString()}
        />
      </div>

      {/* Latest Metrics Summary */}
      {getLatestMetricsData(serviceName) && (
        <div className="mt-6 p-4 bg-black/30 rounded-lg border border-neutral-700">
          <h3 className="text-white font-medium mb-3">Latest Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-neutral-400">Memory:</span>
              <span className="text-white ml-2">
                {(() => {
                  const memData = getLatestMetricsData(serviceName)?.memory;
                  if (!memData) return "N/A";

                  if (serviceName === "backend") {
                    // Backend reports in MB
                    return `${memData.used || 0} MB`;
                  } else {
                    // AI-service and agent report in percentage
                    return `${memData.usage || 0}%`;
                  }
                })()}
              </span>
            </div>
            <div>
              <span className="text-neutral-400">CPU:</span>
              <span className="text-white ml-2">
                {(() => {
                  const cpuData = getLatestMetricsData(serviceName)?.cpu;
                  if (!cpuData) return "N/A";

                  const usage = cpuData.usage || cpuData.process_usage;
                  return usage !== undefined ? `${usage}%` : "N/A";
                })()}
              </span>
            </div>
            <div>
              <span className="text-neutral-400">Uptime:</span>
              <span className="text-white ml-2">
                {formatUptime(getLatestMetricsData(serviceName)?.uptime || 0)}
              </span>
            </div>
            <div>
              <span className="text-neutral-400">
                {serviceName === "agent"
                  ? "Containers:"
                  : serviceName === "ai-service"
                  ? "Response:"
                  : "Active:"}
              </span>
              <span className="text-white ml-2">
                {(() => {
                  const latest = getLatestMetricsData(serviceName);
                  if (!latest) return "N/A";

                  if (serviceName === "agent") {
                    return (
                      latest.system?.docker?.containers ||
                      latest.docker?.containers ||
                      0
                    );
                  } else if (serviceName === "ai-service") {
                    const responseTime =
                      latest.system?.responseTime || latest.responseTime;
                    return responseTime ? `${responseTime}ms` : "N/A";
                  } else {
                    return (
                      latest.system?.activeRequests || latest.activeHandles || 0
                    );
                  }
                })()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceMetrics;
