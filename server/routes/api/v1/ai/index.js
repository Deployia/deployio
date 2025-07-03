// AI Routes - /api/v1/ai/*
// Analysis, Generation, and Optimization endpoints

const express = require("express");
const router = express.Router();
const { protect } = require("@middleware/authMiddleware");

// Import sub-routes
const analysisRoutes = require("./analysis");

// All AI routes require authentication
router.use("/analysis", protect, analysisRoutes);

module.exports = router;
