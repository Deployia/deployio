// Analysis Routes - /api/v1/ai/analysis/*
// Repository analysis endpoints with proper authentication and rate limiting

const express = require("express");
const { ai } = require("@controllers");
const { protect } = require("@middleware/authMiddleware");
const { createRateLimiter } = require("@middleware/rateLimitMiddleware");

const router = express.Router();

// Rate limiting configurations
const demoRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes for demo
  message: {
    success: false,
    message: "Too many demo requests. Please sign up for unlimited access.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const userRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes for authenticated users
  message: {
    success: false,
    message: "Rate limit exceeded. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// PUBLIC ENDPOINTS (Heavy Rate Limited)
router.post("/demo", demoRateLimit, ai.analysis.demoAnalyzeRepository);
router.get("/technologies", ai.analysis.getSupportedTechnologies);

// AUTHENTICATED ENDPOINTS
router.post(
  "/repository",
  protect,
  userRateLimit,
  ai.analysis.analyzeRepository
);
router.post(
  "/stack",
  protect,
  userRateLimit,
  ai.analysis.detectTechnologyStack
);
router.post(
  "/code-quality",
  protect,
  userRateLimit,
  ai.analysis.analyzeCodeQuality
);
router.post(
  "/dependencies",
  protect,
  userRateLimit,
  ai.analysis.analyzeDependencies
);
router.get("/progress/:operationId", protect, ai.analysis.getAnalysisProgress);

// HEALTH CHECK ENDPOINTS
router.get("/health", protect, ai.analysis.checkServiceHealth);
router.get("/health/detailed", protect, ai.analysis.getDetailedServiceHealth);

// LEGACY ENDPOINTS (Deprecated but maintained for backward compatibility)
router.post(
  "/stack/:projectId",
  protect,
  userRateLimit,
  ai.analysis.analyzeProjectStack
);
router.post(
  "/full/:projectId",
  protect,
  userRateLimit,
  ai.analysis.runFullAnalysis
);

module.exports = router;
