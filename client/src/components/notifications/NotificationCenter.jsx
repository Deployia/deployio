import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBell,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle,
  FaRocket,
  FaShieldAlt,
  FaExternalLinkAlt,
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
  const navigate = useNavigate();
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

  // Handle mouse enter/leave for smooth hover behavior
  const handleMouseEnter = useCallback(() => {
    // Mouse enter handling - can be used for future features
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Mouse leave handling - can be used for future features
  }, []);
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
        const notificationId = notification._id || notification.id;
        await dispatch(markNotificationRead(notificationId)).unwrap();
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

  // Get notification icon background based on type and priority
  const getNotificationIconBg = (notification) => {
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

  // Handle "View all notifications" click
  const handleViewAllClick = useCallback(() => {
    navigate("/dashboard/profile?tab=notifications");
    onClose();
  }, [navigate, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="absolute right-0 top-full mt-2 w-96 bg-neutral-800/95 backdrop-blur-lg border border-neutral-700/50 rounded-xl shadow-2xl overflow-hidden z-50 max-w-[calc(100vw-2rem)] lg:max-w-96"
      >
        {/* Header */}
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <FaBell className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-neutral-700/50 rounded-lg transition-all duration-200"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 mt-3 px-2">
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

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading.markAllRead}
                className="ml-auto px-3 py-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-neutral-700/30 rounded-lg transition-all duration-200 flex items-center gap-1.5 font-medium"
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
            <div className="p-2">
              <NotificationListSkeleton count={4} />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <FaBell className="w-4 h-4 opacity-50" />
              </div>
              <p className="text-sm">
                No {filter !== "all" ? filter : ""} notifications
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredNotifications.map((notification, idx) => {
                const IconComponent = getNotificationIcon(notification.type);
                const iconBgClass = getNotificationIconBg(notification);

                return (
                  <motion.div
                    key={notification._id || notification.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: idx * 0.03,
                      duration: 0.15,
                    }}
                    className={`notification-item p-3 rounded-lg hover:bg-neutral-700/80 cursor-pointer transition-all duration-200 group relative overflow-hidden mb-1 ${
                      notification.status === "unread"
                        ? "bg-neutral-800/40 border border-neutral-700/30"
                        : "hover:bg-neutral-800/30"
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    <div className="flex gap-3 relative z-10">
                      <div
                        className={`flex-shrink-0 w-8 h-8 bg-gradient-to-br ${iconBgClass} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg`}
                      >
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {notification.status === "unread" && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            )}
                            <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-400 mt-1 line-clamp-2 group-hover:text-gray-300 transition-colors">
                          {notification.message}
                        </p>

                        {notification.action?.label && (
                          <div className="mt-2">
                            <span className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                              {notification.action.label}
                              <FaExternalLinkAlt className="w-3 h-3" />
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
          <div className="p-2 border-t border-neutral-800/50">
            <button
              onClick={handleViewAllClick}
              className="w-full text-sm text-blue-400 hover:text-blue-300 hover:bg-neutral-700/30 transition-all duration-200 py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              View all notifications
              <FaExternalLinkAlt className="w-3 h-3" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationCenter;
