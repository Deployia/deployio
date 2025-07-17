/**
 * Security Monitoring and Admin Routes
 * Provides endpoints for security monitoring, metrics, and administrative functions
 */

const express = require("express");
const { protect, requireRole } = require("@middleware/authMiddleware");
const { getRedisClient } = require("@config/redisClient");
const User = require("@models/User");
const logger = require("@config/logger");
const { getRateLimitStatus } = require("@middleware/adaptiveRateLimit");

const router = express.Router();

/**
 * @desc Get security dashboard metrics
 * @route GET /api/admin/security/dashboard
 * @access Admin only
 */
router.get("/dashboard", protect, requireRole(["admin"]), async (req, res) => {
  try {
    const redisClient = getRedisClient();
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get user statistics
    const userStats = await getUserSecurityStats(last24Hours, last7Days);

    // Get authentication metrics
    const authMetrics = await getAuthenticationMetrics(
      redisClient,
      last24Hours
    );

    // Get rate limiting metrics
    const rateLimitMetrics = await getRateLimitingMetrics(redisClient);

    // Get suspicious activity
    const suspiciousActivity = await getSuspiciousActivity(redisClient);

    // Get system health
    const systemHealth = await getSystemHealth();

    res.json({
      success: true,
      data: {
        userStats,
        authMetrics,
        rateLimitMetrics,
        suspiciousActivity,
        systemHealth,
        generatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    logger.error("Security dashboard error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate security dashboard",
    });
  }
});

/**
 * @desc Get failed login attempts
 * @route GET /api/admin/security/failed-logins
 * @access Admin only
 */
router.get(
  "/failed-logins",
  protect,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, timeframe = "24h" } = req.query;

      let startTime;
      switch (timeframe) {
        case "1h":
          startTime = new Date(Date.now() - 60 * 60 * 1000);
          break;
        case "24h":
          startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      }

      const failedLogins = await getFailedLoginAttempts(startTime, page, limit);

      res.json({
        success: true,
        data: failedLogins,
      });
    } catch (error) {
      logger.error("Failed logins query error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get failed login attempts",
      });
    }
  }
);

/**
 * @desc Get rate limit status for IP
 * @route GET /api/admin/security/rate-limit/:ip
 * @access Admin only
 */
router.get(
  "/rate-limit/:ip",
  protect,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { ip } = req.params;
      const { endpoint } = req.query;

      if (!ip) {
        return res.status(400).json({
          success: false,
          error: "IP address required",
        });
      }

      const rateLimitStatus = await getRateLimitStatus(
        ip,
        endpoint || "/api/auth/login"
      );

      res.json({
        success: true,
        data: rateLimitStatus,
      });
    } catch (error) {
      logger.error("Rate limit status error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get rate limit status",
      });
    }
  }
);

/**
 * @desc Clear rate limits for IP
 * @route DELETE /api/admin/security/rate-limit/:ip
 * @access Admin only
 */
router.delete(
  "/rate-limit/:ip",
  protect,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { ip } = req.params;
      const { endpoint } = req.query;

      if (!ip) {
        return res.status(400).json({
          success: false,
          error: "IP address required",
        });
      }

      await clearRateLimitsForIP(ip, endpoint);

      logger.info(
        `Rate limits cleared for IP ${ip} by admin ${req.user.email}`
      );

      res.json({
        success: true,
        message: `Rate limits cleared for IP ${ip}`,
      });
    } catch (error) {
      logger.error("Clear rate limits error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear rate limits",
      });
    }
  }
);

/**
 * @desc Get user sessions and security info
 * @route GET /api/admin/security/users/:userId/sessions
 * @access Admin only
 */
router.get(
  "/users/:userId/sessions",
  protect,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId).select(
        "email username sessions refreshTokens twoFactorEnabled lastLogin loginAttempts lockUntil"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Get additional security metrics for user
      const userSecurityInfo = await getUserSecurityInfo(userId);

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            twoFactorEnabled: user.twoFactorEnabled,
            lastLogin: user.lastLogin,
            loginAttempts: user.loginAttempts,
            lockUntil: user.lockUntil,
            sessionCount: user.sessions?.length || 0,
            refreshTokenCount: user.refreshTokens?.length || 0,
          },
          sessions: user.sessions || [],
          refreshTokens:
            user.refreshTokens?.map((token) => ({
              createdAt: token.createdAt,
              expiresAt: token.expiresAt,
              family: token.family,
              isActive: token.isActive,
            })) || [],
          securityInfo: userSecurityInfo,
        },
      });
    } catch (error) {
      logger.error("User sessions query error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get user sessions",
      });
    }
  }
);

// Helper functions

