import { store } from "@redux/store";
import {
  notificationReceived,
  setConnectionStatus,
  incrementUnreadCount,
  setUnreadCount,
} from "@redux/slices/notificationSlice";
import { io } from "socket.io-client";

/**
 * WebSocket Service for Real-time Notifications using Socket.IO
 * Handles connection management and real-time notification delivery
 */
class NotificationWebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.isConnecting = false;
    this.shouldReconnect = true;
  }
  /**
   * Initialize Socket.IO connection
   */
  connect() {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No auth token found, skipping WebSocket connection");
      this.isConnecting = false;
      return;
    }

    try {
      // Use environment variable or fallback to current host
      const serverUrl = import.meta.env.VITE_API_URL || window.location.origin;

      this.socket = io(serverUrl, {
        path: "/socket.io",
        namespace: "/notifications",
        auth: {
          token: token,
        },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error("Failed to create Socket.IO connection:", error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }
  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Socket.IO connected for notifications");
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;

      // Update connection status in Redux
      store.dispatch(setConnectionStatus(true));

      // Request current unread count
      this.socket.emit("get_unread_count");
    });

    this.socket.on("connected", (data) => {
      console.log("✅ Notification service ready:", data.message);
    });

    // Handle new notifications
    this.socket.on("notification", (data) => {
      this.handleNotification(data.data);
    });

    // Handle notification read updates
    this.socket.on("notification_read", (data) => {
      this.handleNotificationRead(data);
    });

    // Handle all notifications read
    this.socket.on("all_notifications_read", () => {
      console.log("All notifications marked as read");
      store.dispatch(setUnreadCount(0));
    });

    // Handle unread count updates
    this.socket.on("unread_count", (data) => {
      this.handleUnreadCount(data.count);
    });

    // Handle notification count updates from new notifications
    this.socket.on("notification_count", (data) => {
      this.handleUnreadCount(data.count);
    });

    // Handle batch notifications
    this.socket.on("notifications_batch", (data) => {
      data.data.forEach((notification) => {
        this.handleNotification(notification);
      });
    });

    // Handle pong responses
    this.socket.on("pong", (data) => {
      console.log("Received pong:", data.timestamp);
    });

    // Handle errors
    this.socket.on("error", (error) => {
      console.error("Socket.IO error:", error);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("🔌 Socket.IO disconnected:", reason);
      this.isConnecting = false;

      // Update connection status in Redux
      store.dispatch(setConnectionStatus(false));

      // Attempt to reconnect if it wasn't a manual disconnect
      if (this.shouldReconnect && reason !== "io client disconnect") {
        this.scheduleReconnect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket.IO connection error:", error);
      this.isConnecting = false;

      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    });
  }
  /**
   * Handle incoming WebSocket messages (kept for compatibility)
   */
  handleMessage(data) {
    // This method is kept for backwards compatibility
    // but Socket.IO uses direct event handlers above
    console.log("Received message:", data);
  }

  /**
   * Handle new notification received
   */
  handleNotification(notification) {
    // Add notification to Redux store
    store.dispatch(notificationReceived(notification));

    // Increment unread count
    store.dispatch(incrementUnreadCount());

    // Show browser notification if permission granted
    this.showBrowserNotification(notification);

    // Optional: Play notification sound
    this.playNotificationSound();
  }

  /**
   * Handle notification marked as read
   */
  handleNotificationRead(data) {
    console.log("Notification marked as read:", data);
    // TODO: Update specific notification in Redux store when we add more complex management
  }

  /**
   * Handle unread count update
   */
  handleUnreadCount(count) {
    store.dispatch(setUnreadCount(count));
    console.log("Unread count updated:", count);
  }

  /**
   * Send ping to server
   */
  sendPing() {
    if (this.socket?.connected) {
      this.socket.emit("ping");
    }
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId) {
    if (this.socket?.connected) {
      this.socket.emit("mark_notification_read", { notificationId });
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead() {
    if (this.socket?.connected) {
      this.socket.emit("mark_all_read");
    }
  }

  /**
   * Request current unread count
   */
  requestUnreadCount() {
    if (this.socket?.connected) {
      this.socket.emit("get_unread_count");
    }
  }

  /**
   * Show browser notification (if permission granted)
   */
  showBrowserNotification(notification) {
    if ("Notification" in window && Notification.permission === "granted") {
      const options = {
        icon: "/favicon.png",
        badge: "/favicon.png",
        tag: notification._id,
        requireInteraction: notification.priority === "urgent",
        data: {
          notificationId: notification._id,
          url: notification.action?.url,
        },
      };

      const browserNotification = new Notification(notification.title, {
        ...options,
        body: notification.message,
      });

      // Handle notification click
      browserNotification.onclick = () => {
        window.focus();
        if (notification.action?.url) {
          window.location.href = notification.action.url;
        }
        browserNotification.close();
      };

      // Auto-close after 10 seconds (except urgent notifications)
      if (notification.priority !== "urgent") {
        setTimeout(() => {
          browserNotification.close();
        }, 10000);
      }
    }
  }

  /**
   * Play notification sound
   */
  playNotificationSound() {
    // Only play if user has audio enabled in preferences
    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore audio play errors (browser restrictions)
    });
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, this.reconnectDelay);

    // Exponential backoff with jitter
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }
  /**
   * Disconnect Socket.IO
   */
  disconnect() {
    this.shouldReconnect = false;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Update connection status in Redux
    store.dispatch(setConnectionStatus(false));
  }

  /**
   * Send message to server
   */
  send(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn("Socket.IO not connected, cannot send message");
    }
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Request browser notification permission
   */
  static async requestNotificationPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }
}

// Export singleton instance
const notificationWS = new NotificationWebSocketService();

export default notificationWS;
