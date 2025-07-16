const webSocketRegistry = require("../core/WebSocketRegistry");
const logger = require("../../config/logger");

/**
 * Notifications WebSocket Namespace
 * Handles real-time notifications for users
 */
class NotificationsNamespace {
  constructor() {
    this.namespace = null;
  }

  /**
   * Initialize the notifications namespace
   */
  static initialize() {
    const instance = new NotificationsNamespace();

    // Register namespace with authentication required but not admin-only
    const namespace = webSocketRegistry.register("/notifications", {
      requireAuth: true,
      requireAdmin: false,
      requireVerified: false, // Allow unverified users to receive notifications
    });

    // Register event handlers
    namespace
      .on("mark_read", instance.markNotificationRead.bind(instance))
      .on("mark_all_read", instance.markAllNotificationsRead.bind(instance))
      .on("get_unread_count", instance.getUnreadCount.bind(instance))
      .on(
        "subscribe_to_notifications",
        instance.subscribeToNotifications.bind(instance)
      );

    // Add connection handler for notification-specific setup
    namespace.onConnection(instance.handleConnection.bind(instance));

    instance.namespace = namespace;

    logger.info("Notifications namespace initialized");
    return instance;
  }

  /**
   * Handle new connection
   * @param {Object} socket - Socket instance
   */
  handleConnection(socket) {
    // Send initial unread count when user connects
    this.sendUnreadCount(socket);

    // Subscribe to user-specific notification updates
    socket.join(`notifications_${socket.userId}`);

    // Send connection confirmation notification
    setTimeout(() => {
      const welcomeNotification = {
        id: `welcome_${Date.now()}`,
        type: "success",
        title: "WebSocket Connected",
        message:
          "🎉 Real-time notifications are now active! You'll receive instant updates for deployments, system events, and alerts.",
        timestamp: new Date().toISOString(),
        source: "connection_confirmation",
        isTest: true,
        isWelcome: true,
        persistent: false,
        data: {
          environment: process.env.NODE_ENV || "development",
          connectionTime: new Date().toISOString(),
        },
      };

      socket.emit("notification", welcomeNotification);

      logger.debug("Connection confirmation notification sent", {
        userId: socket.userId,
        email: socket.userEmail,
        environment: process.env.NODE_ENV,
      });
    }, 1000); // Send after 1 second to ensure client is ready

    logger.debug("User subscribed to notifications", {
      userId: socket.userId,
      email: socket.userEmail,
    });
  }

