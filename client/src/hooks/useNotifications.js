import { useEffect, useCallback, useSyncExternalStore } from "react";
import webSocketService from "../services/websocketService";

/** Module-level singleton so App + NotificationBell share one socket and listener bus */
const globalListeners = new Map();
let socketRef = null;
let connectionPromise = null;
let subscriberCount = 0;
let connectionState = {
  isConnected: false,
  isLoading: false,
  error: null,
};

const connectionSubscribers = new Set();

function notifyConnectionSubscribers() {
  connectionSubscribers.forEach((cb) => cb());
}

function emitToListeners(event, data) {
  const listeners = globalListeners.get(event);
  if (listeners) {
    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in notification listener for ${event}:`, error);
      }
    });
  }
}

function attachSocketHandlers(socket) {
  socket.off("connect");
  socket.off("disconnect");
  socket.off("notification");
  socket.off("new_notification");
  socket.off("unread_count");
  socket.off("notification_marked_read");
  socket.off("all_notifications_marked_read");
  socket.off("error");

  socket.on("connect", () => {
    connectionState = { ...connectionState, isConnected: true, error: null };
    notifyConnectionSubscribers();
    socket.emit("subscribe_to_notifications");
    socket.emit("get_unread_count");
  });

  socket.on("disconnect", () => {
    connectionState = { ...connectionState, isConnected: false };
    notifyConnectionSubscribers();
  });

  const handleIncoming = (notification) => {
    emitToListeners("new_notification", notification);
  };

  socket.on("notification", handleIncoming);
  socket.on("new_notification", handleIncoming);

  socket.on("unread_count", (payload) => {
    const count =
      typeof payload === "number" ? payload : payload?.count ?? 0;
    emitToListeners("unread_count_changed", { count });
  });

  socket.on("notification_marked_read", (data) => {
    emitToListeners("notification_read", data);
  });

  socket.on("all_notifications_marked_read", (data) => {
    emitToListeners("all_notifications_read", data);
  });

  socket.on("error", (error) => {
    connectionState = {
      ...connectionState,
      error: error?.message || "Connection error",
    };
    notifyConnectionSubscribers();
    emitToListeners("error", error);
  });
}

async function ensureConnected() {
  if (socketRef?.connected) {
    return socketRef;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionState = { ...connectionState, isLoading: true, error: null };
  notifyConnectionSubscribers();

  connectionPromise = (async () => {
    try {
      const socket = await webSocketService.connect("/notifications");
      socketRef = socket;
      attachSocketHandlers(socket);
      connectionState = {
        isConnected: socket.connected,
        isLoading: false,
        error: null,
      };
      notifyConnectionSubscribers();
      return socket;
    } catch (error) {
      connectionState = {
        isConnected: false,
        isLoading: false,
        error: error.message,
      };
      notifyConnectionSubscribers();
      throw error;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

function subscribeToConnection(callback) {
  connectionSubscribers.add(callback);
  return () => connectionSubscribers.delete(callback);
}

function getConnectionSnapshot() {
  return connectionState;
}

/**
 * React hook for WebSocket notifications (singleton connection + listener bus)
 */
function useNotifications() {
  const conn = useSyncExternalStore(
    subscribeToConnection,
    getConnectionSnapshot,
    getConnectionSnapshot
  );

  useEffect(() => {
    subscriberCount += 1;
    ensureConnected().catch(() => {});

    return () => {
      subscriberCount -= 1;
      if (subscriberCount <= 0) {
        subscriberCount = 0;
        if (socketRef) {
          webSocketService.disconnect("/notifications");
          socketRef = null;
        }
        connectionState = {
          isConnected: false,
          isLoading: false,
          error: null,
        };
        notifyConnectionSubscribers();
      }
    };
  }, []);

  const addListener = useCallback((event, callback) => {
    if (!globalListeners.has(event)) {
      globalListeners.set(event, new Set());
    }
    globalListeners.get(event).add(callback);
    return () => globalListeners.get(event)?.delete(callback);
  }, []);

  const removeListener = useCallback((event, callback) => {
    globalListeners.get(event)?.delete(callback);
  }, []);

  const markAsRead = useCallback((notificationId) => {
    if (socketRef?.connected) {
      socketRef.emit("mark_read", { notificationId });
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    if (socketRef?.connected) {
      socketRef.emit("mark_all_read");
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return Notification.permission === "granted";
  }, []);

  const clearError = useCallback(() => {
    connectionState = { ...connectionState, error: null };
    notifyConnectionSubscribers();
  }, []);

  return {
    notifications: [],
    unreadCount: 0,
    isConnected: conn.isConnected,
    isLoading: conn.isLoading,
    error: conn.error,
    markAsRead,
    markAllAsRead,
    requestPermission,
    clearError,
    addListener,
    removeListener,
    hasPermission: typeof Notification !== "undefined" && Notification?.permission === "granted",
  };
}

export default useNotifications;
