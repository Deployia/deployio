// Deployment Routes - /api/v1/deployments/*
// Deployment management endpoints

const express = require("express");
const router = express.Router();
const { protect } = require("@middleware/authMiddleware");

// Import sub-routes
const deploymentRoutes = require("./deployments");
const containerRoutes = require("./containers");
const logsRoutes = require("./logs");

// All deployment routes require authentication
router.use(protect);

// Mount sub-routes
router.use("/", deploymentRoutes);
router.use("/containers", containerRoutes);
router.use("/logs", logsRoutes);

module.exports = router;
