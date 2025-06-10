const authService = require("../services/authService");
const jwt = require("jsonwebtoken");
const { storeRefreshToken } = require("../services/authService");
const User = require("../models/User");
// Determine front-end URL for redirects
const frontUrl =
  process.env.NODE_ENV === "development"
    ? process.env.FRONTEND_URL_DEV
    : process.env.FRONTEND_URL_PROD;

// Register a new user
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

    const result = await authService.registerUser({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    // Do not set cookies yet, require OTP verification
    res.status(201).json({
      success: true,
      otpSent: result.otpSent || true,
      user: result.user,
      message:
        result.message ||
        "OTP sent to your email. Please verify to activate your account.",
    });
  } catch (error) {
    let statusCode = 400;
    let message = error.message;

    if (error.message.includes("Email already registered")) {
      statusCode = 409; // Conflict
      message =
        "An account with this email already exists. Please use a different email or try logging in.";
    } else if (error.message.includes("duplicate key")) {
      statusCode = 409;
      if (error.message.includes("username")) {
        message =
          "This username is already taken. Please choose a different username.";
      } else if (error.message.includes("email")) {
        message = "An account with this email already exists.";
      }
    }

    res.status(statusCode).json({
      success: false,
      message: message,
    });
  }
};

// 2FA OTP verification after signup
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP required" });
    }

    const result = await authService.verifyOtp(email, otp);

    if (!result.user) {
      return res.status(400).json({
        success: false,
        message: "OTP verification failed",
      });
    }

    // Record user session and get session record
    const session = await authService.addSession(result.user.id, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    const payload = { id: result.user.id, sessionId: session._id.toString() };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });
    // Store the new refresh token for rotation
    await storeRefreshToken(result.user.id, refreshToken);
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };
    res.cookie("token", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
    });
    res.status(200).json({
      success: true,
      user: result.user,
      sessionId: session._id.toString(),
      message: "Account verified successfully",
    });
  } catch (error) {
    const statusCode = error.message.includes("User not found") ? 404 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    const result = await authService.loginUser(email, password);

    // Handle unverified user case
    if (result.needsVerification) {
      return res.status(200).json({
        success: false,
        needsVerification: true,
        userId: result.userId,
        email: result.email,
        message: result.message,
      });
    }

    // If 2FA is required, check for remembered device
    if (result.requires2FA) {
      // Check for remembered device session
      const sessions = await authService.getSessions(result.userId);
      const remembered = sessions.find(
        (s) =>
          s.ip === req.ip &&
          s.userAgent === req.headers["user-agent"] &&
          s.rememberedUntil &&
          new Date(s.rememberedUntil) > new Date()
      );
      if (remembered) {
        // Skip 2FA and log in directly
        const user = await User.findById(result.userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        const session = await authService.addSession(user._id, {
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        });
        const payload = { id: user._id, sessionId: session._id.toString() };
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN,
        });
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
        });
        await storeRefreshToken(user._id, refreshToken);
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge:
            parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) *
            24 *
            60 *
            60 *
            1000,
        };
        res.cookie("token", accessToken, cookieOptions);
        res.cookie("refreshToken", refreshToken, {
          ...cookieOptions,
          maxAge:
            (parseInt(process.env.JWT_REFRESH_EXPIRES_IN, 10) || 7) *
            24 *
            60 *
            60 *
            1000,
        });
        return res.status(200).json({
          success: true,
          user: { id: user._id, username: user.username, email: user.email },
          sessionId: session._id.toString(),
        });
      }
      // Otherwise require 2FA
      return res.status(200).json({
        success: true,
        requires2FA: true,
        userId: result.userId,
        message: result.message,
      });
    }

    // Normal login flow
    if (!result.user) {
      return res.status(400).json({
        success: false,
        message: "Login failed",
      });
    }

    const { user } = result;
    // Record user session and get session record
    const session = await authService.addSession(user._id, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    const payload = { id: user._id, sessionId: session._id.toString() };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });
    // Store the new refresh token for rotation
    await storeRefreshToken(user._id, refreshToken);
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };
    res.cookie("token", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
    });
    res.status(200).json({
      success: true,
      user: { id: user._id, username: user.username, email: user.email },
      sessionId: session._id.toString(),
    });
  } catch (error) {
    // Return 400 for login validation errors to avoid triggering refresh token interceptor
    // 401 should only be used for expired/invalid tokens, not login failures
    res.status(400).json({ success: false, message: error.message });
  }
};

