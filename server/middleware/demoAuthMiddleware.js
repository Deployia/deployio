const jwt = require("jsonwebtoken");
const logger = require("@config/logger");

/**
 * Middleware for demo access - allows both authenticated users and demo tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const demoAccess = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header first (for API clients)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Check if token is provided in cookies (for web clients)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token, allow as demo user
    if (!token) {
      req.user = null;
      req.isDemo = true;
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if it's a demo token
      if (decoded.type === "demo") {
        req.user = null;
        req.isDemo = true;
        req.demoToken = decoded;
        return next();
      }

      // For regular user tokens, we should validate the user exists
      // For now, we'll trust the token if it's valid
      req.user = {
        _id: decoded.id,
        email: decoded.email,
        username: decoded.username,
      };
      req.isDemo = false;

      return next();
    } catch (tokenError) {
      // If token is invalid, treat as demo user
      logger.warn(
        "Invalid token provided, treating as demo user:",
        tokenError.message
      );
      req.user = null;
      req.isDemo = true;
      return next();
    }
  } catch (error) {
    logger.error("Error in demo access middleware:", error);
    req.user = null;
    req.isDemo = true;
    return next();
  }
};

/**
 * Middleware to require authentication (no demo access)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireAuth = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header first
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Check if token is provided in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication required.",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Reject demo tokens
      if (decoded.type === "demo") {
        return res.status(401).json({
          success: false,
          message: "Demo access not allowed. Please sign up for full access.",
        });
      }

      req.user = {
        _id: decoded.id,
        email: decoded.email,
        username: decoded.username,
      };

      return next();
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
  } catch (error) {
    logger.error("Error in requireAuth middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

/**
 * Generate demo JWT token for development/testing
 */
const generateDemoToken = () => {
  return jwt.sign(
    {
      id: "demo_user",
      email: "demo@deployio.com",
      username: "demo",
      type: "demo",
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

module.exports = {
  demoAccess,
  requireAuth,
  generateDemoToken,
};
