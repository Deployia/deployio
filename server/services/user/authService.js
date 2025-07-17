const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const User = require("@models/User");
const external = require("../external");
const logger = require("@config/logger");
const { getRedisClient } = require("@config/redisClient");
const AuthNotifications = require("./authNotifications");
const AuthActivityLogger = require("./authActivityLogger");

/**
 * Authentication Service - Pure JWT Implementation
 *
 * Handles all authentication business logic including:
 * - User registration with email verification
 * - Login with optional 2FA
 * - Password reset flow
 * - JWT token management (no sessions)
 * - Two-factor authentication (2FA)
 * - OAuth provider linking/unlinking
 *
 * This service is stateless and uses JWT tokens for authentication.
 * No session management is performed - everything is token-based.
 */

/**
 * Generate JWT token for authentication
 * @param {Object} user - User document from MongoDB
 * @returns {String} JWT token
 */
const generateToken = (user, sessionId = null) => {
  const payload = {
    id: user?._id,
    email: user?.email,
    sessionId: sessionId,
    type: "access",
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const generateRefreshToken = (user, sessionId = null, tokenFamily = null) => {
  const payload = {
    id: user?._id,
    sessionId: sessionId,
    family: tokenFamily || crypto.randomUUID(),
    type: "refresh",
  };
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "24h", // Reduced from 7d for security
  });
};

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

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Register a new user
 * @param {Object} userData - User data including username, email, password
 * @returns {Object} User object and token
 */
