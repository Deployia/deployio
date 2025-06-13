const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const User = require("../models/User");
const { sendEmail } = require("./emailService");
const logger = require("../config/logger"); // Added logger

/**
 * Generate JWT token for authentication
 * @param {Object} user - User document from MongoDB
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign({ id: user?._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user?._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Register a new user
 * @param {Object} userData - User data including username, email, password
 * @returns {Object} User object and token
 */
const registerUser = async (userData) => {
  const { username, email, password } = userData;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error("Email already registered");
  }

  // Generate OTP for email verification
  const otp = generateOtp();
  const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  // First, try to send the email BEFORE creating the user
  // This prevents orphaned accounts if email service fails
  try {
    await sendEmail({
      to: email,
      subject: "Verify your DeployIO account (OTP)",
      template: "otp",
      variables: { username, otp },
    });
  } catch (emailError) {
    logger.error(`Failed to send registration email to ${email}:`, {
      error: emailError.message,
      stack: emailError.stack,
      email,
    }); // Replaced console.error
    // If email fails, don't create the user account
    throw new Error(
      "Unable to send verification email. Please try again later or contact support if the problem persists."
    );
  }

  // Only create user after email is successfully sent
  const user = await User.create({
    username,
    email,
    password,
    otp,
    otpExpire,
  });

  // Do not authenticate yet, require OTP verification
  return {
    user: { id: user?._id, username: user?.username, email: user?.email },
    otpSent: true,
  };
};

/**
 * Enhanced login with rate limiting and security features
 * @param {String} email - User email
 * @param {String} password - User password
 * @param {Object} loginInfo - Additional login information (IP, user agent, etc.)
 * @returns {Object} User object and token or 2FA requirement
 */
const loginUser = async (email, password, loginInfo = {}) => {
  try {
    // Input validation
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Rate limiting check (simple implementation)
    const recentAttempts = await checkRecentLoginAttempts(email, loginInfo.ip);
    if (recentAttempts >= 5) {
      throw new Error(
        "Too many login attempts. Please try again in 15 minutes."
      );
    }

    // Find user by email and include password and 2FA fields in query result
    const user = await User.findOne({ email }).select(
      "+password +twoFactorEnabled +loginAttempts +lockUntil"
    );

    // Check if account is locked
    if (user && user.lockUntil && user.lockUntil > Date.now()) {
      throw new Error(
        "Account is temporarily locked due to multiple failed attempts"
      );
    }

    // Check if user exists and password is correct in one step for security
    if (!user || !(await user.comparePassword(password))) {
      // Log failed attempt
      await logFailedLoginAttempt(email, loginInfo.ip);

      // Increment user's failed attempts if user exists
      if (user) {
        await incrementFailedAttempts(user);
      }

      throw new Error("Invalid email or password");
    }

    // Reset failed attempts on successful password verification
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    // Check if user is verified - return verification status instead of throwing error
    if (!user.isVerified) {
      // Generate OTP if user is not verified
      const otp = generateOtp();
      const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

      try {
        // Try to send OTP email first
        await sendEmail({
          to: user.email,
          subject: "Verify your DeployIO account (OTP)",
          template: "otp",
          variables: { username: user.username, otp },
        });

        // Only save OTP to database if email was sent successfully
        user.otp = otp;
        user.otpExpire = otpExpire;
        await user.save();

        logger.info(`OTP email sent to ${user.email}`); // Replaced console.log
      } catch (error) {
        logger.error(`Failed to send OTP email to ${user.email}:`, {
          error: error.message,
          stack: error.stack,
          email: user.email,
        }); // Replaced console.error
        // If email fails, throw an error instead of proceeding
        throw new Error(
          "Unable to send verification email. Please try again later or contact support if the problem persists."
        );
      }

      return {
        needsVerification: true,
        email: user.email,
        message:
          "Please verify your email address with the OTP sent to your inbox",
      };
    }

    // Log successful login
    await logSuccessfulLogin(user._id, loginInfo);

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return {
        requires2FA: true,
        userId: user._id,
        message: "Please provide your 2FA code to complete login",
      };
    }

    // Generate tokens for successful login
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await storeRefreshToken(user._id, refreshToken);

    // Add session information
    if (loginInfo.ip && loginInfo.userAgent) {
      await addSession(user._id, {
        ip: loginInfo.ip,
        userAgent: loginInfo.userAgent,
        location: loginInfo.location || "Unknown",
      });
    }
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
    logger.error("Login error:", {
      error: error.message,
      stack: error.stack,
      email,
    }); // Replaced console.error
    throw error;
  }
};

