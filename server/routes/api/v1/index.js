// API v1 Main Router
// Implements the versioned API routing from BACKEND_ARCHITECTURE_PLAN.md

const express = require("express");
const router = express.Router();

// Import route modules
const aiRoutes = require("./ai");
const deploymentRoutes = require("./deployment");
const projectRoutes = require("./project");
const userRoutes = require("./user");
const gitRoutes = require("./git");
const adminRoutes = require("./admin");
const externalRoutes = require("./external");
const logsRoutes = require("./logs");
const debugRoutes = require("../debug/tokens");

// Mount route modules
router.use("/ai", aiRoutes);
router.use("/deployments", deploymentRoutes);
router.use("/projects", projectRoutes);
router.use("/users", userRoutes);
router.use("/git", gitRoutes);
router.use("/admin", adminRoutes);
router.use("/external", externalRoutes);
router.use("/logs", logsRoutes);
// Debug routes (only in development)
if (process.env.NODE_ENV === "development") {
  router.use("/debug", debugRoutes);
}

module.exports = router;
