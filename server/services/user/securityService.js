const { getRedisClient } = require("@config/redisClient");
const logger = require("@config/logger");
const User = require("@models/User");

/**
 * Security Service - Handles security-related operations
 *
 * Responsibilities:
 * - Rate limiting logic
 * - Account lockout mechanisms
 * - Security monitoring
 * - Login attempt tracking
 */

// Adaptive rate limiting configuration
const rateLimitConfig = {
  baseLimit: 5,
  failureMultiplier: 2,
  successResetTime: 60 * 60 * 1000, // 1 hour
  maxPenalty: 24 * 60 * 60 * 1000, // 24 hours
  endpoints: {
    "/api/auth/login": { max: 5, window: 15 * 60 * 1000 },
    "/api/auth/register": { max: 3, window: 60 * 60 * 1000 },
    "/api/auth/2fa/verify": { max: 3, window: 15 * 60 * 1000 },
    "/api/auth/refresh": { max: 10, window: 60 * 60 * 1000 },
  },
};

/**
 * Check adaptive rate limit for authentication endpoints
 * @param {String} ip - Client IP address
 * @param {String} endpoint - API endpoint
 * @param {Boolean} isFailure - Whether this is a failed attempt
 * @returns {Object} Rate limit result
 */
const checkAdaptiveRateLimit = async (ip, endpoint, isFailure = false) => {
  try {
    const redisClient = getRedisClient();
    const key = `adaptive_rate:${ip}:${endpoint}`;
    const failureKey = `failures:${ip}:${endpoint}`;

    const currentAttempts = parseInt(await redisClient.get(key)) || 0;
    const recentFailures = parseInt(await redisClient.get(failureKey)) || 0;

    // Calculate adaptive limit based on recent failures
    const baseConfig = rateLimitConfig.endpoints[endpoint] || {
      max: 5,
      window: 15 * 60 * 1000,
    };
    const adaptiveLimit = Math.max(
      1,
      baseConfig.max - Math.floor(recentFailures / 2)
    );

    if (currentAttempts >= adaptiveLimit) {
      const backoffTime = Math.min(
        baseConfig.window * Math.pow(2, Math.floor(recentFailures / 3)),
        rateLimitConfig.maxPenalty
      );

      return {
        allowed: false,
        retryAfter: Math.ceil(backoffTime / 1000),
        reason: "Rate limit exceeded",
        adaptiveLimit,
        currentAttempts,
        recentFailures,
      };
    }

    // Update attempt counter
    await redisClient
      .multi()
      .incr(key)
      .expire(key, Math.ceil(baseConfig.window / 1000))
      .exec();

    // Update failure counter if this is a failure
    if (isFailure) {
      await redisClient
        .multi()
        .incr(failureKey)
        .expire(failureKey, 3600) // 1 hour
        .exec();
    } else {
      // Reset failures on success
      await redisClient.del(failureKey);
    }

    return {
      allowed: true,
      adaptiveLimit,
      currentAttempts: currentAttempts + 1,
      recentFailures: isFailure ? recentFailures + 1 : 0,
    };
  } catch (error) {
    logger.error("Adaptive rate limit check failed:", error);
    // Allow request if rate limiting fails
    return { allowed: true, error: "Rate limit check failed" };
  }
};

/**
 * Check recent login attempts for IP/email combination
 * @param {String} email - User email
 * @param {String} ip - Client IP address
 * @returns {Number} Number of recent attempts
 */
const checkRecentLoginAttempts = async (email, ip) => {
  try {
    const redisClient = getRedisClient();
    const key = `login_attempts:${email}:${ip}`;
    const attempts = await redisClient.get(key);
    return parseInt(attempts) || 0;
  } catch (error) {
    logger.error("Error checking recent login attempts:", error);
    return 0;
  }
};

/**
 * Log failed login attempt
 * @param {String} email - User email
 * @param {String} ip - Client IP address
 */
const logFailedLoginAttempt = async (email, ip) => {
  try {
    const redisClient = getRedisClient();
    const key = `login_attempts:${email}:${ip}`;
    const ttl = 15 * 60; // 15 minutes

    await redisClient.multi().incr(key).expire(key, ttl).exec();
  } catch (error) {
    logger.error("Error logging failed login attempt:", error);
  }
};

/**
 * Clear login attempts for successful login
 * @param {String} email - User email
 * @param {String} ip - Client IP address
 */
const clearLoginAttempts = async (email, ip) => {
  try {
    const redisClient = getRedisClient();
    const key = `login_attempts:${email}:${ip}`;
    await redisClient.del(key);
  } catch (error) {
    logger.error("Error clearing login attempts:", error);
  }
};

/**
 * Increment failed attempts for user account lockout
 * @param {Object} user - User document
 */
