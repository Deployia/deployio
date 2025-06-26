const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../config/logger");

/**
 * Debug utility to check refresh token status for a user
 * @param {string} userId - User ID to check
 * @param {string} refreshToken - Refresh token to validate
 */
async function debugRefreshToken(userId, refreshToken = null) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      logger.error(`User not found: ${userId}`);
      return;
    }

    logger.info(`Debug info for user ${userId}:`);
    logger.info(`- Total refresh tokens: ${user.refreshTokens.length}`);

    const now = new Date();
    user.refreshTokens.forEach((tokenObj, index) => {
      const isExpired = new Date(tokenObj.expiresAt) <= now;
      const isActive = tokenObj.isActive !== false;

      logger.info(`Token ${index + 1}:`);
      logger.info(`  - Created: ${tokenObj.createdAt}`);
      logger.info(`  - Expires: ${tokenObj.expiresAt}`);
      logger.info(`  - Is Expired: ${isExpired}`);
      logger.info(`  - Is Active: ${isActive}`);
      logger.info(
        `  - Time remaining: ${
          !isExpired
            ? Math.floor((new Date(tokenObj.expiresAt) - now) / (1000 * 60)) +
              " minutes"
            : "EXPIRED"
        }`
      );

      if (refreshToken && tokenObj.token === refreshToken) {
        logger.info(`  - MATCHES PROVIDED TOKEN ✓`);

        try {
          const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
          );
          logger.info(`  - JWT Valid: ✓`);
          logger.info(`  - JWT Payload:`, decoded);
        } catch (jwtError) {
          logger.error(`  - JWT Invalid: ${jwtError.message}`);
        }
      }
      logger.info("  ---");
    });

    // Check for overall issues
    const validTokens = user.refreshTokens.filter(
      (tokenObj) =>
        new Date(tokenObj.expiresAt) > now && tokenObj.isActive !== false
    );

    logger.info(
      `Valid tokens: ${validTokens.length}/${user.refreshTokens.length}`
    );

    if (
      refreshToken &&
      !user.refreshTokens.some((tokenObj) => tokenObj.token === refreshToken)
    ) {
      logger.warn("PROVIDED REFRESH TOKEN NOT FOUND IN DATABASE");
    }
  } catch (error) {
    logger.error("Debug refresh token error:", error);
  }
}

/**
 * Clean up expired refresh tokens for a user
 * @param {string} userId - User ID
 */
async function cleanupExpiredTokens(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      logger.error(`User not found: ${userId}`);
      return;
    }

    const now = new Date();
    const initialCount = user.refreshTokens.length;
    const validTokens = user.refreshTokens.filter(
      (tokenObj) =>
        new Date(tokenObj.expiresAt) > now && tokenObj.isActive !== false
    );

    if (validTokens.length !== initialCount) {
      await User.findByIdAndUpdate(userId, {
        $set: { refreshTokens: validTokens },
      });

      logger.info(
        `Cleaned up ${
          initialCount - validTokens.length
        } expired tokens for user ${userId}`
      );
      logger.info(`Remaining valid tokens: ${validTokens.length}`);
    } else {
      logger.info(`No expired tokens found for user ${userId}`);
    }
  } catch (error) {
    logger.error("Cleanup expired tokens error:", error);
  }
}

module.exports = {
  debugRefreshToken,
  cleanupExpiredTokens,
};
