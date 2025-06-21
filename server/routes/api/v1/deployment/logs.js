// Logs Routes - /api/v1/deployments/logs/*
// Log management and streaming endpoints

const express = require("express");
const router = express.Router();
const logsController = require("../../../../controllers/deployment/logsController");

// Deployment logs
router.get("/deployment/:deploymentId", logsController.getDeploymentLogs);
router.get(
  "/deployment/:deploymentId/stream",
  logsController.streamDeploymentLogs
);
router.get(
  "/deployment/:deploymentId/download",
  logsController.downloadDeploymentLogs
);

// Container logs
router.get("/container/:containerId", logsController.getContainerLogs);
router.get(
  "/container/:containerId/stream",
  logsController.streamContainerLogs
);
router.get(
  "/container/:containerId/download",
  logsController.downloadContainerLogs
);

// System logs (admin only)
router.get("/system", logsController.getSystemLogs);
router.get("/errors", logsController.getErrorLogs);

module.exports = router;
