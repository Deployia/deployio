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
  max: 15, // Only 2 requests per 15 minutes for demo (very heavy rate limiting)
  message: {
    success: false,
    message:
      "Demo rate limit exceeded. Only 2 complete pipeline demos allowed per 15 minutes. Please try again later or upgrade for unlimited access.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `demo_${req.user.id}`, // Rate limit by authenticated user
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

// DEMO ENDPOINTS (Requires Authentication + Heavy Rate Limiting)
router.post(
  "/demo/complete-pipeline",
  protect,
  demoRateLimit,
  ai.analysis.demoCompletePipeline
);
router.get(
  "/demo/progress/:operationId",
  protect,
  demoRateLimit,
  ai.analysis.getDemoAnalysisProgress
);

// PUBLIC ENDPOINTS (Minimal Rate Limiting)
router.get("/technologies", ai.analysis.getSupportedTechnologies);
router.get("/health", ai.analysis.checkServiceHealth); // Public health check for demo

// AUTHENTICATED ENDPOINTS
router.post(
  "/repository",
  protect,
  userRateLimit,
  ai.analysis.analyzeRepository
);

module.exports = router;
