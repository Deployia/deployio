// Optimization Routes - /api/v1/ai/optimization/*
// Performance and cost optimization endpoints

const express = require("express");
const { ai } = require("@controllers");
const router = express.Router();

// Optimization services
router.post("/performance", ai.optimization.optimizePerformance);
router.post("/security", ai.optimization.optimizeSecurity);
router.post("/costs", ai.optimization.optimizeCosts);
router.post("/recommendations", ai.optimization.generateRecommendations);

// Get optimization results
router.get(
  "/performance/:projectId",
  ai.optimization.getPerformanceOptimization
);
router.get("/security/:projectId", ai.optimization.getSecurityOptimization);
router.get("/costs/:projectId", ai.optimization.getCostOptimization);
router.get("/recommendations/:projectId", ai.optimization.getRecommendations);

module.exports = router;
