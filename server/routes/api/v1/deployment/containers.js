// Container Management Routes - /api/v1/deployments/containers/*
// Container-specific operations

const express = require("express");
const { deployment } = require("@controllers");
const router = express.Router();

// Container operations
router.get("/", deployment.container.getUserContainers);
router.get("/:containerId", deployment.container.getContainerStatus);
router.get("/:containerId/logs", deployment.container.getContainerLogs);
router.post("/:containerId/restart", deployment.container.restartContainer);
router.post("/:containerId/stop", deployment.container.stopContainer);
router.post("/:containerId/start", deployment.container.startContainer);
router.put("/:containerId", deployment.container.updateContainer);

// Container monitoring
router.get("/:containerId/stats", deployment.container.getContainerStats);
router.get("/:containerId/health", deployment.container.getContainerHealth);

module.exports = router;
