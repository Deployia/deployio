// Optimization Routes - /api/v1/ai/optimization/*
// Performance and cost optimization endpoints

const express = require("express");
const { ai } = require("@controllers");
const router = express.Router();

// IMPLEMENTED ROUTES
router.post("/performance", ai.optimization.optimizePerformance);
router.post("/security", ai.optimization.optimizeSecurity);
router.post("/costs", ai.optimization.optimizeCosts);
router.post("/build", ai.optimization.generateBuildOptimization);
router.get("/list/:projectId", ai.optimization.getOptimizations);
router.put(
  "/implement/:optimizationId",
  ai.optimization.markOptimizationImplemented
);

// PLANNED ROUTES - TO BE IMPLEMENTED
// router.post("/recommendations", ai.optimization.generateRecommendations);
// router.get("/performance/:projectId", ai.optimization.getPerformanceOptimization);
// router.get("/security/:projectId", ai.optimization.getSecurityOptimization);
// router.get("/costs/:projectId", ai.optimization.getCostOptimization);
// router.get("/recommendations/:projectId", ai.optimization.getRecommendations);

module.exports = router;
