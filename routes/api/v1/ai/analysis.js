// Analysis Routes - /api/v1/ai/analysis/*
// Repository analysis endpoints

const express = require("express");
const router = express.Router();
const analysisController = require("../../../../controllers/ai/analysisController");

// Repository analysis
router.post("/repository", analysisController.analyzeRepository);
router.post("/stack", analysisController.analyzeStack);
router.post("/code-quality", analysisController.analyzeCodeQuality);
router.post("/security", analysisController.analyzeSecurity);

// Get analysis results
router.get("/repository/:projectId", analysisController.getRepositoryAnalysis);
router.get("/stack/:projectId", analysisController.getStackAnalysis);
router.get(
  "/code-quality/:projectId",
  analysisController.getCodeQualityAnalysis
);
router.get("/security/:projectId", analysisController.getSecurityAnalysis);

module.exports = router;
