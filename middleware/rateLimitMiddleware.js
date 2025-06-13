// middleware/rateLimitMiddleware.js
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { getRedisClient } = require("../config/redisClient");
const logger = require("../config/logger");

/**
 * Helper function to get client IP properly across different deployment scenarios
 */
const getClientIP = (req) => {
  // If trust proxy is enabled and we have X-Forwarded-For
  if (req.ip) {
    return req.ip;
  }

  // Fallback to other headers (be careful with these in production)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, get the first one
    return forwarded.split(",")[0].trim();
  }

  // Fallback to connection remote address
  return (
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    "unknown"
  );
};

/**
 * Create Redis store with error handling - lazy initialization
 */
const createRedisStore = (prefix = "rl:") => {
  try {
    // Check if Redis client is initialized
    const redisClient = getRedisClient();
    if (!redisClient) {
      // Only log in development when debug is enabled
      if (
        process.env.NODE_ENV === "development" &&
        process.env.DEBUG_RATE_LIMIT === "true"
      ) {
        logger.info(
          `Redis client not available for rate limiting (${prefix}), using memory store`
        );
      }
      return undefined;
    } // Test Redis connection before creating store
    if (!redisClient.isReady) {
      // Only log in development when debug is enabled
      if (
        process.env.NODE_ENV === "development" &&
        process.env.DEBUG_RATE_LIMIT === "true"
      ) {
        logger.warn(
          `Redis client not ready (isReady: ${redisClient.isReady}), using memory store for ${prefix}`
        );
      }
      return undefined;
    }

    return new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix,
    });
  } catch (error) {
    logger.error(
      `Failed to create Redis store for rate limiting (${prefix}):`,
      error.message
    );
    if (process.env.NODE_ENV === "development") {
      logger.warn("Falling back to memory store for rate limiting");
    }
    return undefined; // express-rate-limit will use default memory store
  }
};

/**
 * Create a standardized rate limiter with consistent configuration
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // 100 requests default
    message = "Too many requests, please try again later.",
    prefix = "rl:",
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    skipPaths = [],
    onLimitReached,
    ...customOptions
  } = options;

  const limiter = rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000),
      limit: max,
      window: `${Math.ceil(windowMs / 1000 / 60)} minutes`,
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Create store lazily when the limiter is first used
    get store() {
      return createRedisStore(prefix);
    },
    keyGenerator: getClientIP,
    skipSuccessfulRequests,
    skipFailedRequests,
    skip: (req) => {
      // Skip rate limiting for specified paths
      if (skipPaths.includes(req.path)) {
        return true;
      }
      return false;
    },
    // Handle rate limit reached via middleware instead of deprecated onLimitReached
    handler: (req, res, next, options) => {
      const ip = getClientIP(req);
      const message = `Rate limit exceeded for IP: ${ip} on ${req.method} ${req.path}`;
      logger.warn(message);

      if (onLimitReached) {
        onLimitReached(req, res, options);
      }

      // Send rate limit response
      res.status(options.statusCode).json(options.message);
    },
    ...customOptions,
  });

  return limiter;
};

/**
 * Factory function to create rate limiters - lazy initialization
 */
const createRateLimiters = () => {
  return {
    // General API rate limiter
    general: createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // 1000 requests per 15 minutes
      prefix: "general_rl:",
      skipSuccessfulRequests: true, // Don't count successful requests
      skipPaths: ["/api/v1/health", "/health"],
    }),

    // Strict rate limiter for sensitive operations
    strict: createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // 50 requests per 15 minutes
      prefix: "strict_rl:",
      message:
        "Too many requests for this sensitive operation, please try again later.",
    }),

    // Authentication related operations
    auth: {
      login: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 login attempts per 15 minutes
        prefix: "auth_login_rl:",
        message: "Too many login attempts, please try again later.",
        skipFailedRequests: false, // Count failed attempts for security
      }),

      register: createRateLimiter({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5, // 5 registration attempts per hour
        prefix: "auth_register_rl:",
        message: "Too many registration attempts, please try again later.",
      }),

      passwordReset: createRateLimiter({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // 3 password reset requests per hour
        prefix: "auth_password_reset_rl:",
        message: "Too many password reset requests, please try again later.",
      }),

      otp: createRateLimiter({
        windowMs: 10 * 60 * 1000, // 10 minutes
        max: 3, // 3 OTP requests per 10 minutes
        prefix: "auth_otp_rl:",
        message: "Too many OTP requests, please try again later.",
      }),

      refreshToken: createRateLimiter({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 10, // 10 token refresh requests per 5 minutes
        prefix: "auth_refresh_rl:",
        message: "Too many token refresh requests, please try again later.",
        skipSuccessfulRequests: true, // Don't count successful token refreshes
      }),
    },

    // User operations
    user: {
      profileUpdate: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // 10 profile updates per 15 minutes
        prefix: "user_profile_rl:",
        message: "Too many profile updates, please try again later.",
      }),

      passwordUpdate: createRateLimiter({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // 3 password updates per hour
        prefix: "user_password_rl:",
        message: "Too many password change attempts, please try again later.",
      }),

      fileUpload: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20, // 20 file uploads per 15 minutes
        prefix: "user_upload_rl:",
        message: "Too many file uploads, please try again later.",
      }),
    },

    // API operations
    api: {
      read: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 500, // 500 read operations per 15 minutes
        prefix: "api_read_rl:",
        skipSuccessfulRequests: true,
      }),

      write: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 write operations per 15 minutes
        prefix: "api_write_rl:",
        message: "Too many write operations, please try again later.",
      }),
    },
  };
};

// Create rate limiters instance - will be initialized when first accessed
let rateLimiters = null;

// Getter function to lazily initialize rate limiters
const getRateLimiters = () => {
  if (!rateLimiters) {
    rateLimiters = createRateLimiters();
  }
  return rateLimiters;
};

/**
 * Middleware to bypass rate limiting for health checks
 */
const bypassHealthChecks = (req, res, next) => {
  if (req.path === "/api/v1/health" || req.path === "/health") {
    return next();
  }
  next();
};

/**
 * Debug middleware to log IP detection and rate limiting info
 * Only enabled in development or when DEBUG_RATE_LIMIT=true
 */
const debugRateLimit = (req, res, next) => {
  if (
    process.env.NODE_ENV === "development" ||
    process.env.DEBUG_RATE_LIMIT === "true"
  ) {
    const detectedIP = getClientIP(req);
    const trustProxy = req.app.get("trust proxy");
    const forwardedFor = req.headers["x-forwarded-for"];

    logger.debug(`Rate Limit Debug:`, {
      path: req.path,
      method: req.method,
      detectedIP,
      trustProxy,
      expressIP: req.ip,
      forwardedFor,
      connectionIP: req.connection?.remoteAddress,
      socketIP: req.socket?.remoteAddress,
    });
  }
  next();
};

/**
 * Middleware to add rate limit info to response headers for debugging
 */
const addRateLimitHeaders = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Add rate limit debug info in development
    if (process.env.NODE_ENV === "development") {
      const rateLimitInfo = {
        clientIP: getClientIP(req),
        trustProxy: req.app.get("trust proxy"),
        timestamp: new Date().toISOString(),
      };

      if (typeof data === "object" && data !== null) {
        data._rateLimitDebug = rateLimitInfo;
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

module.exports = {
  createRateLimiter,
  getRateLimiters,
  getClientIP,
  createRedisStore,
  bypassHealthChecks,
  debugRateLimit,
  addRateLimitHeaders,
};
