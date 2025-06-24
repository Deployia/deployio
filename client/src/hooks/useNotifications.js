import { useState, useEffect, useCallback, useRef } from "react";
import webSocketService from "../services/websocketService";

/**
 * React hook for WebSocket notifications
 * Provides real-time notification functionality with the new architecture
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());

  const emitToListeners = useCallback((event, data) => {
    const listeners = listenersRef.current.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in notification listener for ${event}:`, error);
        }
      });
    }
  }, []);

  const addListener = useCallback((event, callback) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event).add(callback);
  }, []);

  const removeListener = useCallback((event, callback) => {
    const listeners = listenersRef.current.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }, []);
  // Initialize WebSocket connection
  useEffect(() => {
    let mounted = true;
    const currentListeners = listenersRef.current;

    const initializeConnection = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Connect to notifications namespace
        const socket = await webSocketService.connect("/notifications");

        if (!mounted) return;

        socketRef.current = socket;
        setIsConnected(socket.connected);

        // Set up event handlers
        socket.on("connect", () => {
          if (mounted) {
            setIsConnected(true);
            setError(null);
            console.log("Connected to notifications");

            // Request initial data
            socket.emit("subscribe_to_notifications");
            socket.emit("get_unread_count");
          }
        });

        socket.on("disconnect", (reason) => {
          if (mounted) {
            setIsConnected(false);
            console.log("Disconnected from notifications:", reason);
          }
        });

        socket.on("new_notification", (notification) => {
          if (mounted) {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            emitToListeners("new_notification", notification);

            // Show browser notification if permission granted
            if (Notification.permission === "granted") {
              new Notification(notification.title, {
                body: notification.message,
                icon: "/favicon.ico",
                tag: notification._id,
              });
            }
          }
        });

        socket.on("unread_count", ({ count }) => {
          if (mounted) {
            setUnreadCount(count);
            emitToListeners("unread_count_changed", count);
          }
        });

        socket.on("notification_marked_read", (data) => {
          if (mounted) {
            setNotifications((prev) =>
              prev.map((notif) =>
                notif._id === data.notificationId
                  ? { ...notif, status: "read", readAt: data.readAt }
                  : notif
              )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            emitToListeners("notification_read", data);
          }
        });

        socket.on("all_notifications_marked_read", (data) => {
          if (mounted) {
            setNotifications((prev) =>
              prev.map((notif) => ({
                ...notif,
                status: "read",
                readAt: new Date(),
              }))
            );
            setUnreadCount(0);
            emitToListeners("all_notifications_read", data);
          }
        });

        socket.on("subscribed_to_notifications", (data) => {
          console.log("Subscribed to notifications:", data);
        });

        socket.on("error", (error) => {
          if (mounted) {
            console.error("Notification WebSocket error:", error);
            setError(error.message || "Connection error");
            emitToListeners("error", error);
          }
        });

        setIsLoading(false);
      } catch (error) {
        if (mounted) {
          console.error("Failed to initialize notifications:", error);
          setError(error.message);
          setIsLoading(false);
        }
      }
    };

    initializeConnection();

    return () => {
      mounted = false;
      if (socketRef.current) {
        webSocketService.disconnect("/notifications");
        socketRef.current = null;
      }
      currentListeners.clear();
    };
  }, [emitToListeners]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("mark_read", { notificationId });
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("mark_all_read");
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return Notification.permission === "granted";
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,

    // Actions
    markAsRead,
    markAllAsRead,
    requestPermission,
    clearError,

    // Event listeners
    addListener,
    removeListener,

    // Utilities
    hasPermission: Notification?.permission === "granted",
  };
}

export default useNotifications;
