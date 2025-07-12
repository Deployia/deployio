// AI Routes - /api/v1/ai/*
// Analysis, Generation, Optimization, and Chat endpoints

const express = require("express");
const router = express.Router();
const { protect } = require("@middleware/authMiddleware");

// Import sub-routes
const analysisRoutes = require("./analysis");
const chatRoutes = require("./chat");

// Analysis routes require authentication
router.use("/analysis", protect, analysisRoutes);

// Chat routes - mixed access (business chat is public, devops chat is protected)
router.use("/chat", chatRoutes);

module.exports = router;
