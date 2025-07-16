const userService = require("./userService");
const logger = require("../../config/logger");

/**
 * Authentication Activity Logger
 * Handles all auth-related activity logging for audit trail
 */
class AuthActivityLogger {
  /**
   * Log successful login activity
   * @param {string} userId - User ID
   * @param {object} loginInfo - Login information (IP, userAgent, etc.)
   * @param {string} method - Login method (email, oauth, etc.)
   */
  static async logLogin(userId, loginInfo, method = "email") {
    try {
      await userService.logUserActivity(userId, {
        action: "user.login",
        type: "auth",
        details: {
          method,
          ip: loginInfo.ip,
          userAgent: loginInfo.userAgent,
          location: loginInfo.location,
          deviceFingerprint: loginInfo.deviceFingerprint,
        },
        ip: loginInfo.ip,
        userAgent: loginInfo.userAgent,
      });
    } catch (error) {
      logger.warn("Failed to log login activity", {
        error: error.message,
        userId,
        method,
      });
    }
  }

  /**
   * Log logout activity
   * @param {string} userId - User ID
   * @param {object} logoutInfo - Logout information
   */
  static async logLogout(userId, logoutInfo = {}) {
    try {
      await userService.logUserActivity(userId, {
        action: "user.logout",
        type: "auth",
        details: {
          ip: logoutInfo.ip,
          userAgent: logoutInfo.userAgent,
          deviceFingerprint: logoutInfo.deviceFingerprint,
        },
        ip: logoutInfo.ip,
        userAgent: logoutInfo.userAgent,
      });
    } catch (error) {
      logger.warn("Failed to log logout activity", {
        error: error.message,
        userId,
      });
    }
  }

  /**
   * Log registration activity
   * @param {string} userId - User ID
   * @param {object} registrationInfo - Registration information
   */
  static async logRegistration(userId, registrationInfo) {
    try {
      await userService.logUserActivity(userId, {
        action: "user.registration",
        type: "auth",
        details: {
          email: registrationInfo.email,
          username: registrationInfo.username,
          ip: registrationInfo.ip,
          userAgent: registrationInfo.userAgent,
        },
        ip: registrationInfo.ip,
        userAgent: registrationInfo.userAgent,
      });
    } catch (error) {
      logger.warn("Failed to log registration activity", {
        error: error.message,
        userId,
      });
    }
  }

  /**
   * Log email verification activity
   * @param {string} userId - User ID
   * @param {object} verificationInfo - Verification information
   */
  static async logEmailVerification(userId, verificationInfo) {
    try {
      await userService.logUserActivity(userId, {
        action: "user.email_verified",
        type: "auth",
        details: {
          email: verificationInfo.email,
          ip: verificationInfo.ip,
          userAgent: verificationInfo.userAgent,
        },
        ip: verificationInfo.ip,
        userAgent: verificationInfo.userAgent,
      });
    } catch (error) {
      logger.warn("Failed to log email verification activity", {
        error: error.message,
        userId,
      });
    }
  }

  /**
   * Log password reset request activity
   * @param {string} userId - User ID
   * @param {object} resetInfo - Password reset information
   */
  static async logPasswordResetRequest(userId, resetInfo) {
    try {
      await userService.logUserActivity(userId, {
        action: "security.password_reset_requested",
        type: "security",
        details: {
          email: resetInfo.email,
          ip: resetInfo.ip,
          userAgent: resetInfo.userAgent,
        },
        ip: resetInfo.ip,
        userAgent: resetInfo.userAgent,
      });
    } catch (error) {
      logger.warn("Failed to log password reset request activity", {
        error: error.message,
        userId,
      });
    }
  }

  /**
   * Log password reset completion activity
   * @param {string} userId - User ID
   * @param {object} resetInfo - Password reset information
   */
  static async logPasswordResetComplete(userId, resetInfo) {
    try {
      await userService.logUserActivity(userId, {
        action: "security.password_changed",
        type: "security",
        details: {
          method: "reset_token",
          ip: resetInfo.ip,
          userAgent: resetInfo.userAgent,
        },
        ip: resetInfo.ip,
        userAgent: resetInfo.userAgent,
      });
    } catch (error) {
      logger.warn("Failed to log password reset completion activity", {
        error: error.message,
        userId,
      });
    }
  }

  /**
   * Log failed login attempt
   * @param {string} email - Email attempted
   * @param {object} attemptInfo - Login attempt information
   * @param {string} reason - Reason for failure
   */
  static async logFailedLogin(
    email,
    attemptInfo,
    reason = "invalid_credentials"
  ) {
    try {
      // Since we don't have the user ID for failed logins, we'll skip this for now
      // Failed login attempts are typically logged separately for security analysis
      logger.info("Failed login attempt", {
        email,
        reason,
        ip: attemptInfo.ip,
        userAgent: attemptInfo.userAgent,
      });
    } catch (error) {
      logger.warn("Failed to log failed login activity", {
        error: error.message,
        email,
        reason,
      });
    }
  }

  /**
   * Log 2FA activity
   * @param {string} userId - User ID
   * @param {object} twoFAInfo - 2FA information
   * @param {boolean} enabled - Whether 2FA was enabled or disabled
   */
  static async log2FAChange(userId, twoFAInfo, enabled) {
    try {
      await userService.logUserActivity(userId, {
        action: enabled ? "security.2fa_enabled" : "security.2fa_disabled",
        type: "security",
        details: {
          enabled,
          ip: twoFAInfo.ip,
          userAgent: twoFAInfo.userAgent,
        },
        ip: twoFAInfo.ip,
        userAgent: twoFAInfo.userAgent,
      });
    } catch (error) {
      logger.warn("Failed to log 2FA change activity", {
        error: error.message,
        userId,
        enabled,
      });
    }
  }

  /**
   * Log session termination activity
   * @param {string} userId - User ID
   * @param {object} sessionInfo - Session information
   */
  static async logSessionTermination(userId, sessionInfo) {
    try {
      await userService.logUserActivity(userId, {
        action: "security.session_terminated",
        type: "security",
        details: {
          sessionId: sessionInfo.sessionId,
          ip: sessionInfo.ip,
          userAgent: sessionInfo.userAgent,
          terminatedBy: sessionInfo.terminatedBy || "user",
        },
        ip: sessionInfo.ip,
        userAgent: sessionInfo.userAgent,
      });
    } catch (error) {
      logger.warn("Failed to log session termination activity", {
        error: error.message,
        userId,
      });
    }
  }
}

module.exports = AuthActivityLogger;
