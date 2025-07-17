const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { getRedisClient } = require("@config/redisClient");
const logger = require("@config/logger");
const User = require("@models/User");

/**
 * Session Service - Handles session and token management
 *
 * Responsibilities:
 * - Refresh token rotation
 * - Session management
 * - Active sessions tracking
 * - Session revocation
 */

/**
 * Store refresh token in Redis with user association
 * @param {String} userId - User ID
 * @param {String} refreshToken - Refresh token to store
 * @returns {Promise} Promise that resolves when token is stored
 */
const storeRefreshToken = async (userId, refreshToken) => {
  try {
    const redisClient = getRedisClient();
    const tokenKey = `refresh_token:${userId}:${refreshToken}`;
    const userTokensKey = `user_tokens:${userId}`;

    // Store token with expiration (24 hours)
    const expirationTime = 24 * 60 * 60; // 24 hours in seconds

    await redisClient
      .multi()
      .setex(
        tokenKey,
        expirationTime,
        JSON.stringify({
          userId,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
        })
      )
      .sadd(userTokensKey, refreshToken)
      .expire(userTokensKey, expirationTime)
      .exec();

    logger.debug(`Refresh token stored for user: ${userId}`);
  } catch (error) {
    logger.error("Error storing refresh token:", error);
    throw error;
  }
};

/**
 * Verify and rotate refresh token
 * @param {String} refreshToken - Current refresh token
 * @returns {Object} New tokens and user data
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (decoded.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    const redisClient = getRedisClient();
    const tokenKey = `refresh_token:${decoded.id}:${refreshToken}`;

    // Check if token exists in Redis
    const tokenData = await redisClient.get(tokenKey);
    if (!tokenData) {
      throw new Error("Refresh token not found or expired");
    }

    // Get user data
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate new tokens
    const {
      generateToken,
      generateRefreshToken,
    } = require("./coreAuthService");
    const newAccessToken = generateToken(user, decoded.sessionId);
    const newRefreshToken = generateRefreshToken(
      user,
      decoded.sessionId,
      decoded.family
    );

    // Remove old refresh token
    await redisClient.del(tokenKey);

    // Store new refresh token
    await storeRefreshToken(user._id, newRefreshToken);

    // Update last used timestamp
    await redisClient.setex(
      `refresh_token:${user._id}:${newRefreshToken}`,
      24 * 60 * 60,
      JSON.stringify({
        userId: user._id,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      })
    );

    logger.info(`Token refreshed for user: ${user._id}`);

    return {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        role: user.role,
      },
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    logger.error("Token refresh error:", error);
    throw new Error("Invalid or expired refresh token");
  }
};

/**
 * Get all active sessions for a user
 * @param {String} userId - User ID
 * @returns {Array} Array of active sessions
 */
const getActiveSessions = async (userId) => {
  try {
    const redisClient = getRedisClient();
    const userTokensKey = `user_tokens:${userId}`;

    // Get all refresh tokens for the user
    const refreshTokens = await redisClient.smembers(userTokensKey);

    const sessions = [];

    for (const token of refreshTokens) {
      const tokenKey = `refresh_token:${userId}:${token}`;
      const tokenDataStr = await redisClient.get(tokenKey);

      if (tokenDataStr) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
          const tokenData = JSON.parse(tokenDataStr);

          sessions.push({
            id: decoded.sessionId || crypto.randomUUID(),
            createdAt: tokenData.createdAt,
            lastUsed: tokenData.lastUsed,
            family: decoded.family,
            isCurrentSession: false, // This would need to be determined by the caller
          });
        } catch (jwtError) {
          // Token is invalid, remove it
          await redisClient.del(tokenKey);
          await redisClient.srem(userTokensKey, token);
        }
      }
    }

    return sessions;
  } catch (error) {
    logger.error("Error getting active sessions:", error);
    return [];
  }
};

/**
 * Revoke a specific session
 * @param {String} userId - User ID
 * @param {String} sessionId - Session ID to revoke
 * @returns {String} Success message
 */
const revokeSession = async (userId, sessionId) => {
  try {
    const redisClient = getRedisClient();
    const userTokensKey = `user_tokens:${userId}`;

    // Get all refresh tokens for the user
    const refreshTokens = await redisClient.smembers(userTokensKey);

    let sessionFound = false;

    for (const token of refreshTokens) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        if (decoded.sessionId === sessionId || decoded.family === sessionId) {
          // Remove the token
          const tokenKey = `refresh_token:${userId}:${token}`;
          await redisClient.del(tokenKey);
          await redisClient.srem(userTokensKey, token);
          sessionFound = true;
          logger.info(`Session revoked: ${sessionId} for user: ${userId}`);
        }
      } catch (jwtError) {
        // Token is invalid, remove it anyway
        const tokenKey = `refresh_token:${userId}:${token}`;
        await redisClient.del(tokenKey);
        await redisClient.srem(userTokensKey, token);
      }
    }

    if (!sessionFound) {
      throw new Error("Session not found");
    }

    return "Session revoked successfully";
  } catch (error) {
    logger.error("Error revoking session:", error);
    throw error;
  }
};

