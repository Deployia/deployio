import { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchUserActivity } from "@redux/slices/userSlice";
import {
  FaChartLine,
  FaCalendarAlt,
  FaUser,
  FaShieldAlt,
  FaCog,
  FaSignInAlt,
  FaDownload,
} from "react-icons/fa";
import { motion } from "framer-motion";
import ProfileErrorBoundary from "./ProfileErrorBoundary";

const ActivityAnalytics = () => {
  const dispatch = useDispatch();
  const { activities, loading } = useSelector((state) => state.userProfile);
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d"); // Fetch activities when component mounts if not already loaded
  useEffect(() => {
    // Only load if we don't have enough activities for meaningful analytics
    // Reduced limit to avoid conflicts with ActivityTab pagination
    if (!activities || activities.length < 10) {
      dispatch(fetchUserActivity({ page: 1, limit: 100, source: "analytics" }));
    }
  }, [dispatch, activities]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!activities || activities.length === 0) return null;

    const now = new Date();
    const timeRanges = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
    };

    const cutoffTime = new Date(now.getTime() - timeRanges[selectedTimeRange]);
    const filteredActivities = activities.filter(
      (activity) => new Date(activity.timestamp) >= cutoffTime
    );

    // Activity type distribution
    const typeDistribution = filteredActivities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {});

    // Activity timeline (daily)
    const dailyActivity = {};
    filteredActivities.forEach((activity) => {
      const date = new Date(activity.timestamp).toDateString();
      dailyActivity[date] = (dailyActivity[date] || 0) + 1;
    });

    // Peak activity hours
    const hourlyActivity = {};
    filteredActivities.forEach((activity) => {
      const hour = new Date(activity.timestamp).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourlyActivity).reduce(
      (max, [hour, count]) =>
        count > max.count ? { hour: parseInt(hour), count } : max,
      { hour: 0, count: 0 }
    );

    // Security events
    const securityEvents = filteredActivities.filter(
      (activity) => activity.type === "security"
    ).length;

    // Most common actions
    const actionFrequency = filteredActivities.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {});

    const topActions = Object.entries(actionFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      totalActivities: filteredActivities.length,
      typeDistribution,
      dailyActivity,
      peakHour,
      securityEvents,
      topActions,
      averageDaily: Math.round(
        filteredActivities.length /
          Math.max(1, Object.keys(dailyActivity).length)
      ),
    };
  }, [activities, selectedTimeRange]);

  const exportData = () => {
    if (!analyticsData) return;

    const exportObject = {
      timeRange: selectedTimeRange,
      generatedAt: new Date().toISOString(),
      analytics: analyticsData,
      activities: activities.slice(0, 100), // Export last 100 activities
    };

    const dataStr = JSON.stringify(exportObject, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `activity-analytics-${selectedTimeRange}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  if (!analyticsData) {
    return (
      <ProfileErrorBoundary fallbackMessage="Failed to load activity analytics">
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
          <div className="text-center py-8">
            {loading?.userActivity ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading activity analytics...</p>
              </>
            ) : (
              <>
                <FaChartLine className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">
                  No activity data available for analytics
                </p>{" "}
              </>
            )}
          </div>
        </div>
      </ProfileErrorBoundary>
    );
  }

  const typeColors = {
    auth: "bg-blue-500/20 text-blue-400",
    security: "bg-red-500/20 text-red-400",
    profile: "bg-green-500/20 text-green-400",
    system: "bg-purple-500/20 text-purple-400",
  };

  const typeIcons = {
    auth: FaSignInAlt,
    security: FaShieldAlt,
    profile: FaUser,
    system: FaCog,
  };
  return (
    <ProfileErrorBoundary fallbackMessage="Failed to load activity analytics">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Activity Analytics
            </h3>
            <p className="text-gray-400">
              Insights into your account activity patterns
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>

            {/* Export Button */}
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaDownload className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Activities</p>
                <p className="text-2xl font-bold text-white">
                  {analyticsData.totalActivities}
                </p>
              </div>
              <FaChartLine className="text-blue-400 text-xl" />
            </div>
          </div>

          <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Daily Average</p>
                <p className="text-2xl font-bold text-white">
                  {analyticsData.averageDaily}
                </p>
              </div>
              <FaCalendarAlt className="text-green-400 text-xl" />
            </div>
          </div>

          <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Security Events</p>
                <p className="text-2xl font-bold text-white">
                  {analyticsData.securityEvents}
                </p>
              </div>
              <FaShieldAlt className="text-red-400 text-xl" />
            </div>
          </div>

          <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Peak Hour</p>
                <p className="text-2xl font-bold text-white">
                  {analyticsData.peakHour.hour}:00
                </p>
              </div>
              <FaCog className="text-purple-400 text-xl" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Type Distribution */}
          <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">
              Activity by Type
            </h4>
            <div className="space-y-3">
              {Object.entries(analyticsData.typeDistribution).map(
                ([type, count]) => {
                  const Icon = typeIcons[type] || FaCog;
                  const percentage = Math.round(
                    (count / analyticsData.totalActivities) * 100
                  );

                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            typeColors[type] || typeColors.system
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-white capitalize">{type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-neutral-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-sm w-12">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Top Actions */}
          <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">
              Most Common Actions
            </h4>
            <div className="space-y-3">
              {analyticsData.topActions.map(([action, count], index) => (
                <div key={action} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-neutral-700 rounded-full flex items-center justify-center text-xs text-gray-400">
                      {index + 1}
                    </div>
                    <span className="text-white text-sm">{action}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{count}x</span>
                </div>
              ))}
            </div>{" "}
          </div>
        </div>
      </motion.div>
    </ProfileErrorBoundary>
  );
};

export default ActivityAnalytics;
