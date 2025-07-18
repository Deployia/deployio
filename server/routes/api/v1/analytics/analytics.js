const express = require("express");
const { query, param } = require("express-validator");
const analyticsController = require("@controllers/analytics/analyticsController");

const router = express.Router();

// Validation middleware
const validateTimeRange = [
  query("timeRange")
    .optional()
    .isIn(["24h", "7d", "30d", "90d"])
    .withMessage("Time range must be 24h, 7d, 30d, or 90d"),
];

const validateProjectId = [
  query("projectId")
    .optional()
    .isMongoId()
    .withMessage("Project ID must be a valid MongoDB ObjectId"),
];

const validateProjectParam = [
  param("projectId")
    .isMongoId()
    .withMessage("Project ID must be a valid MongoDB ObjectId"),
];

/**
 * @desc Get analytics overview
 * @route GET /api/v1/analytics/overview
 * @access Private
 */
router.get("/overview", validateTimeRange, analyticsController.getOverview);

/**
 * @desc Get deployment analytics
 * @route GET /api/v1/analytics/deployments
 * @access Private
 */
router.get(
  "/deployments",
  [...validateTimeRange, ...validateProjectId],
  analyticsController.getDeploymentAnalytics
);

/**
 * @desc Get project analytics
 * @route GET /api/v1/analytics/projects
 * @access Private
 */
router.get(
  "/projects",
  validateTimeRange,
  analyticsController.getProjectAnalytics
);

/**
 * @desc Get resource usage analytics
 * @route GET /api/v1/analytics/resources
 * @access Private
 */
router.get(
  "/resources",
  [...validateTimeRange, ...validateProjectId],
  analyticsController.getResourceUsage
);

/**
 * @desc Get analytics for specific project
 * @route GET /api/v1/analytics/projects/:projectId
 * @access Private
 */
router.get(
  "/projects/:projectId",
  [...validateProjectParam, ...validateTimeRange],
  analyticsController.getProjectSpecificAnalytics
);

/**
 * @desc Get performance metrics
 * @route GET /api/v1/analytics/performance
 * @access Private
 */
router.get(
  "/performance",
  [...validateTimeRange, ...validateProjectId],
  analyticsController.getPerformanceMetrics
);

module.exports = router;
