// Clean Auth Controller - Pure JWT Implementation with Cookies
// Stateless JWT authentication using HTTP-only cookies

const authService = require("@services/user/authService");
const userService = require("@services/user/userService");
const logger = require("@config/logger");

/**
 * Extract login info from request
 * @param {object} req - Express request object
 * @returns {object} - Login information with device fingerprint
 */
const getLoginInfo = (req) => {
  return {
    ip: req.ip || req.connection.remoteAddress || "Unknown",
    userAgent: req.headers["user-agent"] || "Unknown",
    location: "Unknown", // Can be enhanced with geolocation service
    deviceFingerprint: generateDeviceFingerprint(req),
  };
};

/**
 * Generate a device fingerprint for login tracking
 * @param {object} req - Express request object
 * @returns {string} - Device fingerprint
 */
const generateDeviceFingerprint = (req) => {
  const crypto = require("crypto");
  const fingerprint = `${req.headers["user-agent"] || ""}|${
    req.headers["accept-language"] || ""
  }|${req.headers["accept-encoding"] || ""}`;
  return crypto
    .createHash("md5")
    .update(fingerprint)
    .digest("hex")
    .substring(0, 8);
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

    const result = await authService.registerUser(
      {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password,
      },
      getLoginInfo(req)
    );

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please verify your email with the OTP sent to your inbox.",
      data: {
        user: result.user,
        otpSent: result.otpSent,
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

    const loginInfo = getLoginInfo(req);

    const result = await authService.loginUser(
      email.toLowerCase().trim(),
      password,
      loginInfo
    );

    // Handle different login scenarios
    if (result.needsVerification) {
      return res.status(403).json({
        success: false,
        message: result.message,
        data: {
          needsVerification: true,
          email: result.email,
        },
      });
    }

    if (result.requires2FA) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          requires2FA: true,
          userId: result.userId,
        },
      });
    }

    // Successful login - set cookies and return user data
    setAuthCookies(res, result.token, result.refreshToken);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
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
 * Verify OTP for email verification
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and OTP",
      });
    }

    const result = await authService.verifyOtp(
      email.toLowerCase().trim(),
      otp,
      getLoginInfo(req)
    );

    // Set cookies using tokens from service
    setAuthCookies(res, result.token, result.refreshToken);

    res.json({
      success: true,
      message: "Email verified successfully",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    logger.error("OTP verification error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Resend OTP for email verification
 */
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide email",
      });
    }

    const message = await authService.resendOtp(email.toLowerCase().trim());

    res.json({
      success: true,
      message: message,
    });
  } catch (error) {
    logger.error("Resend OTP error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Forgot password - send reset email
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide email",
      });
    }

    const resetUrl = `${
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD
    }`;
    const message = await authService.forgotPassword(
      email.toLowerCase().trim(),
      resetUrl,
      getLoginInfo(req)
    );

    res.json({
      success: true,
      message: message,
    });
  } catch (error) {
    logger.error("Forgot password error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password: newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const message = await authService.resetPassword(
      token,
      newPassword,
      getLoginInfo(req)
    );

    res.json({
      success: true,
      message: message,
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
 * Logout user
 */
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const loginInfo = getLoginInfo(req);

    if (refreshToken) {
      await authService.logoutUser(
        req.user._id,
        refreshToken,
        loginInfo.deviceFingerprint
      );
    }

    // Clear authentication cookies
    clearAuthCookies(res);

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

    const result = await authService.refreshAccessToken(clientRefreshToken);

    // Use tokens from auth service (don't generate again)
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    logger.error("Token refresh error:", error.message);

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
const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
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
 * Generate 2FA secret
 */
const generate2FASecret = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await authService.generate2FASecret(userId);

    res.json({
      success: true,
      message: "2FA secret generated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Generate 2FA secret error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate 2FA secret",
      error: error.message,
    });
  }
};

/**
 * Enable 2FA
 */
const enable2FA = async (req, res) => {
  try {
    const userId = req.user._id;
    const { token, secret } = req.body;

    if (!token || !secret) {
      return res.status(400).json({
        success: false,
        message: "2FA token and secret are required",
      });
    }

    const result = await authService.enable2FA(userId, token, secret);

    res.json({
      success: true,
      message: "2FA enabled successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Enable 2FA error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verify 2FA during login
 */
const verify2FALogin = async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: "User ID and 2FA token are required",
      });
    }

    const result = await authService.verify2FALogin(userId, token);

    if (result.verified) {
      const loginInfo = {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        location: "Unknown",
      };

      const loginResult = await authService.complete2FALogin(userId, loginInfo);

      // Use tokens from auth service
      setAuthCookies(res, loginResult.token, loginResult.refreshToken);

      res.json({
        success: true,
        message: "2FA verification successful",
        data: {
          user: loginResult.user,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || "Invalid 2FA token",
      });
    }
  } catch (error) {
    logger.error("Verify 2FA login error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Disable 2FA
 */
const disable2FA = async (req, res) => {
  try {
    const userId = req.user._id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to disable 2FA",
      });
    }

    const message = await authService.disable2FA(userId, password);

    res.json({
      success: true,
      message: message,
    });
  } catch (error) {
    logger.error("Disable 2FA error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get 2FA status
 */
const get2FAStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const status = await authService.get2FAStatus(userId);

    res.json({
      success: true,
      message: "2FA status retrieved successfully",
      data: status,
    });
  } catch (error) {
    logger.error("Get 2FA status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get 2FA status",
      error: error.message,
    });
  }
};

/**
 * Generate new backup codes
 */
const generateNewBackupCodes = async (req, res) => {
  try {
    const userId = req.user._id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to generate new backup codes",
      });
    }

    const result = await authService.generateNewBackupCodes(userId, password);

    res.json({
      success: true,
      message: "New backup codes generated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Generate backup codes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate backup codes",
      error: error.message,
    });
  }
};

