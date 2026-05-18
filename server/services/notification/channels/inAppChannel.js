const logger = require("../../../config/logger");
const { formatInAppPayload } = require("../formatInAppPayload");

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

      const notificationData = formatInAppPayload(notification);
      const userId = notification.user._id || notification.user;
      const alreadyRealtime =
        notification.context?.data?._realtimeWsDelivered === true ||
        notification.context?._realtimeWsDelivered === true;

      if (!alreadyRealtime) {
        await this.sendViaWebSocket(userId, notificationData);
      }

      // Send via Server-Sent Events as fallback
      await this.sendViaSSE(userId, notificationData);

      logger.info("In-app notification sent successfully", {
        notificationId: notification._id,
        userId,
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

  /** @deprecated Use formatInAppPayload from ../formatInAppPayload */
  prepareInAppNotification(notification) {
    return formatInAppPayload(notification);
  }

  /**
   * Send notification via WebSocket
   * @param {string} userId - User ID
   * @param {Object} notificationData - Notification data
   */
  async sendViaWebSocket(userId, notificationData) {
    try {
      // Use the NotificationsNamespace for WebSocket delivery
      const NotificationsNamespace = require("../../../websockets/namespaces/NotificationsNamespace");

      // Send notification to user via WebSocket
      NotificationsNamespace.sendNotificationToUser(userId, notificationData);

      logger.debug("WebSocket notification sent via NotificationsNamespace", {
        userId,
        notificationId: notificationData.id,
      });
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
        const notificationData = userNotifs.map((n) => formatInAppPayload(n));

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
