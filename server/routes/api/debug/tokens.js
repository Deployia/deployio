const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const {
  debugRefreshToken,
  cleanupExpiredTokens,
} = require("@utils/debugTokens");
const { protect } = require("@middleware/authMiddleware");

/**
 * DEBUG: Check refresh token status for current user
 * GET /api/v1/debug/refresh-token-status
 */
router.get("/refresh-token-status", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { refreshToken } = req.cookies;

    // Get debug info
    await debugRefreshToken(userId, refreshToken);

    res.json({
      success: true,
      message: "Debug info logged to console",
      data: {
        userId,
        hasRefreshToken: !!refreshToken,
        refreshTokenPreview: refreshToken
          ? refreshToken.substring(0, 20) + "..."
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Debug failed",
      error: error.message,
    });
  }
});

/**
 * DEBUG: Clean up expired tokens for current user
 * POST /api/v1/debug/cleanup-tokens
 */
router.post("/cleanup-tokens", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    await cleanupExpiredTokens(userId);

    res.json({
      success: true,
      message: "Token cleanup completed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cleanup failed",
      error: error.message,
    });
  }
});

/**
 * DEBUG: Test token refresh manually
 * POST /api/v1/debug/test-refresh
 */
router.post("/test-refresh", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "No refresh token found in cookies",
      });
    }

    // Try to decode the token first
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (jwtError) {
      return res.status(400).json({
        success: false,
        message: "Invalid JWT token",
        error: jwtError.message,
      });
    }

    // Run debug info
    await debugRefreshToken(decoded.id, refreshToken);

    res.json({
      success: true,
      message: "Token analysis completed - check logs",
      data: {
        tokenPayload: decoded,
        tokenPreview: refreshToken.substring(0, 20) + "...",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Debug test failed",
      error: error.message,
    });
  }
});

module.exports = router;
