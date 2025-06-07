const authService = require("../services/authService");
const userService = require("../services/userService");
const jwt = require("jsonwebtoken");
const { storeRefreshToken } = require("../services/authService");
const User = require("../models/User");

// Register a new user
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username, email, and password",
      });
    }
    const result = await authService.registerUser({
      username,
      email,
      password,
    });
    // Do not set cookies yet, require OTP verification
    res.status(201).json({
      success: true,
      otpSent: true,
      user: result.user,
      message:
        "OTP sent to your email. Please verify to activate your account.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
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
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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
    // Handle two-factor requirement or remembered device
    if (result.requires2FA) {
      // Check if this device was remembered
      const sessions = await authService.getSessions(result.userId);
      const remembered = sessions.find(
        (s) =>
          s.ip === req.ip &&
          s.userAgent === req.headers["user-agent"] &&
          s.rememberedUntil &&
          new Date(s.rememberedUntil) > new Date()
      );
      if (remembered) {
        // Skip 2FA: fetch full user and proceed to login
        const user = await User.findById(result.userId);
        // Record a new session or reuse
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
    res.status(401).json({ success: false, message: error.message });
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
    // Remove current session record based on IP and user-agent
    const sessions = await authService.getSessions(userId);
    const currentAgent = req.headers["user-agent"];
    const currentSession = sessions.find(
      (s) => s.userAgent === currentAgent && s.ip === req.ip
    );
    if (currentSession) {
      await authService.deleteSession(userId, currentSession._id.toString());
    }
    const result = await authService.logoutUser(userId);
    // Clear authentication cookies
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.cookie("refreshToken", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.status(200).json({ success: true, message: result });
  } catch (error) {
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
    // Record user session and get session
    const session = await authService.addSession(user._id, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    // If user has 2FA enabled, redirect to a front-end OTP page instead of issuing tokens
    if (user.twoFactorEnabled) {
      const front =
        process.env.NODE_ENV === "development"
          ? process.env.FRONTEND_URL_DEV
          : process.env.FRONTEND_URL_PROD;
      // Redirect to frontend OAuth login with 2FA parameters
      return res.redirect(
        `${front}/auth/login?oauth2fa=true&userId=${user._id}`
      );
    }
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
    res.redirect(
      process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_URL_DEV + "/profile"
        : process.env.FRONTEND_URL_PROD + "/profile"
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const googleAuthCallback = handleOAuthCallback("google");
const githubAuthCallback = handleOAuthCallback("github");
const facebookAuthCallback = handleOAuthCallback("facebook");

// Refresh token logic
const refreshToken = async (req, res) => {
  try {
    const incomingToken = req.cookies.refreshToken;
    if (!incomingToken)
      return res
        .status(401)
        .json({ success: false, message: "No refresh token" });
    // Verify token signature and get payload
    jwt.verify(
      incomingToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, decoded) => {
        if (err)
          return res
            .status(403)
            .json({ success: false, message: "Invalid refresh token" });
        // Find user and check token rotation list
        const user = await require("../models/User").findById(decoded.id);
        if (!user)
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        const tokenIndex = user.refreshTokens.findIndex(
          (rt) => rt.token === incomingToken
        );
        if (tokenIndex === -1)
          return res.status(403).json({
            success: false,
            message: "Refresh token revoked or not found",
          });
        // Remove the used refresh token (rotation)
        user.refreshTokens.splice(tokenIndex, 1);
        await user.save();
        // Generate new tokens with same sessionId
        const payload = { id: decoded.id, sessionId: decoded.sessionId };
        const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN || "1d",
        });
        const newRefreshToken = jwt.sign(
          payload,
          process.env.JWT_REFRESH_SECRET,
          {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
          }
        );
        // Store the new refresh token for rotation
        await storeRefreshToken(decoded.id, newRefreshToken);
        // Set cookies
        res.cookie("token", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 24 * 60 * 60 * 1000,
        });
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({ success: true });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    res.status(400).json({ success: false, message: error.message });
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
    res.redirect(process.env.FRONTEND_URL_DEV + "/profile");
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

// 2FA Controller Functions

// Generate 2FA secret
const generate2FASecret = async (req, res) => {
  try {
    const result = await userService.generate2FASecret(req.user.id);
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
    const result = await userService.enable2FA(req.user.id, token, secret);
    res
      .status(200)
      .json({ success: true, data: result, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Verify 2FA during login
const verify2FALogin = async (req, res) => {
  try {
    const { token, userId, rememberDevice } = req.body;
    if (!token || !userId) {
      return res.status(400).json({
        success: false,
        message: "Please provide verification token and user ID",
      });
    }
    const verificationResult = await userService.verify2FALogin(userId, token);
    if (!verificationResult.verified) {
      return res.status(400).json({
        success: false,
        message: verificationResult.error || "Invalid verification code",
      });
    }
    // Register session (with optional "remember this device")
    const rememberUntil = rememberDevice
      ? new Date(
          Date.now() +
            (parseInt(process.env.REMEMBER_DAYS, 10) || 30) *
              24 *
              60 *
              60 *
              1000
        )
      : undefined;
    const session = await authService.addSession(userId, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      rememberedUntil: rememberUntil,
    });
    // Generate tokens for this session
    const payload = { id: userId, sessionId: session._id.toString() };
    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    const newRefreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });
    // Store and rotate refresh token
    await storeRefreshToken(userId, newRefreshToken);
    // Set cookies
    const opts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:
        parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) * 24 * 60 * 60 * 1000,
    };
    res.cookie("token", newAccessToken, opts);
    res.cookie("refreshToken", newRefreshToken, {
      ...opts,
      maxAge:
        (parseInt(process.env.JWT_REFRESH_EXPIRES_IN, 10) || 7) *
        24 *
        60 *
        60 *
        1000,
    });
    // Return method and sessionId
    res
      .status(200)
      .json({
        success: true,
        method: verificationResult.method,
        sessionId: session._id.toString(),
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
      return res
        .status(400)
        .json({ success: false, message: "Please provide your password" });
    }
    const result = await userService.disable2FA(req.user.id, password);
    res.status(200).json({ success: true, message: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get 2FA status
const get2FAStatus = async (req, res) => {
  try {
    const result = await userService.get2FAStatus(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Generate new backup codes
const generateNewBackupCodes = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide your password" });
    }
    const result = await userService.generateNewBackupCodes(
      req.user.id,
      password
    );
    res
      .status(200)
      .json({ success: true, data: result, message: result.message });
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
  facebookAuthCallback,
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
