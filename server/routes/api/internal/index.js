/**
 * Internal API Routes Index
 * Routes used by internal services for secure communication
 */

const express = require("express");
const authRoutes = require("./auth");
const notificationRoutes = require("./notifications");

const router = express.Router();

// Auth validation routes
router.use("/auth", authRoutes);

// Notification testing routes
router.use("/notifications", notificationRoutes);

module.exports = router;
