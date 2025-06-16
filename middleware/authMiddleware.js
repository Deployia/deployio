const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../config/logger"); // Import logger

/**
 * Middleware to protect routes and verify authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token is provided in cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please log in to continue.",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { id, sessionId } = decoded;

      if (!id) {
        return res.status(401).json({
          success: false,
          message: "Invalid token format. Please log in again.",
        });
      }

      // Find user by ID
      const user = await User.findById(id);

      // Check if user exists
      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User account not found. Please register or contact support.",
        });
      } // Check if user account is still verified/active
      if (!user.isVerified) {
        // Auto-verify OAuth users who might have been created before the fix
        if (user.googleId || user.githubId) {
          user.isVerified = true;
          await user.save();
          logger.info(`Auto-verified OAuth user: ${user.email}`);
        } else {
          return res.status(403).json({
            success: false,
            message: "Account not verified. Please verify your email.",
          });
        }
      } // Check that sessionId exists in user's sessions (if sessionId is provided)
      if (sessionId) {
        const sessionExists = user.sessions.some(
          (s) => s._id.toString() === sessionId
        );
        if (!sessionExists) {
          // If the specific session doesn't exist, but user has other valid sessions,
          // allow the request but log it for monitoring
          if (user.sessions && user.sessions.length > 0) {
            logger.warn("Session mismatch but user has valid sessions", {
              userId: user._id,
              requestedSessionId: sessionId,
              availableSessions: user.sessions.length,
            });
            // Use the most recent session as fallback
            const latestSession = user.sessions.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            )[0];
            req.sessionId = latestSession._id.toString();
          } else {
            return res.status(401).json({
              success: false,
              message: "Session expired or invalid. Please log in again.",
            });
          }
        } else {
          req.sessionId = sessionId;
        }
      } // Attach user to request object
      req.user = user;
      // sessionId is already set above based on validation logic
      next();
    } catch (tokenError) {
      let message = "Authentication failed. Please log in again.";

      if (tokenError.name === "TokenExpiredError") {
        message = "Session expired. Please log in again.";
      } else if (tokenError.name === "JsonWebTokenError") {
        message = "Invalid token. Please log in again.";
      }

      return res.status(401).json({
        success: false,
        message: message,
      });
    }
  } catch (error) {
    logger.error("Auth middleware error", {
      error: { message: error.message, stack: error.stack, name: error.name },
      request: {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      },
    });
    return res.status(500).json({
      success: false,
      message: "Server error during authentication. Please try again.",
    });
  }
};

module.exports = {
  protect,
};
