const mongoose = require("mongoose");
const Notification = require("../../models/Notification");
const User = require("../../models/User");
const logger = require("../../config/logger");
const NotificationQueue = require("./queue/notificationQueue");
const EmailChannel = require("./channels/emailChannel");
const InAppChannel = require("./channels/inAppChannel");
const PushChannel = require("./channels/pushChannel");
const NotificationTemplates = require("./templates/notificationTemplates");

class NotificationService {
  constructor() {
    this.queue = new NotificationQueue();
    this.channels = {
      email: new EmailChannel(),
      inApp: new InAppChannel(),
      push: new PushChannel(),
    };
    this.templates = new NotificationTemplates();
  }

  /**
   * Create and queue a notification for delivery
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.userId - Target user ID
   * @param {string} notificationData.type - Notification type
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {Object} notificationData.context - Additional context data
   * @param {Array} notificationData.channels - Delivery channels (optional, will be determined from user preferences)
   * @param {string} notificationData.priority - Priority level (low, normal, high, urgent)
   * @param {Date} notificationData.expiresAt - Expiration date (optional)
   * @returns {Promise<Object>} Created notification
   */
  async createNotification(notificationData) {
    try {
      const {
        userId,
        type,
        title,
        message,
        context = {},
        channels,
        priority = "normal",
        expiresAt,
        action,
      } = notificationData;

      // Validate required fields
      if (!userId || !type || !title || !message) {
        throw new Error("Missing required notification data");
      }

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Determine delivery channels based on user preferences
      const deliveryChannels =
        channels || (await this.determineChannels(userId, type));

      // Create notification document
      const notification = new Notification({
        type,
        user: userId,
        title,
        message,
        context,
        channels: deliveryChannels,
        priority,
        expiresAt,
        action,
      });

      await notification.save();

      // Queue for delivery if channels are specified
      if (deliveryChannels.length > 0) {
        await this.queue.addNotification(notification._id, deliveryChannels);
      }

      logger.info("Notification created and queued", {
        notificationId: notification._id,
        userId,
        type,
        channels: deliveryChannels,
      });

      return notification;
    } catch (error) {
      logger.error("Failed to create notification", {
        error: error.message,
        notificationData,
      });
      throw error;
    }
  }

