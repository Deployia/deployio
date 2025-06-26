// Internal Notification Testing Routes - /api/internal/notifications/*
// Handles test notifications for development and admin testing

const express = require("express");
const logger = require("@config/logger");
const { getWebSocketManager } = require("@websockets");
const { protect, adminOnly } = require("@middleware/authMiddleware");

const router = express.Router();

/**
 * Test notification endpoint
 * Sends a test notification via WebSocket to verify connection
 */
router.post("/test", protect, async (req, res) => {
  try {
    const { message, type = "info" } = req.body;

    const webSocketManager = getWebSocketManager();
    const notificationsNamespace =
      webSocketManager.getNamespace("/notifications");

    if (!notificationsNamespace) {
      return res.status(503).json({
        success: false,
        message: "WebSocket notifications namespace not available",
      });
    }

    // Create test notification
    const testNotification = {
      id: `test_${Date.now()}`,
      type: type,
      message:
        message || "This is a test notification from the DeployIO platform.",
      timestamp: new Date().toISOString(),
      user: req.user._id,
      source: "system_test",
      isTest: true,
    };

    // Send to user's notification room using webSocketManager's emitToUser method
    webSocketManager.emitToUser(
      req.user._id.toString(),
      "new_notification",
      testNotification
    );

    // Also emit to general notifications channel for debugging
    notificationsNamespace.emit("test_notification", {
      ...testNotification,
      triggeredBy: req.user.email,
    });

    logger.info("Test notification sent", {
      userId: req.user._id,
      userEmail: req.user.email,
      message: testNotification.message,
      type: testNotification.type,
    });

    res.json({
      success: true,
      message: "Test notification sent successfully",
      notification: testNotification,
      triggeredBy: req.user.email,
    });
  } catch (error) {
    logger.error("Error sending test notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send test notification",
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

    const webSocketManager = getWebSocketManager();
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
 * Get notification status and statistics
 */
router.get("/status", protect, adminOnly, (req, res) => {
  try {
    const webSocketManager = getWebSocketManager();
    const notificationsNamespace =
      webSocketManager.getNamespace("/notifications");

    const status = {
      notificationNamespaceActive: !!notificationsNamespace,
      connectedClients: notificationsNamespace
        ? notificationsNamespace.sockets.size
        : 0,
      features: [
        "test_notifications",
        "broadcast_notifications",
        "user_specific_notifications",
      ],
    };

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error("Error getting notification status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notification status",
      error: error.message,
    });
  }
});

module.exports = router;
