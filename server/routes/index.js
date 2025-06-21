// Main Routes Index - Updated with Modular Architecture
// Implements the route organization from BACKEND_ARCHITECTURE_PLAN.md

const express = require("express");

// Import new modular routes
const apiV1Routes = require("./api/v1");
const webhookRoutes = require("./webhooks");
const healthRoutes = require("./health");

// Import existing routes for backward compatibility
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const projectRoutes = require("./projectRoutes");
const protectedRoutes = require("./protectedRoutes");
const documentationRoutes = require("./documentationRoutes");
const blogRoutes = require("./blogRoutes");
const adminRoutes = require("./adminRoutes");
const demoRoutes = require("./demoRoutes");

const router = express.Router();

// Mount new modular routes (Phase 3 implementation)
router.use("/api/v1", apiV1Routes);
router.use("/webhooks", webhookRoutes);
router.use("/health", healthRoutes);

// Legacy routes for backward compatibility (maintain existing frontend integration)
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/projects", projectRoutes);
router.use("/protected", protectedRoutes);
router.use("/documentation", documentationRoutes);
router.use("/blogs", blogRoutes);
router.use("/admin", adminRoutes);
router.use("/demo", demoRoutes);

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
      Webhooks: "/webhooks",
      Health: "/health",
      Legacy: "Various legacy endpoints",
    },
  });
});

module.exports = router;