/**
 * Revoke all sessions except current one
 * @param {String} userId - User ID
 * @param {String} currentSessionId - Current session ID to keep
 * @returns {String} Success message
 */
const revokeAllOtherSessions = async (userId, currentSessionId = null) => {
  try {
    const redisClient = getRedisClient();
    const userTokensKey = `user_tokens:${userId}`;

    // Get all refresh tokens for the user
    const refreshTokens = await redisClient.smembers(userTokensKey);

    let revokedCount = 0;

    for (const token of refreshTokens) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        // Skip current session if specified
        if (
          currentSessionId &&
          (decoded.sessionId === currentSessionId ||
            decoded.family === currentSessionId)
        ) {
          continue;
        }

        // Remove the token
        const tokenKey = `refresh_token:${userId}:${token}`;
        await redisClient.del(tokenKey);
        await redisClient.srem(userTokensKey, token);
        revokedCount++;
      } catch (jwtError) {
        // Token is invalid, remove it anyway
        const tokenKey = `refresh_token:${userId}:${token}`;
        await redisClient.del(tokenKey);
        await redisClient.srem(userTokensKey, token);
        revokedCount++;
      }
    }

    logger.info(`Revoked ${revokedCount} sessions for user: ${userId}`);
    return `${revokedCount} sessions revoked successfully`;
  } catch (error) {
    logger.error("Error revoking all other sessions:", error);
    throw error;
  }
};

/**
 * Logout user - revoke current session
 * @param {String} userId - User ID
 * @param {String} refreshToken - Current refresh token
 * @returns {String} Success message
 */
const logoutUser = async (userId, refreshToken = null) => {
  try {
    const redisClient = getRedisClient();

    if (refreshToken) {
      // Remove specific refresh token
      const tokenKey = `refresh_token:${userId}:${refreshToken}`;
      const userTokensKey = `user_tokens:${userId}`;

      await redisClient.del(tokenKey);
      await redisClient.srem(userTokensKey, refreshToken);

      logger.info(`User logged out: ${userId}`);
      return "Logged out successfully";
    } else {
      // Remove all sessions for the user
      return await revokeAllOtherSessions(userId);
    }
  } catch (error) {
    logger.error("Logout error:", error);
    throw error;
  }
};

/**
 * Clean up expired tokens and sessions
 */
const cleanupExpiredSessions = async () => {
  try {
    const redisClient = getRedisClient();

    // Get all user token keys
    const userTokenKeys = await redisClient.keys("user_tokens:*");

    for (const userTokenKey of userTokenKeys) {
      const userId = userTokenKey.split(":")[1];
      const refreshTokens = await redisClient.smembers(userTokenKey);

      for (const token of refreshTokens) {
        const tokenKey = `refresh_token:${userId}:${token}`;
        const exists = await redisClient.exists(tokenKey);

        if (!exists) {
          // Token doesn't exist, remove from user's token set
          await redisClient.srem(userTokenKey, token);
        }
      }

      // If no tokens left, remove the user token key
      const remainingTokens = await redisClient.scard(userTokenKey);
      if (remainingTokens === 0) {
        await redisClient.del(userTokenKey);
      }
    }

    logger.info("Session cleanup completed");
  } catch (error) {
    logger.error("Error during session cleanup:", error);
  }
};

/**
 * Get session statistics for monitoring
 * @returns {Object} Session statistics
 */
const getSessionStats = async () => {
  try {
    const redisClient = getRedisClient();

    const userTokenKeys = await redisClient.keys("user_tokens:*");
    const totalUsers = userTokenKeys.length;

    let totalSessions = 0;
    for (const userTokenKey of userTokenKeys) {
      const sessionCount = await redisClient.scard(userTokenKey);
      totalSessions += sessionCount;
    }

    return {
      totalActiveUsers: totalUsers,
      totalActiveSessions: totalSessions,
      averageSessionsPerUser:
        totalUsers > 0 ? (totalSessions / totalUsers).toFixed(2) : 0,
    };
  } catch (error) {
    logger.error("Error getting session stats:", error);
    return {
      totalActiveUsers: 0,
      totalActiveSessions: 0,
      averageSessionsPerUser: 0,
    };
  }
};

module.exports = {
  storeRefreshToken,
  refreshAccessToken,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  logoutUser,
  cleanupExpiredSessions,
  getSessionStats,
};
