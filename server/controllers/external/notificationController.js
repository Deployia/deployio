const notificationService = require("@services/notification/notificationService");
const logger = require("@config/logger");
const { validationResult } = require("express-validator");

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

    res.json({
      success: true,
      data: result,
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
};