async function getUserSecurityStats(last24Hours, last7Days) {
  try {
    const stats = await User.aggregate([
      {
        $facet: {
          totalUsers: [{ $count: "count" }],
          newUsers24h: [
            { $match: { createdAt: { $gte: last24Hours } } },
            { $count: "count" },
          ],
          newUsers7d: [
            { $match: { createdAt: { $gte: last7Days } } },
            { $count: "count" },
          ],
          activeUsers24h: [
            { $match: { lastLogin: { $gte: last24Hours } } },
            { $count: "count" },
          ],
          twoFactorEnabled: [
            { $match: { twoFactorEnabled: true } },
            { $count: "count" },
          ],
          lockedAccounts: [
            { $match: { lockUntil: { $gt: new Date() } } },
            { $count: "count" },
          ],
        },
      },
    ]);

    return {
      totalUsers: stats[0].totalUsers[0]?.count || 0,
      newUsers24h: stats[0].newUsers24h[0]?.count || 0,
      newUsers7d: stats[0].newUsers7d[0]?.count || 0,
      activeUsers24h: stats[0].activeUsers24h[0]?.count || 0,
      twoFactorEnabled: stats[0].twoFactorEnabled[0]?.count || 0,
      lockedAccounts: stats[0].lockedAccounts[0]?.count || 0,
    };
  } catch (error) {
    logger.error("User security stats error:", error);
    return {};
  }
}

async function getAuthenticationMetrics(redisClient, since) {
  try {
    if (!redisClient || !redisClient.isReady) {
      return { available: false };
    }

    // Get metrics from Redis patterns
    const keys = await redisClient.keys("auth_metrics:*");
    const failureKeys = await redisClient.keys("failures:*");
    const suspiciousKeys = await redisClient.keys("suspicious:*");

    return {
      available: true,
      totalAttempts: keys.length,
      failedAttempts: failureKeys.length,
      suspiciousIPs: suspiciousKeys.length,
      successRate:
        keys.length > 0
          ? (((keys.length - failureKeys.length) / keys.length) * 100).toFixed(
              2
            )
          : 0,
    };
  } catch (error) {
    logger.error("Authentication metrics error:", error);
    return { available: false };
  }
}

async function getRateLimitingMetrics(redisClient) {
  try {
    if (!redisClient || !redisClient.isReady) {
      return { available: false };
    }

    const rateLimitKeys = await redisClient.keys("rate:*");
    const adaptiveKeys = await redisClient.keys("adaptive_rate:*");

    return {
      available: true,
      activeRateLimits: rateLimitKeys.length,
      adaptiveRateLimits: adaptiveKeys.length,
    };
  } catch (error) {
    logger.error("Rate limiting metrics error:", error);
    return { available: false };
  }
}

async function getSuspiciousActivity(redisClient) {
  try {
    if (!redisClient || !redisClient.isReady) {
      return { available: false };
    }

    const suspiciousKeys = await redisClient.keys("suspicious:*");
    const suspiciousIPs = [];

    for (const key of suspiciousKeys.slice(0, 20)) {
      // Limit to 20 most recent
      const ip = key.replace("suspicious:", "");
      const ttl = await redisClient.ttl(key);
      suspiciousIPs.push({
        ip,
        expiresIn: ttl > 0 ? ttl : 0,
      });
    }

    return {
      available: true,
      suspiciousIPs,
      count: suspiciousKeys.length,
    };
  } catch (error) {
    logger.error("Suspicious activity error:", error);
    return { available: false };
  }
}

async function getSystemHealth() {
  try {
    const redisClient = getRedisClient();

    return {
      redis: {
        connected: redisClient && redisClient.isReady,
        status: redisClient?.status || "unknown",
      },
      database: {
        connected: true, // MongoDB connection is assumed working if we get here
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("System health check error:", error);
    return { available: false };
  }
}

async function getFailedLoginAttempts(since, page, limit) {
  // This would typically come from a dedicated logging collection
  // For now, return a placeholder structure
  return {
    attempts: [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 0,
      pages: 0,
    },
  };
}

async function getUserSecurityInfo(userId) {
  try {
    const redisClient = getRedisClient();

    if (!redisClient || !redisClient.isReady) {
      return { available: false };
    }

    // Get user-specific security metrics
    const userKeys = await redisClient.keys(`*${userId}*`);

    return {
      available: true,
      activeTokens: userKeys.filter((key) => key.includes("refresh_token"))
        .length,
      recentActivity: userKeys.length,
    };
  } catch (error) {
    logger.error("User security info error:", error);
    return { available: false };
  }
}

async function clearRateLimitsForIP(ip, endpoint) {
  try {
    const redisClient = getRedisClient();

    if (!redisClient || !redisClient.isReady) {
      throw new Error("Redis not available");
    }

    const pattern = endpoint ? `*${ip}*${endpoint}*` : `*${ip}*`;
    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await redisClient.del(keys);
    }

    return keys.length;
  } catch (error) {
    logger.error("Clear rate limits error:", error);
    throw error;
  }
}

module.exports = router;
