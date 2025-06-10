import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaChartLine,
  FaDownload,
  FaClock,
  FaServer,
  FaCode,
  FaRocket,
  FaShieldAlt,
  FaFilter,
  FaSyncAlt,
} from "react-icons/fa";
import SEO from "../components/SEO";

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API calls
  const mockData = {
    overview: {
      totalDeployments: 145,
      successRate: 96.5,
      avgDeployTime: "4.2m",
      uptime: "99.9%",
    },
    charts: {
      deployments: [
        { date: "2024-01-01", value: 12 },
        { date: "2024-01-02", value: 18 },
        { date: "2024-01-03", value: 15 },
        { date: "2024-01-04", value: 22 },
        { date: "2024-01-05", value: 28 },
        { date: "2024-01-06", value: 32 },
        { date: "2024-01-07", value: 18 },
      ],
      performance: [
        { metric: "Response Time", value: "145ms", change: "-12%" },
        { metric: "Error Rate", value: "0.2%", change: "-45%" },
        { metric: "Throughput", value: "1.2k/s", change: "+8%" },
        { metric: "CPU Usage", value: "45%", change: "+2%" },
      ],
    },
    topProjects: [
      { name: "E-commerce API", deployments: 45, status: "active" },
      { name: "Mobile App Backend", deployments: 38, status: "active" },
      { name: "Analytics Dashboard", deployments: 32, status: "inactive" },
      { name: "User Management", deployments: 28, status: "active" },
    ],
    recentActivity: [
      {
        id: 1,
        type: "deployment",
        project: "E-commerce API",
        status: "success",
        time: "2 hours ago",
      },
      {
        id: 2,
        type: "rollback",
        project: "Mobile App Backend",
        status: "warning",
        time: "4 hours ago",
      },
      {
        id: 3,
        type: "deployment",
        project: "Analytics Dashboard",
        status: "success",
        time: "6 hours ago",
      },
    ],
  };

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRange, mockData]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaChartLine className="animate-spin text-4xl text-blue-600 mb-4 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Analytics - Deployio"
        description="View detailed analytics and insights for your deployments and projects."
        keywords="analytics, deployments, performance, monitoring, insights"
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaChartLine className="text-blue-600" />
              Analytics
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Monitor your deployment performance and insights
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <FaSyncAlt />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Overview Cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Deployments
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.overview.totalDeployments}
                </p>
              </div>
              <FaRocket className="text-blue-600 text-2xl" />
            </div>
            <p className="text-sm text-green-600 mt-2">+12% from last period</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Success Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.overview.successRate}%
                </p>
              </div>
              <FaShieldAlt className="text-green-600 text-2xl" />
            </div>
            <p className="text-sm text-green-600 mt-2">
              +2.1% from last period
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Deploy Time
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.overview.avgDeployTime}
                </p>
              </div>
              <FaClock className="text-orange-600 text-2xl" />
            </div>
            <p className="text-sm text-green-600 mt-2">-8% from last period</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Uptime
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.overview.uptime}
                </p>
              </div>
              <FaServer className="text-purple-600 text-2xl" />
            </div>
            <p className="text-sm text-green-600 mt-2">Excellent</p>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deployment Trends */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Deployment Trends
              </h3>
              <FaDownload className="text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>

            <div className="h-64 flex items-end justify-between space-x-2">
              {data.charts.deployments.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-blue-600 rounded-t-md transition-all duration-300 hover:bg-blue-700"
                    style={{ height: `${(item.value / 35) * 100}%` }}
                  />
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(item.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Performance Metrics
              </h3>
              <FaFilter className="text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>

            <div className="space-y-4">
              {data.charts.performance.map((metric, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {metric.metric}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {metric.value}
                    </span>
                    <span
                      className={`text-sm ${
                        metric.change.startsWith("+")
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {metric.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Projects */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Top Projects
            </h3>

            <div className="space-y-4">
              {data.topProjects.map((project, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FaCode className="text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {project.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {project.deployments} deployments
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      project.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Recent Activity
            </h3>

            <div className="space-y-4">
              {data.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div
                    className={`p-2 rounded-full ${
                      activity.status === "success"
                        ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                        : activity.status === "warning"
                        ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
                        : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                    }`}
                  >
                    {activity.type === "deployment" ? (
                      <FaRocket />
                    ) : (
                      <FaSyncAlt />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {activity.type === "deployment"
                        ? "Deployed"
                        : "Rolled back"}{" "}
                      {activity.project}
                    </p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default Analytics;