// Send password reset email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email address" });
    }
    const frontendUrl =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;
    const result = await authService.forgotPassword(email, frontendUrl);
    res.status(200).json({ success: true, message: result });
  } catch (error) {
    // Don't reveal if email exists or not for security reasons
    if (error.message.includes("User with this email does not exist")) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// Reset password using token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide new password" });
    }
    const result = await authService.resetPassword(token, password);
    res.status(200).json({ success: true, message: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Remove current session record based on IP and user-agent
    try {
      const sessions = await authService.getSessions(userId);
      const currentAgent = req.headers["user-agent"];
      const currentSession = sessions.find(
        (s) => s.userAgent === currentAgent && s.ip === req.ip
      );

      if (currentSession) {
        await authService.deleteSession(userId, currentSession._id.toString());
      }
    } catch (sessionError) {
      console.error("Error removing session:", sessionError);
      // Continue with logout even if session removal fails
    }

    // Call logout service
    const result = await authService.logoutUser(userId);

    // Clear authentication cookies
    const cookieOptions = {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    res.cookie("token", "none", cookieOptions);
    res.cookie("refreshToken", "none", cookieOptions);

    res.status(200).json({
      success: true,
      message: result || "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    // Still clear cookies even if there's an error
    const cookieOptions = {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    res.cookie("token", "none", cookieOptions);
    res.cookie("refreshToken", "none", cookieOptions);

    res.status(500).json({
      success: false,
      message: error.message || "An error occurred during logout",
    });
  }
};

// Get current authenticated user
const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Return user data and current session ID
    res.status(200).json({ user: req.user, sessionId: req.sessionId });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// DRY: Unified OAuth callback handler
const handleOAuthCallback = (providerName) => async (req, res) => {
  try {
    const user = req.user;
    const front =
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV
        : process.env.FRONTEND_URL_PROD;
    // If user has 2FA enabled, check for remembered device
    if (user.twoFactorEnabled) {
      // Check previous sessions for rememberedUntil > now
      const sessions = await authService.getSessions(user._id);
      const remembered = sessions.find(
        (s) =>
          s.ip === req.ip &&
          s.userAgent === req.headers["user-agent"] &&
          s.rememberedUntil &&
          new Date(s.rememberedUntil) > new Date()
      );
      if (remembered) {
        // Skip 2FA: create a new session and issue tokens
        const session = await authService.addSession(user._id, {
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        });
        const payload = {
          id: user._id,
          sessionId: session._id.toString(),
        };
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN,
        });
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
        });
        await storeRefreshToken(user._id, refreshToken);
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        };
        res.cookie("token", accessToken, {
          ...cookieOptions,
          maxAge: 24 * 60 * 60 * 1000,
        });
        res.cookie("refreshToken", refreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.redirect(`${front}/dashboard/profile`);
      }
      // Otherwise require 2FA
      return res.redirect(
        `${front}/auth/login?oauth2fa=true&userId=${user._id}`
      );
    }

    // No 2FA or not enabled: record session and issue tokens
    const session = await authService.addSession(user._id, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    // Generate tokens including sessionId
    const payload = { id: user._id, sessionId: session._id.toString() };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };
    res.cookie("token", accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.redirect(`${front}/dashboard/profile`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const googleAuthCallback = handleOAuthCallback("google");
const githubAuthCallback = handleOAuthCallback("github");

// Refresh token logic
const refreshToken = async (req, res) => {
  try {
    const incomingToken = req.cookies.refreshToken;

    if (!incomingToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not found. Please log in again.",
      });
    }

    // Verify token signature and get payload
    let decoded;
    try {
      decoded = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired refresh token. Please log in again.",
      });
    }

    // Find user and check token rotation list
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register or log in again.",
      });
    }

    // Check if refresh token exists in user's token list
    const tokenIndex = user.refreshTokens.findIndex(
      (rt) => rt.token === incomingToken
    );

    if (tokenIndex === -1) {
      // Token not found - could be revoked or expired
      return res.status(403).json({
        success: false,
        message:
          "Refresh token has been revoked or is invalid. Please log in again.",
      });
    }

    // Check if token is expired
    const tokenData = user.refreshTokens[tokenIndex];
    if (tokenData.expiresAt && new Date() > tokenData.expiresAt) {
      // Remove expired token
      user.refreshTokens.splice(tokenIndex, 1);
      await user.save();
      return res.status(403).json({
        success: false,
        message: "Refresh token has expired. Please log in again.",
      });
    }

    // Remove the used refresh token (rotation)
    user.refreshTokens.splice(tokenIndex, 1);
    await user.save();

    // Generate new tokens with same sessionId if it exists
    const sessionId = decoded.sessionId || new Date().getTime().toString();
    const payload = { id: decoded.id, sessionId: sessionId };

    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
    const newRefreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });

    // Store the new refresh token for rotation
    await storeRefreshToken(decoded.id, newRefreshToken);

    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    res.cookie("token", newAccessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Tokens refreshed successfully",
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during token refresh. Please try again.",
    });
  }
};