  /**
   * Mark notification as read
   * @param {Object} socket - Socket instance
   * @param {Object} data - Request data
   */
  async markNotificationRead(socket, data) {
    try {
      const { notificationId } = data;

      if (!notificationId) {
        return socket.emit("error", {
          message: "Notification ID is required",
          code: "MISSING_NOTIFICATION_ID",
        });
      }

      // Update notification status in database
      const Notification = require("../../models/Notification");
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        {
          status: "read",
          readAt: new Date(),
        },
        { new: true }
      );

      if (!notification) {
        return socket.emit("error", {
          message: "Notification not found",
          code: "NOTIFICATION_NOT_FOUND",
        });
      }

      // Verify user owns this notification
      if (notification.user.toString() !== socket.userId) {
        return socket.emit("error", {
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        });
      }

      // Emit success response
      socket.emit("notification_marked_read", {
        notificationId: notification._id,
        status: notification.status,
        readAt: notification.readAt,
      });

      // Send updated unread count
      this.sendUnreadCount(socket);

      logger.debug("Notification marked as read", {
        userId: socket.userId,
        notificationId: notification._id,
      });
    } catch (error) {
      logger.error("Error marking notification as read", {
        error: error.message,
        userId: socket.userId,
        data,
      });
      socket.emit("error", {
        message: "Failed to mark notification as read",
        code: "MARK_READ_ERROR",
      });
    }
  }

  /**
   * Mark all notifications as read
   * @param {Object} socket - Socket instance
   */
  async markAllNotificationsRead(socket) {
    try {
      const Notification = require("../../models/Notification");

      const result = await Notification.updateMany(
        {
          user: socket.userId,
          status: "unread",
        },
        {
          status: "read",
          readAt: new Date(),
        }
      );

      socket.emit("all_notifications_marked_read", {
        modifiedCount: result.modifiedCount,
      });

      // Send updated unread count (should be 0)
      this.sendUnreadCount(socket);

      logger.debug("All notifications marked as read", {
        userId: socket.userId,
        count: result.modifiedCount,
      });
    } catch (error) {
      logger.error("Error marking all notifications as read", {
        error: error.message,
        userId: socket.userId,
      });
      socket.emit("error", {
        message: "Failed to mark all notifications as read",
        code: "MARK_ALL_READ_ERROR",
      });
    }
  }

  /**
   * Get unread notification count
   * @param {Object} socket - Socket instance
   */
  async getUnreadCount(socket) {
    try {
      this.sendUnreadCount(socket);
    } catch (error) {
      logger.error("Error getting unread count", {
        error: error.message,
        userId: socket.userId,
      });
      socket.emit("error", {
        message: "Failed to get unread count",
        code: "UNREAD_COUNT_ERROR",
      });
    }
  }

  /**
   * Subscribe to notification updates
   * @param {Object} socket - Socket instance
   */
  async subscribeToNotifications(socket) {
    try {
      // User is already subscribed via handleConnection
      // This is just for explicit subscription requests
      socket.emit("subscribed_to_notifications", {
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      });

      logger.debug("User explicitly subscribed to notifications", {
        userId: socket.userId,
      });
    } catch (error) {
      logger.error("Error subscribing to notifications", {
        error: error.message,
        userId: socket.userId,
      });
      socket.emit("error", {
        message: "Failed to subscribe to notifications",
        code: "SUBSCRIPTION_ERROR",
      });
    }
  }

  /**
   * Send unread notification count to user
   * @param {Object} socket - Socket instance
   */
  async sendUnreadCount(socket) {
    try {
      const Notification = require("../../models/Notification");
      const unreadCount = await Notification.countDocuments({
        user: socket.userId,
        status: "unread",
      });

      socket.emit("unread_count", { count: unreadCount });
    } catch (error) {
      logger.error("Error sending unread count", {
        error: error.message,
        userId: socket.userId,
      });
    }
  }

  /**
   * Send notification to user (called from other parts of the app)
   * @param {String} userId - User ID
   * @param {Object} notification - Notification object
   */
  static async sendNotificationToUser(userId, notification) {
    const namespace = webSocketRegistry.get("/notifications");
    if (namespace) {
      namespace.emitToUser(userId, "new_notification", notification);

      // Also send updated unread count
      try {
        const Notification = require("../../models/Notification");
        const unreadCount = await Notification.countDocuments({
          user: userId,
          status: "unread",
        });

        namespace.emitToUser(userId, "unread_count", {
          count: unreadCount,
        });

        logger.debug("Sent notification and unread count update", {
          userId,
          notificationId: notification.id,
          unreadCount,
        });
      } catch (error) {
        logger.error("Failed to send unread count update", {
          userId,
          error: error.message,
        });
      }
    }
  }

  /**
   * Broadcast notification to all users with specific role
   * @param {String} role - User role
   * @param {Object} notification - Notification object
   */
  static broadcastToRole(role, notification) {
    const namespace = webSocketRegistry.get("/notifications");
    if (namespace) {
      namespace.emitToRole(role, "new_notification", notification);
    }
  }

  /**
   * Broadcast notification to all users
   * @param {Object} notification - Notification object
   */
  static broadcastToAll(notification) {
    const namespace = webSocketRegistry.get("/notifications");
    if (namespace) {
      namespace.emit("new_notification", notification);
    }
  }
}

module.exports = NotificationsNamespace;