/**
 * Verify OTP for 2FA after signup
 * @param {String} email - User email
 * @param {String} otp - OTP code
 * @returns {Object} Success message
 */
const verifyOtp = async (email, otp) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");
  if (!user.otp || !user.otpExpire) throw new Error("No OTP requested");
  if (user.otp !== otp) throw new Error("Invalid OTP");
  if (user.otpExpire < Date.now()) throw new Error("OTP expired");

  // OTP valid, clear OTP fields and mark as verified
  user.otp = undefined;
  user.otpExpire = undefined;
  user.isVerified = true;
  await user.save();

  // Now generate tokens for login
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  return {
    user: { id: user?._id, username: user?.username, email: user?.email },
    token,
    refreshToken,
  };
};

/**
 * Generate password reset token and send email
 * @param {String} email - User email
 * @param {String} resetUrl - Base URL for reset link
 * @returns {String} Success message
 */
const forgotPassword = async (email, resetUrl) => {
  // Find user by email
  const user = await User.findOne({ email });

  // Check if user exists
  if (!user) {
    throw new Error("User with this email does not exist");
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetLink = `${resetUrl}/auth/reset-password/${resetToken}`;

  try {
    // Send email
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      template: "passwordReset",
      variables: { resetLink },
    });

    return "Password reset email sent";
  } catch (error) {
    // If error sending email, clear reset token and expiry
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new Error("Email could not be sent");
  }
};

/**
 * Reset user password using token
 * @param {String} token - Password reset token
 * @param {String} newPassword - New password
 * @returns {String} Success message
 */
const resetPassword = async (token, newPassword) => {
  // Hash token to compare with stored token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user by token and check token expiry
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  // Check if user exists and token is valid
  if (!user) {
    throw new Error("Invalid or expired token");
  }

  // Update password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return "Password reset successful";
};

/**
 * Logout user
 * @param {String} userId - The ID of the user logging out
 * @returns {String} Success message
 *
 * Note: In a real-world implementation, you might invalidate tokens server-side using
 * Redis or a similar database. This simplified implementation relies on client-side
 * token removal only.
 */
const logoutUser = async (userId) => {
  // In a production implementation, you might:
  // 1. Log the logout action
  // 2. Store session data or user activity
  // 3. Invalidate the token in a Redis store

  // Optional: find the user to confirm they exist
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Here we simply return a success message
  // The actual token invalidation happens client-side by removing the token
  return "Logged out successfully";
};

/**
 * Resend OTP for 2FA after signup
 * @param {String} email - User email
 * @returns {String} Success message
 */
const resendOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  // Check if user is already verified
  if (user.isVerified) {
    throw new Error("Account is already verified");
  }

  // Generate new OTP
  const otp = generateOtp();
  const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  try {
    // Try to send OTP email first
    await sendEmail({
      to: user.email,
      subject: "Your DeployIO OTP (Resend)",
      template: "otp",
      variables: { username: user.username, otp },
    });

    // Only save OTP to database if email was sent successfully
    user.otp = otp;
    user.otpExpire = otpExpire;
    await user.save();

    logger.info(`OTP resent to ${user.email}`); // Replaced console.log
  } catch (error) {
    logger.error(`Failed to resend OTP email to ${user.email}:`, {
      error: error.message,
      stack: error.stack,
      email: user.email,
    }); // Replaced console.error
    throw new Error(
      "Unable to send verification email. Please try again later or contact support if the problem persists."
    );
  }

  return "OTP resent to your email";
};

