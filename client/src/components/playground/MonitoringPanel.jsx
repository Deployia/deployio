import { motion } from "framer-motion";
import {
  FiActivity,
  FiCpu,
  FiHardDrive,
  FiWifi,
  FiAlertTriangle,
} from "react-icons/fi";

const MonitoringPanel = ({ workspace: _workspace }) => {
  // Sample monitoring data
  const metrics = {
    cpu: { value: 45, status: "good", trend: "stable" },
    memory: { value: 68, status: "warning", trend: "up" },
    disk: { value: 23, status: "good", trend: "down" },
    network: { value: 12, status: "good", trend: "stable" },
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "good":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "critical":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800/50">
        <div className="flex items-center gap-3">
          <FiActivity className="w-6 h-6 text-red-400" />
          <h2 className="text-lg font-medium text-white">System Monitoring</h2>
        </div>
      </div>

      {/* Metrics */}
      <div className="flex-1 p-4 space-y-4">
        {Object.entries(metrics).map(([key, metric]) => {
          const icons = {
            cpu: FiCpu,
            memory: FiHardDrive,
            disk: FiHardDrive,
            network: FiWifi,
          };
          const Icon = icons[key];

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon
                    className={`w-4 h-4 ${getStatusColor(metric.status)}`}
                  />
                  <span className="text-white capitalize">{key}</span>
                </div>
                <span
                  className={`text-lg font-bold ${getStatusColor(
                    metric.status
                  )}`}
                >
                  {metric.value}%
                </span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.value}%` }}
                  className={`h-2 rounded-full ${
                    metric.status === "good"
                      ? "bg-green-500"
                      : metric.status === "warning"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Alerts */}
      <div className="p-4 border-t border-neutral-800/50 bg-neutral-900/30">
        <div className="flex items-center gap-2 text-yellow-400">
          <FiAlertTriangle className="w-4 h-4" />
          <span className="text-sm">1 warning: Memory usage above 60%</span>
        </div>
      </div>
    </div>
  );
};

export default MonitoringPanel;
