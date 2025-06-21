// Optimization Routes - /api/v1/ai/optimization/*
// Performance and cost optimization endpoints

const express = require("express");
const router = express.Router();
const optimizationController = require("../../../../controllers/ai/optimizationController");

// Optimization services
router.post("/performance", optimizationController.optimizePerformance);
router.post("/security", optimizationController.optimizeSecurity);
router.post("/costs", optimizationController.optimizeCosts);
router.post("/recommendations", optimizationController.generateRecommendations);

// Get optimization results
router.get(
  "/performance/:projectId",
  optimizationController.getPerformanceOptimization
);
router.get(
  "/security/:projectId",
  optimizationController.getSecurityOptimization
);
router.get("/costs/:projectId", optimizationController.getCostOptimization);
router.get(
  "/recommendations/:projectId",
  optimizationController.getRecommendations
);

module.exports = router;
