// AI Routes - /api/v1/ai/*
// Analysis, Generation, and Optimization endpoints

const express = require("express");
const router = express.Router();
const { protect } = require("@middleware/authMiddleware");

// Import sub-routes
const analysisRoutes = require("./analysis");
const generationRoutes = require("./generation");
const optimizationRoutes = require("./optimization");

// All AI routes require authentication
router.use("/analysis", protect, analysisRoutes);
router.use("/generation", protect, generationRoutes);
router.use("/optimization", protect, optimizationRoutes);

module.exports = router;
