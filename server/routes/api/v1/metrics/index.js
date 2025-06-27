/**
 * Metrics API Routes
 * Clean routes that delegate to controllers
 */

const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("@middleware/authMiddleware");

// Import controller
const MetricsController = require("@controllers/MetricsController");

/**
 * Metrics System Status and Information
 */
router.get("/status", protect, adminOnly, MetricsController.getStatus);

/**
 * System Metrics - Admin only
 */
router.get("/system", protect, adminOnly, MetricsController.getSystemMetrics);
router.get(
  "/system/:service",
  protect,
  adminOnly,
  MetricsController.getSystemServiceMetrics
);

/**
 * Metrics Management Endpoints
 */
router.post("/collect", protect, adminOnly, MetricsController.forceCollection);
router.post("/cleanup", protect, adminOnly, MetricsController.cleanupMetrics);

module.exports = router;
