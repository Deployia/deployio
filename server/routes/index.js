// Main Routes Index - Updated with Modular Architecture
// Implements the route organization from BACKEND_ARCHITECTURE_PLAN.md

const express = require("express");

// Import new modular routes
const apiV1Routes = require("./api/v1");
const apiInternalRoutes = require("./api/internal");
const webhookRoutes = require("./webhooks");
const healthRoutes = require("./health");

const router = express.Router();

// Mount new modular routes
router.use("/api/v1", apiV1Routes);
router.use("/api/internal", apiInternalRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/health", healthRoutes);

// Root endpoint with architecture info
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DeployIO API is running",
    version: "1.0.0",
    architecture: "modular",
    timestamp: new Date().toISOString(),
    endpoints: {
      "API v1": "/api/v1",
      "API v1 Users": "/api/v1/users",
      "API v1 Projects": "/api/v1/projects",
      "API v1 AI": "/api/v1/ai",
      "API v1 Deployments": "/api/v1/deployments",
      "API v1 External": "/api/v1/external",
      "API v1 Admin": "/api/v1/admin",
      "API v1 Notifications": "/api/v1/notifications",
      Webhooks: "/webhooks",
      Health: "/health",
    },
  });
});

module.exports = router;
