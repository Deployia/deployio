const notificationService = require("../notification/notificationService");
const logger = require("../../config/logger");

/**
 * Authentication-specific notification helpers
 * These replace the external email service calls in authService
 */

class AuthNotifications {
  /**
   * Send OTP verification email
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   * @param {string} otp - OTP code
   * @param {boolean} isResend - Whether this is a resend
   */
  static async sendOTPVerification(userId, userData, otp, isResend = false) {
    try {
      const { username, email } = userData;

      return await notificationService.createNotification({
        userId,
        type: "auth.otp_verification",
        title: isResend
          ? "Your DeployIO OTP (Resend)"
          : "Verify your DeployIO account",
        message: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
        priority: "high",
        channels: ["email"], // Only email for OTP
        context: {
          data: {
            otp,
            username,
            email,
            isResend,
            expiresIn: "10 minutes",
            actionUrl: `${
              process.env.FRONTEND_URL || "https://deployio.tech"
            }/auth/verify`,
          },
        },
        action: {
          label: "Verify Account",
          url: `${
            process.env.FRONTEND_URL || "https://deployio.tech"
          }/auth/verify`,
          type: "button",
        },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });
    } catch (error) {
      logger.error("Failed to send OTP verification notification", {
        userId,
        email: userData.email,
        isResend,
        error: error.message,
      });
      throw new Error(
        "Unable to send verification email. Please try again later."
      );
    }
  }

  /**
   * Send password reset email
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   * @param {string} resetToken - Reset token
   * @param {string} resetUrl - Reset URL
   */
  static async sendPasswordReset(userId, userData, resetToken, resetUrl) {
    try {
      const { username, email } = userData;
      const resetLink = `${resetUrl}/auth/reset-password/${resetToken}`;

      return await notificationService.createNotification({
        userId,
        type: "auth.password_reset",
        title: "Password Reset Request",
        message:
          "You requested a password reset for your DeployIO account. Click the link below to reset your password.",
        priority: "high",
        channels: ["email"], // Only email for password reset
        context: {
          data: {
            username,
            email,
            resetToken,
            resetLink,
            expiresIn: "30 minutes",
          },
        },
        action: {
          label: "Reset Password",
          url: resetLink,
          type: "button",
        },
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      });
    } catch (error) {
      logger.error("Failed to send password reset notification", {
        userId,
        email: userData.email,
        error: error.message,
      });
      throw new Error(
        "Unable to send password reset email. Please try again later."
      );
    }
  }

