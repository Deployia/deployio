// AI Chat Routes - /api/v1/ai/chat/*
// Chatbot endpoints for business and DevOps assistance

const express = require("express");
const { body } = require("express-validator");
const { ai } = require("@controllers");
const { protect } = require("@middleware/authMiddleware");
const { demoAccess } = require("@middleware/demoAuthMiddleware");
const { createRateLimiter } = require("@middleware/rateLimitMiddleware");

const router = express.Router();

// Rate limiting configurations
const businessChatRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute for business chat
  message: {
    success: false,
    message:
      "Too many chat requests. Please wait a moment before sending another message.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const devOpsChatRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 requests per minute for DevOps chat (more resource intensive)
  message: {
    success: false,
    message:
      "Too many DevOps chat requests. Please wait a moment before sending another message.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateBusinessChat = [
  body("message")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message must be between 1 and 1000 characters"),
  body("sessionId")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Session ID must be between 1 and 100 characters"),
];

const validateDevOpsChat = [
  body("message")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message must be between 1 and 1000 characters"),
  body("context")
    .optional()
    .isObject()
    .withMessage("Context must be an object"),
];

const validateResetConversation = [
  body("sessionId")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage(
      "Session ID is required and must be between 1 and 100 characters"
    ),
];

/**
 * @route   POST /api/v1/ai/chat/business
 * @desc    Business chatbot for customer support and sales inquiries
 * @access  Public (no authentication required)
 */
router.post(
  "/business",
  businessChatRateLimit,
  validateBusinessChat,
  ai.aiChat.businessChat
);

/**
 * @route   POST /api/v1/ai/chat/devops
 * @desc    DevOps chatbot for technical assistance
 * @access  Private (authenticated users only)
 */
router.post(
  "/devops",
  protect,
  devOpsChatRateLimit,
  validateDevOpsChat,
  ai.aiChat.devOpsChat
);

/**
 * @route   POST /api/v1/ai/chat/business/reset
 * @desc    Reset business chat conversation history
 * @access  Public
 */
router.post(
  "/business/reset",
  businessChatRateLimit,
  validateResetConversation,
  ai.aiChat.resetBusinessConversation
);

/**
 * @route   GET /api/v1/ai/chat/business/welcome
 * @desc    Get business chat welcome message
 * @access  Public
 */
router.get("/business/welcome", ai.aiChat.getBusinessWelcome);

/**
 * @route   GET /api/v1/ai/chat/health
 * @desc    Get chatbot services health status
 * @access  Public
 */
router.get("/health", ai.aiChat.getChatbotHealth);

module.exports = router;
