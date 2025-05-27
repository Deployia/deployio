/**
 * Custom error response handler
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error("Error:", err);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error.message = `${field} '${value}' already exists`;
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    error.message = messages.join(", ");
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // JWT token errors
  if (err.name === "JsonWebTokenError") {
    error.message = "Invalid token";
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Token expired";
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }

  // Default server error
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
  });
};

module.exports = errorHandler;