const registerUser = async (userData, registrationInfo = {}) => {
  const { username, email, password } = userData;

  // Enhanced password validation
  const passwordValidation = validatePasswordPolicy(password);
  if (!passwordValidation.isValid) {
    const error = new Error("Password does not meet security requirements");
    error.details = passwordValidation.errors;
    error.strength = passwordValidation.strength;
    throw error;
  }

  // Import sanitizeUsername utility
  const { sanitizeUsername } = require("@config/strategies/githubStrategy");
  const safeUsername = sanitizeUsername(username);

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error("Email already registered");
  }

  // Rate limiting check for registration
  if (registrationInfo.ip) {
    const rateLimitCheck = await checkAdaptiveRateLimit(
      registrationInfo.ip,
      "/api/auth/register",
      false
    );

    if (!rateLimitCheck.allowed) {
      const error = new Error(
        "Too many registration attempts. Please try again later."
      );
      error.retryAfter = rateLimitCheck.retryAfter;
      throw error;
    }
  }

  // Generate OTP for email verification
  const otp = generateOtp();
  const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Create user first to get userId for notification system
  const user = await User.create({
    username: safeUsername,
    email,
    password,
    otp,
    otpExpire,
    passwordHistory: [password], // Track password history
    passwordChangedAt: new Date(),
  });

  // Log registration activity
  try {
    await AuthActivityLogger.logRegistration(user._id, {
      email,
      username: safeUsername,
      ip: registrationInfo.ip,
      userAgent: registrationInfo.userAgent,
    });
  } catch (activityError) {
    logger.warn("Failed to log registration activity", {
      error: activityError.message,
      userId: user._id,
    });
  }

  // Send OTP verification email via notification system
  try {
    await AuthNotifications.sendOTPVerification(
      user._id,
      { username: safeUsername, email },
      otp,
      false // not a resend
    );

    logger.info(`Registration OTP sent via notification system to ${email}`);
  } catch (emailError) {
    logger.error(
      `Failed to send registration OTP via notification system to ${email}:`,
      {
        error: emailError.message,
        stack: emailError.stack,
        email,
        userId: user._id,
      }
    );

    // If notification fails, remove the user to prevent orphaned accounts
    await User.findByIdAndDelete(user._id);
    throw new Error(
      "Unable to send verification email. Please try again later or contact support if the problem persists."
    );
  }

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
      await AuthActivityLogger.logFailedLogin(
        email,
        loginInfo,
        "invalid_credentials"
      );

      // Increment user's failed attempts if user exists
      if (user) {
        await incrementFailedAttempts(user);
      }

      throw new Error("Invalid email or password");
    } // Reset failed attempts on successful password verification
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    } // Clear Redis-based login attempts on successful authentication
    await clearLoginAttempts(email, loginInfo.ip); // Check if user is verified - return verification status instead of throwing error
    if (!user.isVerified) {
      // Generate OTP if user is not verified
      const otp = generateOtp();
      const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

      try {
        // Send OTP email via notification system
        await AuthNotifications.sendOTPVerification(
          user._id,
          { username: user.username, email: user.email },
          otp,
          false // not a resend
        );

        // Only save OTP to database if notification was sent successfully
        user.otp = otp;
        user.otpExpire = otpExpire;
        await user.save();

        logger.info(`Login OTP sent via notification system to ${user.email}`);
      } catch (error) {
        logger.error(
          `Failed to send login OTP via notification system to ${user.email}:`,
          {
            error: error.message,
            stack: error.stack,
            email: user.email,
            userId: user._id,
          }
        );
        // If notification fails, throw an error instead of proceeding
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

    // Log successful login session management
    await logSuccessfulLogin(user._id, loginInfo);

    // Log login activity for audit trail
    await AuthActivityLogger.logLogin(user._id, loginInfo, "email");

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
const verifyOtp = async (email, otp, verificationInfo = {}) => {
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

  // Log email verification activity
  try {
    await AuthActivityLogger.logEmailVerification(user._id, {
      email: user.email,
      ip: verificationInfo.ip,
      userAgent: verificationInfo.userAgent,
    });
  } catch (activityError) {
    logger.warn("Failed to log email verification activity", {
      error: activityError.message,
      userId: user._id,
    });
  }

  // Send verification success notification
  try {
    await AuthNotifications.sendVerificationSuccess(user._id, {
      username: user.username,
      email: user.email,
    });
    logger.info(`Verification success notification sent to ${user.email}`);
  } catch (verificationError) {
    logger.error(
      `Failed to send verification success notification to ${user.email}:`,
      {
        error: verificationError.message,
        userId: user._id,
        email: user.email,
      }
    );
  }

  // Send welcome notification to newly verified user
  try {
    await AuthNotifications.sendWelcome(user._id, {
      username: user.username,
      email: user.email,
    });
    logger.info(
      `Welcome notification sent to newly verified user ${user.email}`
    );
  } catch (welcomeError) {
    // Don't fail the verification if welcome notification fails
    logger.error(`Failed to send welcome notification to ${user.email}:`, {
      error: welcomeError.message,
      userId: user._id,
      email: user.email,
    });
  }

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
const forgotPassword = async (email, resetUrl, requestInfo = {}) => {
  // Find user by email
  const user = await User.findOne({ email });

  // Check if user exists
  if (!user) {
    throw new Error("User with this email does not exist");
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
    // Send password reset email via notification system
    await AuthNotifications.sendPasswordReset(
      user._id,
      { username: user.username, email: user.email },
      resetToken,
      resetUrl
    );

    logger.info(
      `Password reset email sent via notification system to ${user.email}`
    );
    return "Password reset email sent";
  } catch (error) {
    logger.error(
      `Failed to send password reset via notification system to ${user.email}:`,
      {
        error: error.message,
        stack: error.stack,
        email: user.email,
        userId: user._id,
      }
    );

    // If error sending notification, clear reset token and expiry
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
const resetPassword = async (token, newPassword, resetInfo = {}) => {
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

  // Log password reset completion activity
  try {
    await AuthActivityLogger.logPasswordResetComplete(user._id, {
      ip: resetInfo.ip,
      userAgent: resetInfo.userAgent,
    });
  } catch (activityError) {
    logger.warn("Failed to log password reset completion activity", {
      error: activityError.message,
      userId: user._id,
    });
  }

  // Send password change confirmation notification
  try {
    await AuthNotifications.sendPasswordChangeConfirmation(user._id, {
      username: user.username,
      email: user.email,
      ipAddress: resetInfo.ip || "Password reset via email",
      userAgent: resetInfo.userAgent || "Password reset via email",
    });
    logger.info(`Password change confirmation sent to ${user.email}`);
  } catch (securityError) {
    // Don't fail the password reset if notification fails
    logger.error(
      `Failed to send password change confirmation to ${user.email}:`,
      {
        error: securityError.message,
        userId: user._id,
        email: user.email,
      }
    );
  }

  return "Password reset successful";
};

/**
 * Logout user
 * @param {String} userId - The ID of the user logging out
 * @param {String} refreshToken - The refresh token to invalidate
 * @param {String} deviceFingerprint - The device fingerprint to deactivate
 * @returns {String} Success message
 */
const logoutUser = async (userId, refreshToken, deviceFingerprint) => {
  try {
    const redisClient = getRedisClient();

    // Remove refresh token from database using atomic update
    if (refreshToken) {
      try {
        await User.findByIdAndUpdate(
          userId,
          { $pull: { refreshTokens: { token: refreshToken } } },
          { new: true }
        );
      } catch (error) {
        logger.warn(
          "Failed to remove refresh token from database during logout",
          {
            error: error.message,
            userId,
          }
        );
      }
    }

    // Deactivate the current session
    if (deviceFingerprint) {
      try {
        const user = await User.findById(userId);
        if (user) {
          const session = user.loginSessions.find(
            (s) => s.deviceFingerprint === deviceFingerprint
          );
          if (session) {
            session.isActive = false;
          }

          // Clear current device fingerprint if it matches
          if (user.currentDeviceFingerprint === deviceFingerprint) {
            user.currentDeviceFingerprint = null;
          }

          await user.save();
        }
      } catch (error) {
        logger.warn("Failed to deactivate session during logout", {
          error: error.message,
          userId,
          deviceFingerprint,
        });
      }
    }

    // Log logout activity
    try {
      await AuthActivityLogger.logLogout(userId, {
        deviceFingerprint,
      });
    } catch (activityError) {
      logger.warn("Failed to log logout activity", {
        error: activityError.message,
        userId,
      });
    }

    // Remove refresh token from Redis (only if Redis is available)
    if (redisClient && redisClient.isReady) {
      try {
        if (refreshToken) {
          const tokenKey = `refresh_token:${userId}:${refreshToken}`;
          await redisClient.del(tokenKey);
        }
      } catch (redisError) {
        logger.warn("Redis operations failed during logout", {
          error: redisError.message,
          userId,
        });
      }
    }

    logger.info(`User ${userId} logged out successfully`);
    return true;
  } catch (error) {
    logger.error("Error during logout:", {
      error: error.message,
      stack: error.stack,
      userId,
    });
    throw new Error("Logout failed");
  }
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
    // Send OTP resend email via notification system
    await AuthNotifications.sendOTPVerification(
      user._id,
      { username: user.username, email: user.email },
      otp,
      true // this is a resend
    );

    // Only save OTP to database if notification was sent successfully
    user.otp = otp;
    user.otpExpire = otpExpire;
    await user.save();
    logger.info(`OTP resent via notification system to ${user.email}`);
  } catch (error) {
    logger.error(
      `Failed to resend OTP via notification system to ${user.email}:`,
      {
        error: error.message,
        stack: error.stack,
        email: user.email,
        userId: user._id,
      }
    );

    throw new Error(
      "Unable to send verification email. Please try again later or contact support if the problem persists."
    );
  }

  return "OTP resent to your email";
};

// Enhanced function to store refresh tokens with family tracking
async function storeRefreshToken(userId, token, tokenFamily = null) {
  try {
    const redisClient = getRedisClient();
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      throw new Error("Invalid token format");
    }

    const expiresAt = new Date(decoded.exp * 1000);
    const now = new Date();
    const maxTokens = 5;

    // Use atomic update to prevent version conflicts
    try {
      const updatedUser = await User.findOneAndUpdate(
        { _id: userId },
        [
          {
            $set: {
              refreshTokens: {
                $let: {
                  vars: {
                    // Remove expired tokens
                    filteredTokens: {
                      $filter: {
                        input: "$refreshTokens",
                        cond: { $gt: ["$$this.expiresAt", now] },
                      },
                    },
                  },
                  in: {
                    $concatArrays: [
                      // Keep only the most recent tokens if over limit
                      {
                        $cond: {
                          if: {
                            $gte: [{ $size: "$$filteredTokens" }, maxTokens],
                          },
                          then: {
                            $slice: [
                              {
                                $sortArray: {
                                  input: "$$filteredTokens",
                                  sortBy: { createdAt: -1 },
                                },
                              },
                              maxTokens - 1,
                            ],
                          },
                          else: "$$filteredTokens",
                        },
                      },
                      // Add the new token with family tracking
                      [
                        {
                          token: token,
                          family: tokenFamily || decoded.family,
                          expiresAt: expiresAt,
                          createdAt: "$$NOW",
                          isActive: true,
                        },
                      ],
                    ],
                  },
                },
              },
            },
          },
        ],
        { new: true }
      );

      if (!updatedUser) {
        throw new Error("User not found for storing refresh token");
      }

      logger.info("Refresh token stored successfully", {
        userId,
        tokenFamily: tokenFamily || decoded.family,
        expiresAt: expiresAt.toISOString(),
        activeTokenCount: updatedUser.refreshTokens.length,
      });
    } catch (dbError) {
      logger.error("Failed to store refresh token in database", {
        error: dbError.message,
        userId,
      });
      throw dbError;
    }

    // Store token in Redis for fast validation with TTL (only if Redis is available)
    if (redisClient && redisClient.isReady) {
      try {
        const tokenKey = `refresh_token:${userId}:${token}`;
        const ttlSeconds = Math.floor(
          (expiresAt.getTime() - now.getTime()) / 1000
        );

        if (ttlSeconds > 0) {
          await redisClient.setEx(
            tokenKey,
            ttlSeconds,
            JSON.stringify({
              userId,
              createdAt: now.toISOString(),
              expiresAt: expiresAt.toISOString(),
            })
          );
        }
      } catch (redisError) {
        logger.warn("Redis operation failed while storing refresh token", {
          error: redisError.message,
          userId,
        });
      }
    }

    return true;
  } catch (error) {
    logger.error("Error storing refresh token:", {
      error: error.message,
      stack: error.stack,
      userId,
    });
    throw new Error("Failed to store refresh token");
  }
}

// OAuth providers management functions
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

    // Send 2FA enabled notification
    try {
      await AuthNotifications.send2FAChange(
        user._id,
        {
          username: user.username,
          email: user.email,
        },
        true
      );
      logger.info(`2FA enabled notification sent to ${user.email}`);
    } catch (notificationError) {
      logger.error(
        `Failed to send 2FA enabled notification to ${user.email}:`,
        {
          error: notificationError.message,
          userId: user._id,
        }
      );
    }

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

    // Send 2FA disabled notification
    try {
      await AuthNotifications.send2FAChange(
        user._id,
        {
          username: user.username,
          email: user.email,
        },
        false
      );
      logger.info(`2FA disabled notification sent to ${user.email}`);
    } catch (notificationError) {
      logger.error(
        `Failed to send 2FA disabled notification to ${user.email}:`,
        {
          error: notificationError.message,
          userId: user._id,
        }
      );
    }

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
 * @param {Object} loginInfo - Login information (IP, userAgent, etc.)
 * @returns {Object} User data and tokens
 */
const complete2FALogin = async (userId, loginInfo = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await storeRefreshToken(userId, refreshToken);

    // Log successful login for audit trail
    if (loginInfo.ip) {
      await logSuccessfulLogin(userId, loginInfo);
    }

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
    });
    throw new Error("Failed to complete 2FA login");
  }
};

