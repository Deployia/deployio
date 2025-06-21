const user = require("@services/user");
const logger = require("@config/logger");
const { getRedisClient } = require("@config/redisClient");
const {
  getSafeUserData,
  getSafeActivityData,
} = require("@utils/userDataFilter");

/**
 * Update user password
 */
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const redisClient = getRedisClient(); // Get redisClient from singleton
    const cacheKey = `user:${req.user.id}`;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    // Update password
    const result = await user.user.updatePassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    // Invalidate cache after successful password update (only if Redis is available)
    if (redisClient && redisClient.isReady) {
      try {
        await redisClient.del(cacheKey);
      } catch (cacheError) {
        // Log cache error but don't fail the operation
        logger.warn("Cache invalidation failed after password update", {
          error: cacheError.message,
          userId: req.user?.id,
          cacheKey,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: result,
    });
  } catch (error) {
    // console.error("Update password error:", error);
    logger.error("Update password error", {
      error: { message: error.message, stack: error.stack, name: error.name },
      userId: req.user?.id,
      // Not logging req.body here as it contains passwords
    });
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete user account
 */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to delete account",
      });
    }

    await user.user.deleteUser(userId, password);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    // console.error("Delete account error:", error);
    logger.error("Delete account error", {
      error: { message: error.message, stack: error.stack, name: error.name },
      userId: req.user?.id,
      // Not logging req.body here as it contains password
    });
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user notification preferences
 */
const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await user.user.getNotificationPreferences(userId);

    res.status(200).json({
      success: true,
      preferences,
    });
  } catch (error) {
    // console.error("Get notification preferences error:", error);
    logger.error("Get notification preferences error", {
      error: { message: error.message, stack: error.stack, name: error.name },
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get notification preferences",
    });
  }
};

/**
 * Update user notification preferences
 */
const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    const updatedPreferences = await user.user.updateNotificationPreferences(
      userId,
      preferences
    );

    res.status(200).json({
      success: true,
      preferences: updatedPreferences,
      message: "Notification preferences updated successfully",
    });
  } catch (error) {
    // console.error("Update notification preferences error:", error);
    logger.error("Update notification preferences error", {
      error: { message: error.message, stack: error.stack, name: error.name },
      userId: req.user?.id,
      requestBody: req.body,
    });
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update notification preferences",
    });
  }
};

/**
 * Get user activity log
 */
const getUserActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    const activities = await user.user.getUserActivity(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
    });

    // Filter activity data for safety
    const safeActivities = activities.data.map((activity) =>
      getSafeActivityData(activity)
    );

    res.status(200).json({
      success: true,
      activities: safeActivities,
      pagination: {
        current: activities.page,
        pages: activities.pages,
        total: activities.total,
      },
    });
  } catch (error) {
    // console.error("Get user activity error:", error);
    logger.error("Get user activity error", {
      error: { message: error.message, stack: error.stack, name: error.name },
      userId: req.user?.id,
      query: req.query,
    });
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get user activity",
    });
  }
};

/**
 * Log user activity
 */
const logUserActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action, type, details, ip } = req.body;

    const activity = await user.user.logUserActivity(userId, {
      action,
      type,
      details,
      ip: ip || req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.status(201).json({
      success: true,
      activity,
    });
  } catch (error) {
    // console.error("Log user activity error:", error);
    logger.error("Log user activity error", {
      error: { message: error.message, stack: error.stack, name: error.name },
      userId: req.user?.id,
      requestBody: req.body,
    });
    res.status(400).json({
      success: false,
      message: error.message || "Failed to log user activity",
    });
  }
};

/**
 * Get dashboard stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await user.user.getDashboardStats(userId);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    // console.error("Get dashboard stats error:", error);
    logger.error("Get dashboard stats error", {
      error: { message: error.message, stack: error.stack, name: error.name },
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get dashboard stats",
    });
  }
};

module.exports = {
  updatePassword,
  deleteAccount,
  getNotificationPreferences,
  updateNotificationPreferences,
  getUserActivity,
  logUserActivity,
  getDashboardStats,
};
