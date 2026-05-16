import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaBell } from "react-icons/fa";
import { motion } from "framer-motion";
import {
  fetchNotifications,
  fetchUnreadCount,
  selectUnreadCount,
  selectNotificationLoading,
  addNotification,
  updateNotificationCount,
} from "@redux";
import NotificationCenter from "./NotificationCenter";
import useNotifications from "@hooks/useNotifications";

const NotificationBell = ({ isOpen, onToggle, onClose }) => {
  const dispatch = useDispatch();
  const bellRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const { isAuthenticated } = useSelector((state) => state.auth);
  const unreadCount = useSelector(selectUnreadCount);
  const loading = useSelector(selectNotificationLoading);

  const {
    isConnected: wsConnected,
    addListener,
    removeListener,
  } = useNotifications();

  const syncNotifications = useCallback(() => {
    dispatch(fetchUnreadCount());
    dispatch(fetchNotifications({ page: 1, limit: 20 }));
  }, [dispatch]);

  // Sync from API on login and mount
  useEffect(() => {
    if (!isAuthenticated) return;
    syncNotifications();
  }, [isAuthenticated, syncNotifications]);

  // Light polling fallback to keep badge accurate
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, 60000);

    return () => clearInterval(interval);
  }, [dispatch, isAuthenticated]);

  // Real-time WebSocket updates
  useEffect(() => {
    if (!wsConnected) return;

    const handleNewNotification = (notification) => {
      dispatch(addNotification(notification));
      dispatch(fetchUnreadCount());
      // Merge API list without dropping the realtime item (handled in slice)
      dispatch(fetchNotifications({ page: 1, limit: 20 }));
    };

    const handleCountUpdate = (data) => {
      const count = typeof data === "number" ? data : data?.count;
      if (typeof count === "number") {
        dispatch(updateNotificationCount(count));
      }
    };

    addListener("new_notification", handleNewNotification);
    addListener("unread_count_changed", handleCountUpdate);

    return () => {
      removeListener("new_notification", handleNewNotification);
      removeListener("unread_count_changed", handleCountUpdate);
    };
  }, [dispatch, wsConnected, addListener, removeListener]);

  useEffect(() => {
    const currentTimeout = hoverTimeoutRef.current;
    return () => {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
    };
  }, []);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <motion.div className="relative" ref={bellRef}>
      <motion.button
        onClick={handleToggle}
        className={`relative inline-flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          loading.unreadCount
            ? "text-gray-500 cursor-not-allowed"
            : "text-gray-300 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-700"
        }`}
        whileHover={!loading.unreadCount ? { scale: 1.02 } : {}}
        whileTap={!loading.unreadCount ? { scale: 0.98 } : {}}
        disabled={loading.unreadCount}
      >
        <FaBell className="w-5 h-5" />

        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold border-2 border-neutral-900"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}

        {loading.unreadCount && (
          <motion.div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
            />
          </motion.div>
        )}
      </motion.button>

      <NotificationCenter isOpen={isOpen} onClose={handleClose} />
    </motion.div>
  );
};

export default NotificationBell;
