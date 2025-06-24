/**
 * Internal API Routes Index
 * Routes used by internal services for secure communication
 */

const express = require("express");
const authRoutes = require("./auth");
const logRoutes = require("./logs");

const router = express.Router();

// Auth validation routes
router.use("/auth", authRoutes);

// Log streaming routes
router.use("/logs", logRoutes);

module.exports = router;
