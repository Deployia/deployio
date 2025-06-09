const jwt = require("jsonwebtoken");
const User = require("../models/User");

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
      }

      // Check if user account is still verified/active
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: "Account not verified. Please verify your email.",
        });
      }

      // Check that sessionId exists in user's sessions (if sessionId is provided)
      if (sessionId) {
        const sessionExists = user.sessions.some(
          (s) => s._id.toString() === sessionId
        );
        if (!sessionExists) {
          return res.status(401).json({
            success: false,
            message: "Session expired or invalid. Please log in again.",
          });
        }
      }

      // Attach user and sessionId to request object
      req.user = user;
      req.sessionId = sessionId;
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
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during authentication. Please try again.",
    });
  }
};

module.exports = {
  protect,
};
