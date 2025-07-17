const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("@models/User");
const logger = require("@config/logger");
const AuthNotifications = require("./authNotifications");
const AuthActivityLogger = require("./authActivityLogger");
const { validatePasswordPolicy } = require("./passwordService");
const { checkAdaptiveRateLimit } = require("./securityService");

/**
 * Core Authentication Service - Pure JWT Implementation
 *
 * Handles core authentication business logic:
 * - User registration with email verification
 * - Login with email/password
 * - JWT token generation and validation
 * - Email verification flow
 */

/**
 * Generate JWT token for authentication
 * @param {Object} user - User document from MongoDB
 * @param {String} sessionId - Optional session ID
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

/**
 * Generate refresh token
 * @param {Object} user - User document from MongoDB
 * @param {String} sessionId - Optional session ID
 * @param {String} tokenFamily - Token family for rotation
 * @returns {String} Refresh token
 */
const generateRefreshToken = (user, sessionId = null, tokenFamily = null) => {
  const payload = {
    id: user?._id,
    sessionId: sessionId,
    family: tokenFamily || crypto.randomUUID(),
    type: "refresh",
  };
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "24h",
  });
};

/**
 * Generate OTP for email verification
 * @returns {String} 6-digit OTP
 */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Register a new user
 * @param {Object} userData - User data including username, email, password
 * @param {Object} registrationInfo - Additional registration information
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

    // Import security service functions
    const {
      checkRecentLoginAttempts,
      logFailedLoginAttempt,
      incrementFailedAttempts,
      clearLoginAttempts,
      logSuccessfulLogin,
    } = require("./securityService");

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
    }

    // Reset failed attempts on successful password verification
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    // Clear Redis-based login attempts on successful authentication
    await clearLoginAttempts(email, loginInfo.ip);

    // Check if user is verified - return verification status instead of throwing error
    if (!user.isVerified) {
      // Generate OTP if user is not verified
      const otp = generateOtp();
      const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

      user.otp = otp;
      user.otpExpire = otpExpire;
      await user.save();

      try {
        // Send OTP email via notification system
        await AuthNotifications.sendOTPVerification(
          user._id,
          { username: user.username, email: user.email },
          otp,
          true // this is a resend
        );

        logger.info(`Login OTP sent to unverified user ${user.email}`);
      } catch (error) {
        logger.error(`Failed to send login OTP to ${user.email}:`, {
          error: error.message,
          userId: user._id,
          email: user.email,
        });

        throw new Error(
          "Unable to send verification email. Please try again later."
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
    const { storeRefreshToken } = require("./sessionService");
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
    });
    throw error;
  }
};

/**
 * Verify OTP for email verification
 * @param {String} email - User email
 * @param {String} otp - OTP code
 * @param {Object} verificationInfo - Verification information
 * @returns {Object} Success message and tokens
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

  // Store refresh token
  const { storeRefreshToken } = require("./sessionService");
  await storeRefreshToken(user._id, refreshToken);

  return {
    user: { id: user?._id, username: user?.username, email: user?.email },
    token,
    refreshToken,
  };
};

/**
 * Resend OTP for email verification
 * @param {String} email - User email
 * @returns {Object} Success message
 */
const resendOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");
  if (user.isVerified) throw new Error("Email already verified");

  // Generate new OTP
  const otp = generateOtp();
  const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  user.otp = otp;
  user.otpExpire = otpExpire;
  await user.save();

  // Send OTP verification email
  try {
    await AuthNotifications.sendOTPVerification(
      user._id,
      { username: user.username, email: user.email },
      otp,
      true // this is a resend
    );

    logger.info(`OTP resent to ${email}`);
    return "OTP sent successfully";
  } catch (error) {
    logger.error(`Failed to resend OTP to ${email}:`, {
      error: error.message,
      userId: user._id,
      email: email,
    });

    throw new Error("Unable to send OTP. Please try again later.");
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  generateOtp,
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
};
