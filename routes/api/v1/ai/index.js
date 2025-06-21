// AI Routes - /api/v1/ai/*
// Analysis, Generation, and Optimization endpoints

const express = require("express");
const router = express.Router();
const requireAuth = require("../../../middleware/authMiddleware");

// Import modular AI controllers
const analysisController = require("../../../controllers/ai/analysisController");
const generationController = require("../../../controllers/ai/generationController");
const optimizationController = require("../../../controllers/ai/optimizationController");

// Analysis routes
router.use("/analysis", requireAuth, analysisController);
router.use("/generation", requireAuth, generationController);
router.use("/optimization", requireAuth, optimizationController);

// Legacy compatibility - redirect old routes
router.use("/analyze", requireAuth, analysisController);
router.use("/generate", requireAuth, generationController);

module.exports = router;