/**
 * Complete OAuth login and generate tokens
 * @param {String} userId - User ID
 * @param {Object} loginInfo - Login information (IP, userAgent, etc.)
 * @returns {Object} User data and tokens
 */
const completeOAuthLogin = async (userId, loginInfo = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await storeRefreshToken(userId, refreshToken);

    // Log successful login for audit trail
    if (loginInfo.ip) {
      await logSuccessfulLogin(userId, loginInfo);
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
    logger.error("Error completing OAuth login:", {
      error: error.message,
      stack: error.stack,
      userId,
    });
    throw new Error("Failed to complete OAuth login");
  }
};

// =============================================================================
// Security Helper Functions
// =============================================================================

/**
 * Check recent login attempts for rate limiting using Redis
 */
async function checkRecentLoginAttempts(email, ip) {
  try {
    const redisClient = getRedisClient();
    const cacheKey = `login_attempts_${email}_${ip}`;

    // Only check Redis if available
    if (redisClient && redisClient.isReady) {
      // Get the current count of login attempts
      const attempts = await redisClient.get(cacheKey);
      return attempts ? parseInt(attempts) : 0;
    }

    // Return 0 if Redis is not available
    return 0;
  } catch (error) {
    logger.error("Error checking recent login attempts:", {
      error: error.message,
      stack: error.stack,
      email,
      ip,
    });
    return 0; // Fail open for now
  }
}

