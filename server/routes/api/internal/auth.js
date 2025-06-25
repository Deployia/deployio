/**
 * Internal Authentication Validation Routes
 * Used by internal services to validate JWT tokens against the database
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("@models/User");
const logger = require("@config/logger");

const router = express.Router();

/**
 * Validate internal service access
 */
const validateInternalService = (req, res, next) => {
  const serviceHeader = req.headers["x-internal-service"];
  // Accept both ai-service and agent as valid internal callers
  const allowedServices = ["deployio-ai-service", "deployio-agent"];
  if (!allowedServices.includes(serviceHeader)) {
    return res.status(403).json({
      success: false,
      error: "Unauthorized internal service",
    });
  }
  next();
};

/**
 * @desc Validate JWT token and return user info
 * @route POST /api/internal/auth/validate-token
 * @access Internal services only
 */
router.post("/validate-token", validateInternalService, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token required",
      });
    }

    // Decode JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
        details: tokenError.message,
      });
    }

    // Handle demo tokens
    if (decoded.type === "demo") {
      return res.status(200).json({
        success: true,
        data: {
          valid: true,
          user: {
            id: "demo_user",
            email: "demo@deployio.com",
            username: "demo",
            type: "demo",
          },
          isDemo: true,
        },
      });
    }

    // Validate real user exists in database
    const user = await User.findById(decoded.id).select(
      "email username isVerified status"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if user is active and verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        error: "User account not verified",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        error: "User account is not active",
      });
    }

    // Validate session if sessionId is present
    if (decoded.sessionId) {
      const sessionExists = user.sessions?.some(
        (session) => session._id.toString() === decoded.sessionId
      );

      if (!sessionExists) {
        return res.status(401).json({
          success: false,
          error: "Session expired or invalid",
        });
      }
    }

    // Return validated user info
    res.status(200).json({
      success: true,
      data: {
        valid: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          type: "user",
        },
        isDemo: false,
      },
    });
  } catch (error) {
    logger.error("Token validation error:", error);
    res.status(500).json({
      success: false,
      error: "Token validation failed",
    });
  }
});

/**
 * @desc Generate a demo user JWT token for development/testing only
 * @route POST /api/internal/auth/demo-token
 * @access Internal services only
 */
router.post("/demo-token", validateInternalService, (req, res) => {
  // if (process.env.NODE_ENV === "production") {
  //   return res.status(404).json({ success: false, error: "Not found" });
  // }
  const payload = {
    id: "demo_user",
    email: "demo@deployio.com",
    username: "demo",
    type: "demo",
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
  return res.status(200).json({ success: true, token });
});

module.exports = router;
