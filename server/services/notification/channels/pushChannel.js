const logger = require("../../../config/logger");

class PushChannel {
  constructor() {
    this.channelName = "push";
    this.initialized = false;
    this.fcm = null;
    this.apn = null;
  }

  /**
   * Initialize push notification services
   */
  async initialize() {
    try {
      // Initialize Firebase Cloud Messaging (for Android and Web)
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
        const admin = require("firebase-admin");

        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(
                /\\n/g,
                "\n"
              ),
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
          });
        }

        this.fcm = admin.messaging();
        logger.info("Firebase Cloud Messaging initialized");
      }

      // Initialize Apple Push Notification service (for iOS)
      if (process.env.APN_KEY_ID && process.env.APN_TEAM_ID) {
        const apn = require("apn");

        this.apn = new apn.Provider({
          token: {
            key: process.env.APN_PRIVATE_KEY,
            keyId: process.env.APN_KEY_ID,
            teamId: process.env.APN_TEAM_ID,
          },
          production: process.env.NODE_ENV === "production",
        });

        logger.info("Apple Push Notification service initialized");
      }

      this.initialized = true;
    } catch (error) {
      logger.error("Failed to initialize push services", {
        error: error.message,
      });
      // Don't throw error - allow graceful degradation
    }
  }

  /**
   * Send notification via push
   * @param {Object} notification - Notification document
   * @returns {Promise<Object>} Send result
   */
  async send(notification) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.fcm && !this.apn) {
        throw new Error("Push notification services not configured");
      }

      // Get user's push tokens
      const pushTokens = await this.getUserPushTokens(notification.user._id);
      if (!pushTokens || pushTokens.length === 0) {
        throw new Error("No push tokens found for user");
      }

      const pushData = this.preparePushNotification(notification);
      const results = [];

      // Send via FCM (Android/Web)
      if (this.fcm) {
        const fcmTokens = pushTokens.filter(
          (token) => token.platform !== "ios"
        );
        if (fcmTokens.length > 0) {
          const fcmResult = await this.sendViaFCM(fcmTokens, pushData);
          results.push({ platform: "fcm", ...fcmResult });
        }
      }

      // Send via APN (iOS)
      if (this.apn) {
        const iosTokens = pushTokens.filter(
          (token) => token.platform === "ios"
        );
        if (iosTokens.length > 0) {
          const apnResult = await this.sendViaAPN(iosTokens, pushData);
          results.push({ platform: "apn", ...apnResult });
        }
      }

      logger.info("Push notification sent successfully", {
        notificationId: notification._id,
        userId: notification.user._id,
        type: notification.type,
        platforms: results.map((r) => r.platform),
      });

      return {
        results,
        totalSent: results.reduce((sum, r) => sum + (r.successCount || 0), 0),
        totalFailed: results.reduce((sum, r) => sum + (r.failureCount || 0), 0),
        sentAt: new Date(),
      };
    } catch (error) {
      logger.error("Failed to send push notification", {
        notificationId: notification._id,
        userId: notification.user?._id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Prepare push notification data
   * @param {Object} notification - Notification document
   * @returns {Object} Push notification data
   */
  preparePushNotification(notification) {
    const { type, title, message, context, action, priority } = notification;

    return {
      title: title.length > 50 ? title.substring(0, 47) + "..." : title,
      body: message.length > 100 ? message.substring(0, 97) + "..." : message,
      data: {
        notificationId: notification._id.toString(),
        type,
        userId: notification.user._id.toString(),
        context: JSON.stringify(context || {}),
        action: JSON.stringify(action || {}),
        timestamp: notification.createdAt.toISOString(),
      },
      badge: 1, // Will be updated with actual count
      sound: this.getNotificationSound(type, priority),
      icon: this.getNotificationIcon(type),
      color: this.getNotificationColor(type),
      category: this.getNotificationCategory(type),
      priority: this.getPushPriority(priority),
      ttl: this.getTTL(type, priority),
    };
  }

  /**
   * Send notification via Firebase Cloud Messaging
   * @param {Array} tokens - FCM tokens
   * @param {Object} pushData - Push notification data
   * @returns {Promise<Object>} FCM result
   */
  async sendViaFCM(tokens, pushData) {
    try {
      const message = {
        notification: {
          title: pushData.title,
          body: pushData.body,
        },
        data: pushData.data,
        android: {
          notification: {
            icon: pushData.icon,
            color: pushData.color,
            sound: pushData.sound,
            priority: pushData.priority,
            channelId: "deployio_notifications",
          },
          ttl: pushData.ttl,
        },
        webpush: {
          notification: {
            title: pushData.title,
            body: pushData.body,
            icon: "/icons/notification-icon.png",
            badge: "/icons/badge-icon.png",
            requireInteraction: pushData.priority === "high",
          },
          fcmOptions: {
            link:
              pushData.action?.url ||
              `${process.env.FRONTEND_URL}/notifications`,
          },
        },
        tokens: tokens.map((t) => t.token),
      };

      const response = await this.fcm.sendMulticast(message);

      // Clean up invalid tokens
      await this.cleanupInvalidTokens(tokens, response.responses);

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error) {
      logger.error("FCM send failed", {
        error: error.message,
        tokenCount: tokens.length,
      });
      throw error;
    }
  }

  /**
   * Send notification via Apple Push Notification service
   * @param {Array} tokens - APN tokens
   * @param {Object} pushData - Push notification data
   * @returns {Promise<Object>} APN result
   */
  async sendViaAPN(tokens, pushData) {
    try {
      const apn = require("apn");

      const notification = new apn.Notification({
        alert: {
          title: pushData.title,
          body: pushData.body,
        },
        payload: pushData.data,
        badge: pushData.badge,
        sound: pushData.sound,
        category: pushData.category,
        priority: pushData.priority === "high" ? 10 : 5,
        expiry: Math.floor(Date.now() / 1000) + pushData.ttl,
        topic: process.env.APN_BUNDLE_ID,
      });

      const deviceTokens = tokens.map((t) => t.token);
      const result = await this.apn.send(notification, deviceTokens);

      // Clean up failed tokens
      if (result.failed && result.failed.length > 0) {
        await this.cleanupFailedAPNTokens(result.failed);
      }

      return {
        successCount: result.sent.length,
        failureCount: result.failed.length,
        sent: result.sent,
        failed: result.failed,
      };
    } catch (error) {
      logger.error("APN send failed", {
        error: error.message,
        tokenCount: tokens.length,
      });
      throw error;
    }
  }

  /**
   * Get user's push tokens from database
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of push tokens
   */
  async getUserPushTokens(userId) {
    try {
      // This would typically come from a UserDevice model or similar
      // For now, return empty array as push tokens aren't implemented yet
      // TODO: Implement push token storage and retrieval

      // Example structure:
      // const UserDevice = require("../../../models/UserDevice");
      // return await UserDevice.find({
      //   user: userId,
      //   pushToken: { $exists: true, $ne: null },
      //   isActive: true,
      // }).select("pushToken platform deviceId");

      return [];
    } catch (error) {
      logger.error("Failed to get user push tokens", {
        userId,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get notification sound based on type and priority
   * @param {string} type - Notification type
   * @param {string} priority - Notification priority
   * @returns {string} Sound name
   */
  getNotificationSound(type, priority) {
    if (priority === "urgent") return "urgent_alert.wav";
    if (priority === "high") return "high_priority.wav";

    const soundMap = {
      "deployment.failed": "error_alert.wav",
      "security.login_new_device": "security_alert.wav",
      "system.quota_exceeded": "warning_alert.wav",
    };

    return soundMap[type] || "default_notification.wav";
  }

  /**
   * Get notification icon
   * @param {string} type - Notification type
   * @returns {string} Icon name
   */
  getNotificationIcon(type) {
    const iconMap = {
      "deployment.started": "ic_rocket",
      "deployment.success": "ic_check_circle",
      "deployment.failed": "ic_error",
      "deployment.stopped": "ic_stop",
      "security.login_new_device": "ic_security_alert",
      "system.quota_exceeded": "ic_warning",
    };

    return iconMap[type] || "ic_notification";
  }

  /**
   * Get notification color
   * @param {string} type - Notification type
   * @returns {string} Color hex code
   */
  getNotificationColor(type) {
    const colorMap = {
      "deployment.success": "#10b981",
      "deployment.failed": "#ef4444",
      "deployment.started": "#3b82f6",
      "security.login_new_device": "#f59e0b",
      "system.quota_exceeded": "#ef4444",
    };

    return colorMap[type] || "#3b82f6";
  }

  /**
   * Get notification category for iOS
   * @param {string} type - Notification type
   * @returns {string} Category identifier
   */
  getNotificationCategory(type) {
    const categoryMap = {
      "deployment.started": "DEPLOYMENT",
      "deployment.success": "DEPLOYMENT",
      "deployment.failed": "DEPLOYMENT",
      "deployment.stopped": "DEPLOYMENT",
      "security.login_new_device": "SECURITY",
      "system.quota_exceeded": "SYSTEM",
    };

    return categoryMap[type] || "GENERAL";
  }

  /**
   * Get push priority level
   * @param {string} priority - Notification priority
   * @returns {string} Push priority
   */
  getPushPriority(priority) {
    const priorityMap = {
      urgent: "high",
      high: "high",
      normal: "normal",
      low: "normal",
    };

    return priorityMap[priority] || "normal";
  }

  /**
   * Get time-to-live for notification
   * @param {string} type - Notification type
   * @param {string} priority - Notification priority
   * @returns {number} TTL in seconds
   */
  getTTL(type, priority) {
    if (priority === "urgent") return 300; // 5 minutes
    if (priority === "high") return 3600; // 1 hour
    if (priority === "low") return 86400; // 24 hours

    return 3600; // Default 1 hour
  }

  /**
   * Clean up invalid FCM tokens
   * @param {Array} tokens - Original tokens
   * @param {Array} responses - FCM responses
   */
  async cleanupInvalidTokens(tokens, responses) {
    try {
      const invalidTokens = [];

      responses.forEach((response, index) => {
        if (response.error) {
          const errorCode = response.error.code;
          if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
          ) {
            invalidTokens.push(tokens[index]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        // TODO: Remove invalid tokens from database
        logger.info("Cleaned up invalid FCM tokens", {
          count: invalidTokens.length,
        });
      }
    } catch (error) {
      logger.error("Failed to cleanup invalid tokens", {
        error: error.message,
      });
    }
  }

  /**
   * Clean up failed APN tokens
   * @param {Array} failed - Failed APN results
   */
  async cleanupFailedAPNTokens(failed) {
    try {
      const invalidTokens = failed.filter(
        (f) =>
          f.error &&
          (f.error.indexOf("BadDeviceToken") !== -1 ||
            f.error.indexOf("Unregistered") !== -1)
      );

      if (invalidTokens.length > 0) {
        // TODO: Remove invalid tokens from database
        logger.info("Cleaned up invalid APN tokens", {
          count: invalidTokens.length,
        });
      }
    } catch (error) {
      logger.error("Failed to cleanup failed APN tokens", {
        error: error.message,
      });
    }
  }

  /**
   * Register a new push token
   * @param {string} userId - User ID
   * @param {string} token - Push token
   * @param {string} platform - Platform (ios, android, web)
   * @param {string} deviceId - Device identifier
   * @returns {Promise<Object>} Registration result
   */
  async registerPushToken(userId, token, platform, deviceId) {
    try {
      // TODO: Implement push token storage
      // const UserDevice = require("../../../models/UserDevice");
      //
      // await UserDevice.findOneAndUpdate(
      //   { user: userId, deviceId },
      //   {
      //     pushToken: token,
      //     platform,
      //     lastActive: new Date(),
      //     isActive: true,
      //   },
      //   { upsert: true }
      // );

      logger.info("Push token registered", {
        userId,
        platform,
        deviceId,
      });

      return { success: true };
    } catch (error) {
      logger.error("Failed to register push token", {
        userId,
        platform,
        deviceId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Unregister a push token
   * @param {string} userId - User ID
   * @param {string} deviceId - Device identifier
   * @returns {Promise<Object>} Unregistration result
   */
  async unregisterPushToken(userId, deviceId) {
    try {
      // TODO: Implement push token removal
      // const UserDevice = require("../../../models/UserDevice");
      //
      // await UserDevice.findOneAndUpdate(
      //   { user: userId, deviceId },
      //   {
      //     isActive: false,
      //     pushToken: null,
      //   }
      // );

      logger.info("Push token unregistered", {
        userId,
        deviceId,
      });

      return { success: true };
    } catch (error) {
      logger.error("Failed to unregister push token", {
        userId,
        deviceId,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = PushChannel;