/**
 * Google OAuth callback
 */
const googleAuthCallback = async (req, res) => {
  try {
    // User is already authenticated by passport strategy
    const user = req.user;

    if (!user) {
      return res.redirect(
        `${
          process.env.FRONTEND_URL_DEV || process.env.FRONTEND_URL_PROD
        }/auth/login?error=oauth_failed`
      );
    }

    // Complete OAuth login through service
    const loginInfo = getLoginInfo(req);
    const result = await authService.completeOAuthLogin(user._id, loginInfo);

    // Set cookies using tokens from service
    setAuthCookies(res, result.token, result.refreshToken);

    // Redirect to frontend with success parameter
    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    // Check if there's a state parameter for redirect path
    const state = req.query.state;
    let redirectPath = "/dashboard";

    if (state) {
      try {
        const decodedState = decodeURIComponent(state);
        // Validate that it's a safe relative path
        if (
          decodedState.startsWith("/") &&
          !decodedState.startsWith("//") &&
          !decodedState.startsWith("/auth/")
        ) {
          redirectPath = decodedState;
        }
      } catch (e) {
        // Use default if state is invalid
        console.warn("Invalid OAuth state parameter:", state);
      }
    }

    res.redirect(`${frontUrl}${redirectPath}?oauth=success`);
  } catch (error) {
    logger.error("Google OAuth callback error:", error);
    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;
    res.redirect(`${frontUrl}/auth/login?error=oauth_error`);
  }
};

/**
 * GitHub OAuth callback
 */
const githubAuthCallback = async (req, res) => {
  try {
    // User is already authenticated by passport strategy
    const user = req.user;

    if (!user) {
      return res.redirect(
        `${
          process.env.FRONTEND_URL_DEV || process.env.FRONTEND_URL_PROD
        }/auth/login?error=oauth_failed`
      );
    }

    // Complete OAuth login through service
    const loginInfo = getLoginInfo(req);
    const result = await authService.completeOAuthLogin(user._id, loginInfo);

    // Set cookies using tokens from service
    setAuthCookies(res, result.token, result.refreshToken);

    // Redirect to frontend with success parameter
    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;

    // Check if there's a state parameter for redirect path
    const state = req.query.state;
    let redirectPath = "/dashboard";

    if (state) {
      try {
        const decodedState = decodeURIComponent(state);
        // Validate that it's a safe relative path
        if (
          decodedState.startsWith("/") &&
          !decodedState.startsWith("//") &&
          !decodedState.startsWith("/auth/")
        ) {
          redirectPath = decodedState;
        }
      } catch (e) {
        // Use default if state is invalid
        console.warn("Invalid OAuth state parameter:", state);
      }
    }

    res.redirect(`${frontUrl}${redirectPath}?oauth=success`);
  } catch (error) {
    logger.error("GitHub OAuth callback error:", error);
    const frontUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;
    res.redirect(`${frontUrl}/auth/login?error=oauth_error`);
  }
};

/**
 * Get active sessions
 */
const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentLoginInfo = getLoginInfo(req);
    const sessions = await authService.getActiveSessions(
      userId,
      currentLoginInfo.deviceFingerprint
    );

    res.json({
      success: true,
      message: "Active sessions retrieved successfully",
      data: {
        sessions,
      },
    });
  } catch (error) {
    logger.error("Get active sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get active sessions",
      error: error.message,
    });
  }
};

/**
 * Revoke a specific session
 */
const revokeSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    const result = await authService.revokeSession(
      userId,
      sessionId,
      getLoginInfo(req)
    );

    res.json({
      success: true,
      message: result,
    });
  } catch (error) {
    logger.error("Revoke session error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Revoke all other sessions except current
 */
const revokeAllOtherSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const loginInfo = getLoginInfo(req);

    const result = await authService.revokeAllOtherSessions(
      userId,
      loginInfo.deviceFingerprint
    );

    res.json({
      success: true,
      message: result,
    });
  } catch (error) {
    logger.error("Revoke all other sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to revoke sessions",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  logout,
  refreshToken,
  getMe,
  generate2FASecret,
  enable2FA,
  verify2FALogin,
  disable2FA,
  get2FAStatus,
  generateNewBackupCodes,
  googleAuthCallback,
  githubAuthCallback,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
};