  /**
   * Send notification immediately (bypass queue)
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Delivery results
   */
  async sendNotification(notificationId) {
    try {
      const notification = await Notification.findById(notificationId).populate(
        "user"
      );
      if (!notification) {
        throw new Error("Notification not found");
      }

      const deliveryResults = {};

      // Send via each channel
      for (const channelType of notification.channels) {
        try {
          const channel = this.channels[channelType];
          if (channel) {
            const result = await channel.send(notification);
            deliveryResults[channelType] = {
              success: true,
              result,
              sentAt: new Date(),
            };

            // Update delivery status in notification
            await this.updateDeliveryStatus(notificationId, channelType, true);
          }
        } catch (channelError) {
          deliveryResults[channelType] = {
            success: false,
            error: channelError.message,
            sentAt: new Date(),
          };

          // Update delivery status with error
          await this.updateDeliveryStatus(
            notificationId,
            channelType,
            false,
            channelError.message
          );

          logger.error("Channel delivery failed", {
            notificationId,
            channel: channelType,
            error: channelError.message,
          });
        }
      }

      return deliveryResults;
    } catch (error) {
      logger.error("Failed to send notification", {
        notificationId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send bulk notifications
   * @param {Array} notificationIds - Array of notification IDs
   * @returns {Promise<Array>} Array of delivery results
   */
  async sendBulkNotifications(notificationIds) {
    const results = [];

    for (const notificationId of notificationIds) {
      try {
        const result = await this.sendNotification(notificationId);
        results.push({ notificationId, success: true, result });
      } catch (error) {
        results.push({
          notificationId,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get user notifications with filtering
   * @param {string} userId - User ID
   * @param {Object} filters - Filtering options
   * @returns {Promise<Object>} Paginated notifications
   */
  async getUserNotifications(userId, filters = {}) {
    try {
      const {
        status,
        type,
        priority,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = filters;

      const query = { user: userId };

      // Apply filters
      if (status) query.status = status;
      if (type) query.type = type;
      if (priority) query.priority = priority;

      // Build sort object
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("context.project", "name")
          .populate("context.deployment", "status environmentName")
          .lean(),
        Notification.countDocuments(query),
      ]);

      return {
        notifications,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error("Failed to get user notifications", {
        userId,
        filters,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Mark notifications as read
   * @param {string} userId - User ID
   * @param {Array} notificationIds - Array of notification IDs
   * @returns {Promise<Object>} Update result
   */
  async markAsRead(userId, notificationIds) {
    try {
      const result = await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          user: userId,
        },
        {
          $set: {
            status: "read",
            readAt: new Date(),
          },
        }
      );

      logger.info("Notifications marked as read", {
        userId,
        count: result.modifiedCount,
      });

      return result;
    } catch (error) {
      logger.error("Failed to mark notifications as read", {
        userId,
        notificationIds,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        {
          user: userId,
          status: "unread",
        },
        {
          $set: {
            status: "read",
            readAt: new Date(),
          },
        }
      );

      return result;
    } catch (error) {
      logger.error("Failed to mark all notifications as read", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete notifications
   * @param {string} userId - User ID
   * @param {Array} notificationIds - Array of notification IDs
   * @returns {Promise<Object>} Delete result
   */
  async deleteNotifications(userId, notificationIds) {
    try {
      const result = await Notification.deleteMany({
        _id: { $in: notificationIds },
        user: userId,
      });

      logger.info("Notifications deleted", {
        userId,
        count: result.deletedCount,
      });

      return result;
    } catch (error) {
      logger.error("Failed to delete notifications", {
        userId,
        notificationIds,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get notification statistics for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Notification statistics
   */
  async getNotificationStats(userId) {
    try {
      const stats = await Notification.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: {
              $sum: { $cond: [{ $eq: ["$status", "unread"] }, 1, 0] },
            },
            read: {
              $sum: { $cond: [{ $eq: ["$status", "read"] }, 1, 0] },
            },
            archived: {
              $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] },
            },
            byPriority: {
              $push: "$priority",
            },
            byType: {
              $push: "$type",
            },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            unread: 1,
            read: 1,
            archived: 1,
            priorityStats: {
              $arrayToObject: {
                $map: {
                  input: ["low", "normal", "high", "urgent"],
                  as: "priority",
                  in: {
                    k: "$$priority",
                    v: {
                      $size: {
                        $filter: {
                          input: "$byPriority",
                          cond: { $eq: ["$$this", "$$priority"] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]);

      return (
        stats[0] || {
          total: 0,
          unread: 0,
          read: 0,
          archived: 0,
          priorityStats: { low: 0, normal: 0, high: 0, urgent: 0 },
        }
      );
    } catch (error) {
      logger.error("Failed to get notification stats", {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Determine delivery channels based on user preferences and notification type
   * @param {string} userId - User ID
   * @param {string} notificationType - Notification type
   * @returns {Promise<Array>} Array of channel names
   */
  async determineChannels(userId, notificationType) {
    try {
      const user = await User.findById(userId).select(
        "notificationPreferences"
      );
      if (!user) {
        return ["in_app"]; // Default fallback
      }

      const prefs = user.notificationPreferences || {};
      const channels = [];

      // Always include in-app if enabled
      if (prefs.inApp !== false) {
        channels.push("in_app");
      }

      // Check if user wants email notifications for this type
      if (prefs.email && this.shouldSendEmailForType(prefs, notificationType)) {
        channels.push("email");
      }

      // Check if user wants push notifications for this type
      if (prefs.push && this.shouldSendPushForType(prefs, notificationType)) {
        channels.push("push");
      }

      return channels;
    } catch (error) {
      logger.error("Failed to determine channels", {
        userId,
        notificationType,
        error: error.message,
      });
      return ["in_app"]; // Default fallback
    }
  }

  /**
   * Check if email should be sent for notification type
   * @param {Object} preferences - User preferences
   * @param {string} notificationType - Notification type
   * @returns {boolean} Whether to send email
   */
  shouldSendEmailForType(preferences, notificationType) {
    const typeMap = {
      "deployment.started": "deploymentStarted",
      "deployment.success": "deploymentSuccess",
      "deployment.failed": "deploymentFailure",
      "deployment.stopped": "deploymentStopped",
      "project.analysis_complete": "projectAnalysisComplete",
      "project.analysis_failed": "projectAnalysisFailed",
      "project.collaborator_added": "projectCollaboratorAdded",
      "security.login_new_device": "newDeviceLogin",
      "security.password_changed": "passwordChanged",
      "security.2fa_enabled": "twoFactorEnabled",
      "security.2fa_disabled": "twoFactorDisabled",
      "security.api_key_created": "apiKeyCreated",
      "system.maintenance": "systemMaintenance",
      "system.update": "systemUpdates",
      "system.quota_warning": "quotaWarning",
      "system.quota_exceeded": "quotaExceeded",
      "general.welcome": "welcomeMessage",
      "general.announcement": "announcements",
    };

    const prefKey = typeMap[notificationType];
    return prefKey ? preferences[prefKey] !== false : true;
  }

  /**
   * Check if push should be sent for notification type
   * @param {Object} preferences - User preferences
   * @param {string} notificationType - Notification type
   * @returns {boolean} Whether to send push
   */
  shouldSendPushForType(preferences, notificationType) {
    // Push notifications are typically for urgent/important notifications
    const urgentTypes = [
      "deployment.failed",
      "security.login_new_device",
      "security.password_changed",
      "system.quota_exceeded",
    ];

    return urgentTypes.includes(notificationType);
  }

  /**
   * Update delivery status for a notification
   * @param {string} notificationId - Notification ID
   * @param {string} channel - Channel name
   * @param {boolean} success - Whether delivery was successful
   * @param {string} error - Error message if failed
   */
  async updateDeliveryStatus(notificationId, channel, success, error = null) {
    try {
      const updateData = {
        [`delivery.${channel}.sent`]: success,
        [`delivery.${channel}.sentAt`]: new Date(),
      };

      if (error) {
        updateData[`delivery.${channel}.error`] = error;
      }

      await Notification.findByIdAndUpdate(notificationId, {
        $set: updateData,
      });
    } catch (updateError) {
      logger.error("Failed to update delivery status", {
        notificationId,
        channel,
        error: updateError.message,
      });
    }
  }

  /**
   * Check user's quiet hours
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether user is in quiet hours
   */
  async isInQuietHours(userId) {
    try {
      const user = await User.findById(userId).select(
        "notificationPreferences"
      );
      if (!user || !user.notificationPreferences?.quietHours?.enabled) {
        return false;
      }

      const { start, end, timezone } = user.notificationPreferences.quietHours;
      const now = new Date();

      // Convert current time to user's timezone
      // This is a simplified version - in production, use a proper timezone library
      const userTime = new Date(
        now.toLocaleString("en-US", { timeZone: timezone })
      );
      const currentHour = userTime.getHours();
      const currentMinute = userTime.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = start.split(":").map(Number);
      const [endHour, endMinute] = end.split(":").map(Number);
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      if (startTime < endTime) {
        return currentTime >= startTime && currentTime <= endTime;
      } else {
        // Quiet hours span midnight
        return currentTime >= startTime || currentTime <= endTime;
      }
    } catch (error) {
      logger.error("Failed to check quiet hours", {
        userId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Create system-wide notification for all users
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Array>} Array of created notifications
   */
  async createSystemNotification(notificationData) {
    try {
      const users = await User.find({ status: "active" }).select("_id");
      const notifications = [];

      for (const user of users) {
        const notification = await this.createNotification({
          ...notificationData,
          userId: user._id,
        });
        notifications.push(notification);
      }

      logger.info("System notification created for all users", {
        type: notificationData.type,
        userCount: users.length,
      });

      return notifications;
    } catch (error) {
      logger.error("Failed to create system notification", {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new NotificationService();
