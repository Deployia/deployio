const crypto = require("crypto");
const User = require("@models/User");
const logger = require("@config/logger");
const AuthNotifications = require("./authNotifications");
const AuthActivityLogger = require("./authActivityLogger");

/**
 * Password Service - Handles all password-related operations
 *
 * Responsibilities:
 * - Password validation and policies
 * - Password reset flow
 * - Password history management
 * - Password strength checking
 */

// Enhanced password validation with security policies
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
  preventPasswordReuse: 5, // Last 5 passwords
  patterns: {
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    numbers: /[0-9]/,
    specialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
  },
  commonPasswords: [
    "password",
    "password123",
    "123456789",
    "qwerty123",
    "admin123",
    "letmein",
    "welcome123",
    "password1",
    "abc123456",
    "iloveyou",
    "princess",
    "1234567890",
    "password!",
    "admin",
    "user123",
  ],
};

/**
 * Validate password against security policy
 * @param {String} password - Password to validate
 * @param {Object} user - User object (for checking history)
 * @returns {Object} Validation result with errors
 */
const validatePasswordPolicy = (password, user = null) => {
  const errors = [];

  if (!password || password.length < passwordPolicy.minLength) {
    errors.push(
      `Password must be at least ${passwordPolicy.minLength} characters long`
    );
  }

  if (
    passwordPolicy.requireUppercase &&
    !passwordPolicy.patterns.uppercase.test(password)
  ) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (
    passwordPolicy.requireLowercase &&
    !passwordPolicy.patterns.lowercase.test(password)
  ) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (
    passwordPolicy.requireNumbers &&
    !passwordPolicy.patterns.numbers.test(password)
  ) {
    errors.push("Password must contain at least one number");
  }

  if (
    passwordPolicy.requireSpecialChars &&
    !passwordPolicy.patterns.specialChars.test(password)
  ) {
    errors.push("Password must contain at least one special character");
  }

  // Check against common passwords
  if (passwordPolicy.commonPasswords.includes(password.toLowerCase())) {
    errors.push("Password is too common, please choose a more secure password");
  }

  // Check for sequential characters
  if (/123|abc|qwe|asd|zxc/i.test(password)) {
    errors.push("Password should not contain sequential characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
};

/**
 * Calculate password strength score
 * @param {String} password - Password to analyze
 * @returns {Object} Strength analysis
 */
const calculatePasswordStrength = (password) => {
  let score = 0;
  const feedback = [];

  // Length scoring
  if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 15;
  else feedback.push("Use at least 12 characters");

  // Character variety
  if (/[a-z]/.test(password)) score += 15;
  else feedback.push("Add lowercase letters");

  if (/[A-Z]/.test(password)) score += 15;
  else feedback.push("Add uppercase letters");

  if (/[0-9]/.test(password)) score += 15;
  else feedback.push("Add numbers");

  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  else feedback.push("Add special characters");

  // Bonus for variety
  const uniqueChars = new Set(password).size;
  if (uniqueChars > password.length * 0.7) score += 10;

  let strength = "Very Weak";
  if (score >= 80) strength = "Very Strong";
  else if (score >= 60) strength = "Strong";
  else if (score >= 40) strength = "Medium";
  else if (score >= 20) strength = "Weak";

  return {
    score,
    strength,
    feedback: feedback.length > 0 ? feedback : ["Password strength is good"],
  };
};

/**
 * Generate password reset token and send email
 * @param {String} email - User email
 * @param {String} resetUrl - Base URL for reset link
 * @param {Object} requestInfo - Request information (IP, user agent, etc.)
 * @returns {String} Success message
 */
const forgotPassword = async (email, resetUrl, requestInfo = {}) => {
  // Find user by email
  const user = await User.findOne({ email });

  // Check if user exists
  if (!user) {
    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    return "If an account with that email exists, a reset link has been sent.";
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Log password reset request activity
  try {
    await AuthActivityLogger.logPasswordResetRequest(user._id, {
      email: user.email,
      ip: requestInfo.ip,
      userAgent: requestInfo.userAgent,
    });
  } catch (activityError) {
    logger.warn("Failed to log password reset request activity", {
      error: activityError.message,
      userId: user._id,
    });
  }

  // Create reset URL
  const resetLink = `${resetUrl}/auth/reset-password/${resetToken}`;

  try {
    await AuthNotifications.sendPasswordReset(
      user._id,
      { username: user.username, email: user.email },
      resetLink
    );

    logger.info(`Password reset email sent to ${email}`);
    return "Password reset email sent successfully";
  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}:`, {
      error: error.message,
      stack: error.stack,
      email,
      userId: user._id,
    });

    // Clear the reset token if email fails
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new Error(
      "Unable to send password reset email. Please try again later."
    );
  }
};

/**
 * Reset user password using token
 * @param {String} token - Password reset token
 * @param {String} newPassword - New password
 * @param {Object} resetInfo - Reset information (IP, user agent, etc.)
 * @returns {String} Success message
 */
const resetPassword = async (token, newPassword, resetInfo = {}) => {
  // Hash the token to compare with stored version
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with matching token that hasn't expired
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    throw new Error("Invalid or expired password reset token");
  }

  // Validate the new password
  const passwordValidation = validatePasswordPolicy(newPassword, user);
  if (!passwordValidation.isValid) {
    const error = new Error("Password does not meet security requirements");
    error.details = passwordValidation.errors;
    error.strength = passwordValidation.strength;
    throw error;
  }

  // Check if the new password is the same as current password
  if (user.password && (await user.comparePassword(newPassword))) {
    throw new Error("New password must be different from current password");
  }

  // Check password reuse
  if (await user.isPasswordReused(newPassword)) {
    throw new Error(
      "This password has been used recently. Please choose a different password."
    );
  }

  // Update password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.passwordChangedAt = new Date();

  await user.save();

  // Log password reset completion activity
  try {
    await AuthActivityLogger.logPasswordReset(user._id, {
      email: user.email,
      ip: resetInfo.ip,
      userAgent: resetInfo.userAgent,
    });
  } catch (activityError) {
    logger.warn("Failed to log password reset completion activity", {
      error: activityError.message,
      userId: user._id,
    });
  }

  // Send password reset confirmation notification
  try {
    await AuthNotifications.sendPasswordResetConfirmation(user._id, {
      username: user.username,
      email: user.email,
    });
    logger.info(`Password reset confirmation sent to ${user.email}`);
  } catch (notificationError) {
    logger.error(
      `Failed to send password reset confirmation to ${user.email}:`,
      {
        error: notificationError.message,
        userId: user._id,
        email: user.email,
      }
    );
  }

  return "Password reset successfully";
};

/**
 * Update user password
 * @param {String} userId - User ID
 * @param {String} currentPassword - Current password
 * @param {String} newPassword - New password
 * @returns {String} Success message
 */
const updatePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select(
    "+password githubId googleId gitlabId bitbucketId azureDevOpsId"
  );

  if (!user) throw new Error("User not found");

  // Check if user is OAuth-only (has OAuth ID but no password)
  const isOAuthUser =
    user.githubId ||
    user.googleId ||
    user.gitlabId ||
    user.bitbucketId ||
    user.azureDevOpsId;

  if (isOAuthUser && !user.password) {
    // This is an OAuth user setting their first password
    return setInitialPassword(userId, newPassword);
  }

  // Regular password update flow
  if (!user.password) {
    throw new Error(
      "No current password set. Use set initial password instead."
    );
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new Error("Current password is incorrect");

  // Validate the new password
  const passwordValidation = validatePasswordPolicy(newPassword, user);
  if (!passwordValidation.isValid) {
    const error = new Error("Password does not meet security requirements");
    error.details = passwordValidation.errors;
    error.strength = passwordValidation.strength;
    throw error;
  }

  // Check if the new password is the same as current password
  if (await user.comparePassword(newPassword)) {
    throw new Error("New password must be different from current password");
  }

  // Check password reuse
  if (await user.isPasswordReused(newPassword)) {
    throw new Error(
      "This password has been used recently. Please choose a different password."
    );
  }

  user.password = newPassword;
  await user.save();

  return "Password updated successfully";
};

/**
 * Set initial password for OAuth users
 * @param {String} userId - User ID
 * @param {String} newPassword - New password
 * @returns {String} Success message
 */
const setInitialPassword = async (userId, newPassword) => {
  const user = await User.findById(userId).select(
    "+password githubId googleId gitlabId bitbucketId azureDevOpsId"
  );

  if (!user) throw new Error("User not found");

  // Verify this is an OAuth user
  const isOAuthUser =
    user.githubId ||
    user.googleId ||
    user.gitlabId ||
    user.bitbucketId ||
    user.azureDevOpsId;
  if (!isOAuthUser) {
    throw new Error(
      "This endpoint is only for OAuth users setting their first password"
    );
  }

  // Check if user already has a password
  if (user.password) {
    throw new Error(
      "User already has a password. Use update password instead."
    );
  }

  const passwordValidation = validatePasswordPolicy(newPassword, user);

  if (!passwordValidation.isValid) {
    const error = new Error("Password does not meet security requirements");
    error.details = passwordValidation.errors;
    error.strength = passwordValidation.strength;
    throw error;
  }

  user.password = newPassword;
  await user.save();

  return "Initial password set successfully";
};

module.exports = {
  validatePasswordPolicy,
  calculatePasswordStrength,
  forgotPassword,
  resetPassword,
  updatePassword,
  setInitialPassword,
  passwordPolicy,
};
