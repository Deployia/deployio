import { useMemo, useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchUserActivity } from "@redux/slices/userSlice";
import {
  FaChartLine,
  FaCalendarAlt,
  FaShieldAlt,
  FaCog,
  FaSignInAlt,
  FaDownload,
  FaServer,
  FaKey,
  FaExclamationTriangle,
} from "react-icons/fa";
import { motion } from "framer-motion";
import ProfileErrorBoundary from "./ProfileErrorBoundary";
import { ProfileCardSkeleton, StatsGridSkeleton } from "./LoadingState";

const AnalyticsTab = () => {
  const dispatch = useDispatch();
  const { activities, loading } = useSelector((state) => state.userProfile);
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const hasInitiallyLoaded = useRef(false);

  // Fetch audit logs when component mounts
  useEffect(() => {
    if (!hasInitiallyLoaded.current) {
      hasInitiallyLoaded.current = true;
      dispatch(
        fetchUserActivity({
          page: 1,
          limit: 100,
          source: "analytics",
        })
      );
    }
  }, [dispatch]);

  // Calculate analytics data from audit logs
  const analyticsData = useMemo(() => {
    // Add proper null checks for activities
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return null;
    }

    const now = new Date();
    const timeRanges = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
    };

    const cutoffTime = new Date(now.getTime() - timeRanges[selectedTimeRange]);
    const filteredActivities = activities.filter(
      (activity) =>
        new Date(activity.createdAt || activity.timestamp) >= cutoffTime
    );

    if (filteredActivities.length === 0) return null;

    // Analyze activity patterns
    const actionTypeDistribution = {};
    const dailyActivity = {};
    const hourlyActivity = new Array(24).fill(0);

    filteredActivities.forEach((activity) => {
      const date = new Date(activity.createdAt || activity.timestamp);

      // Action type analysis (user, security, project, deployment, etc.)
      // Add proper null checks for activity.action
      const actionType =
        activity.action && typeof activity.action === "string"
          ? activity.action.split(".")[0]
          : "unknown";
      actionTypeDistribution[actionType] =
        (actionTypeDistribution[actionType] || 0) + 1;

      // Hourly activity
      hourlyActivity[date.getHours()]++;

      // Daily activity
      const dayKey = date.toISOString().split("T")[0];
      dailyActivity[dayKey] = (dailyActivity[dayKey] || 0) + 1;
    });

    // Calculate peak activity hour
    const peakHourIndex = hourlyActivity.indexOf(Math.max(...hourlyActivity));
    const peakHour = {
      hour: peakHourIndex,
      count: hourlyActivity[peakHourIndex],
    };

    // Security score based on security-related activities
    const securityActivities = filteredActivities.filter(
      (activity) =>
        activity.action &&
        (activity.action.startsWith("security.") ||
          activity.action.startsWith("user.login") ||
          activity.action.startsWith("user.password") ||
          activity.action.startsWith("user.2fa"))
    );

    // Calculate severity distribution
    const severityDistribution = {};
    filteredActivities.forEach((activity) => {
      // If activity.severity is not present, default to 'low'
      const severity =
        activity.severity && typeof activity.severity === "string"
          ? activity.severity.toLowerCase()
          : "low";
      severityDistribution[severity] =
        (severityDistribution[severity] || 0) + 1;
    });

    // Calculate security metrics
    const securityEventCount = securityActivities.length;
    const totalEvents = filteredActivities.length;
    const securityScore =
      totalEvents > 0
        ? Math.max(0, 100 - (securityEventCount / totalEvents) * 50)
        : 100;

    // Calculate average daily activity
    const uniqueDays = Object.keys(dailyActivity).length || 1;
    const averageDaily = Math.round(totalEvents / uniqueDays);

    return {
      totalActivities: filteredActivities.length,
      uniqueDays,
      averageDaily,
      securityEvents: securityEventCount,
      securityScore: Math.round(securityScore),
      peakHour,
      actionTypeDistribution,
      hourlyActivity,
      dailyActivity,
      severityDistribution, // <-- add this property
    };
  }, [activities, selectedTimeRange]);

  console.log("Analytics Data:", analyticsData);

  const timeRangeOptions = [
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
  ];

  // Export analytics data
  const exportData = () => {
    if (!analyticsData) return;

    const exportData = {
      timeRange: selectedTimeRange,
      generatedAt: new Date().toISOString(),
      analytics: analyticsData,
      rawData: activities,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-analytics-${selectedTimeRange}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  console.log(analyticsData);
  // Show loading state during initial load
  if (loading.userActivity && !analyticsData) {
    return (
      <ProfileErrorBoundary fallbackMessage="Failed to load audit analytics">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <StatsGridSkeleton columns={1} />
          </div>
          <StatsGridSkeleton columns={2} />
          <ProfileCardSkeleton />
          <StatsGridSkeleton columns={4} />
        </div>
      </ProfileErrorBoundary>
    );
  }

  if (!analyticsData) {
    return (
      <ProfileErrorBoundary fallbackMessage="Failed to load audit analytics">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8 text-center max-w-md">
            <FaChartLine className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No audit data available for analytics
            </h3>
            <p className="text-gray-400 mb-4">
              Start using the platform to generate audit logs that will appear
              in your analytics.
            </p>
          </div>
        </div>
      </ProfileErrorBoundary>
    );
  }

  const getCategoryColor = (category) => {
    const colors = {
      authentication: "text-blue-400 bg-blue-500/20",
      authorization: "text-purple-400 bg-purple-500/20",
      security: "text-red-400 bg-red-500/20",
      data: "text-green-400 bg-green-500/20",
      system: "text-orange-400 bg-orange-500/20",
    };
    return colors[category] || "text-gray-400 bg-gray-500/20";
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: "text-green-400 bg-green-500/20",
      medium: "text-yellow-400 bg-yellow-500/20",
      high: "text-orange-400 bg-orange-500/20",
      critical: "text-red-400 bg-red-500/20",
    };
    return colors[severity] || "text-gray-400 bg-gray-500/20";
  };

  const getCategoryIcon = (category) => {
    const icons = {
      authentication: FaSignInAlt,
      authorization: FaKey,
      security: FaShieldAlt,
      data: FaServer,
      system: FaCog,
    };
    return icons[category] || FaCog;
  };

  return (
    <ProfileErrorBoundary fallbackMessage="Failed to load audit analytics">
      <div className="space-y-6">
        {/* Header with time range selector */}
        <div
          id="analytics-header"
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Audit Analytics
            </h2>
            <p className="text-gray-400">
              Insights from your account activity and security events
            </p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={exportData}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FaDownload className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div
          id="analytics-metrics"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 p-6 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Events</p>
                <p className="text-2xl font-bold text-white">
                  {analyticsData.totalActivities}
                </p>
              </div>
              <FaChartLine className="text-2xl text-blue-400" />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Across {analyticsData.uniqueDays} days
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 p-6 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Daily Average</p>
                <p className="text-2xl font-bold text-white">
                  {analyticsData.averageDaily}
                </p>
              </div>
              <FaCalendarAlt className="text-2xl text-green-400" />
            </div>
            <p className="text-xs text-gray-400 mt-2">Events per day</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 p-6 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Security Events</p>
                <p className="text-2xl font-bold text-white">
                  {analyticsData.securityEvents}
                </p>
              </div>
              <FaExclamationTriangle className="text-2xl text-red-400" />
            </div>
            <p className="text-xs text-gray-400 mt-2">High/Critical severity</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 p-6 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Peak Hour</p>
                <p className="text-2xl font-bold text-white">
                  {analyticsData.peakHour.hour}:00
                </p>
              </div>
              <FaCog className="text-2xl text-purple-400" />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {analyticsData.peakHour.count} events
            </p>
          </motion.div>
        </div>

        <div
          id="analytics-distributions"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Activity by Category
            </h3>
            <div className="space-y-3">
              {Object.entries(analyticsData.actionTypeDistribution).map(
                ([category, count]) => {
                  const percentage =
                    (count / analyticsData.totalActivities) * 100;
                  const Icon = getCategoryIcon(category);
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${getCategoryColor(
                          category
                        )}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white capitalize">
                            {category}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="bg-neutral-800 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </motion.div>

          {/* Severity Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Events by Severity
            </h3>
            <div className="space-y-3">
              {Object.entries(analyticsData.severityDistribution).map(
                ([severity, count]) => {
                  const percentage =
                    (count / analyticsData.totalActivities) * 100;
                  return (
                    <div key={severity} className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${getSeverityColor(
                          severity
                        )}`}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white capitalize">
                            {severity}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="bg-neutral-800 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor:
                                severity === "critical"
                                  ? "#ef4444"
                                  : severity === "high"
                                  ? "#f97316"
                                  : severity === "medium"
                                  ? "#eab308"
                                  : "#22c55e",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </motion.div>
        </div>

        {/* Hourly Activity Pattern */}
        <motion.div
          id="analytics-activity-pattern"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Activity Pattern (24h)
          </h3>
          <div className="flex items-end justify-between gap-1 h-40 bg-neutral-800/30 rounded-lg p-4">
            {analyticsData.hourlyActivity.map((count, hour) => {
              const maxCount = Math.max(...analyticsData.hourlyActivity);
              const height =
                maxCount > 0
                  ? Math.max((count / maxCount) * 100, count > 0 ? 8 : 0)
                  : 0;
              return (
                <div
                  key={hour}
                  className="flex flex-col items-center min-w-[12px]"
                >
                  <div
                    className={`w-3 transition-all duration-300 rounded-t ${
                      count > 0
                        ? "bg-blue-500 hover:bg-blue-400 cursor-pointer"
                        : "bg-neutral-700/50"
                    }`}
                    style={{
                      height: `${height}%`,
                      minHeight: count > 0 ? "8px" : "2px",
                    }}
                    title={`${hour}:00 - ${count} events`}
                  />
                  {hour % 6 === 0 && (
                    <span className="text-xs text-gray-400 mt-2">{hour}h</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Peak activity: {analyticsData.peakHour.hour}:00 (
            {analyticsData.peakHour.count} events)
          </div>
        </motion.div>
      </div>
    </ProfileErrorBoundary>
  );
};

export default AnalyticsTab;
