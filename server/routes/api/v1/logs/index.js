/**
 * Unified Log API Routes
 * Clean routes that delegate to controllers
 */

const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("@middleware/authMiddleware");

// Import controllers
const LogsController = require("@controllers/logs/LogsController");
const LogsTestController = require("@controllers/logs/LogsTestController");

/**
 * System Status and Information
 */
router.get("/status", protect, LogsController.getStatus);

/**
 * System Logs - Admin only
 */
router.get("/system", protect, adminOnly, LogsController.getSystemLogs);
router.get(
  "/system/:service",
  protect,
  adminOnly,
  LogsController.getSystemServiceLogs
);

/**
 * User Deployment Logs
 */
router.get("/projects/:projectId", protect, LogsController.getProjectLogs);
router.get(
  "/deployments/:deploymentId",
  protect,
  LogsController.getDeploymentLogs
);

/**
 * Metrics Endpoints - Admin only
 */
router.get("/metrics", protect, adminOnly, LogsController.getSystemMetrics);

/**
 * Stream Management Endpoints
 */
router.post("/streams", protect, LogsController.startLogStream);
router.delete("/streams/:streamId", protect, LogsController.stopLogStream);

/**
 * Internal Service Endpoints
 */
router.post("/internal/stream", LogsController.receiveInternalLogs);

/**
 * Testing Endpoints
 */
router.post("/test", protect, adminOnly, LogsTestController.generateTestLogs);

/**
 * Maintenance Endpoints
 */
router.post("/cleanup", protect, adminOnly, LogsController.cleanupLogs);

module.exports = router;
