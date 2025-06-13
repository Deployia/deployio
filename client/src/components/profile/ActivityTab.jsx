import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FaShieldAlt,
  FaUser,
  FaLock,
  FaCog,
  FaSignInAlt,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { fetchUserActivity } from "@redux/slices/userSlice";
import LoadingState from "./LoadingState";
import ProfileErrorBoundary from "./ProfileErrorBoundary";

const ActivityTab = () => {
  const dispatch = useDispatch();

  // Get data from Redux state
  const { activities, activityPagination, loading } = useSelector(
    (state) => state.userProfile
  );
  const isLoading = loading?.userActivity || false;

  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const itemsPerPage = 10; // Reduced for better pagination UX
  // Load activities data
  const loadActivities = useCallback(
    async (page = 1, type = filter) => {
      try {
        const params = {
          page,
          limit: itemsPerPage,
          source: "activity-tab", // Add source identifier
        };

        // Only add type filter if it's not "all"
        if (type !== "all") {
          params.type = type;
        }

        await dispatch(fetchUserActivity(params));
      } catch (error) {
        console.error("Error loading activities:", error);
      }
    },
    [dispatch, filter, itemsPerPage]
  ); // Load activities on mount
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
    if (newPage >= 1 && newPage <= (activityPagination?.pages || 1)) {
      setCurrentPage(newPage);
      await loadActivities(newPage, filter);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "auth":
        return <FaSignInAlt className="w-5 h-5" />;
      case "security":
        return <FaShieldAlt className="w-5 h-5" />;
      case "profile":
        return <FaUser className="w-5 h-5" />;
      case "system":
        return <FaCog className="w-5 h-5" />;
      default:
        return <FaLock className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "auth":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "security":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "profile":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "system":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  };
  // Filter activities based on selected filter
  // Note: We're doing server-side filtering now, so we just use activities directly
  const displayActivities = activities || [];

  // Show loading state during initial load
  if (isInitialLoading) {
    return <LoadingState message="Loading activities..." />;
  }

  return (
    <ProfileErrorBoundary fallbackMessage="Failed to load activities">
      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Account Activity
            </h3>
            <p className="text-gray-400">
              View your recent account activity and security events.
            </p>
          </div>
        </div>
        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <FaFilter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Filter:</span>
          </div>{" "}
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "All" },
              { value: "auth", label: "Authentication" },
              { value: "security", label: "Security" },
              { value: "profile", label: "Profile" },
              { value: "system", label: "System" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleFilterChange(value)}
                disabled={isLoading}
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
        </div>{" "}
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-400">Loading activities...</span>
          </div>
        )}
        {/* Activities List */}
        {!isLoading &&
        (!displayActivities || displayActivities.length === 0) ? (
          <div className="text-center py-12">
            <FaLock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No activity found</p>
            <p className="text-gray-500 text-sm mt-2">
              {filter !== "all"
                ? `No ${filter} activities to display`
                : "Your account activity will appear here"}
            </p>
          </div>
        ) : (
          !isLoading && (
            <div className="space-y-4">
              {displayActivities.map((activity, index) => (
                <div
                  key={`${activity.timestamp}-${index}`}
                  className="flex items-start gap-4 p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg hover:border-neutral-600/50 transition-colors"
                >
                  <div
                    className={`p-3 rounded-full border ${getActivityColor(
                      activity.type
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white mb-1">
                      {activity.action}
                    </h4>
                    {activity.details && (
                      <p className="text-sm text-gray-400 mb-2">
                        {activity.details}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                      {activity.ip && <span>IP: {activity.ip}</span>}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs rounded-full border ${getActivityColor(
                      activity.type
                    )}`}
                  >
                    {activity.type}
                  </span>
                </div>
              ))}{" "}
            </div>
          )
        )}
        {/* Pagination */}
        {!isLoading &&
          displayActivities &&
          displayActivities.length > 0 &&
          activityPagination &&
          activityPagination.pages > 1 && (
            <div className="mt-6 space-y-4">
              {/* Pagination Info */}
              <div className="text-center text-sm text-gray-500">
                Showing page {activityPagination.current} of{" "}
                {activityPagination.pages}({activityPagination.total} total
                activities)
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-neutral-800/50 border border-neutral-700/50 text-gray-400 hover:bg-neutral-700/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronLeft className="w-3 h-3" />
                  Previous
                </button>

                {/* Page Info */}
                <div className="px-4 py-2 text-sm text-gray-400">
                  Page {currentPage} of {activityPagination.pages}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={
                    currentPage === (activityPagination?.pages || 1) ||
                    isLoading
                  }
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-neutral-800/50 border border-neutral-700/50 text-gray-400 hover:bg-neutral-700/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <FaChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
      </div>
    </ProfileErrorBoundary>
  );
};

export default ActivityTab;
