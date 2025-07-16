import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  FaBell,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle,
  FaRocket,
  FaShieldAlt,
  FaExternalLinkAlt,
  FaTrash,
  FaCheckDouble,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  selectNotifications,
  selectUnreadCount,
  selectNotificationLoading,
  selectNotificationError,
  clearNotificationError,
} from "@redux";
import { NotificationListSkeleton } from "./NotificationSkeleton";
import { toast } from "react-hot-toast";

const NotificationsList = ({ isMobile = false }) => {
  const dispatch = useDispatch();
  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'read'
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [limit] = useState(20);

  // Redux state
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const loading = useSelector(selectNotificationLoading);
  const error = useSelector(selectNotificationError);

  // Load notifications on mount and when filter changes
  useEffect(() => {
    dispatch(
      fetchNotifications({
        page: 1,
        limit,
        filter: filter === "all" ? undefined : filter,
      })
    );
  }, [dispatch, limit, filter]);

  // Filter notifications based on current filter
  const filteredNotifications = (notifications || []).filter((notification) => {
    if (filter === "unread") return notification.status === "unread";
    if (filter === "read") return notification.status === "read";
    return true; // 'all'
  });

  // Handle notification click (mark as read)
  const handleNotificationClick = useCallback(
    async (notification) => {
      if (notification.status === "unread") {
        try {
          const notificationId = notification._id || notification.id;
          await dispatch(markNotificationRead(notificationId)).unwrap();
        } catch (error) {
          console.error("Failed to mark notification as read:", error);
        }
      }

      // Handle action if notification has one
      if (notification.action?.url) {
        window.open(notification.action.url, "_blank");
      }
    },
    [dispatch]
  );

  // Mark all as read
  const handleMarkAllRead = useCallback(async () => {
    try {
      await dispatch(markAllNotificationsRead()).unwrap();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [dispatch]);

  // Delete notification
  const handleDeleteNotification = useCallback(
    async (notificationId) => {
      try {
        await dispatch(deleteNotification(notificationId)).unwrap();
        toast.success("Notification deleted");
      } catch (error) {
        toast.error("Failed to delete notification");
        console.error("Failed to delete notification:", error);
      }
    },
    [dispatch]
  );

  // Toggle notification selection
  const handleToggleSelection = useCallback((notificationId) => {
    setSelectedNotifications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  }, []);

  // Select all/none
  const handleSelectAll = useCallback(() => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(
        new Set(filteredNotifications.map((n) => n._id || n.id))
      );
    }
  }, [selectedNotifications.size, filteredNotifications]);

  // Bulk actions
  const handleBulkMarkRead = useCallback(async () => {
    const promises = Array.from(selectedNotifications).map((id) =>
      dispatch(markNotificationRead(id)).unwrap()
    );

    try {
      await Promise.all(promises);
      toast.success(
        `${selectedNotifications.size} notifications marked as read`
      );
      setSelectedNotifications(new Set());
    } catch {
      toast.error("Failed to mark some notifications as read");
    }
  }, [dispatch, selectedNotifications]);

  const handleBulkDelete = useCallback(async () => {
    const promises = Array.from(selectedNotifications).map((id) =>
      dispatch(deleteNotification(id)).unwrap()
    );

    try {
      await Promise.all(promises);
      toast.success(`${selectedNotifications.size} notifications deleted`);
      setSelectedNotifications(new Set());
    } catch {
      toast.error("Failed to delete some notifications");
    }
  }, [dispatch, selectedNotifications]);

  // Get notification icon based on type
  const getNotificationIcon = useCallback((type) => {
    if (type.startsWith("deployment.")) return FaRocket;
    if (type.startsWith("security.")) return FaShieldAlt;
    if (type.startsWith("system.")) return FaExclamationTriangle;
    return FaInfoCircle;
  }, []);

  // Get notification icon background based on type and priority
  const getNotificationIconBg = useCallback((notification) => {
    if (notification.priority === "urgent") return "from-red-500 to-red-600";
    if (notification.priority === "high")
      return "from-orange-500 to-orange-600";
    if (notification.type.startsWith("deployment.success"))
      return "from-green-500 to-green-600";
    if (notification.type.startsWith("deployment.failed"))
      return "from-red-500 to-red-600";
    if (notification.type.startsWith("security."))
      return "from-yellow-500 to-yellow-600";
    if (notification.type.startsWith("system."))
      return "from-purple-500 to-purple-600";
    return "from-blue-500 to-blue-600";
  }, []);

  // Format relative time
  const formatTimeAgo = useCallback((date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }, []);

  const containerClass = isMobile
    ? "w-full"
    : "bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl shadow-xl overflow-hidden";

  return (
    <div className={containerClass}>
      {/* Header */}
      <div
        className={`${
          isMobile ? "mb-6" : "p-4 border-b border-neutral-800/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2
                className={`font-bold text-white ${
                  isMobile ? "text-2xl" : "text-lg"
                }`}
              >
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>

          {/* Desktop actions */}
          {!isMobile && unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={loading.markAllRead}
              className="px-3 py-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-neutral-700/30 rounded-lg transition-all duration-200 flex items-center gap-1.5 font-medium"
            >
              <FaCheckDouble className="w-3 h-3" />
              Mark all read
            </button>
          )}
        </div>

        {/* Mobile actions row */}
        {isMobile && (
          <div className="flex flex-wrap gap-2 mt-4">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading.markAllRead}
                className="px-3 py-2 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all duration-200 flex items-center gap-1.5 font-medium"
              >
                <FaCheckDouble className="w-3 h-3" />
                Mark all read
              </button>
            )}

            {selectedNotifications.size > 0 && (
              <>
                <button
                  onClick={handleBulkMarkRead}
                  className="px-3 py-2 text-xs text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg transition-all duration-200 flex items-center gap-1.5 font-medium"
                >
                  <FaCheck className="w-3 h-3" />
                  Mark read ({selectedNotifications.size})
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-2 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all duration-200 flex items-center gap-1.5 font-medium"
                >
                  <FaTrash className="w-3 h-3" />
                  Delete ({selectedNotifications.size})
                </button>
              </>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1 mt-4">
          {["all", "unread", "read"].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 capitalize font-medium ${
                filter === filterType
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-neutral-700/50"
              }`}
            >
              {filterType}
            </button>
          ))}

          {/* Selection toggle */}
          {filteredNotifications.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="ml-auto px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-neutral-700/50 rounded-lg transition-all duration-200 flex items-center gap-1.5 font-medium"
            >
              {selectedNotifications.size === filteredNotifications.length ? (
                <FaEyeSlash />
              ) : (
                <FaEye />
              )}
              {selectedNotifications.size === filteredNotifications.length
                ? "Deselect all"
                : "Select all"}
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error.fetch && (
        <div className="px-4 py-2 bg-red-500/10 border-l-4 border-red-500 text-red-400 text-sm">
          {error.fetch}
          <button
            onClick={() => dispatch(clearNotificationError("fetch"))}
            className="ml-2 text-red-300 hover:text-red-200"
          >
            <FaTimes className="w-3 h-3 inline" />
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div
        className={`${
          isMobile ? "space-y-2" : "max-h-96 overflow-y-auto custom-scrollbar"
        }`}
      >
        {loading.fetch && filteredNotifications.length === 0 ? (
          <div className={isMobile ? "" : "p-2"}>
            <NotificationListSkeleton count={4} />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FaBell className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-lg font-medium mb-1">
              No {filter !== "all" ? filter : ""} notifications
            </p>
            <p className="text-sm text-gray-500">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className={isMobile ? "space-y-2" : "p-2"}>
            {filteredNotifications.map((notification, idx) => {
              const IconComponent = getNotificationIcon(notification.type);
              const iconBgClass = getNotificationIconBg(notification);
              const notificationId = notification._id || notification.id;
              const isSelected = selectedNotifications.has(notificationId);

              return (
                <motion.div
                  key={notificationId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: idx * 0.03,
                    duration: 0.15,
                  }}
                  className={`notification-item ${
                    isMobile
                      ? "p-4 bg-neutral-800/50 border border-neutral-700/50"
                      : "p-3 bg-neutral-800/50 border border-neutral-700/50"
                  } rounded-lg hover:bg-neutral-700/50 hover:border-neutral-600/50 cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                    notification.status === "unread"
                      ? "bg-neutral-800/60 border-neutral-600/50 shadow-lg shadow-blue-500/5"
                      : ""
                  } ${
                    isSelected ? "ring-2 ring-blue-500/50 bg-blue-500/10" : ""
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                  <div className="flex gap-3 relative z-10">
                    {/* Selection checkbox */}
                    {isMobile && (
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelection(notificationId)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </div>
                    )}

                    <div
                      className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${iconBgClass} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg`}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`${
                            isMobile ? "text-base" : "text-sm"
                          } font-medium text-white truncate group-hover:text-blue-400 transition-colors`}
                        >
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {notification.status === "unread" && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          )}
                          <span
                            className={`${
                              isMobile ? "text-sm" : "text-xs"
                            } text-gray-400 group-hover:text-gray-300 transition-colors`}
                          >
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>

                      <p
                        className={`${
                          isMobile ? "text-sm" : "text-sm"
                        } text-gray-400 mt-1 line-clamp-2 group-hover:text-gray-300 transition-colors`}
                      >
                        {notification.message}
                      </p>

                      {notification.action?.label && (
                        <div className="mt-2">
                          <span
                            className={`${
                              isMobile ? "text-sm" : "text-xs"
                            } text-blue-400 hover:text-blue-300 flex items-center gap-1`}
                          >
                            {notification.action.label}
                            <FaExternalLinkAlt className="w-3 h-3" />
                          </span>
                        </div>
                      )}

                      {/* Mobile actions */}
                      {isMobile && (
                        <div className="flex gap-2 mt-3 pt-2 border-t border-neutral-700/30">
                          {notification.status === "unread" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                              className="px-2 py-1 text-xs text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded transition-all duration-200"
                            >
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notificationId);
                            }}
                            className="px-2 py-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded transition-all duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsList;
