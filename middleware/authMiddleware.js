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
        message: "Not authorized to access this route. Please log in.",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { id, sessionId } = decoded;

      // Find user by ID
      const user = await User.findById(id);

      // Check if user exists
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Check that sessionId exists in user's sessions
      const sessionExists = user.sessions.some(
        (s) => s._id.toString() === sessionId
      );
      if (!sessionExists) {
        return res.status(401).json({
          success: false,
          message: "Session invalid or expired. Please log in again.",
        });
      }

      // Attach user and sessionId to request object
      req.user = user;
      req.sessionId = sessionId;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
};