// New function to store refresh tokens for rotation
async function storeRefreshToken(userId, token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      throw new Error("Invalid token format");
    }

    const expiresAt = new Date(decoded.exp * 1000);
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found for storing refresh token");
    }

    // Clean up expired tokens before adding new one
    const now = new Date();
    user.refreshTokens = user.refreshTokens.filter(
      (rt) => rt.expiresAt && rt.expiresAt > now
    );

    // Limit the number of refresh tokens per user (prevent token accumulation)
    const maxTokens = 5;
    if (user.refreshTokens.length >= maxTokens) {
      // Remove oldest token
      user.refreshTokens.sort((a, b) => a.createdAt - b.createdAt);
      user.refreshTokens = user.refreshTokens.slice(1);
    }

    user.refreshTokens.push({ token, expiresAt });
    await user.save();

    return true;
  } catch (error) {
    logger.error("Error storing refresh token:", {
      error: error.message,
      stack: error.stack,
      userId,
    }); // Replaced console.error
    throw new Error("Failed to store refresh token");
  }
}

// OAuth providers and session management functions
/**
 * Get linked OAuth providers for a user
 */
async function getLinkedProviders(userId) {
  const user = await User.findById(userId);
  return {
    google: Boolean(user.googleId),
    github: Boolean(user.githubId),
  };
}

/**
 * Link an OAuth provider to user account
 */
async function linkProvider(userId, provider, providerId, profileImage) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  user[`${provider}Id`] = providerId;
  if (profileImage) user.profileImage = profileImage;
  await user.save();
}

/**
 * Unlink an OAuth provider from user account
 */
async function unlinkProvider(userId, provider) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  let count = 0;
  if (user.password) count++;
  if (user.googleId) count++;
  if (user.githubId) count++;
  if (count <= 1)
    throw new Error("Cannot unlink the only authentication method");
  user[`${provider}Id`] = undefined;
  await user.save();
}

/**
 * Add a session record for the user
 */
async function addSession(userId, session) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Avoid duplicate sessions for the same device
    const existing = user.sessions.find(
      (s) => s.ip === session.ip && s.userAgent === session.userAgent
    );

    if (existing) {
      // Update remember setting if provided
      if (session.rememberedUntil) {
        existing.rememberedUntil = session.rememberedUntil;
      }
      // Update last activity
      existing.createdAt = new Date();
      await user.save();
      return existing;
    }

    // Clean up old sessions (keep only last 10 sessions per user)
    if (user.sessions.length >= 10) {
      user.sessions.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      user.sessions = user.sessions.slice(0, 9);
    }

    user.sessions.push({
      ...session,
      createdAt: new Date(),
    });
    await user.save();
    return user.sessions[user.sessions.length - 1];
  } catch (error) {
    logger.error("Error adding session:", {
      error: error.message,
      stack: error.stack,
      userId,
      session,
    }); // Replaced console.error
    throw new Error("Failed to create session");
  }
}

/**
 * Get all sessions for a user
 */
async function getSessions(userId) {
  try {
    const user = await User.findById(userId).select("sessions");
    if (!user) {
      throw new Error("User not found");
    }

    // Clean up expired remembered sessions
    const now = new Date();
    user.sessions = user.sessions.filter(
      (s) => !s.rememberedUntil || s.rememberedUntil > now
    );

    // Save if we cleaned up any sessions
    const originalLength = user.sessions.length;
    if (originalLength !== user.sessions.length) {
      await user.save();
    }

    return user.sessions;
  } catch (error) {
    logger.error("Error getting sessions:", {
      error: error.message,
      stack: error.stack,
      userId,
    }); // Replaced console.error
    throw new Error("Failed to retrieve sessions");
  }
}

/**
 * Delete a user session with enhanced validation
 */
async function deleteSession(userId, sessionId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const sessionExists = user.sessions.some(
      (s) => s._id.toString() === sessionId
    );
    if (!sessionExists) {
      throw new Error("Session not found");
    }

    // Don't allow deletion of the last session if user has no other auth methods
    if (user.sessions.length === 1 && !user.googleId && !user.githubId) {
      throw new Error(
        "Cannot delete the only active session. Please login from another device first."
      );
    }

    user.sessions = user.sessions.filter((s) => s._id.toString() !== sessionId);
    await user.save();

    // Log security event
    logger.info(`Session ${sessionId} deleted for user ${userId}`); // Replaced console.log

    return true;
  } catch (error) {
    logger.error("Error deleting session:", {
      error: error.message,
      stack: error.stack,
      userId,
      sessionId,
    }); // Replaced console.error
    throw new Error(error.message || "Failed to delete session");
  }
}

