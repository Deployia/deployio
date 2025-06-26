import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FaHistory,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle,
  FaRocket,
  FaShieldAlt,
  FaUser,
  FaCog,
  FaKey,
  FaSignInAlt,
  FaGlobe,
  FaDatabase,
  FaCode,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { fetchUserActivity } from "@redux/slices/userSlice";
import { ActivityListSkeleton } from "./LoadingState";
import ProfileErrorBoundary from "./ProfileErrorBoundary";

const ActivityTab = () => {
  const dispatch = useDispatch();

  // Get user activities from Redux state
  const { activities, activityPagination, loading, error } = useSelector(
    (state) => state.userProfile
  );

  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const itemsPerPage = 20;

  // Load user activities data
  const loadActivities = useCallback(
    async (page = 1, type = filter) => {
      try {
        const params = {
          page,
          limit: itemsPerPage,
        };

        // Add type filter if it's not "all"
        if (type !== "all") {
          params.type = type;
        }

        await dispatch(fetchUserActivity(params));
      } catch (error) {
        console.error("Error loading user activities:", error);
      }
    },
    [dispatch, filter, itemsPerPage]
  );

  // Load activities on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadActivities(1, filter);
      } catch (error) {
        console.error("Error loading activities:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
  }, [loadActivities, filter]);

  // Handle filter change
  const handleFilterChange = async (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    await loadActivities(1, newFilter);
  };

  // Handle page change
  const handlePageChange = async (newPage) => {
    setCurrentPage(newPage);
    await loadActivities(newPage, filter);
  };

  // Get activity icon based on action type
  const getActivityIcon = (action) => {
    if (action?.startsWith("user.")) return FaUser;
    if (action?.startsWith("project.")) return FaCode;
    if (action?.startsWith("deployment.")) return FaRocket;
    if (action?.startsWith("security.")) return FaShieldAlt;
    if (action?.startsWith("auth.")) return FaSignInAlt;
    if (action?.startsWith("api.")) return FaKey;
    if (action?.startsWith("system.")) return FaCog;
    if (action?.startsWith("database.")) return FaDatabase;
    if (action?.startsWith("network.")) return FaGlobe;
    return FaInfoCircle;
  };
  // Get activity color based on action type
  const getActivityColor = (action) => {
    if (action?.startsWith("security."))
      return "text-red-400 border-red-500/30 bg-red-500/10";
    if (action?.startsWith("deployment.success"))
      return "text-green-400 border-green-500/30 bg-green-500/10";
    if (action?.startsWith("deployment.failed"))
      return "text-red-400 border-red-500/30 bg-red-500/10";
    if (action?.startsWith("deployment."))
      return "text-blue-400 border-blue-500/30 bg-blue-500/10";
    if (action?.startsWith("auth."))
      return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
    if (action?.startsWith("user."))
      return "text-green-400 border-green-500/30 bg-green-500/10";
    if (action?.startsWith("project."))
      return "text-purple-400 border-purple-500/30 bg-purple-500/10";
    if (action?.startsWith("api."))
      return "text-orange-400 border-orange-500/30 bg-orange-500/10";
    return "text-blue-400 border-blue-500/30 bg-blue-500/10";
  };

  // Format relative time
  const formatTimeAgo = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInSeconds = Math.floor((now - activityDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Format action for display
  const formatActionTitle = (action) => {
    if (!action) return "Activity";
    const parts = action.split(".");
    if (parts.length > 1) {
      const category = parts[0];
      const actionType = parts.slice(1).join(" ");
      return `${
        category.charAt(0).toUpperCase() + category.slice(1)
      } ${actionType}`;
    }
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  // Show loading state during initial load
  if (isInitialLoading) {
    return <ActivityListSkeleton items={8} />;
  }

  const displayActivities = activities || [];

  return (
    <ProfileErrorBoundary fallbackMessage="Failed to load activity">
      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Recent Activity
            </h3>
            <p className="text-gray-400">
              View your recent account and system activity logs.
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <FaFilter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Filter:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "All" },
              { value: "user", label: "Account" },
              { value: "auth", label: "Authentication" },
              { value: "project", label: "Projects" },
              { value: "deployment", label: "Deployments" },
              { value: "security", label: "Security" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleFilterChange(value)}
                disabled={loading.userActivity}
                className={`px-3 py-1 text-xs rounded-full transition-colors disabled:opacity-50 ${
                  filter === value
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error.userActivity && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            Failed to load activity: {error.userActivity}
          </div>
        )}

        {/* Loading State */}
        {loading.userActivity && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-400">Loading activity...</span>
          </div>
        )}

        {/* Activities List */}
        {!loading.userActivity &&
        (!displayActivities || displayActivities.length === 0) ? (
          <div className="text-center py-12">
            <FaHistory className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No activity found</p>
            <p className="text-gray-500 text-sm mt-2">
              {filter !== "all"
                ? `No ${filter} activity to display`
                : "Your activity will appear here"}
            </p>
          </div>
        ) : (
          !loading.userActivity && (
            <div className="space-y-4">
              {displayActivities.map((activity) => {
                const IconComponent = getActivityIcon(activity.action);
                const colorClass = getActivityColor(activity.action);

                return (
                  <motion.div
                    key={activity._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-neutral-800/30 border-neutral-700/50 hover:border-neutral-600/50 transition-colors"
                  >
                    <div className={`p-3 rounded-full border ${colorClass}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-white mb-1 truncate">
                          {formatActionTitle(activity.action)}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(
                              activity.createdAt || activity.timestamp
                            )}
                          </span>
                        </div>
                      </div>
                      {activity.details && (
                        <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                          {activity.details}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span
                          className={`px-2 py-1 rounded-full border ${colorClass}`}
                        >
                          {activity.action}
                        </span>
                        {activity.location && (
                          <span className="flex items-center gap-1">
                            <FaGlobe className="w-3 h-3" />
                            {activity.location}
                          </span>
                        )}
                        {activity.browser && (
                          <span className="capitalize">{activity.browser}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        )}

        {/* Pagination */}
        {!loading.userActivity &&
          displayActivities &&
          displayActivities.length > 0 &&
          activityPagination &&
          activityPagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-neutral-800/50">
              <div className="text-sm text-gray-400">
                Page {activityPagination.current} of {activityPagination.pages}{" "}
                ({activityPagination.total} total)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading.userActivity}
                  className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm text-gray-300">
                  {currentPage}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={
                    currentPage === activityPagination.pages ||
                    loading.userActivity
                  }
                  className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
      </div>
    </ProfileErrorBoundary>
  );
};

export default ActivityTab;
