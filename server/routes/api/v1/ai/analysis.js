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
  max: 10, // 3 requests per 15 minutes for demo (IP-based)
  message: {
    success: false,
    message:
      "Demo rate limit exceeded. Please sign up for unlimited access or try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip, // Rate limit by IP address
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
router.get(
  "/demo/progress/:operationId",
  demoRateLimit,
  ai.analysis.getDemoAnalysisProgress
);
router.get("/technologies", ai.analysis.getSupportedTechnologies);
router.get("/health", ai.analysis.checkServiceHealth); // Public health check for demo

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
router.get("/health/detailed", protect, ai.analysis.getDetailedServiceHealth);

module.exports = router;