/**
 * Clean up expired sessions for all users (scheduled task)
 */
async function cleanupExpiredSessions() {
  try {
    const now = new Date();
    const result = await User.updateMany(
      {},
      {
        $pull: {
          sessions: {
            rememberedUntil: { $lt: now },
          },
        },
      }
    );

    logger.info(
      `Cleaned up expired sessions for ${result.modifiedCount} users` // Replaced console.log
    );
    return result;
  } catch (error) {
    logger.error("Error cleaning up expired sessions:", {
      error: error.message,
      stack: error.stack,
    }); // Replaced console.error
    throw new Error("Failed to cleanup expired sessions");
  }
}

/**
 * Get session analytics for a user
 */
async function getSessionAnalytics(userId) {
  try {
    const user = await User.findById(userId).select("sessions");
    if (!user) {
      throw new Error("User not found");
    }

    const sessions = user.sessions;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const analytics = {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(
        (s) => !s.rememberedUntil || s.rememberedUntil > now
      ).length,
      recentSessions: sessions.filter(
        (s) => new Date(s.createdAt) > thirtyDaysAgo
      ).length,
      uniqueIPs: [...new Set(sessions.map((s) => s.ip))].length,
      devices: sessions.reduce((acc, session) => {
        const deviceType = session.userAgent.includes("Mobile")
          ? "mobile"
          : "desktop";
        acc[deviceType] = (acc[deviceType] || 0) + 1;
        return acc;
      }, {}),
    };
    return analytics;
  } catch (error) {
    logger.error("Error getting session analytics:", {
      error: error.message,
      stack: error.stack,
      userId,
    }); // Replaced console.error
    throw new Error("Failed to get session analytics");
  }
}

// =============================================================================
// 2FA (Two-Factor Authentication) Functions
// =============================================================================

/**
 * Generate 2FA secret and QR code
 * @param {String} userId - User ID
 * @returns {Object} Secret, QR code URL, and manual entry key
 */
const generate2FASecret = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `DeployIO (${user?.email})`,
      issuer: "DeployIO",
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url, // Return the TOTP URL instead of data URL
      manualEntryKey: secret.base32,
    };
  } catch (error) {
    logger.error("Error generating 2FA secret:", {
      error: error.message,
      stack: error.stack,
      userId,
    }); // Replaced console.error
    throw new Error("Failed to generate 2FA secret");
  }
};

/**
 * Verify 2FA token and enable 2FA
 * @param {String} userId - User ID
 * @param {String} token - 2FA verification token
 * @param {String} secret - 2FA secret
 * @returns {Object} Success message and backup codes
 */
const enable2FA = async (userId, token, secret) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 1, // Allow minimal time drift during setup only (±1 period)
    });

    if (!verified) {
      throw new Error("Invalid verification code");
    }

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push({
        code: crypto.randomBytes(4).toString("hex").toUpperCase(),
        used: false,
      });
    }

    // Save 2FA settings to user
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = true;
    user.backupCodes = backupCodes;
    await user.save();

    return {
      message: "2FA enabled successfully",
      backupCodes: backupCodes.map((bc) => bc.code),
    };
  } catch (error) {
    logger.error("Error enabling 2FA:", {
      error: error.message,
      stack: error.stack,
      userId,
    }); // Replaced console.error
    throw new Error(error.message || "Failed to enable 2FA");
  }
};

/**
 * Verify 2FA token during login
 * @param {String} userId - User ID
 * @param {String} token - 2FA verification token
 * @returns {Object} Verification result with method used
 */
