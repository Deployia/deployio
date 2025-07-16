// Internal Notification Testing Routes - /api/internal/notifications/*
// Handles test notifications for development and admin testing

const express = require("express");
const logger = require("@config/logger");
const { protect, adminOnly } = require("@middleware/authMiddleware");
const NotificationService = require("@services/notification/notificationService");

const router = express.Router();

/**
 * Test notification endpoint - Uses the full notification service
 * Creates a real notification and tests the complete real-time delivery flow
 */
router.post("/test", protect, async (req, res) => {
  try {
    const {
      message,
      title = "Test Notification",
      type = "system.test",
      priority = "normal",
      channels = ["inApp"],
    } = req.body;

    const notificationService = new NotificationService();

    // Create a real notification using the service
    const notification = await notificationService.createNotification({
      userId: req.user._id,
      type: type,
      title: title,
      message:
        message ||
        "This is a test notification from the DeployIO platform to verify real-time delivery.",
      priority: priority,
      channels: channels,
      context: {
        source: "api_test",
        testId: `test_${Date.now()}`,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
      },
    });

    logger.info("Test notification created and sent", {
      notificationId: notification._id,
      userId: req.user._id,
      type: type,
      channels: channels,
    });

    res.json({
      success: true,
      message: "Test notification sent successfully",
      notification: {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        channels: notification.channels,
        createdAt: notification.createdAt,
      },
    });
  } catch (error) {
    logger.error("Test notification failed", {
      userId: req.user?._id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to send test notification",
      error: error.message,
    });
  }
});

/**
 * Test WebSocket connection endpoint
 * Sends a direct WebSocket message to verify connection
 */
router.post("/test-websocket", protect, async (req, res) => {
  try {
    const { message, type = "info" } = req.body;

    const NotificationsNamespace = require("@websockets/namespaces/NotificationsNamespace");

    // Create test notification data
    const testNotification = {
      id: `ws_test_${Date.now()}`,
      type: type,
      title: "WebSocket Test",
      message: message || "This is a direct WebSocket test message.",
      timestamp: new Date().toISOString(),
      source: "websocket_test",
      isTest: true,
      priority: "normal",
    };

    // Send directly via NotificationsNamespace
    await NotificationsNamespace.sendNotificationToUser(
      req.user._id.toString(),
      testNotification
    );

    logger.info("WebSocket test notification sent", {
      userId: req.user._id,
      testNotificationId: testNotification.id,
    });

    res.json({
      success: true,
      message: "WebSocket test notification sent successfully",
      testNotification,
    });
  } catch (error) {
    logger.error("WebSocket test notification failed", {
      userId: req.user?._id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to send WebSocket test notification",
      error: error.message,
    });
  }
});

/**
 * Admin-only broadcast test notification endpoint
 * Sends a test notification to all connected users
 */
router.post("/test/broadcast", protect, adminOnly, async (req, res) => {
  try {
    const { message, type = "info" } = req.body;

    const NotificationsNamespace = require("@websockets/namespaces/NotificationsNamespace");
    const notificationsNamespace =
      webSocketManager.getNamespace("/notifications");

    if (!notificationsNamespace) {
      return res.status(503).json({
        success: false,
        message: "WebSocket notifications namespace not available",
      });
    }

    // Create broadcast test notification
    const testNotification = {
      id: `broadcast_test_${Date.now()}`,
      type: type,
      message:
        message ||
        "This is a broadcast test notification from the DeployIO admin panel.",
      timestamp: new Date().toISOString(),
      source: "admin_broadcast",
      isTest: true,
      isBroadcast: true,
    };

    // Broadcast to all connected users
    notificationsNamespace.emit("new_notification", testNotification);

    logger.info("Broadcast test notification sent", {
      adminId: req.user._id,
      adminEmail: req.user.email,
      message: testNotification.message,
      type: testNotification.type,
    });

    res.json({
      success: true,
      message: "Broadcast test notification sent to all users",
      notification: testNotification,
      triggeredBy: req.user.email,
    });
  } catch (error) {
    logger.error("Error sending broadcast test notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send broadcast test notification",
      error: error.message,
    });
  }
});

/**
 * Create multiple test notifications for testing real-time delivery
 */
router.post("/test/multiple", protect, async (req, res) => {
  try {
    const { count = 3, delay = 1000 } = req.body;
    const notificationService = new NotificationService();

    const notifications = [];

    // Create multiple notifications with delay
    for (let i = 1; i <= count; i++) {
      setTimeout(async () => {
        try {
          const notification = await notificationService.createNotification({
            userId: req.user._id,
            type: "system.test",
            title: `Test Notification #${i}`,
            message: `This is test notification ${i} of ${count} to verify real-time delivery sequence.`,
            priority: i === 1 ? "high" : "normal",
            channels: ["inApp"],
            context: {
              source: "multiple_test",
              sequence: i,
              total: count,
            },
          });

          logger.info(`Test notification ${i} created`, {
            notificationId: notification._id,
            userId: req.user._id,
          });
        } catch (error) {
          logger.error(`Failed to create test notification ${i}`, {
            error: error.message,
            userId: req.user._id,
          });
        }
      }, delay * (i - 1));

      notifications.push({
        sequence: i,
        scheduledFor: new Date(Date.now() + delay * (i - 1)),
      });
    }

    res.json({
      success: true,
      message: `${count} test notifications scheduled for delivery`,
      notifications,
      totalDelay: delay * (count - 1),
    });
  } catch (error) {
    logger.error("Multiple test notifications failed", {
      userId: req.user?._id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to schedule multiple test notifications",
      error: error.message,
    });
  }
});

/**
 * Get notification system status
 */
router.get("/status", protect, async (req, res) => {
  try {
    const NotificationsNamespace = require("@websockets/namespaces/NotificationsNamespace");
    const webSocketRegistry = require("@websockets/core/WebSocketRegistry");

    const namespace = webSocketRegistry.get("/notifications");
    const isNamespaceActive = !!namespace;

    // Get user's unread count
    const Notification = require("@models/Notification");
    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      status: "unread",
    });

    // Check if user is connected to WebSocket
    let isUserConnected = false;
    let connectionCount = 0;

    if (namespace) {
      // This would need to be implemented in the namespace to check user connections
      connectionCount = namespace.connections ? namespace.connections.size : 0;
    }

    res.json({
      success: true,
      status: {
        user: {
          id: req.user._id,
          email: req.user.email,
          unreadCount,
          isConnected: isUserConnected,
        },
        websocket: {
          namespaceActive: isNamespaceActive,
          totalConnections: connectionCount,
        },
        system: {
          timestamp: new Date().toISOString(),
          nodeEnv: process.env.NODE_ENV,
        },
      },
    });
  } catch (error) {
    logger.error("Failed to get notification status", {
      userId: req.user?._id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to get notification status",
      error: error.message,
    });
  }
});

module.exports = router;