/**
 * Log failed login attempt using Redis
 */
async function logFailedLoginAttempt(email, ip) {
  try {
    const redisClient = getRedisClient();
    const cacheKey = `login_attempts_${email}_${ip}`;

    // Only log to Redis if available
    if (redisClient && redisClient.isReady) {
      // Increment the failed attempt counter with 15 minute expiry
      await redisClient
        .multi()
        .incr(cacheKey)
        .expire(cacheKey, 15 * 60) // 15 minutes
        .exec();
    }

    logger.warn(
      `Failed login attempt for ${email} from IP: ${ip} at ${new Date().toISOString()}`
    );
  } catch (error) {
    logger.error("Error logging failed login attempt:", {
      error: error.message,
      stack: error.stack,
      email,
      ip,
    });
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

      // Send account locked notification
      try {
        await AuthNotifications.sendAccountLocked(
          user._id,
          {
            username: user.username,
            email: user.email,
          },
          {
            reason: "multiple failed login attempts",
            lockUntil: user.lockUntil,
            attempts: user.loginAttempts,
          }
        );
        logger.info(`Account locked notification sent to ${user.email}`);
      } catch (notificationError) {
        logger.error(
          `Failed to send account locked notification to ${user.email}:`,
          {
            error: notificationError.message,
            userId: user._id,
          }
        );
      }
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
 * Log successful login for security monitoring and session tracking
 */
async function logSuccessfulLogin(userId, loginInfo) {
  try {
    logger.info(
      `Successful login for user ${userId} from IP: ${
        loginInfo.ip
      } at ${new Date().toISOString()}`
    );

    // Update user's last login info and manage login sessions
    const user = await User.findById(userId);
    if (user) {
      // Update basic login info
      user.lastLogin = new Date();
      user.lastLoginIP = loginInfo.ip;
      user.currentDeviceFingerprint = loginInfo.deviceFingerprint; // Set current session

      // Manage login sessions (keep track of where user is logged in)
      const existingSession = user.loginSessions.find(
        (session) => session.deviceFingerprint === loginInfo.deviceFingerprint
      );

      if (existingSession) {
        // Update existing session
        existingSession.lastActivity = new Date();
        existingSession.ip = loginInfo.ip;
        existingSession.userAgent = loginInfo.userAgent;
        existingSession.location = loginInfo.location;
        existingSession.isActive = true;
      } else {
        // Add new session (limit to 10 active sessions)
        if (user.loginSessions.length >= 10) {
          // Remove oldest inactive session or oldest session if all active
          const inactiveSessions = user.loginSessions.filter(
            (s) => !s.isActive
          );
          if (inactiveSessions.length > 0) {
            // Remove oldest inactive session
            const oldestInactive = inactiveSessions.sort(
              (a, b) => a.lastActivity - b.lastActivity
            )[0];
            user.loginSessions = user.loginSessions.filter(
              (s) => s._id.toString() !== oldestInactive._id.toString()
            );
          } else {
            // Remove oldest session overall
            user.loginSessions.sort((a, b) => a.lastActivity - b.lastActivity);
            user.loginSessions.shift();
          }
        }

        user.loginSessions.push({
          deviceFingerprint: loginInfo.deviceFingerprint,
          ip: loginInfo.ip,
          userAgent: loginInfo.userAgent,
          location: loginInfo.location,
          lastActivity: new Date(),
          isActive: true,
        });

        // Send new device login notification
        try {
          await AuthNotifications.sendNewDeviceLogin(
            user._id,
            {
              username: user.username,
              email: user.email,
            },
            {
              ipAddress: loginInfo.ip,
              userAgent: loginInfo.userAgent,
              location: loginInfo.location || "Unknown location",
              loginTime: new Date(),
            }
          );
          logger.info(`New device login notification sent to ${user.email}`);
        } catch (notificationError) {
          logger.error(
            `Failed to send new device login notification to ${user.email}:`,
            {
              error: notificationError.message,
              userId: user._id,
            }
          );
        }
      }

      await user.save();
    }
  } catch (error) {
    logger.error("Error logging successful login:", {
      error: error.message,
      stack: error.stack,
      userId,
      loginInfo,
    });
  }
}

/**
 * Clear login attempts on successful login using Redis
 */
async function clearLoginAttempts(email, ip) {
  try {
    const redisClient = getRedisClient();
    const cacheKey = `login_attempts_${email}_${ip}`;

    // Only clear from Redis if available
    if (redisClient && redisClient.isReady) {
      // Delete the login attempts counter
      await redisClient.del(cacheKey);
      logger.info(`Cleared login attempts for ${email} from IP: ${ip}`);
    }
  } catch (error) {
    logger.error("Error clearing login attempts:", {
      error: error.message,
      stack: error.stack,
      email,
      ip,
    });
  }
}

/**
 * Enhanced refresh access token with rotation and family tracking
 */
async function refreshAccessToken(refreshToken) {
  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { id: userId, family: tokenFamily } = decoded;

    if (!userId) {
      throw new Error("Invalid refresh token format");
    }

    // Find the user and check if refresh token exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Clean up expired refresh tokens first
    const currentTime = new Date();
    const validTokens = user.refreshTokens.filter(
      (tokenObj) =>
        new Date(tokenObj.expiresAt) > currentTime &&
        tokenObj.isActive !== false
    );

    // Update user if we removed any expired tokens
    if (validTokens.length !== user.refreshTokens.length) {
      await User.findByIdAndUpdate(userId, {
        $set: { refreshTokens: validTokens },
      });
      user.refreshTokens = validTokens;
      logger.info(
        `Cleaned up ${
          user.refreshTokens.length - validTokens.length
        } expired refresh tokens for user ${userId}`
      );
    }

    // Check if the refresh token exists and validate token family
    const now = new Date();
    const tokenIndex = user.refreshTokens.findIndex((tokenObj) => {
      const isTokenMatch = tokenObj.token === refreshToken;
      const isNotExpired = new Date(tokenObj.expiresAt) > now;
      const isActive = tokenObj.isActive !== false;

      return isTokenMatch && isNotExpired && isActive;
    });

    if (tokenIndex === -1) {
      // Check if this token family has been compromised
      const familyTokenExists = user.refreshTokens.some(
        (tokenObj) => tokenObj.family === tokenFamily
      );

      if (familyTokenExists && tokenFamily) {
        // Potential token theft detected - invalidate all tokens in family
        logger.warn(
          "Potential refresh token theft detected - invalidating token family:",
          {
            userId,
            tokenFamily,
            tokenPreview: refreshToken.substring(0, 20) + "...",
          }
        );

        await User.findByIdAndUpdate(userId, {
          $pull: { refreshTokens: { family: tokenFamily } },
        });

        throw new Error("Token theft detected - all tokens invalidated");
      }

      // Log detailed information for debugging
      logger.warn("Refresh token validation failed:", {
        userId,
        hasRefreshTokens: user.refreshTokens.length > 0,
        tokenCount: user.refreshTokens.length,
        currentTime: now.toISOString(),
        tokenPreview: refreshToken.substring(0, 20) + "...",
        tokenFamily,
      });
      throw new Error("Invalid or expired refresh token");
    }

    // Generate new session ID for token rotation
    const newSessionId = crypto.randomUUID();
    const newTokenFamily = crypto.randomUUID();

    // Generate new access token with session ID
    const accessToken = generateToken(user, newSessionId);

    // Generate new refresh token with new family for rotation
    const newRefreshToken = generateRefreshToken(
      user,
      newSessionId,
      newTokenFamily
    );

    // Remove old refresh token and store new one atomically
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { token: refreshToken } },
    });

    await storeRefreshToken(userId, newRefreshToken, newTokenFamily);

    // Log successful token rotation
    logger.info("Refresh token rotated successfully:", {
      userId,
      oldTokenFamily: tokenFamily,
      newTokenFamily,
      sessionId: newSessionId,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user,
      sessionId: newSessionId,
    };
  } catch (error) {
    logger.error("Refresh token error:", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Get user's active login sessions
 * @param {String} userId - User ID
 * @returns {Array} Array of active login sessions
 */
const getActiveSessions = async (userId, currentDeviceFingerprint = null) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Filter active sessions and sort by last activity
    const activeSessions = user.loginSessions
      .filter((session) => session.isActive)
      .sort((a, b) => b.lastActivity - a.lastActivity)
      .map((session) => ({
        id: session._id,
        deviceFingerprint: session.deviceFingerprint,
        ip: session.ip,
        userAgent: session.userAgent,
        location: session.location,
        lastActivity: session.lastActivity,
        isCurrent: currentDeviceFingerprint
          ? session.deviceFingerprint === currentDeviceFingerprint
          : session.deviceFingerprint === user.currentDeviceFingerprint,
      }));

    return activeSessions;
  } catch (error) {
    logger.error("Error getting active sessions:", {
      error: error.message,
      stack: error.stack,
      userId,
    });
    throw new Error("Failed to get active sessions");
  }
};

