// Deployment Management Routes - /api/v1/deployments/*
// Core deployment operations

const express = require("express");
const { deployment } = require("@controllers");
const router = express.Router();

// IMPLEMENTED ROUTES
router.post("/", deployment.deployment.createDeployment);
router.get("/", deployment.deployment.getUserDeployments);
router.get("/:deploymentId", deployment.deployment.getDeployment);
router.put(
  "/:deploymentId/status",
  deployment.deployment.updateDeploymentStatus
);
router.post("/:deploymentId/stop", deployment.deployment.stopDeployment);
router.get("/:deploymentId/logs", deployment.deployment.getDeploymentLogs);
router.get("/:deploymentId/stats", deployment.deployment.getDeploymentStats);

// PLANNED ROUTES - TO BE IMPLEMENTED
// router.post("/:deploymentId/deploy", deployment.deployment.deployProject);
// router.post("/:deploymentId/restart", deployment.deployment.restartDeployment);
// router.get("/:deploymentId/status", deployment.deployment.getDeploymentStatus);
// router.get("/:deploymentId/health", deployment.deployment.getDeploymentHealth);
// router.get("/:deploymentId/metrics", deployment.deployment.getDeploymentMetrics);
// router.post("/:deploymentId/rollback", deployment.deployment.rollbackDeployment);
// router.get("/:deploymentId/history", deployment.deployment.getDeploymentHistory);

module.exports = router;
