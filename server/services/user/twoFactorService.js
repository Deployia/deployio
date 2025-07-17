const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const crypto = require("crypto");
const User = require("@models/User");
const logger = require("@config/logger");
const AuthActivityLogger = require("./authActivityLogger");
const AuthNotifications = require("./authNotifications");

/**
 * Two-Factor Authentication Service
 *
 * Responsibilities:
 * - 2FA secret generation
 * - TOTP verification
 * - Backup codes management
 * - 2FA enable/disable
 */

/**
 * Generate 2FA secret and QR code for user
 * @param {String} userId - User ID
 * @returns {Object} Secret and QR code data
 */
const generate2FASecret = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Deployio (${user.email})`,
      issuer: "Deployio",
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store temporary secret (not enabled yet)
    user.twoFactorTempSecret = secret.base32;
    await user.save();

    logger.info(`2FA secret generated for user: ${userId}`);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: [], // Will be generated when 2FA is enabled
    };
  } catch (error) {
    logger.error("Error generating 2FA secret:", error);
    throw error;
  }
};

/**
 * Enable 2FA for user after verifying setup
 * @param {String} userId - User ID
 * @param {String} token - TOTP token for verification
 * @returns {Object} Success message and backup codes
 */
const enable2FA = async (userId, token) => {
  try {
    const user = await User.findById(userId).select("+twoFactorTempSecret");
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.twoFactorTempSecret) {
      throw new Error("No 2FA setup in progress");
    }

    // Verify the provided token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: "base32",
      token: token,
      window: 2, // Allow some time drift
    });

    if (!verified) {
      throw new Error("Invalid 2FA token");
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = undefined;
    user.twoFactorBackupCodes = backupCodes.map((code) => ({
      code: crypto.createHash("sha256").update(code).digest("hex"),
      used: false,
      createdAt: new Date(),
    }));

    await user.save();

    // Log 2FA enablement
    try {
      await AuthActivityLogger.log2FAEnabled(userId);
    } catch (activityError) {
      logger.warn("Failed to log 2FA enablement activity", {
        error: activityError.message,
        userId,
      });
    }

    // Send 2FA enabled notification
    try {
      await AuthNotifications.send2FAEnabled(userId, {
        username: user.username,
        email: user.email,
      });
    } catch (notificationError) {
      logger.warn("Failed to send 2FA enabled notification", {
        error: notificationError.message,
        userId,
      });
    }

    logger.info(`2FA enabled for user: ${userId}`);

    return {
      message: "2FA enabled successfully",
      backupCodes: backupCodes, // Return plain text codes to user
    };
  } catch (error) {
    logger.error("Error enabling 2FA:", error);
    throw error;
  }
};

/**
 * Disable 2FA for user
 * @param {String} userId - User ID
 * @param {String} token - TOTP token or backup code for verification
 * @returns {String} Success message
 */
const disable2FA = async (userId, token) => {
  try {
    const user = await User.findById(userId).select(
      "+twoFactorSecret +twoFactorBackupCodes"
    );
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.twoFactorEnabled) {
      throw new Error("2FA is not enabled");
    }

    // Verify token (either TOTP or backup code)
    const isValidTotp = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 2,
    });

    const isValidBackupCode = await verifyBackupCode(user, token);

    if (!isValidTotp && !isValidBackupCode) {
      throw new Error("Invalid 2FA token or backup code");
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];

    await user.save();

    // Log 2FA disablement
    try {
      await AuthActivityLogger.log2FADisabled(userId);
    } catch (activityError) {
      logger.warn("Failed to log 2FA disablement activity", {
        error: activityError.message,
        userId,
      });
    }

    // Send 2FA disabled notification
    try {
      await AuthNotifications.send2FADisabled(userId, {
        username: user.username,
        email: user.email,
      });
    } catch (notificationError) {
      logger.warn("Failed to send 2FA disabled notification", {
        error: notificationError.message,
        userId,
      });
    }

    logger.info(`2FA disabled for user: ${userId}`);
    return "2FA disabled successfully";
  } catch (error) {
    logger.error("Error disabling 2FA:", error);
    throw error;
  }
};

/**
 * Verify 2FA token during login
 * @param {String} userId - User ID
 * @param {String} token - TOTP token or backup code
 * @returns {Object} Verification result and user data
 */
const verify2FALogin = async (userId, token, loginInfo = {}) => {
  try {
    const user = await User.findById(userId).select(
      "+twoFactorSecret +twoFactorBackupCodes"
    );
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.twoFactorEnabled) {
      throw new Error("2FA is not enabled for this user");
    }

    // Verify token (either TOTP or backup code)
    const isValidTotp = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 2,
    });

    let isValidBackupCode = false;
    if (!isValidTotp) {
      isValidBackupCode = await verifyBackupCode(user, token, true); // Mark as used
    }

    if (!isValidTotp && !isValidBackupCode) {
      // Log failed 2FA attempt
      try {
        await AuthActivityLogger.logFailed2FA(userId, {
          token: token.substring(0, 2) + "****",
        });
      } catch (activityError) {
        logger.warn("Failed to log failed 2FA attempt", {
          error: activityError.message,
          userId,
        });
      }

      throw new Error("Invalid 2FA token");
    }

    // Log successful 2FA verification
    try {
      await AuthActivityLogger.logSuccessful2FA(userId, {
        method: isValidBackupCode ? "backup_code" : "totp",
      });
    } catch (activityError) {
      logger.warn("Failed to log successful 2FA verification", {
        error: activityError.message,
        userId,
      });
    }

    // Generate login tokens
    const {
      generateToken,
      generateRefreshToken,
    } = require("./coreAuthService");
    const { storeRefreshToken } = require("./sessionService");

    const token_jwt = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token with login information
    await storeRefreshToken(user._id, refreshToken, loginInfo);

    logger.info(`2FA verification successful for user: ${userId}`);

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
      token: token_jwt,
      refreshToken,
    };
  } catch (error) {
    logger.error("Error verifying 2FA login:", error);
    throw error;
  }
};

/**
 * Get 2FA status for user
 * @param {String} userId - User ID
 * @returns {Object} 2FA status information
 */
const get2FAStatus = async (userId) => {
  try {
    const user = await User.findById(userId).select("twoFactorEnabled");
    if (!user) {
      throw new Error("User not found");
    }

    return {
      twoFactorEnabled: user.twoFactorEnabled || false,
      hasBackupCodes:
        user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0,
    };
  } catch (error) {
    logger.error("Error getting 2FA status:", error);
    throw error;
  }
};

/**
 * Generate new backup codes
 * @param {String} userId - User ID
 * @returns {Array} New backup codes
 */
const generateNewBackupCodes = async (userId) => {
  try {
    const user = await User.findById(userId).select("+twoFactorBackupCodes");
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.twoFactorEnabled) {
      throw new Error("2FA is not enabled");
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes();

    // Replace existing backup codes
    user.twoFactorBackupCodes = backupCodes.map((code) => ({
      code: crypto.createHash("sha256").update(code).digest("hex"),
      used: false,
      createdAt: new Date(),
    }));

    await user.save();

    // Log backup codes regeneration
    try {
      await AuthActivityLogger.logBackupCodesRegenerated(userId);
    } catch (activityError) {
      logger.warn("Failed to log backup codes regeneration", {
        error: activityError.message,
        userId,
      });
    }

    logger.info(`New backup codes generated for user: ${userId}`);

    return backupCodes;
  } catch (error) {
    logger.error("Error generating new backup codes:", error);
    throw error;
  }
};

/**
 * Helper function to generate backup codes
 * @returns {Array} Array of backup codes
 */
const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
};

/**
 * Helper function to verify backup code
 * @param {Object} user - User object
 * @param {String} code - Backup code to verify
 * @param {Boolean} markAsUsed - Whether to mark the code as used
 * @returns {Boolean} Whether code is valid
 */
const verifyBackupCode = async (user, code, markAsUsed = false) => {
  try {
    const hashedCode = crypto
      .createHash("sha256")
      .update(code.toUpperCase())
      .digest("hex");

    const backupCodeEntry = user.twoFactorBackupCodes.find(
      (entry) => entry.code === hashedCode && !entry.used
    );

    if (!backupCodeEntry) {
      return false;
    }

    if (markAsUsed) {
      backupCodeEntry.used = true;
      backupCodeEntry.usedAt = new Date();
      await user.save();
    }

    return true;
  } catch (error) {
    logger.error("Error verifying backup code:", error);
    return false;
  }
};

/**
 * Complete 2FA login process (used after OAuth + 2FA)
 * @param {String} userId - User ID
 * @param {Object} loginInfo - Login information
 * @returns {Object} User and tokens
 */
const complete2FALogin = async (userId, loginInfo = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate tokens
    const {
      generateToken,
      generateRefreshToken,
    } = require("./coreAuthService");
    const { storeRefreshToken } = require("./sessionService");

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token with login information
    await storeRefreshToken(user._id, refreshToken, loginInfo);

    // Log successful login
    const { logSuccessfulLogin } = require("./securityService");
    await logSuccessfulLogin(user._id, loginInfo);

    logger.info(`2FA login completed for user: ${userId}`);

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
      token,
      refreshToken,
    };
  } catch (error) {
    logger.error("Error completing 2FA login:", error);
    throw error;
  }
};

module.exports = {
  generate2FASecret,
  enable2FA,
  disable2FA,
  verify2FALogin,
  get2FAStatus,
  generateNewBackupCodes,
  complete2FALogin,
  generateBackupCodes,
  verifyBackupCode,
};
