// Deployment Management Routes - /api/v1/deployments/*
// Core deployment operations

const express = require("express");
const router = express.Router();
const deploymentController = require("../../../../controllers/deployment/deploymentController");

// Deployment CRUD operations
router.post("/", deploymentController.deployProject);
router.get("/", deploymentController.getUserDeployments);
router.get("/:deploymentId", deploymentController.getDeploymentStatus);
router.put("/:deploymentId", deploymentController.updateDeployment);
router.delete("/:deploymentId", deploymentController.deleteDeployment);

// Deployment actions
router.post("/:deploymentId/start", deploymentController.startDeployment);
router.post("/:deploymentId/stop", deploymentController.stopDeployment);
router.post("/:deploymentId/restart", deploymentController.restartDeployment);
router.post("/:deploymentId/redeploy", deploymentController.redeployProject);

// Deployment status and monitoring
router.get("/:deploymentId/status", deploymentController.getDeploymentStatus);
router.get("/:deploymentId/health", deploymentController.getDeploymentHealth);
router.get("/:deploymentId/metrics", deploymentController.getDeploymentMetrics);

module.exports = router;
