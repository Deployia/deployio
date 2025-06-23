const logger = require("../../../config/logger");

class InAppChannel {
  constructor() {
    this.channelName = "in_app";
  }

  /**
   * Send notification via in-app (already stored in database)
   * In-app notifications are stored in the Notification model
   * This channel handles real-time delivery via WebSocket
   * @param {Object} notification - Notification document
   * @returns {Promise<Object>} Send result
   */
  async send(notification) {
    try {
      // In-app notifications are already stored in the database
      // This method handles real-time delivery via WebSocket/SSE

      const notificationData = this.prepareInAppNotification(notification);

      // Send via WebSocket if available
      await this.sendViaWebSocket(notification.user._id, notificationData);

      // Send via Server-Sent Events as fallback
      await this.sendViaSSE(notification.user._id, notificationData);

      logger.info("In-app notification sent successfully", {
        notificationId: notification._id,
        userId: notification.user._id,
        type: notification.type,
      });

      return {
        delivered: true,
        channels: ["websocket", "sse"],
        sentAt: new Date(),
      };
    } catch (error) {
      logger.error("Failed to send in-app notification", {
        notificationId: notification._id,
        userId: notification.user?._id,
        error: error.message,
      });

      // In-app notifications don't fail completely since they're stored in DB
      // Return success but log the real-time delivery failure
      return {
        delivered: true,
        realtimeDelivered: false,
        error: error.message,
        sentAt: new Date(),
      };
    }
  }

  /**
   * Prepare in-app notification data for real-time delivery
   * @param {Object} notification - Notification document
   * @returns {Object} Formatted notification data
   */
  prepareInAppNotification(notification) {
    return {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      status: notification.status,
      context: notification.context,
      action: notification.action,
      createdAt: notification.createdAt,
      expiresAt: notification.expiresAt,
      // Add UI-specific properties
      ui: {
        icon: this.getNotificationIcon(notification.type),
        color: this.getNotificationColor(
          notification.type,
          notification.priority
        ),
        sound: this.shouldPlaySound(notification.type, notification.priority),
        persist: this.shouldPersist(notification.type, notification.priority),
        showToast: this.shouldShowToast(
          notification.type,
          notification.priority
        ),
      },
    };
  }

