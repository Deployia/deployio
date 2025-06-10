import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaChartLine,
  FaCpu,
  FaMemory,
  FaHdd,
  FaWifi,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEye,
  FaBell,
  FaCog,
  FaDownload,
  FaRefresh,
} from "react-icons/fa";
import SEO from "../components/SEO";

const Monitoring = () => {
  const [timeRange, setTimeRange] = useState("1h");
  const [selectedService, setSelectedService] = useState("all");
  const [realTimeData, setRealTimeData] = useState({});

  // Mock real-time data
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData({
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        disk: Math.floor(Math.random() * 100),
        network: Math.floor(Math.random() * 1000),
        responseTime: Math.floor(100 + Math.random() * 500),
        uptime: 99.9,
        requests: Math.floor(1000 + Math.random() * 5000),
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const services = [
    {
      id: "web-api",
      name: "Web API",
      status: "healthy",
      uptime: "99.9%",
      responseTime: "145ms",
      requests: "2.3k/min",
      cpu: 45,
      memory: 62,
    },
    {
      id: "database",
      name: "Database",
      status: "healthy",
      uptime: "99.8%",
      responseTime: "23ms",
      requests: "890/min",
      cpu: 32,
      memory: 78,
    },
    {
      id: "cache",
      name: "Redis Cache",
      status: "warning",
      uptime: "99.5%",
      responseTime: "12ms",
      requests: "5.1k/min",
      cpu: 28,
      memory: 85,
    },
    {
      id: "cdn",
      name: "CDN",
      status: "healthy",
      uptime: "99.9%",
      responseTime: "89ms",
      requests: "12.4k/min",
      cpu: 15,
      memory: 34,
    },
  ];

  const mockAlerts = [
    {
      id: 1,
      level: "warning",
      service: "Redis Cache",
      message: "Memory usage above 80%",
      time: "5 minutes ago",
      resolved: false,
    },
    {
      id: 2,
      level: "info",
      service: "Web API",
      message: "High request volume detected",
      time: "12 minutes ago",
      resolved: true,
    },
    {
      id: 3,
      level: "critical",
      service: "Database",
      message: "Connection timeout threshold exceeded",
      time: "1 hour ago",
      resolved: true,
    },
  ];

  const metrics = [
    {
      name: "CPU Usage",
      value: realTimeData.cpu || 45,
      unit: "%",
      icon: FaCpu,
      color: "blue",
      trend: "+2.1%",
    },
    {
      name: "Memory Usage",
      value: realTimeData.memory || 62,
      unit: "%",
      icon: FaMemory,
      color: "green",
      trend: "-1.4%",
    },
    {
      name: "Disk Usage",
      value: realTimeData.disk || 34,
      unit: "%",
      icon: FaHdd,
      color: "purple",
      trend: "+0.8%",
    },
    {
      name: "Network I/O",
      value: realTimeData.network || 456,
      unit: "MB/s",
      icon: FaWifi,
      color: "orange",
      trend: "+5.2%",
    },
  ];

  const responseTimeData = [
    { time: "00:00", value: 120 },
    { time: "04:00", value: 145 },
    { time: "08:00", value: 180 },
    { time: "12:00", value: 220 },
    { time: "16:00", value: 190 },
    { time: "20:00", value: 160 },
    { time: "24:00", value: 135 },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200";
      case "warning":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200";
      case "critical":
        return "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
        return <FaCheckCircle className="text-green-600" />;
      case "warning":
        return <FaExclamationTriangle className="text-yellow-600" />;
      case "critical":
        return <FaTimesCircle className="text-red-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <>
      <SEO
        title="Monitoring - Deployio"
        description="Monitor your applications and infrastructure in real-time. Track performance metrics, alerts, and system health."
        keywords="monitoring, performance, metrics, alerts, infrastructure, uptime"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FaChartLine className="text-blue-400" />
              System Monitoring
            </h1>
            <p className="text-gray-400 mt-2">
              Real-time monitoring and performance analytics
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1h">Last 1 hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <FaRefresh />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* System Metrics Overview */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metric.value}
                    {metric.unit}
                  </p>
                </div>
                <metric.icon className={`text-2xl text-${metric.color}-600`} />
              </div>
              <div className="mt-2 flex items-center">
                <span
                  className={`text-sm ${
                    metric.trend.startsWith("+")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {metric.trend}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  from last hour
                </span>
              </div>

              {/* Real-time indicator */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`bg-${metric.color}-600 h-2 rounded-full transition-all duration-1000`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Services Status */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Services Status
            </h3>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All Services</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {service.name}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          service.status
                        )}`}
                      >
                        {service.status}
                      </span>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <FaEye />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Uptime:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {service.uptime}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Response:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {service.responseTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Requests:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {service.requests}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">CPU:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {service.cpu}%
                    </span>
                  </div>
                </div>

                {/* Resource usage bars */}
                <div className="mt-3 space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>CPU</span>
                      <span>{service.cpu}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                        style={{ width: `${service.cpu}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Memory</span>
                      <span>{service.memory}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-green-600 h-1.5 rounded-full transition-all duration-1000"
                        style={{ width: `${service.memory}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Charts and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Response Time Chart */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Response Time Trends
              </h3>
              <FaDownload className="text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>

            <div className="h-64 flex items-end justify-between space-x-2">
              {responseTimeData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-blue-600 rounded-t-md transition-all duration-300 hover:bg-blue-700"
                    style={{ height: `${(item.value / 250) * 100}%` }}
                  />
                  <span className="text-xs text-gray-500 mt-2">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>Average: 165ms</span>
              <span>Peak: 220ms</span>
            </div>
          </motion.div>

          {/* Alerts */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Alerts
              </h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                <FaCog />
                Configure
              </button>
            </div>

            <div className="space-y-3">
              {mockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.level === "critical"
                      ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                      : alert.level === "warning"
                      ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
                      : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {alert.level === "critical" ? (
                          <FaTimesCircle className="text-red-600" />
                        ) : alert.level === "warning" ? (
                          <FaExclamationTriangle className="text-yellow-600" />
                        ) : (
                          <FaCheckCircle className="text-blue-600" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {alert.service}
                        </span>
                        {alert.resolved && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <FaBell />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-2 text-center text-blue-600 hover:text-blue-700 text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
              View All Alerts
            </button>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default Monitoring;
