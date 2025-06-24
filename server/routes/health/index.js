// Health & Monitoring Routes - /health/*
// System health checks and monitoring endpoints

const express = require("express");
const router = express.Router();
const healthRoutes = require("./health");
const serviceRoutes = require("./service");

// Mount health and monitoring routes
router.use("/", healthRoutes);
router.use("/service", serviceRoutes);

module.exports = router;