/**
 * Revoke a specific login session
 * @param {String} userId - User ID
 * @param {String} sessionId - Session ID to revoke
 * @returns {String} Success message
 */
const revokeSession = async (userId, sessionId, revokeInfo = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const session = user.loginSessions.id(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Mark session as inactive
    session.isActive = false;
    await user.save();

    // Log session termination activity
    try {
      await AuthActivityLogger.logSessionTermination(userId, {
        sessionId,
        ip: revokeInfo.ip,
        userAgent: revokeInfo.userAgent,
        terminatedBy: "user",
      });
    } catch (activityError) {
      logger.warn("Failed to log session termination activity", {
        error: activityError.message,
        userId,
        sessionId,
      });
    }

    logger.info(`Session revoked for user ${userId}`, {
      sessionId,
      ip: session.ip,
      userAgent: session.userAgent,
    });

    return "Session revoked successfully";
  } catch (error) {
    logger.error("Error revoking session:", {
      error: error.message,
      stack: error.stack,
      userId,
      sessionId,
    });
    throw new Error("Failed to revoke session");
  }
};

/**
 * Revoke all sessions except current
 * @param {String} userId - User ID
 * @param {String} currentDeviceFingerprint - Current device fingerprint to keep
 * @returns {String} Success message
 */
const revokeAllOtherSessions = async (userId, currentDeviceFingerprint) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Mark all other sessions as inactive
    user.loginSessions.forEach((session) => {
      if (session.deviceFingerprint !== currentDeviceFingerprint) {
        session.isActive = false;
      }
    });

    await user.save();

    logger.info(`All other sessions revoked for user ${userId}`, {
      currentDeviceFingerprint,
    });

    return "All other sessions revoked successfully";
  } catch (error) {
    logger.error("Error revoking all other sessions:", {
      error: error.message,
      stack: error.stack,
      userId,
    });
    throw new Error("Failed to revoke all other sessions");
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
  generateRefreshToken,
  refreshAccessToken,
  verifyOtp,
  resendOtp,
  // OAuth providers management
  getLinkedProviders,
  linkProvider,
  unlinkProvider,
  storeRefreshToken,
  // 2FA functions
  generate2FASecret,
  enable2FA,
  verify2FALogin,
  disable2FA,
  get2FAStatus,
  generateNewBackupCodes,
  complete2FALogin,
  completeOAuthLogin,
  // Session management functions
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
};
