import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaChartLine,
  FaUsers,
  FaEye,
  FaClock,
  FaGlobe,
  FaMobile,
  FaDesktop,
  FaDownload,
  FaArrowUp,
  FaArrowDown,
  FaSync,
} from "react-icons/fa";
import { fetchProjectAnalytics } from "@redux/index";

const ProjectAnalytics = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const { projectAnalytics, loading, error } = useSelector(
    (state) => state.analytics
  );

  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectAnalytics({ projectId: id, timeRange }));
    }
  }, [id, timeRange, dispatch]);

  const handleRefresh = () => {
    if (id) {
      dispatch(fetchProjectAnalytics({ projectId: id, timeRange }));
    }
  };

  // Mock data for demonstration
  const mockData = {
    totalVisits: 12543,
    uniqueVisitors: 8921,
    pageViews: 45678,
    avgSessionDuration: "3m 45s",
    bounceRate: "42.3%",
    conversionRate: "2.8%",
    devices: {
      desktop: 65,
      mobile: 30,
      tablet: 5,
    },
    topPages: [
      { path: "/", views: 5432, percentage: 42 },
      { path: "/about", views: 2341, percentage: 18 },
      { path: "/products", views: 1876, percentage: 15 },
      { path: "/contact", views: 987, percentage: 8 },
    ],
    trafficSources: [
      { source: "Direct", visitors: 3456, percentage: 39 },
      { source: "Google", visitors: 2890, percentage: 32 },
      { source: "Social", visitors: 1234, percentage: 14 },
      { source: "Referral", visitors: 876, percentage: 10 },
      { source: "Email", visitors: 465, percentage: 5 },
    ],
    weeklyStats: [
      { day: "Mon", visits: 1230 },
      { day: "Tue", visits: 1456 },
      { day: "Wed", visits: 1789 },
      { day: "Thu", visits: 2103 },
      { day: "Fri", visits: 1934 },
      { day: "Sat", visits: 1678 },
      { day: "Sun", visits: 1354 },
    ],
  };

  // Use real data if available, otherwise use mock data
  const analytics = projectAnalytics || mockData;

  const StatCard = ({ title, value, change, icon: Icon, color = "blue" }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6 hover:border-neutral-700/50 transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-gray-400 text-xs sm:text-sm mb-1 truncate">
            {title}
          </p>
          <p className="text-lg sm:text-2xl font-bold text-white truncate">
            {value}
          </p>
          {change && (
            <div
              className={`flex items-center gap-1 mt-1 sm:mt-2 text-xs sm:text-sm ${
                change > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {change > 0 ? (
                <FaArrowUp className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
              ) : (
                <FaArrowDown className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
              )}
              <span className="truncate">
                {Math.abs(change)}% vs last period
              </span>
            </div>
          )}
        </div>
        <div
          className={`p-2 sm:p-3 bg-${color}-500/20 rounded-lg flex-shrink-0`}
        >
          <Icon className={`w-4 h-4 sm:w-6 sm:h-6 text-${color}-400`} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Analytics
          </h2>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Monitor your project&apos;s performance and user engagement
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:border-blue-500/50 focus:outline-none text-sm sm:text-base"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <div className="flex gap-2 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-sm sm:text-base flex-1 sm:flex-none"
            >
              <FaSync className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors text-sm sm:text-base flex-1 sm:flex-none"
            >
              <FaDownload className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Export</span>
            </motion.button>
          </div>
        </div>
      </div>

      {loading.analytics ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Total Visits"
              value={analytics.totalVisits?.toLocaleString() || "0"}
              change={12}
              icon={FaEye}
              color="blue"
            />
            <StatCard
              title="Unique Visitors"
              value={analytics.uniqueVisitors?.toLocaleString() || "0"}
              change={8}
              icon={FaUsers}
              color="green"
            />
            <StatCard
              title="Page Views"
              value={analytics.pageViews?.toLocaleString() || "0"}
              change={-3}
              icon={FaChartLine}
              color="purple"
            />
            <StatCard
              title="Avg. Session"
              value={analytics.avgSessionDuration || "0m 0s"}
              change={15}
              icon={FaClock}
              color="orange"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Traffic Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
                Traffic Overview
              </h3>
              <div className="h-48 sm:h-64 flex items-end justify-between gap-1 sm:gap-2">
                {analytics.weeklyStats?.map((stat) => (
                  <div
                    key={stat.day}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-purple-600 rounded-t"
                      style={{
                        height: `${
                          (stat.visits /
                            Math.max(
                              ...analytics.weeklyStats.map((s) => s.visits)
                            )) *
                          (window.innerWidth < 640 ? 160 : 200)
                        }px`,
                        minHeight: "20px",
                      }}
                    />
                    <span className="text-gray-400 text-xs mt-2">
                      {stat.day}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Device Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
                Device Types
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FaDesktop className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    <span className="text-white text-sm sm:text-base">
                      Desktop
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-20 sm:w-32 bg-neutral-800 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${analytics.devices?.desktop || 0}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-xs sm:text-sm w-8 sm:w-10">
                      {analytics.devices?.desktop || 0}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FaMobile className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    <span className="text-white text-sm sm:text-base">
                      Mobile
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-20 sm:w-32 bg-neutral-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${analytics.devices?.mobile || 0}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-xs sm:text-sm w-8 sm:w-10">
                      {analytics.devices?.mobile || 0}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FaDesktop className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    <span className="text-white text-sm sm:text-base">
                      Tablet
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-20 sm:w-32 bg-neutral-800 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${analytics.devices?.tablet || 0}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-xs sm:text-sm w-8 sm:w-10">
                      {analytics.devices?.tablet || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Top Pages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
                Top Pages
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {analytics.topPages?.map((page, index) => (
                  <div
                    key={page.path}
                    className="flex items-center justify-between p-2 sm:p-3 bg-neutral-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <span className="text-gray-400 text-xs sm:text-sm w-3 sm:w-4 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-white font-mono text-xs sm:text-sm truncate">
                        {page.path}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span className="text-gray-400 text-xs sm:text-sm">
                        {page.views.toLocaleString()}
                      </span>
                      <div className="w-12 sm:w-20 bg-neutral-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${page.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Traffic Sources */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
                Traffic Sources
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {analytics.trafficSources?.map((source) => (
                  <div
                    key={source.source}
                    className="flex items-center justify-between p-2 sm:p-3 bg-neutral-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <FaGlobe className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-white text-sm sm:text-base truncate">
                        {source.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span className="text-gray-400 text-xs sm:text-sm">
                        {source.visitors.toLocaleString()}
                      </span>
                      <span className="text-blue-400 text-xs sm:text-sm">
                        {source.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Additional Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6 text-center">
              <h4 className="text-base sm:text-lg font-semibold text-white mb-2">
                Bounce Rate
              </h4>
              <p className="text-2xl sm:text-3xl font-bold text-orange-400">
                {analytics.bounceRate || "0%"}
              </p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Users who left after one page
              </p>
            </div>
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6 text-center">
              <h4 className="text-base sm:text-lg font-semibold text-white mb-2">
                Conversion Rate
              </h4>
              <p className="text-2xl sm:text-3xl font-bold text-green-400">
                {analytics.conversionRate || "0%"}
              </p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Visitors who completed goals
              </p>
            </div>
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-4 sm:p-6 text-center">
              <h4 className="text-base sm:text-lg font-semibold text-white mb-2">
                Return Visitors
              </h4>
              <p className="text-2xl sm:text-3xl font-bold text-purple-400">
                34.2%
              </p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Users who visited before
              </p>
            </div>
          </motion.div>
        </>
      )}

      {/* Error Message */}
      {error.analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-center"
        >
          {error.analytics}
        </motion.div>
      )}
    </div>
  );
};

export default ProjectAnalytics;
