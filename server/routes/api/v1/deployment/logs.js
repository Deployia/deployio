// Logs Routes - /api/v1/deployments/logs/*
// Log management and streaming endpoints

const express = require("express");
const { deployment } = require("@controllers");
const router = express.Router();

// Deployment logs
router.get("/deployment/:deploymentId", deployment.logs.getDeploymentLogs);
router.get(
  "/deployment/:deploymentId/stream",
  deployment.logs.streamDeploymentLogs
);
router.get(
  "/deployment/:deploymentId/download",
  deployment.logs.downloadDeploymentLogs
);

// Container logs
router.get("/container/:containerId", deployment.logs.getContainerLogs);
router.get(
  "/container/:containerId/stream",
  deployment.logs.streamContainerLogs
);
router.get(
  "/container/:containerId/download",
  deployment.logs.downloadContainerLogs
);

// System logs (admin only)
router.get("/system", deployment.logs.getSystemLogs);
router.get("/errors", deployment.logs.getErrorLogs);

module.exports = router;
