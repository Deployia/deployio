/**
 * Enhanced Adaptive Rate Limiting Middleware
 * Provides dynamic rate limiting based on user behavior and failure patterns
 */

const { getRedisClient } = require("@config/redisClient");
const logger = require("@config/logger");

// Enhanced rate limiting configuration
const rateLimitConfig = {
  // Base limits for different endpoints
  endpoints: {
    "/api/auth/login": {
      max: 5,
      window: 15 * 60 * 1000, // 15 minutes
      blockDuration: 15 * 60 * 1000, // 15 minutes
    },
    "/api/auth/register": {
      max: 3,
      window: 60 * 60 * 1000, // 1 hour
      blockDuration: 60 * 60 * 1000, // 1 hour
    },
    "/api/auth/2fa/verify": {
      max: 3,
      window: 15 * 60 * 1000, // 15 minutes
      blockDuration: 30 * 60 * 1000, // 30 minutes
    },
    "/api/auth/refresh": {
      max: 10,
      window: 60 * 60 * 1000, // 1 hour
      blockDuration: 60 * 60 * 1000, // 1 hour
    },
    "/api/auth/forgot-password": {
      max: 3,
      window: 60 * 60 * 1000, // 1 hour
      blockDuration: 60 * 60 * 1000, // 1 hour
    },
  },

  // Adaptive settings
  adaptive: {
    failureMultiplier: 2,
    maxPenalty: 24 * 60 * 60 * 1000, // 24 hours
    suspiciousThreshold: 10, // Mark IP as suspicious after 10 failures
    globalLimitThreshold: 1000, // Global rate limit per minute
  },
};

/**
 * Enhanced adaptive rate limiting middleware
 */
const adaptiveRateLimit = (options = {}) => {
  return async (req, res, next) => {
    try {
      const ip = req.ip || req.connection.remoteAddress;
      const endpoint = req.route?.path || req.path;
      const userAgent = req.get("User-Agent") || "";

      // Get endpoint configuration
      const endpointConfig = rateLimitConfig.endpoints[endpoint] || {
        max: 5,
        window: 15 * 60 * 1000,
        blockDuration: 15 * 60 * 1000,
      };

      const rateLimitResult = await checkAdvancedRateLimit(
        ip,
        endpoint,
        endpointConfig,
        userAgent
      );

      if (!rateLimitResult.allowed) {
        // Log rate limit violation
        logger.warn("Rate limit exceeded:", {
          ip,
          endpoint,
          userAgent,
          currentAttempts: rateLimitResult.currentAttempts,
          limit: rateLimitResult.limit,
          retryAfter: rateLimitResult.retryAfter,
          reason: rateLimitResult.reason,
        });

        // Set rate limit headers
        res.set({
          "X-RateLimit-Limit": rateLimitResult.limit,
          "X-RateLimit-Remaining": Math.max(
            0,
            rateLimitResult.limit - rateLimitResult.currentAttempts
          ),
          "X-RateLimit-Reset": new Date(
            Date.now() + rateLimitResult.retryAfter * 1000
          ).toISOString(),
          "Retry-After": rateLimitResult.retryAfter,
        });

        return res.status(429).json({
          success: false,
          error: "Too many requests",
          message:
            rateLimitResult.reason ||
            "Rate limit exceeded. Please try again later.",
          retryAfter: rateLimitResult.retryAfter,
          type: "RATE_LIMIT_EXCEEDED",
        });
      }

      // Add rate limit info to response headers
      res.set({
        "X-RateLimit-Limit": rateLimitResult.limit,
        "X-RateLimit-Remaining": Math.max(
          0,
          rateLimitResult.limit - rateLimitResult.currentAttempts
        ),
        "X-RateLimit-Reset": new Date(
          Date.now() + endpointConfig.window
        ).toISOString(),
      });

      // Store rate limit info in request for use in route handlers
      req.rateLimit = rateLimitResult;

      next();
    } catch (error) {
      logger.error("Rate limiting error:", error);
      // Allow request to proceed if rate limiting fails
      next();
    }
  };
};

/**
 * Advanced rate limit checking with adaptive behavior
 */
