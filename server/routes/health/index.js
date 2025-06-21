// Health & Monitoring Routes - /health/*
// System health checks and monitoring endpoints

const express = require("express");
const router = express.Router();
const healthRoutes = require("./health");
const metricsRoutes = require("./metrics");

// Mount health and monitoring routes
router.use("/", healthRoutes);
router.use("/metrics", metricsRoutes);

module.exports = router;
