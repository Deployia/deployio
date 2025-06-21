const express = require("express");
const { body, query } = require("express-validator");
const auth = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications with pagination and filtering
 * @access  Private
 */
router.get(
  "/",
  auth,
  [
    query("status")
      .optional()
      .isIn(["unread", "read", "archived"])
      .withMessage("Invalid status"),
    query("type").optional().isString().withMessage("Type must be a string"),
    query("priority")
      .optional()
      .isIn(["low", "normal", "high", "urgent"])
      .withMessage("Invalid priority"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("sortBy")
      .optional()
      .isIn(["createdAt", "priority", "type", "status"])
      .withMessage("Invalid sort field"),
    query("sortOrder")
      .optional()
      .isIn(["asc", "desc"])
      .withMessage("Sort order must be asc or desc"),
  ],
  notificationController.getNotifications
);

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics for user
 * @access  Private
 */
router.get("/stats", auth, notificationController.getNotificationStats);

/**
 * @route   PUT /api/notifications/read
 * @desc    Mark notifications as read
 * @access  Private
 */
router.put(
  "/read",
  auth,
  [
    body("notificationIds")
      .isArray({ min: 1 })
      .withMessage("NotificationIds must be a non-empty array"),
    body("notificationIds.*")
      .isMongoId()
      .withMessage("Each notification ID must be a valid MongoDB ObjectId"),
  ],
  notificationController.markAsRead
);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put("/read-all", auth, notificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications
 * @desc    Delete notifications
 * @access  Private
 */
router.delete(
  "/",
  auth,
  [
    body("notificationIds")
      .isArray({ min: 1 })
      .withMessage("NotificationIds must be a non-empty array"),
    body("notificationIds.*")
      .isMongoId()
      .withMessage("Each notification ID must be a valid MongoDB ObjectId"),
  ],
  notificationController.deleteNotifications
);

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get(
  "/preferences",
  auth,
  notificationController.getNotificationPreferences
);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update user notification preferences
 * @access  Private
 */
router.put(
  "/preferences",
  auth,
  [
    // Delivery method preferences
    body("email").optional().isBoolean().withMessage("Email must be a boolean"),
    body("inApp").optional().isBoolean().withMessage("InApp must be a boolean"),
    body("push").optional().isBoolean().withMessage("Push must be a boolean"),

    // Notification type preferences
    body("deploymentSuccess").optional().isBoolean(),
    body("deploymentFailure").optional().isBoolean(),
    body("deploymentStarted").optional().isBoolean(),
    body("deploymentStopped").optional().isBoolean(),
    body("projectAnalysisComplete").optional().isBoolean(),
    body("projectAnalysisFailed").optional().isBoolean(),
    body("projectCollaboratorAdded").optional().isBoolean(),
    body("securityAlerts").optional().isBoolean(),
    body("accountChanges").optional().isBoolean(),
    body("newDeviceLogin").optional().isBoolean(),
    body("passwordChanged").optional().isBoolean(),
    body("twoFactorEnabled").optional().isBoolean(),
    body("twoFactorDisabled").optional().isBoolean(),
    body("apiKeyCreated").optional().isBoolean(),
    body("systemMaintenance").optional().isBoolean(),
    body("systemUpdates").optional().isBoolean(),
    body("quotaWarning").optional().isBoolean(),
    body("quotaExceeded").optional().isBoolean(),
    body("welcomeMessage").optional().isBoolean(),
    body("announcements").optional().isBoolean(),
    body("productUpdates").optional().isBoolean(),
    body("tips").optional().isBoolean(),

    // Quiet hours validation
    body("quietHours.enabled").optional().isBoolean(),
    body("quietHours.start")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Start time must be in HH:MM format"),
    body("quietHours.end")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("End time must be in HH:MM format"),
    body("quietHours.timezone").optional().isString(),

    // Digest settings validation
    body("digestSettings.enabled").optional().isBoolean(),
    body("digestSettings.frequency")
      .optional()
      .isIn(["daily", "weekly"])
      .withMessage("Frequency must be daily or weekly"),
    body("digestSettings.time")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Time must be in HH:MM format"),
    body("digestSettings.timezone").optional().isString(),
  ],
  notificationController.updateNotificationPreferences
);

/**
 * @route   POST /api/notifications/push-token
 * @desc    Register push notification token
 * @access  Private
 */
router.post(
  "/push-token",
  auth,
  [
    body("token")
      .notEmpty()
      .isString()
      .withMessage("Token is required and must be a string"),
    body("platform")
      .isIn(["ios", "android", "web"])
      .withMessage("Platform must be ios, android, or web"),
    body("deviceId")
      .notEmpty()
      .isString()
      .withMessage("Device ID is required and must be a string"),
  ],
  notificationController.registerPushToken
);

/**
 * @route   DELETE /api/notifications/push-token
 * @desc    Unregister push notification token
 * @access  Private
 */
router.delete(
  "/push-token",
  auth,
  [
    body("deviceId")
      .notEmpty()
      .isString()
      .withMessage("Device ID is required and must be a string"),
  ],
  notificationController.unregisterPushToken
);

/**
 * @route   POST /api/notifications/test
 * @desc    Create a test notification (development only)
 * @access  Private
 */
router.post(
  "/test",
  auth,
  [
    body("type").optional().isString().withMessage("Type must be a string"),
    body("title")
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage("Title must be between 1 and 100 characters"),
    body("message")
      .optional()
      .isString()
      .isLength({ min: 1, max: 500 })
      .withMessage("Message must be between 1 and 500 characters"),
    body("priority")
      .optional()
      .isIn(["low", "normal", "high", "urgent"])
      .withMessage("Invalid priority"),
    body("channels")
      .optional()
      .isArray()
      .withMessage("Channels must be an array"),
    body("channels.*")
      .optional()
      .isIn(["in_app", "email", "push"])
      .withMessage("Invalid channel"),
  ],
  notificationController.createTestNotification
);

/**
 * @route   POST /api/notifications/send
 * @desc    Send immediate notification (admin only)
 * @access  Private (Admin)
 */
router.post(
  "/send",
  auth,
  [
    body("userId")
      .optional()
      .isMongoId()
      .withMessage("User ID must be a valid MongoDB ObjectId"),
    body("type")
      .notEmpty()
      .isString()
      .withMessage("Type is required and must be a string"),
    body("title")
      .notEmpty()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage(
        "Title is required and must be between 1 and 100 characters"
      ),
    body("message")
      .notEmpty()
      .isString()
      .isLength({ min: 1, max: 500 })
      .withMessage(
        "Message is required and must be between 1 and 500 characters"
      ),
    body("priority")
      .optional()
      .isIn(["low", "normal", "high", "urgent"])
      .withMessage("Invalid priority"),
    body("channels")
      .optional()
      .isArray()
      .withMessage("Channels must be an array"),
    body("channels.*")
      .optional()
      .isIn(["in_app", "email", "push"])
      .withMessage("Invalid channel"),
    body("systemWide")
      .optional()
      .isBoolean()
      .withMessage("SystemWide must be a boolean"),
  ],
  notificationController.sendImmediateNotification
);

module.exports = router;
