// API v1 Main Router
// Implements the versioned API routing from BACKEND_ARCHITECTURE_PLAN.md

const express = require("express");
const router = express.Router();

// Import route modules
const aiRoutes = require("./ai");
const deploymentRoutes = require("./deployment");
const projectRoutes = require("./project");
const userRoutes = require("./user");
const adminRoutes = require("./admin");

// Mount route modules
router.use("/ai", aiRoutes);
router.use("/deployments", deploymentRoutes);
router.use("/projects", projectRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);

// API v1 health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    version: "v1",
    timestamp: new Date().toISOString(),
    message: "DeployIO API v1 is running",
  });
});

module.exports = router;
