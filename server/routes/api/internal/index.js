/**
 * Internal API Routes Index
 * Routes used by internal services for secure communication
 */

const express = require("express");
const authRoutes = require("./auth");

const router = express.Router();

// Auth validation routes
router.use("/auth", authRoutes);

module.exports = router;