  /**
   * Send welcome notification to new users
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   */
  static async sendWelcome(userId, userData) {
    try {
      const { username, email } = userData;

      return await notificationService.createNotification({
        userId,
        type: "auth.welcome",
        title: "Welcome to DeployIO!",
        message: `Welcome ${username}! We're excited to have you on board. Get started by creating your first project.`,
        priority: "normal",
        channels: ["email", "in_app"], // Both email and in-app
        context: {
          data: {
            username,
            email,
            isNewUser: true,
          },
        },
        action: {
          label: "Get Started",
          url: `${
            process.env.FRONTEND_URL || "https://deployio.tech"
          }/dashboard`,
          type: "button",
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
    } catch (error) {
      logger.error("Failed to send welcome notification", {
        userId,
        email: userData.email,
        error: error.message,
      });
      // Don't throw error for welcome email - it's not critical
    }
  }

  /**
   * Send account verification success notification
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   */
  static async sendVerificationSuccess(userId, userData) {
    try {
      const { username, email } = userData;

      return await notificationService.createNotification({
        userId,
        type: "auth.verification_success",
        title: "Account Verified Successfully!",
        message: `Congratulations ${username}! Your account has been verified. You can now access all DeployIO features.`,
        priority: "normal",
        channels: ["in_app"], // In-app only - they just verified via email
        context: {
          data: {
            username,
            email,
            verifiedAt: new Date(),
          },
        },
        action: {
          label: "Go to Dashboard",
          url: `${
            process.env.FRONTEND_URL || "https://deployio.tech"
          }/dashboard`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send verification success notification", {
        userId,
        email: userData.email,
        error: error.message,
      });
      // Don't throw error - verification was successful
    }
  }

  /**
   * Send password change confirmation
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   */
  static async sendPasswordChangeConfirmation(userId, userData) {
    try {
      const { username, email } = userData;

      return await notificationService.createNotification({
        userId,
        type: "security.password_changed",
        title: "Password Changed Successfully",
        message:
          "Your password has been changed successfully. If you didn't make this change, please contact support immediately.",
        priority: "high",
        channels: ["email", "in_app"], // Both channels for security
        context: {
          data: {
            username,
            email,
            changedAt: new Date(),
            ipAddress: userData.ipAddress || "Unknown",
            userAgent: userData.userAgent || "Unknown",
          },
        },
        action: {
          label: "Security Settings",
          url: `${
            process.env.FRONTEND_URL || "https://deployio.tech"
          }/dashboard/profile?tab=security&section=security-password`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send password change confirmation", {
        userId,
        email: userData.email,
        error: error.message,
      });
      // Don't throw error - password change was successful
    }
  }

  /**
   * Send new device login alert
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   * @param {Object} deviceInfo - Device information
   */
  static async sendNewDeviceLogin(userId, userData, deviceInfo) {
    try {
      const { username, email } = userData;
      const { ipAddress, userAgent, location, loginTime } = deviceInfo;

      return await notificationService.createNotification({
        userId,
        type: "security.login_new_device",
        title: "New Device Login Detected",
        message:
          "We detected a login from a new device. If this wasn't you, please secure your account immediately.",
        priority: "high",
        channels: ["email", "in_app"], // Both channels for security
        context: {
          data: {
            username,
            email,
            device: userAgent || "Unknown device",
            location: location || "Unknown location",
            ipAddress: ipAddress || "Unknown IP",
            loginTime: loginTime || new Date(),
          },
        },
        action: {
          label: "Review Security Settings",
          url: `${
            process.env.FRONTEND_URL || "https://deployio.tech"
          }/dashboard/profile?tab=security`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send new device login notification", {
        userId,
        email: userData.email,
        error: error.message,
      });
      // Don't throw error - login was successful
    }
  }

  /**
   * Send 2FA setup notification
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   * @param {boolean} enabled - Whether 2FA was enabled or disabled
   */
  static async send2FAChange(userId, userData, enabled) {
    try {
      const { username, email } = userData;

      return await notificationService.createNotification({
        userId,
        type: enabled ? "security.2fa_enabled" : "security.2fa_disabled",
        title: enabled
          ? "Two-Factor Authentication Enabled"
          : "Two-Factor Authentication Disabled",
        message: enabled
          ? "Two-factor authentication has been enabled for your account. Your account is now more secure."
          : "Two-factor authentication has been disabled for your account. Consider re-enabling it for better security.",
        priority: "normal",
        channels: ["email", "in_app"],
        context: {
          data: {
            username,
            email,
            enabled,
            changedAt: new Date(),
          },
        },
        action: {
          label: "Security Settings",
          url: `${
            process.env.FRONTEND_URL || "https://deployio.tech"
          }/dashboard/profile?tab=security&section=security-2fa`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send 2FA change notification", {
        userId,
        email: userData.email,
        enabled,
        error: error.message,
      });
      // Don't throw error
    }
  }

  /**
   * Send account locked notification
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   * @param {Object} lockInfo - Lock information
   */
  static async sendAccountLocked(userId, userData, lockInfo) {
    try {
      const { username, email } = userData;
      const { reason, lockUntil, attempts } = lockInfo;

      return await notificationService.createNotification({
        userId,
        type: "security.account_locked",
        title: "Account Temporarily Locked",
        message: `Your account has been temporarily locked due to ${reason}. It will be unlocked automatically.`,
        priority: "high",
        channels: ["email"],
        context: {
          data: {
            username,
            email,
            reason,
            lockUntil,
            attempts,
            lockedAt: new Date(),
          },
        },
        action: {
          label: "Contact Support",
          url: `${process.env.FRONTEND_URL || "https://deployio.tech"}/support`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send account locked notification", {
        userId,
        email: userData.email,
        error: error.message,
      });
      // Don't throw error
    }
  }

  /**
   * Send account security alert
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   * @param {Object} securityContext - Security event context
   */
  static async sendAccountSecurity(userId, userData, securityContext) {
    try {
      const { username, email } = userData;
      const { securityAction, timestamp, ipAddress, location, device } =
        securityContext;

      return await notificationService.createNotification({
        userId,
        type: "auth.account_security",
        title: `Security Alert: ${securityAction}`,
        message: `A security-related change was made to your DeployIO account: ${securityAction}. If this wasn't you, please secure your account immediately.`,
        priority: "high",
        channels: ["email"],
        context: {
          data: {
            username,
            email,
            securityAction,
            timestamp,
            ipAddress,
            location,
            device,
          },
        },
        action: {
          label: "Review Account Security",
          url: `${
            process.env.FRONTEND_URL || "https://deployio.tech"
          }/dashboard/profile?tab=security`,
          type: "button",
        },
      });
    } catch (error) {
      logger.error("Failed to send account security notification", {
        userId,
        email: userData.email,
        error: error.message,
      });
      // Don't throw error for security notifications
    }
  }
}

module.exports = AuthNotifications;
