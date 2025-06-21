// Container Management Routes - /api/v1/deployments/containers/*
// Container-specific operations

const express = require("express");
const router = express.Router();
const containerController = require("../../../../controllers/deployment/containerController");

// Container operations
router.get("/", containerController.getUserContainers);
router.get("/:containerId", containerController.getContainerStatus);
router.get("/:containerId/logs", containerController.getContainerLogs);
router.post("/:containerId/restart", containerController.restartContainer);
router.post("/:containerId/stop", containerController.stopContainer);
router.post("/:containerId/start", containerController.startContainer);
router.put("/:containerId", containerController.updateContainer);

// Container monitoring
router.get("/:containerId/stats", containerController.getContainerStats);
router.get("/:containerId/health", containerController.getContainerHealth);

module.exports = router;
