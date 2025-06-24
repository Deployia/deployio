import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FaBell,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaRocket,
  FaShieldAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  selectNotifications,
  selectNotificationPagination,
  selectNotificationLoading,
  selectNotificationError,
} from "@redux";
import { ActivityListSkeleton } from "./LoadingState";
import ProfileErrorBoundary from "./ProfileErrorBoundary";

const ActivityTab = () => {
  const dispatch = useDispatch();

  // Get notifications from Redux state (replacing activities)
  const notifications = useSelector(selectNotifications);
  const pagination = useSelector(selectNotificationPagination);
  const loading = useSelector(selectNotificationLoading);
  const error = useSelector(selectNotificationError);

  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const itemsPerPage = 10;

  // Load notifications data (replacing activities)
  const loadNotifications = useCallback(
    async (page = 1, status = filter) => {
      try {
        const params = {
          page,
          limit: itemsPerPage,
        };

        // Only add status filter if it's not "all"
        if (status !== "all") {
          params.status = status;
        }

        await dispatch(fetchNotifications(params));
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    },
    [dispatch, filter, itemsPerPage]
  );

  // Load notifications on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadNotifications(1, filter);
      } catch (error) {
        console.error("Error loading notifications:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
  }, [loadNotifications, filter]);

  // Handle filter change
  const handleFilterChange = async (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    await loadNotifications(1, newFilter);
  };

  // Handle page change
  const handlePageChange = async (newPage) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      setCurrentPage(newPage);
      await loadNotifications(newPage, filter);
    }
  };

  // Handle notification click (mark as read)
  const handleNotificationClick = async (notification) => {
    if (notification.status === "unread") {
      try {
        await dispatch(markNotificationRead(notification._id)).unwrap();
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await dispatch(markAllNotificationsRead()).unwrap();
      // Reload current page
      await loadNotifications(currentPage, filter);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    if (type?.startsWith("deployment.")) return FaRocket;
    if (type?.startsWith("security.")) return FaShieldAlt;
    if (type?.startsWith("system.")) return FaExclamationTriangle;
    return FaInfoCircle;
  };

  const getNotificationColor = (notification) => {
    if (notification.priority === "urgent")
      return "text-red-400 border-red-500/30 bg-red-500/10";
    if (notification.priority === "high")
      return "text-orange-400 border-orange-500/30 bg-orange-500/10";
    if (notification.type?.startsWith("deployment.success"))
      return "text-green-400 border-green-500/30 bg-green-500/10";
    if (notification.type?.startsWith("deployment.failed"))
      return "text-red-400 border-red-500/30 bg-red-500/10";
    if (notification.type?.startsWith("security."))
      return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
    return "text-blue-400 border-blue-500/30 bg-blue-500/10";
  };

  // Format relative time
  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };
  // Show loading state during initial load
  if (isInitialLoading) {
    return <ActivityListSkeleton items={8} />;
  }

  const displayNotifications = notifications || [];

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
              View your recent notifications and system activity.
            </p>
          </div>
          {displayNotifications.some((n) => n.status === "unread") && (
            <button
              onClick={handleMarkAllRead}
              disabled={loading.markAllRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FaCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
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
              { value: "unread", label: "Unread" },
              { value: "read", label: "Read" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleFilterChange(value)}
                disabled={loading.fetch}
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
        {error.fetch && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            Failed to load activity: {error.fetch}
          </div>
        )}

        {/* Loading State */}
        {loading.fetch && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-400">Loading activity...</span>
          </div>
        )}

        {/* Notifications List */}
        {!loading.fetch &&
        (!displayNotifications || displayNotifications.length === 0) ? (
          <div className="text-center py-12">
            <FaBell className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No activity found</p>
            <p className="text-gray-500 text-sm mt-2">
              {filter !== "all"
                ? `No ${filter} notifications to display`
                : "Your activity will appear here"}
            </p>
          </div>
        ) : (
          !loading.fetch && (
            <div className="space-y-4">
              {displayNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification);

                return (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                      notification.status === "unread"
                        ? "bg-neutral-800/50 border-neutral-600/50"
                        : "bg-neutral-800/30 border-neutral-700/50"
                    } hover:border-neutral-600/50`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={`p-3 rounded-full border ${colorClass}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-white mb-1 truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {notification.status === "unread" && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span
                          className={`px-2 py-1 rounded-full border ${colorClass}`}
                        >
                          {notification.type || "notification"}
                        </span>
                        {notification.priority &&
                          notification.priority !== "normal" && (
                            <span className="capitalize">
                              {notification.priority} priority
                            </span>
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
        {!loading.fetch &&
          displayNotifications &&
          displayNotifications.length > 0 &&
          pagination &&
          pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-neutral-800/50">
              <div className="text-sm text-gray-400">
                Page {pagination.currentPage} of {pagination.totalPages} (
                {pagination.total} total)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading.fetch}
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
                    currentPage === pagination.totalPages || loading.fetch
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