const incrementFailedAttempts = async (user) => {
  try {
    const maxAttempts = 5;
    const lockTime = 30 * 60 * 1000; // 30 minutes

    // If account is currently locked and we're past the lock time
    if (user.lockUntil && user.lockUntil < Date.now()) {
      return user.updateOne({
        $unset: {
          loginAttempts: 1,
          lockUntil: 1,
        },
      });
    }

    const updates = {};

    // If first attempt or account not locked, increase attempts
    if (!user.loginAttempts) {
      updates.loginAttempts = 1;
    } else {
      updates.loginAttempts = user.loginAttempts + 1;
    }

    // Lock account if max attempts reached
    if (updates.loginAttempts >= maxAttempts && !user.lockUntil) {
      updates.lockUntil = Date.now() + lockTime;
      logger.warn(`Account locked for user: ${user.email}`, {
        userId: user._id,
        attempts: updates.loginAttempts,
        lockUntil: new Date(updates.lockUntil),
      });
    }

    await user.updateOne(updates);
  } catch (error) {
    logger.error("Error incrementing failed attempts:", error);
  }
};

/**
 * Log successful login for monitoring
 * @param {String} userId - User ID
 * @param {Object} loginInfo - Login information
 */
const logSuccessfulLogin = async (userId, loginInfo = {}) => {
  try {
    // Update user's last login time
    await User.findByIdAndUpdate(userId, {
      lastLogin: new Date(),
      $push: {
        loginHistory: {
          timestamp: new Date(),
          ip: loginInfo.ip,
          userAgent: loginInfo.userAgent,
          location: loginInfo.location,
        },
      },
    });

    logger.info(`Successful login for user: ${userId}`, {
      userId,
      ip: loginInfo.ip,
      userAgent: loginInfo.userAgent,
    });
  } catch (error) {
    logger.error("Error logging successful login:", error);
  }
};

/**
 * Check if IP address should be blocked
 * @param {String} ip - Client IP address
 * @returns {Boolean} Whether IP should be blocked
 */
const isIpBlocked = async (ip) => {
  try {
    const redisClient = getRedisClient();
    const blockedKey = `blocked_ip:${ip}`;
    const blocked = await redisClient.get(blockedKey);
    return !!blocked;
  } catch (error) {
    logger.error("Error checking blocked IP:", error);
    return false;
  }
};

/**
 * Block IP address temporarily
 * @param {String} ip - Client IP address
 * @param {Number} duration - Block duration in seconds
 * @param {String} reason - Reason for blocking
 */
const blockIp = async (ip, duration = 3600, reason = "Security violation") => {
  try {
    const redisClient = getRedisClient();
    const blockedKey = `blocked_ip:${ip}`;

    await redisClient.setex(
      blockedKey,
      duration,
      JSON.stringify({
        reason,
        blockedAt: new Date().toISOString(),
        duration,
      })
    );

    logger.warn(`IP blocked: ${ip}`, {
      ip,
      reason,
      duration,
    });
  } catch (error) {
    logger.error("Error blocking IP:", error);
  }
};

/**
 * Monitor suspicious activities and take action
 * @param {String} ip - Client IP address
 * @param {String} activity - Type of activity
 * @param {Object} metadata - Additional metadata
 */
const monitorSuspiciousActivity = async (ip, activity, metadata = {}) => {
  try {
    const redisClient = getRedisClient();
    const key = `suspicious:${ip}:${activity}`;
    const count = await redisClient.incr(key);
    await redisClient.expire(key, 3600); // 1 hour window

    // Define thresholds for different activities
    const thresholds = {
      failed_login: 10,
      invalid_token: 5,
      password_reset_spam: 3,
      registration_spam: 5,
    };

    const threshold = thresholds[activity] || 10;

    if (count >= threshold) {
      // Block IP for escalating suspicious activity
      const blockDuration = Math.min(
        3600 * Math.pow(2, Math.floor(count / threshold)),
        86400
      ); // Max 24 hours
      await blockIp(ip, blockDuration, `Suspicious activity: ${activity}`);

      logger.error(`Suspicious activity detected: ${activity}`, {
        ip,
        activity,
        count,
        threshold,
        blockDuration,
        metadata,
      });
    }
  } catch (error) {
    logger.error("Error monitoring suspicious activity:", error);
  }
};

/**
 * Clean up expired rate limit and security data
 */
const cleanupSecurityData = async () => {
  try {
    const redisClient = getRedisClient();

    // Get all keys that might need cleanup
    const patterns = [
      "login_attempts:*",
      "adaptive_rate:*",
      "failures:*",
      "suspicious:*",
      "blocked_ip:*",
    ];

    for (const pattern of patterns) {
      const keys = await redisClient.keys(pattern);

      // Check TTL for each key and remove expired ones
      for (const key of keys) {
        const ttl = await redisClient.ttl(key);
        if (ttl === -1) {
          // Key exists but has no TTL, set one
          await redisClient.expire(key, 3600);
        }
      }
    }

    logger.info("Security data cleanup completed");
  } catch (error) {
    logger.error("Error during security data cleanup:", error);
  }
};

module.exports = {
  checkAdaptiveRateLimit,
  checkRecentLoginAttempts,
  logFailedLoginAttempt,
  clearLoginAttempts,
  incrementFailedAttempts,
  logSuccessfulLogin,
  isIpBlocked,
  blockIp,
  monitorSuspiciousActivity,
  cleanupSecurityData,
  rateLimitConfig,
};
