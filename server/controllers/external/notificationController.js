const notificationService = require("@services/notification/notificationService");
const logger = require("@config/logger");
const { validationResult } = require("express-validator");
const { getWebSocketManager } = require("@websockets");

/**
 * Get user notifications with pagination and filtering
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      status,
      type,
      priority,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filters = {
      status,
      type,
      priority,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
    };
    const result = await notificationService.getUserNotifications(
      userId,
      filters
    );

    // Also get unread count for the header
    const unreadCount = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        ...result,
        unreadCount,
      },
    });
  } catch (error) {
    logger.error("Get notifications failed", {
      userId: req.user?.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

/**
 * Mark notifications as read
 */
const markAsRead = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const userId = req.user.id;
    const { notificationIds } = req.body;

    const result = await notificationService.markAsRead(
      userId,
      notificationIds
    );

    // Send real-time update via WebSocket
    try {
      const webSocketManager = getWebSocketManager();
      if (webSocketManager) {
        // Send notification marked as read event
        webSocketManager.emitToUser(userId, "notification_marked_read", {
          notificationIds,
          timestamp: new Date().toISOString(),
        });

        // Send updated unread count
        const unreadCount = await notificationService.getUnreadCount(userId);
        webSocketManager.emitToUser(userId, "unread_count", {
          count: unreadCount,
        });
      }
    } catch (wsError) {
      logger.error("Failed to send real-time notification update", {
        userId,
        error: wsError.message,
      });
      // Don't fail the request if WebSocket fails
    }

    res.json({
      success: true,
      message: "Notifications marked as read",
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    logger.error("Mark notifications as read failed", {
      userId: req.user?.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await notificationService.markAllAsRead(userId);

    // Send real-time update via WebSocket
    try {
      const webSocketManager = getWebSocketManager();
      if (webSocketManager) {
        // Send all notifications marked as read event
        webSocketManager.emitToUser(userId, "all_notifications_marked_read", {
          timestamp: new Date().toISOString(),
        });

        // Send updated unread count (should be 0)
        webSocketManager.emitToUser(userId, "unread_count", { count: 0 });
      }
    } catch (wsError) {
      logger.error("Failed to send real-time notification update", {
        userId,
        error: wsError.message,
      });
      // Don't fail the request if WebSocket fails
    }

    res.json({
      success: true,
      message: "All notifications marked as read",
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    logger.error("Mark all notifications as read failed", {
      userId: req.user?.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

/**
 * Delete notifications
 */
const deleteNotifications = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const userId = req.user.id;
    const { notificationIds } = req.body;

    const result = await notificationService.deleteNotifications(
      userId,
      notificationIds
    );

    res.json({
      success: true,
      message: "Notifications deleted",
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    logger.error("Delete notifications failed", {
      userId: req.user?.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to delete notifications",
      error: error.message,
    });
  }
};

/**
 * Get notification statistics
 */
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await notificationService.getNotificationStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Get notification stats failed", {
      userId: req.user?.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to get notification statistics",
      error: error.message,
    });
  }
};

/**
 * Create a test notification (for development/testing)
 */
const createTestNotification = async (req, res) => {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "Test notifications not allowed in production",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const userId = req.user.id;
    const { type, title, message, priority, channels, context, action } =
      req.body;

    const notification = await notificationService.createNotification({
      userId,
      type: type || "general.announcement",
      title: title || "Test Notification",
      message: message || "This is a test notification",
      priority: priority || "normal",
      channels,
      context,
      action,
    });

    res.json({
      success: true,
      message: "Test notification created",
      data: notification,
    });
  } catch (error) {
    logger.error("Create test notification failed", {
      userId: req.user?.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to create test notification",
      error: error.message,
    });
  }
};

/**
 * Send immediate notification (for admin/system use)
 */
const sendImmediateNotification = async (req, res) => {
  try {
    // Only allow for admin users
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      userId,
      type,
      title,
      message,
      priority,
      channels,
      context,
      action,
      systemWide = false,
    } = req.body;

    let notification;

    if (systemWide) {
      // Send to all users
      notification = await notificationService.createSystemNotification({
        type,
        title,
        message,
        priority,
        channels,
        context,
        action,
      });
    } else {
      // Send to specific user
      notification = await notificationService.createNotification({
        userId,
        type,
        title,
        message,
        priority,
        channels,
        context,
        action,
      });
    }

    res.json({
      success: true,
      message: systemWide ? "System notification sent" : "Notification sent",
      data: notification,
    });
  } catch (error) {
    logger.error("Send immediate notification failed", {
      adminId: req.user?.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};

/**
 * Get notification preferences
 */
const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const userService = require("../../services/user/userService");

    const preferences = await userService.getNotificationPreferences(userId);

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    logger.error("Get notification preferences failed", {
      userId: req.user?.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to get notification preferences",
      error: error.message,
    });
  }
};

/**
 * Update notification preferences
 */
const updateNotificationPreferences = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const userId = req.user.id;
    const preferences = req.body;
    const userService = require("../../services/user/userService");

    const updatedPreferences = await userService.updateNotificationPreferences(
      userId,
      preferences
    );

    res.json({
      success: true,
      message: "Notification preferences updated",
      data: updatedPreferences,
    });
  } catch (error) {
    logger.error("Update notification preferences failed", {
      userId: req.user?.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to update notification preferences",
      error: error.message,
    });
  }
};

/**
 * Register push token
 */
const registerPushToken = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const userId = req.user.id;
    const { token, platform, deviceId } = req.body;

    const pushChannel = require("../../services/notification/channels/pushChannel");
    const result = await pushChannel.registerPushToken(
      userId,
      token,
      platform,
      deviceId
    );

    res.json({
      success: true,
      message: "Push token registered",
      data: result,
    });
  } catch (error) {
    logger.error("Register push token failed", {
      userId: req.user?.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to register push token",
      error: error.message,
    });
  }
};

/**
 * Unregister push token
 */
const unregisterPushToken = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const userId = req.user.id;
    const { deviceId } = req.body;

    const pushChannel = require("../../services/notification/channels/pushChannel");
    const result = await pushChannel.unregisterPushToken(userId, deviceId);

    res.json({
      success: true,
      message: "Push token unregistered",
      data: result,
    });
  } catch (error) {
    logger.error("Unregister push token failed", {
      userId: req.user?.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to unregister push token",
      error: error.message,
    });
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    logger.error("Get unread count failed", {
      userId: req.user?.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: error.message,
    });
  }
};

/**
 * Mark a single notification as read
 */
const markSingleAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await notificationService.markAsRead(userId, [
      notificationId,
    ]);

    res.json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    logger.error("Mark single notification as read failed", {
      userId: req.user?.id,
      notificationId: req.params.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotifications,
  getNotificationStats,
  createTestNotification,
  sendImmediateNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  registerPushToken,
  unregisterPushToken,
  getUnreadCount,
  markSingleAsRead,
};
