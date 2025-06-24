import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBell,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle,
  FaRocket,
  FaShieldAlt,
} from "react-icons/fa";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  selectNotifications,
  selectUnreadCount,
  selectNotificationLoading,
  selectNotificationError,
  clearNotificationError,
} from "@redux";
import { NotificationListSkeleton } from "./NotificationSkeleton";

const NotificationCenter = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);

  // Redux state
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const loading = useSelector(selectNotificationLoading);
  const error = useSelector(selectNotificationError);

  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'read'

  // Load notifications when component mounts or opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications({ page: 1, limit: 20 }));
    }
  }, [dispatch, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);
  // Filter notifications based on current filter
  const filteredNotifications = (notifications || []).filter((notification) => {
    if (filter === "unread") return notification.status === "unread";
    if (filter === "read") return notification.status === "read";
    return true; // 'all'
  });

  // Handle notification click (mark as read)
  const handleNotificationClick = async (notification) => {
    if (notification.status === "unread") {
      try {
        await dispatch(markNotificationRead(notification._id)).unwrap();
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    // Handle action if notification has one
    if (notification.action?.url) {
      window.location.href = notification.action.url;
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await dispatch(markAllNotificationsRead()).unwrap();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    if (type.startsWith("deployment.")) return FaRocket;
    if (type.startsWith("security.")) return FaShieldAlt;
    if (type.startsWith("system.")) return FaExclamationTriangle;
    return FaInfoCircle;
  };

  // Get notification color based on type and priority
  const getNotificationColor = (notification) => {
    if (notification.priority === "urgent") return "text-red-400";
    if (notification.priority === "high") return "text-orange-400";
    if (notification.type.startsWith("deployment.success"))
      return "text-green-400";
    if (notification.type.startsWith("deployment.failed"))
      return "text-red-400";
    if (notification.type.startsWith("security.")) return "text-yellow-400";
    return "text-blue-400";
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.1 }}
        className="absolute right-0 top-12 w-96 max-h-96 bg-neutral-900/95 backdrop-blur-md border border-neutral-800/50 rounded-xl shadow-xl z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaBell className="text-blue-400" />
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 mt-3">
            {["all", "unread", "read"].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 text-xs rounded-md transition-colors capitalize ${
                  filter === filterType
                    ? "bg-blue-500 text-white"
                    : "text-gray-400 hover:text-white hover:bg-neutral-800/50"
                }`}
              >
                {filterType}
              </button>
            ))}

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading.markAllRead}
                className="ml-auto px-3 py-1 text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                <FaCheck className="w-3 h-3" />
                Mark all read
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
        )}{" "}
        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
          {loading.fetch && filteredNotifications.length === 0 ? (
            <NotificationListSkeleton count={4} />
          ) : filteredNotifications.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <FaBell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No {filter !== "all" ? filter : ""} notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/30">
              {filteredNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification);

                return (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`notification-item p-3 hover:bg-neutral-800/30 cursor-pointer transition-colors ${
                      notification.status === "unread"
                        ? "bg-neutral-800/20"
                        : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className={`flex-shrink-0 ${colorClass}`}>
                        <IconComponent className="w-4 h-4 mt-0.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-white truncate">
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {notification.status === "unread" && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>

                        {notification.action?.label && (
                          <div className="mt-2">
                            <span className="text-xs text-blue-400 hover:text-blue-300">
                              {notification.action.label} →
                            </span>
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
        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="px-4 py-2 border-t border-neutral-800/50 text-center">
            <button
              onClick={() => {
                // Navigate to full notifications page (implement later)
                console.log("Navigate to full notifications page");
              }}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              View all notifications
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationCenter;