const verify2FALogin = async (userId, token) => {
  try {
    const user = await User.findById(userId).select(
      "+twoFactorSecret +backupCodes +lastTOTPToken +lastTOTPTimestamp"
    );
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.twoFactorEnabled) {
      throw new Error("2FA is not enabled for this account");
    }

    // First, try to verify with TOTP
    // Use window: 0 for better security - only current time period is accepted
    // This prevents attacks using old/expired TOTP codes
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 0, // Restricted to current time period only (typically 30 seconds)
    });

    // Check for token reuse (if the token was already used in the past)
    if (user.lastTOTPToken === token) {
      // Token has been used before - reject it to prevent replay attacks
      return { verified: false, error: "Verification code already used" };
    }

    // Store the last used token and timestamp for additional security
    // This can help prevent token reuse attacks
    if (verified) {
      // Save the used token to prevent replay attacks
      user.lastTOTPToken = token;
      user.lastTOTPTimestamp = new Date();
      await user.save();
      return { verified: true, method: "totp" };
    }

    // If TOTP fails, check backup codes
    const backupCode = user.backupCodes.find(
      (bc) => bc.code === token.toUpperCase() && !bc.used
    );

    if (backupCode) {
      // Mark backup code as used
      backupCode.used = true;
      backupCode.usedAt = new Date();
      await user.save();
      return { verified: true, method: "backup" };
    }

    // Neither TOTP nor backup code worked
    return { verified: false, error: "Invalid verification code" };
  } catch (error) {
    logger.error("Error verifying 2FA login:", {
      error: error.message,
      stack: error.stack,
      userId,
    }); // Replaced console.error
    throw new Error(error.message || "Failed to verify 2FA");
  }
};

/**
 * Disable 2FA
 * @param {String} userId - User ID
 * @param {String} password - User password for verification
 * @returns {String} Success message
 */
const disable2FA = async (userId, password) => {
  try {
    const user = await User.findById(userId).select(
      "+password +twoFactorSecret"
    );
    if (!user) {
      throw new Error("User not found");
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error("Incorrect password");
    }

    // Disable 2FA and clear all related data
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.backupCodes = [];
    user.lastTOTPToken = undefined;
    user.lastTOTPTimestamp = undefined;
    await user.save();

    return "2FA disabled successfully";
  } catch (error) {
    logger.error("Error disabling 2FA:", {
      error: error.message,
      stack: error.stack,
      userId,
    }); // Replaced console.error
    throw new Error(error.message || "Failed to disable 2FA");
  }
};

/**
 * Get 2FA status
 * @param {String} userId - User ID
 * @returns {Object} 2FA status and backup codes count
 */
const get2FAStatus = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      twoFactorEnabled: user.twoFactorEnabled,
      backupCodesCount: user.backupCodes
        ? user.backupCodes.filter((bc) => !bc.used).length
        : 0,
    };
  } catch (error) {
    logger.error("Error getting 2FA status:", {
      error: error.message,
      stack: error.stack,
      userId,
    }); // Replaced console.error
    throw new Error("Failed to get 2FA status");
  }
};

/**
 * Generate new backup codes
 * @param {String} userId - User ID
 * @param {String} password - User password for verification
 * @returns {Object} Success message and new backup codes
 */
const generateNewBackupCodes = async (userId, password) => {
  try {
    const user = await User.findById(userId).select("+password");
    if (!user) {
      throw new Error("User not found");
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error("Incorrect password");
    }

    if (!user.twoFactorEnabled) {
      throw new Error("2FA is not enabled");
    }

    // Generate new backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push({
        code: crypto.randomBytes(4).toString("hex").toUpperCase(),
        used: false,
      });
    }

    user.backupCodes = backupCodes;
    await user.save();

    return {
      message: "New backup codes generated successfully",
      backupCodes: backupCodes.map((bc) => bc.code),
    };
  } catch (error) {
    logger.error("Error generating new backup codes:", {
      error: error.message,
      stack: error.stack,
      userId,
    }); // Replaced console.error
    throw new Error(error.message || "Failed to generate new backup codes");
  }
};

/**
 * Complete 2FA login after verification
 * @param {String} userId - User ID
 * @returns {Object} User data and tokens
 */