async function checkAdvancedRateLimit(ip, endpoint, config, userAgent = "") {
  try {
    const redisClient = getRedisClient();

    if (!redisClient || !redisClient.isReady) {
      logger.warn("Redis not available for rate limiting");
      return { allowed: true, reason: "Rate limiting unavailable" };
    }

    const now = Date.now();
    const windowStart = now - config.window;

    // Keys for different types of tracking
    const attemptKey = `rate:${ip}:${endpoint}`;
    const failureKey = `failures:${ip}:${endpoint}`;
    const suspiciousKey = `suspicious:${ip}`;
    const globalKey = `global:${endpoint}`;

    // Get current data
    const pipeline = redisClient.multi();
    pipeline.zcard(attemptKey);
    pipeline.get(failureKey);
    pipeline.get(suspiciousKey);
    pipeline.zcard(globalKey);

    const results = await pipeline.exec();
    const currentAttempts = results[0][1] || 0;
    const recentFailures = parseInt(results[1][1]) || 0;
    const isSuspicious = results[2][1] === "true";
    const globalAttempts = results[3][1] || 0;

    // Calculate adaptive limit
    let adaptiveLimit = config.max;

    // Reduce limit for suspicious IPs
    if (isSuspicious) {
      adaptiveLimit = Math.max(1, Math.floor(config.max / 2));
    }

    // Reduce limit based on recent failures
    if (recentFailures > 0) {
      const reduction = Math.floor(
        recentFailures / rateLimitConfig.adaptive.failureMultiplier
      );
      adaptiveLimit = Math.max(1, adaptiveLimit - reduction);
    }

    // Check global rate limits
    if (globalAttempts > rateLimitConfig.adaptive.globalLimitThreshold) {
      return {
        allowed: false,
        limit: adaptiveLimit,
        currentAttempts,
        retryAfter: Math.ceil(config.window / 1000),
        reason: "Global rate limit exceeded - service temporarily unavailable",
      };
    }

    // Check if current attempts exceed adaptive limit
    if (currentAttempts >= adaptiveLimit) {
      // Calculate backoff time based on failures
      const backoffMultiplier = Math.min(
        Math.pow(2, Math.floor(recentFailures / 3)),
        8
      );
      const retryAfter = Math.min(
        Math.ceil((config.blockDuration * backoffMultiplier) / 1000),
        Math.ceil(rateLimitConfig.adaptive.maxPenalty / 1000)
      );

      return {
        allowed: false,
        limit: adaptiveLimit,
        currentAttempts,
        retryAfter,
        reason: isSuspicious
          ? "IP marked as suspicious - extended rate limit applied"
          : "Rate limit exceeded",
      };
    }

    // Record this attempt
    await recordAttempt(ip, endpoint, config, userAgent);

    return {
      allowed: true,
      limit: adaptiveLimit,
      currentAttempts: currentAttempts + 1,
      remaining: adaptiveLimit - currentAttempts - 1,
    };
  } catch (error) {
    logger.error("Advanced rate limit check failed:", error);
    return { allowed: true, error: "Rate limit check failed" };
  }
}

/**
 * Record an attempt for rate limiting
 */
async function recordAttempt(ip, endpoint, config, userAgent = "") {
  try {
    const redisClient = getRedisClient();
    const now = Date.now();
    const windowStart = now - config.window;

    const attemptKey = `rate:${ip}:${endpoint}`;
    const globalKey = `global:${endpoint}`;

    // Use pipeline for atomic operations
    const pipeline = redisClient.multi();

    // Remove old attempts outside the window
    pipeline.zremrangebyscore(attemptKey, 0, windowStart);
    pipeline.zremrangebyscore(globalKey, 0, now - 60000); // Global window is 1 minute

    // Add current attempt
    pipeline.zadd(attemptKey, now, `${now}:${userAgent.substring(0, 50)}`);
    pipeline.zadd(globalKey, now, `${ip}:${now}`);

    // Set expiry
    pipeline.expire(attemptKey, Math.ceil(config.window / 1000));
    pipeline.expire(globalKey, 60); // 1 minute

    await pipeline.exec();
  } catch (error) {
    logger.error("Failed to record rate limit attempt:", error);
  }
}

/**
 * Record a failed attempt (for adaptive behavior)
 */
async function recordFailure(ip, endpoint) {
  try {
    const redisClient = getRedisClient();

    if (!redisClient || !redisClient.isReady) {
      return;
    }

    const failureKey = `failures:${ip}:${endpoint}`;
    const suspiciousKey = `suspicious:${ip}`;

    // Increment failure count
    const failures = await redisClient.incr(failureKey);
    await redisClient.expire(failureKey, 3600); // 1 hour expiry

    // Mark as suspicious if too many failures
    if (failures >= rateLimitConfig.adaptive.suspiciousThreshold) {
      await redisClient.setex(suspiciousKey, 24 * 3600, "true"); // 24 hours

      logger.warn("IP marked as suspicious due to repeated failures:", {
        ip,
        endpoint,
        failures,
      });
    }
  } catch (error) {
    logger.error("Failed to record failure:", error);
  }
}

/**
 * Clear failures for an IP (on successful auth)
 */
async function clearFailures(ip, endpoint) {
  try {
    const redisClient = getRedisClient();

    if (!redisClient || !redisClient.isReady) {
      return;
    }

    const failureKey = `failures:${ip}:${endpoint}`;
    await redisClient.del(failureKey);
  } catch (error) {
    logger.error("Failed to clear failures:", error);
  }
}

/**
 * Get rate limit status for an IP/endpoint
 */
async function getRateLimitStatus(ip, endpoint) {
  try {
    const redisClient = getRedisClient();

    if (!redisClient || !redisClient.isReady) {
      return { available: false };
    }

    const config = rateLimitConfig.endpoints[endpoint] || {
      max: 5,
      window: 15 * 60 * 1000,
    };

    const attemptKey = `rate:${ip}:${endpoint}`;
    const failureKey = `failures:${ip}:${endpoint}`;
    const suspiciousKey = `suspicious:${ip}`;

    const pipeline = redisClient.multi();
    pipeline.zcard(attemptKey);
    pipeline.get(failureKey);
    pipeline.get(suspiciousKey);

    const results = await pipeline.exec();
    const currentAttempts = results[0][1] || 0;
    const recentFailures = parseInt(results[1][1]) || 0;
    const isSuspicious = results[2][1] === "true";

    return {
      available: true,
      currentAttempts,
      limit: config.max,
      remaining: Math.max(0, config.max - currentAttempts),
      recentFailures,
      isSuspicious,
      resetTime: new Date(Date.now() + config.window),
    };
  } catch (error) {
    logger.error("Failed to get rate limit status:", error);
    return { available: false, error: error.message };
  }
}

module.exports = {
  adaptiveRateLimit,
  checkAdvancedRateLimit,
  recordFailure,
  clearFailures,
  getRateLimitStatus,
  rateLimitConfig,
};
