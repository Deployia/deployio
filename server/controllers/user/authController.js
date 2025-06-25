// Clean Auth Controller - Pure JWT Implementation
// No session tracking, simplified authentication flow

const user = require("@services/user");
const jwt = require("jsonwebtoken");
const logger = require("@config/logger");
const { getSafeUserData } = require("@utils/userDataFilter");

/**
 * Generate JWT tokens without session tracking
 * @param {string} userId - User ID
 * @returns {object} - Access and refresh tokens
 */
const generateTokens = (userId) => {
  const payload = { id: userId };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

  return { accessToken, refreshToken };
};

/**
 * Set authentication cookies
 * @param {object} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  // Access token cookie (shorter expiry)
  res.cookie("token", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Refresh token cookie (longer expiry)
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clear authentication cookies
 * @param {object} res - Express response object
 */
const clearAuthCookies = (res) => {
  res.clearCookie("token");
  res.clearCookie("refreshToken");
};

// Determine front-end URL for redirects
const frontUrl =
  process.env.NODE_ENV === "development"
    ? process.env.FRONTEND_URL_DEV
    : process.env.FRONTEND_URL_PROD;

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username, email, and password",
      });
    }

    // Basic validation
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 3 characters long",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const result = await user.auth.registerUser({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    // No immediate token generation - require email verification
    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      data: {
        userId: result.user.id,
        emailSent: result.emailSent,
        requiresVerification: true,
      },
    });
  } catch (error) {
    logger.error("Registration error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verify email with OTP
 */
const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and OTP",
      });
    }

    const result = await user.auth.verifyEmail({
      email: email.toLowerCase().trim(),
      otp,
    });

    if (!result.user) {
      return res.status(400).json({
        success: false,
        message: "Email verification failed",
      });
    }

    // Generate tokens and set cookies
    const { accessToken, refreshToken } = generateTokens(result.user.id);
    setAuthCookies(res, accessToken, refreshToken);

    logger.info(`User email verified and logged in: ${result.user.email}`);

    res.json({
      success: true,
      message: "Email verified successfully",
      data: {
        user: getSafeUserData(result.user),
        requiresVerification: false,
      },
    });
  } catch (error) {
    logger.error("Email verification error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const result = await user.auth.loginUser({
      email: email.toLowerCase().trim(),
      password,
    });

    if (!result.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is verified
    if (!result.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
        data: {
          requiresVerification: true,
          userId: result.user.id,
        },
      });
    }

    // Check if account is locked
    if (result.user.isLocked) {
      return res.status(423).json({
        success: false,
        message: "Account temporarily locked. Please try again later.",
      });
    }

    // Generate tokens and set cookies
    const { accessToken, refreshToken } = generateTokens(result.user.id);
    setAuthCookies(res, accessToken, refreshToken);

    // Update last login
    await user.auth.updateLastLogin(result.user.id, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    logger.info(`User logged in: ${result.user.email}`);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: getSafeUserData(result.user),
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    // Clear authentication cookies
    clearAuthCookies(res);

    // Optional: Add token to blacklist if using Redis
    // await addTokenToBlacklist(req.cookies.token);

    logger.info(`User logged out: ${req.user?.email || "Unknown"}`);

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during logout",
    });
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: clientRefreshToken } = req.cookies;

    if (!clientRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not provided",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      clientRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    // Check if user still exists
    const userRecord = await user.auth.getUserById(decoded.id);
    if (!userRecord) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      decoded.id
    );
    setAuthCookies(res, accessToken, newRefreshToken);

    logger.info(`Token refreshed for user: ${userRecord.email}`);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        user: getSafeUserData(userRecord),
      },
    });
  } catch (error) {
    logger.error("Token refresh error:", error);

    // Clear invalid cookies
    clearAuthCookies(res);

    res.status(401).json({
      success: false,
      message: "Token refresh failed. Please log in again.",
    });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: getSafeUserData(req.user),
      },
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
    });
  }
};

/**
 * Google OAuth callback
 */
const googleCallback = async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.authInfo;
    const googleProfile = req.user;

    // Generate our JWT tokens
    const { accessToken: jwtAccessToken, refreshToken: jwtRefreshToken } =
      generateTokens(googleProfile.id);
    setAuthCookies(res, jwtAccessToken, jwtRefreshToken);

    logger.info(`Google OAuth login: ${googleProfile.email}`);

    res.redirect(`${frontUrl}/dashboard?auth=success`);
  } catch (error) {
    logger.error("Google OAuth callback error:", error);
    res.redirect(`${frontUrl}/auth/login?error=oauth_failed`);
  }
};

/**
 * GitHub OAuth callback (for authentication only)
 */
const githubCallback = async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.authInfo;
    const githubProfile = req.user;

    // Generate our JWT tokens
    const { accessToken: jwtAccessToken, refreshToken: jwtRefreshToken } =
      generateTokens(githubProfile.id);
    setAuthCookies(res, jwtAccessToken, jwtRefreshToken);

    logger.info(`GitHub OAuth login: ${githubProfile.email}`);

    res.redirect(`${frontUrl}/dashboard?auth=success`);
  } catch (error) {
    logger.error("GitHub OAuth callback error:", error);
    res.redirect(`${frontUrl}/auth/login?error=oauth_failed`);
  }
};

/**
 * Forgot password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide email address",
      });
    }

    const result = await user.auth.forgotPassword({
      email: email.toLowerCase().trim(),
    });

    // Always return success for security (don't reveal if email exists)
    res.json({
      success: true,
      message:
        "If an account exists with this email, a reset link has been sent.",
      data: {
        emailSent: result.emailSent,
      },
    });
  } catch (error) {
    logger.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
    });
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide reset token and new password",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const result = await user.auth.resetPassword({
      token,
      password,
    });

    res.json({
      success: true,
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    logger.error("Reset password error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Resend verification email
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide email address",
      });
    }

    const result = await user.auth.resendVerificationEmail({
      email: email.toLowerCase().trim(),
    });

    res.json({
      success: true,
      message: "Verification email sent successfully",
      data: {
        emailSent: result.emailSent,
      },
    });
  } catch (error) {
    logger.error("Resend verification error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  refreshToken,
  getProfile,
  googleCallback,
  githubCallback,
  forgotPassword,
  resetPassword,
  resendVerification,
  // Utility functions
  generateTokens,
  setAuthCookies,
  clearAuthCookies,
};
