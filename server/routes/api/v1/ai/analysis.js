// Analysis Routes - /api/v1/ai/analysis/*
// Repository analysis endpoints

const express = require("express");
const { ai } = require("@controllers");
const router = express.Router();

// IMPLEMENTED ROUTES
router.post("/repository", ai.analysis.demoAnalyzeRepository);
router.post("/stack", ai.analysis.analyzeProjectStack);
router.post("/full", ai.analysis.runFullAnalysis);
router.get("/technologies", ai.analysis.getSupportedTechnologies);
router.get("/health", ai.analysis.checkServiceHealth);

// PLANNED ROUTES - TO BE IMPLEMENTED
// router.post("/code-quality", ai.analysis.analyzeCodeQuality);
// router.post("/security", ai.analysis.analyzeSecurity);
// router.post("/performance", ai.analysis.analyzePerformance);
// router.get("/repository/:projectId", ai.analysis.getRepositoryAnalysis);
// router.get("/stack/:projectId", ai.analysis.getStackAnalysis);
// router.get("/code-quality/:projectId", ai.analysis.getCodeQualityAnalysis);
// router.get("/security/:projectId", ai.analysis.getSecurityAnalysis);

module.exports = router;
