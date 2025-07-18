// Deployment Routes - /api/v1/deployments/*
// Deployment management endpoints

const express = require("express");
const router = express.Router();
const { protect } = require("@middleware/authMiddleware");

// Import sub-routes
const deploymentRoutes = require("./deployments");

// All deployment routes require authentication
router.use(protect);

// Mount sub-routes
router.use("/", deploymentRoutes);

module.exports = router;