  /**
   * Send notification via WebSocket
   * @param {string} userId - User ID
   * @param {Object} notificationData - Notification data
   */
  async sendViaWebSocket(userId, notificationData) {
    try {
      // Get WebSocket instance (assuming it's available globally or via dependency injection)
      const io = global.io || require("../../../app").io;

      if (io) {
        // Send to user's room
        io.to(`user_${userId}`).emit("notification", {
          event: "new_notification",
          data: notificationData,
          timestamp: new Date().toISOString(),
        });

        // Send notification count update
        const notificationCount = await this.getUnreadCount(userId);
        io.to(`user_${userId}`).emit("notification_count", {
          count: notificationCount,
          timestamp: new Date().toISOString(),
        });

        logger.debug("WebSocket notification sent", {
          userId,
          notificationId: notificationData.id,
        });
      }
    } catch (error) {
      logger.error("WebSocket notification failed", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send notification via Server-Sent Events
   * @param {string} userId - User ID
   * @param {Object} notificationData - Notification data
   */
  async sendViaSSE(userId, notificationData) {
    try {
      // Get SSE connections (if implemented)
      const sseConnections = global.sseConnections || new Map();
      const userConnections = sseConnections.get(userId) || [];

      if (userConnections.length > 0) {
        const sseData = {
          event: "notification",
          data: JSON.stringify(notificationData),
          id: notificationData.id,
        };

        userConnections.forEach((connection) => {
          try {
            connection.write(`event: notification\n`);
            connection.write(`data: ${JSON.stringify(notificationData)}\n`);
            connection.write(`id: ${notificationData.id}\n\n`);
          } catch (connError) {
            logger.error("SSE connection write failed", {
              userId,
              error: connError.message,
            });
          }
        });

        logger.debug("SSE notification sent", {
          userId,
          connections: userConnections.length,
          notificationId: notificationData.id,
        });
      }
    } catch (error) {
      logger.error("SSE notification failed", {
        userId,
        error: error.message,
      });
      // Don't throw error for SSE failures
    }
  }

  /**
   * Get notification icon based on type
   * @param {string} type - Notification type
   * @returns {string} Icon name/class
   */
  getNotificationIcon(type) {
    const iconMap = {
      // Deployment icons
      "deployment.started": "rocket",
      "deployment.success": "check-circle",
      "deployment.failed": "x-circle",
      "deployment.stopped": "stop-circle",

      // Project icons
      "project.analysis_complete": "file-check",
      "project.analysis_failed": "file-x",
      "project.collaborator_added": "user-plus",

      // Security icons
      "security.login_new_device": "shield-alert",
      "security.password_changed": "key",
      "security.2fa_enabled": "shield-check",
      "security.2fa_disabled": "shield-x",
      "security.api_key_created": "code",

      // System icons
      "system.maintenance": "tool",
      "system.update": "download",
      "system.quota_warning": "alert-triangle",
      "system.quota_exceeded": "alert-circle",

      // General icons
      "general.welcome": "heart",
      "general.announcement": "megaphone",
    };

    return iconMap[type] || "bell";
  }

  /**
   * Get notification color based on type and priority
   * @param {string} type - Notification type
   * @param {string} priority - Notification priority
   * @returns {string} Color class/code
   */
  getNotificationColor(type, priority) {
    // Priority-based colors
    if (priority === "urgent") return "red";
    if (priority === "high") return "orange";
    if (priority === "low") return "gray";

    // Type-based colors
    const colorMap = {
      "deployment.success": "green",
      "deployment.failed": "red",
      "deployment.started": "blue",
      "deployment.stopped": "yellow",

      "project.analysis_complete": "green",
      "project.analysis_failed": "red",
      "project.collaborator_added": "blue",

      "security.login_new_device": "red",
      "security.password_changed": "green",
      "security.2fa_enabled": "green",
      "security.2fa_disabled": "red",
      "security.api_key_created": "blue",

      "system.maintenance": "yellow",
      "system.update": "blue",
      "system.quota_warning": "yellow",
      "system.quota_exceeded": "red",

      "general.welcome": "green",
      "general.announcement": "blue",
    };

    return colorMap[type] || "blue";
  }

  /**
   * Determine if notification should play sound
   * @param {string} type - Notification type
   * @param {string} priority - Notification priority
   * @returns {boolean} Whether to play sound
   */
  shouldPlaySound(type, priority) {
    // Play sound for urgent/high priority notifications
    if (priority === "urgent" || priority === "high") return true;

    // Play sound for critical events
    const soundTypes = [
      "deployment.failed",
      "security.login_new_device",
      "system.quota_exceeded",
    ];

    return soundTypes.includes(type);
  }

  /**
   * Determine if notification should persist on screen
   * @param {string} type - Notification type
   * @param {string} priority - Notification priority
   * @returns {boolean} Whether to persist
   */
  shouldPersist(type, priority) {
    // Persist urgent notifications
    if (priority === "urgent") return true;

    // Persist security alerts
    const persistTypes = [
      "security.login_new_device",
      "security.password_changed",
      "system.quota_exceeded",
    ];

    return persistTypes.includes(type);
  }

  /**
   * Determine if notification should show as toast
   * @param {string} type - Notification type
   * @param {string} priority - Notification priority
   * @returns {boolean} Whether to show toast
   */
  shouldShowToast(type, priority) {
    // Show toast for all notifications except low priority general ones
    if (priority === "low" && type.startsWith("general.")) return false;
    return true;
  }

  /**
   * Get unread notification count for user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount(userId) {
    try {
      const Notification = require("../../../models/Notification");
      return await Notification.countDocuments({
        user: userId,
        status: "unread",
      });
    } catch (error) {
      logger.error("Failed to get unread count", {
        userId,
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Send batch notifications for performance
   * @param {Array} notifications - Array of notifications
   */
  async sendBatch(notifications) {
    const results = [];

    // Group notifications by user
    const userNotifications = notifications.reduce((acc, notification) => {
      const userId = notification.user._id || notification.user;
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(notification);
      return acc;
    }, {});

    // Send notifications for each user
    for (const [userId, userNotifs] of Object.entries(userNotifications)) {
      try {
        const notificationData = userNotifs.map((n) =>
          this.prepareInAppNotification(n)
        );

        // Send batch via WebSocket
        await this.sendBatchViaWebSocket(userId, notificationData);

        results.push({
          userId,
          count: userNotifs.length,
          success: true,
        });
      } catch (error) {
        results.push({
          userId,
          count: userNotifs.length,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Send batch notifications via WebSocket
   * @param {string} userId - User ID
   * @param {Array} notificationData - Array of notification data
   */
  async sendBatchViaWebSocket(userId, notificationData) {
    try {
      const io = global.io || require("../../../app").io;

      if (io) {
        io.to(`user_${userId}`).emit("notifications_batch", {
          event: "batch_notifications",
          data: notificationData,
          count: notificationData.length,
          timestamp: new Date().toISOString(),
        });

        // Update notification count
        const notificationCount = await this.getUnreadCount(userId);
        io.to(`user_${userId}`).emit("notification_count", {
          count: notificationCount,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error("Batch WebSocket notification failed", {
        userId,
        count: notificationData.length,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = InAppChannel;
