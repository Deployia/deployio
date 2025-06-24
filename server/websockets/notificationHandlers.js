const logger = require("../config/logger");

/**
 * Notification WebSocket Handlers
 * Handles all notification-related WebSocket events
 */
class NotificationHandlers {
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
      const Notification = require("../models/Notification");
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

      // Broadcast read status to all user's connected devices
      const webSocketManager = require("../config/webSocketManager");
      webSocketManager.emitToUser(socket.userId, "notification_read", {
        notificationId,
        timestamp: new Date().toISOString(),
      });

      // Send updated unread count
      const unreadCount = await Notification.countDocuments({
        user: socket.userId,
        status: "unread",
      });

      webSocketManager.emitToUser(socket.userId, "unread_count", {
        count: unreadCount,
        timestamp: new Date().toISOString(),
      });

      logger.debug("Notification marked as read", {
        userId: socket.userId,
        notificationId,
      });
    } catch (error) {
      logger.error("Failed to mark notification as read", {
        userId: socket.userId,
        error: error.message,
      });

      socket.emit("error", {
        message: "Failed to mark notification as read",
        code: "MARK_READ_FAILED",
      });
    }
  }

  /**
   * Mark all notifications as read
   * @param {Object} socket - Socket instance
   */
  async markAllNotificationsRead(socket) {
    try {
      // Update all unread notifications for user
      const Notification = require("../models/Notification");
      await Notification.updateMany(
        { user: socket.userId, status: "unread" },
        {
          status: "read",
          readAt: new Date(),
        }
      );

      // Broadcast to all user's connected devices
      const webSocketManager = require("../config/webSocketManager");
      webSocketManager.emitToUser(socket.userId, "all_notifications_read", {
        timestamp: new Date().toISOString(),
      });

      // Send updated unread count (should be 0)
      webSocketManager.emitToUser(socket.userId, "unread_count", {
        count: 0,
        timestamp: new Date().toISOString(),
      });

      logger.debug("All notifications marked as read", {
        userId: socket.userId,
      });
    } catch (error) {
      logger.error("Failed to mark all notifications as read", {
        userId: socket.userId,
        error: error.message,
      });

      socket.emit("error", {
        message: "Failed to mark all notifications as read",
        code: "MARK_ALL_READ_FAILED",
      });
    }
  }

  /**
   * Get current unread count
   * @param {Object} socket - Socket instance
   */
  async getUnreadCount(socket) {
    try {
      const Notification = require("../models/Notification");
      const count = await Notification.countDocuments({
        user: socket.userId,
        status: "unread",
      });

      socket.emit("unread_count", {
        count,
        timestamp: new Date().toISOString(),
      });

      logger.debug("Unread count requested", {
        userId: socket.userId,
        count,
      });
    } catch (error) {
      logger.error("Failed to get unread count", {
        userId: socket.userId,
        error: error.message,
      });

      socket.emit("error", {
        message: "Failed to get unread count",
        code: "UNREAD_COUNT_FAILED",
      });
    }
  }

  /**
   * Get recent notifications
   * @param {Object} socket - Socket instance
   * @param {Object} data - Request data
   */
  async getRecentNotifications(socket, data = {}) {
    try {
      const { limit = 10, offset = 0 } = data;

      const Notification = require("../models/Notification");
      const notifications = await Notification.find({
        user: socket.userId,
      })
        .sort({ createdAt: -1 })
        .limit(Math.min(limit, 50)) // Cap at 50
        .skip(offset)
        .lean();

      socket.emit("recent_notifications", {
        notifications,
        timestamp: new Date().toISOString(),
      });

      logger.debug("Recent notifications requested", {
        userId: socket.userId,
        count: notifications.length,
      });
    } catch (error) {
      logger.error("Failed to get recent notifications", {
        userId: socket.userId,
        error: error.message,
      });

      socket.emit("error", {
        message: "Failed to get recent notifications",
        code: "RECENT_NOTIFICATIONS_FAILED",
      });
    }
  }

  /**
   * Archive notification
   * @param {Object} socket - Socket instance
   * @param {Object} data - Request data
   */
  async archiveNotification(socket, data) {
    try {
      const { notificationId } = data;

      if (!notificationId) {
        return socket.emit("error", {
          message: "Notification ID is required",
          code: "MISSING_NOTIFICATION_ID",
        });
      }

      const Notification = require("../models/Notification");
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        {
          status: "archived",
          archivedAt: new Date(),
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

      // Broadcast archive status to all user's connected devices
      const webSocketManager = require("../config/webSocketManager");
      webSocketManager.emitToUser(socket.userId, "notification_archived", {
        notificationId,
        timestamp: new Date().toISOString(),
      });

      logger.debug("Notification archived", {
        userId: socket.userId,
        notificationId,
      });
    } catch (error) {
      logger.error("Failed to archive notification", {
        userId: socket.userId,
        error: error.message,
      });

      socket.emit("error", {
        message: "Failed to archive notification",
        code: "ARCHIVE_FAILED",
      });
    }
  }
}

// Export event handlers mapping
const notificationHandlers = new NotificationHandlers();

module.exports = {
  // Event handler mapping for WebSocket manager
  mark_notification_read:
    notificationHandlers.markNotificationRead.bind(notificationHandlers),
  mark_all_read:
    notificationHandlers.markAllNotificationsRead.bind(notificationHandlers),
  get_unread_count:
    notificationHandlers.getUnreadCount.bind(notificationHandlers),
  get_recent_notifications:
    notificationHandlers.getRecentNotifications.bind(notificationHandlers),
  archive_notification:
    notificationHandlers.archiveNotification.bind(notificationHandlers),

  // Export class for advanced usage
  NotificationHandlers,
};
