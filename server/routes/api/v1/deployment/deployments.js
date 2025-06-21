// Deployment Management Routes - /api/v1/deployments/*
// Core deployment operations

const express = require("express");
const { deployment } = require("@controllers");
const router = express.Router();

// Deployment CRUD operations
router.post("/", deployment.deployment.deployProject);
router.get("/", deployment.deployment.getUserDeployments);
router.get("/:deploymentId", deployment.deployment.getDeploymentStatus);
router.put("/:deploymentId", deployment.deployment.updateDeployment);
router.delete("/:deploymentId", deployment.deployment.deleteDeployment);

// Deployment actions
router.post("/:deploymentId/start", deployment.deployment.startDeployment);
router.post("/:deploymentId/stop", deployment.deployment.stopDeployment);
router.post("/:deploymentId/restart", deployment.deployment.restartDeployment);
router.post("/:deploymentId/redeploy", deployment.deployment.redeployProject);

// Deployment status and monitoring
router.get("/:deploymentId/status", deployment.deployment.getDeploymentStatus);
router.get("/:deploymentId/health", deployment.deployment.getDeploymentHealth);
router.get(
  "/:deploymentId/metrics",
  deployment.deployment.getDeploymentMetrics
);

module.exports = router;
