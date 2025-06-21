// Deployment Routes - /api/v1/deployments/*
// Deployment management endpoints

const express = require("express");
const router = express.Router();
const requireAuth = require("../../../middleware/authMiddleware");

// Import modular deployment controllers
const deploymentController = require("../../../controllers/deployment/deploymentController");
const containerController = require("../../../controllers/deployment/containerController");
const logsController = require("../../../controllers/deployment/logsController");

// All deployment routes require authentication
router.use(requireAuth);

// Deployment management
router.use("/", deploymentController);
router.use("/containers", containerController);
router.use("/logs", logsController);

module.exports = router;
