// Analysis Routes - /api/v1/ai/analysis/*
// Repository analysis endpoints

const express = require("express");
const { ai } = require("@controllers");
const router = express.Router();

// Repository analysis
router.post("/repository", ai.analysis.analyzeRepository);
router.post("/stack", ai.analysis.analyzeStack);
router.post("/code-quality", ai.analysis.analyzeCodeQuality);
router.post("/security", ai.analysis.analyzeSecurity);

// Get analysis results
router.get("/repository/:projectId", ai.analysis.getRepositoryAnalysis);
router.get("/stack/:projectId", ai.analysis.getStackAnalysis);
router.get("/code-quality/:projectId", ai.analysis.getCodeQualityAnalysis);
router.get("/security/:projectId", ai.analysis.getSecurityAnalysis);

module.exports = router;
