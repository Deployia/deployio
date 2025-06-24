import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaBell } from "react-icons/fa";
import { motion } from "framer-motion";
import {
  fetchUnreadCount,
  selectUnreadCount,
  selectNotificationLoading,
} from "@redux";
import NotificationCenter from "./NotificationCenter";

const NotificationBell = () => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);

  // Redux state
  const unreadCount = useSelector(selectUnreadCount);
  const loading = useSelector(selectNotificationLoading);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    dispatch(fetchUnreadCount());

    // Poll for unread count every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };
  return (
    <div className="relative">
      <motion.button
        onClick={handleToggle}
        className={`relative p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          loading.unreadCount
            ? "text-gray-500 cursor-not-allowed"
            : "text-gray-400 hover:text-white hover:bg-neutral-800/50"
        }`}
        whileHover={!loading.unreadCount ? { scale: 1.05 } : {}}
        whileTap={!loading.unreadCount ? { scale: 0.95 } : {}}
        disabled={loading.unreadCount}
      >
        {/* Bell Icon */}
        <FaBell className="w-5 h-5" />

        {/* Unread count badge */}
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

        {/* Loading spinner overlay */}
        {loading.unreadCount && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
            />
          </div>
        )}

        {/* Pulse animation for new notifications */}
        {unreadCount > 0 && !loading.unreadCount && (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-blue-500/20 rounded-lg"
          />
        )}
      </motion.button>

      {/* Notification Center Dropdown */}
      <NotificationCenter isOpen={isOpen} onClose={handleClose} />
    </div>
  );
};

export default NotificationBell;