// Resend OTP after signup
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email required" });
    }

    const result = await authService.resendOtp(email);
    res.status(200).json({ success: true, message: result });
  } catch (error) {
    let statusCode = 400;

    if (error.message.includes("User not found")) {
      statusCode = 404;
    } else if (error.message.includes("already verified")) {
      statusCode = 409; // Conflict
    } else if (error.message.includes("Failed to send")) {
      statusCode = 500; // Server error
    }

    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// New controller methods
// Get linked OAuth providers
const getLinkedProviders = async (req, res) => {
  try {
    const providers = await authService.getLinkedProviders(req.user._id);
    res.status(200).json({ success: true, providers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Link provider callback
const linkProviderCallback = (providerName) => async (req, res) => {
  try {
    const userId = req.user._id;
    const providerId = req.account.id;
    const profileImage =
      req.account.photos &&
      req.account.photos[0] &&
      req.account.photos[0].value;
    await authService.linkProvider(
      userId,
      providerName,
      providerId,
      profileImage
    );
    // Redirect to profile on front-end
    return res.redirect(`${frontUrl}/dashboard/profile`);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Unlink OAuth provider
const unlinkProvider = async (req, res) => {
  try {
    const provider = req.params.provider;
    await authService.unlinkProvider(req.user._id, provider);
    res.status(200).json({ success: true, message: `${provider} unlinked` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get user sessions
const getSessions = async (req, res) => {
  try {
    const sessions = await authService.getSessions(req.user._id);
    res.status(200).json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a session
const deleteSession = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    // Prevent deleting the current session
    const sessions = await authService.getSessions(req.user._id);
    const target = sessions.find((s) => s._id.toString() === sessionId);
    if (!target) throw new Error("Session not found");
    if (target.userAgent === req.headers["user-agent"]) {
      throw new Error("Cannot delete current session");
    }
    await authService.deleteSession(req.user._id, sessionId);
    res.status(200).json({ success: true, message: "Session removed" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// =============================================================================
// 2FA (Two-Factor Authentication) Controller Functions
// =============================================================================

// Generate 2FA secret
const generate2FASecret = async (req, res) => {
  try {
    const result = await authService.generate2FASecret(req.user.id);
    res.status(200).json({
      success: true,
      data: result,
      message: "2FA secret generated successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Enable 2FA
const enable2FA = async (req, res) => {
  try {
    const { token, secret } = req.body;
    if (!token || !secret) {
      return res.status(400).json({
        success: false,
        message: "Please provide verification token and secret",
      });
    }
    const result = await authService.enable2FA(req.user.id, token, secret);
    res.status(200).json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Verify 2FA during login
const verify2FALogin = async (req, res) => {
  try {
    const { token, userId } = req.body;
    if (!token || !userId) {
      return res.status(400).json({
        success: false,
        message: "Please provide verification token and user ID",
      });
    }

    const verificationResult = await authService.verify2FALogin(userId, token);
    if (!verificationResult.verified) {
      return res.status(400).json({
        success: false,
        message: verificationResult.error || "Invalid verification code",
      });
    }

    // Complete login by generating tokens
    const loginResult = await authService.complete2FALogin(userId);

    // Set cookies (using same names as regular login)
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };
    res.cookie("token", loginResult.token, cookieOptions);
    res.cookie("refreshToken", loginResult.refreshToken, {
      ...cookieOptions,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(200).json({
      success: true,
      data: {
        user: loginResult.user,
        method: verificationResult.method,
      },
      message: "2FA verification successful",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Disable 2FA
const disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please provide your password",
      });
    }
    const result = await authService.disable2FA(req.user.id, password);
    res.status(200).json({
      success: true,
      message: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get 2FA status
const get2FAStatus = async (req, res) => {
  try {
    const result = await authService.get2FAStatus(req.user.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Generate new backup codes
const generateNewBackupCodes = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please provide your password",
      });
    }
    const result = await authService.generateNewBackupCodes(
      req.user.id,
      password
    );
    res.status(200).json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  logout,
  getMe,
  googleAuthCallback,
  githubAuthCallback,
  refreshToken,
  verifyOtp,
  resendOtp,
  getLinkedProviders,
  linkProviderCallback,
  unlinkProvider,
  getSessions,
  deleteSession,
  // 2FA methods
  generate2FASecret,
  enable2FA,
  verify2FALogin,
  disable2FA,
  get2FAStatus,
  generateNewBackupCodes,
};