const complete2FALogin = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in user sessions
    await storeRefreshToken(userId, refreshToken);

    return {
      user: {
        id: user?._id,
        username: user?.username,
        email: user?.email,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        profileImage: user.profileImage,
      },
      token,
      refreshToken,
    };
  } catch (error) {
    logger.error("Error completing 2FA login:", {
      error: error.message,
      stack: error.stack,
      userId,
    }); // Replaced console.error
    throw new Error("Failed to complete 2FA login");
  }
};

// =============================================================================
// Security Helper Functions
// =============================================================================

/**
 * Check recent login attempts for rate limiting
 */
async function checkRecentLoginAttempts(email, ip) {
  try {
    // This is a simple in-memory rate limiting
    // In production, you'd want to use Redis or a database
    const cacheKey = `login_attempts_${email}_${ip}`;
    // For now, return 0 as we don't have a cache implementation
    // TODO: Implement proper rate limiting with Redis
    return 0;
  } catch (error) {
    logger.error("Error checking recent login attempts:", {
      error: error.message,
      stack: error.stack,
      email,
      ip,
    }); // Replaced console.error
    return 0; // Fail open for now
  }
}

/**
 * Log failed login attempt
 */
async function logFailedLoginAttempt(email, ip) {
  try {
    logger.warn(
      `Failed login attempt for ${email} from IP: ${ip} at ${new Date().toISOString()}` // Replaced console.log with logger.warn
    );
    // TODO: Store in security log collection
  } catch (error) {
    logger.error("Error logging failed login attempt:", {
      error: error.message,
      stack: error.stack,
      email,
      ip,
    }); // Replaced console.error
  }
}

/**
 * Increment failed attempts for user account locking
 */
async function incrementFailedAttempts(user) {
  try {
    const maxAttempts = 5;
    const lockDuration = 15 * 60 * 1000; // 15 minutes

    user.loginAttempts = (user.loginAttempts || 0) + 1;

    if (user.loginAttempts >= maxAttempts) {
      user.lockUntil = new Date(Date.now() + lockDuration);
    }

    await user.save();
  } catch (error) {
    logger.error("Error incrementing failed attempts:", {
      error: error.message,
      stack: error.stack,
      userId: user?._id,
    }); // Replaced console.error
  }
}

/**
 * Log successful login for security monitoring
 */
async function logSuccessfulLogin(userId, loginInfo) {
  try {
    logger.info(
      `Successful login for user ${userId} from IP: ${
        loginInfo.ip
      } at ${new Date().toISOString()}` // Replaced console.log
    );

    // Update user's last login info
    await User.findByIdAndUpdate(userId, {
      lastLogin: new Date(),
      lastLoginIP: loginInfo.ip,
    });

    // TODO: Store in security log collection for audit trail
  } catch (error) {
    logger.error("Error logging successful login:", {
      error: error.message,
      stack: error.stack,
    });
  }
}

/**
 * Enhanced session cleanup with user activity tracking
 */
async function cleanupInactiveSessions() {
  try {
    const inactivityThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days

    const result = await User.updateMany(
      {},
      {
        $pull: {
          sessions: {
            createdAt: { $lt: inactivityThreshold },
            rememberedUntil: { $exists: false },
          },
        },
      }
    );

    logger.info(
      `Cleaned up inactive sessions for ${result.modifiedCount} users`
    );
    return result;
  } catch (error) {
    logger.error("Error cleaning up inactive sessions:", {
      error: error.message,
      stack: error.stack,
    });
    throw new Error("Failed to cleanup inactive sessions");
  }
}

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
  generateRefreshToken,
  verifyOtp,
  resendOtp,
  // OAuth providers and session management
  getLinkedProviders,
  linkProvider,
  unlinkProvider,
  getSessions,
  deleteSession,
  cleanupExpiredSessions,
  getSessionAnalytics,
  cleanupInactiveSessions,
  addSession,
  storeRefreshToken,
  // 2FA functions
  generate2FASecret,
  enable2FA,
  verify2FALogin,
  disable2FA,
  get2FAStatus,
  generateNewBackupCodes,
  complete2FALogin,
};
