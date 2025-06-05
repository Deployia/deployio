const authService = require("../services/authService");
const jwt = require("jsonwebtoken");

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
    // Set cookies after successful verification
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };
    res.cookie("token", result.token, cookieOptions);
    res.cookie("refreshToken", result.refreshToken, {
      ...cookieOptions,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    res.status(200).json({
      success: true,
      user: result.user,
      message: "Account verified and logged in successfully!",
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
    const result = await authService.loginUser(email, password); // Check if user needs verification
    if (result.needsVerification) {
      return res.status(200).json({
        success: true,
        needsVerification: true,
        email: result.email,
        userId: result.userId,
        message: result.message,
      });
    }

    // Check if 2FA is required
    if (result.requires2FA) {
      // Return 2FA requirement response without setting cookies
      return res.status(200).json({
        success: true,
        requires2FA: true,
        userId: result.userId,
        message: result.message,
      });
    }

    // Normal login flow (without 2FA)
    const { user, token, refreshToken } = result;
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };
    res.cookie("token", token, cookieOptions);
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    res.status(200).json({
      success: true,
      user: { id: user?._id, username: user?.username, email: user?.email },
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
    const result = await authService.logoutUser(userId);
    res.cookie("token", "none", {
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
    res.status(200).json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// DRY: Unified OAuth callback handler
const handleOAuthCallback = (providerName) => async (req, res) => {
  try {
    const user = req.user;
    const accessToken = jwt.sign({ id: user?._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
    const refreshToken = jwt.sign(
      { id: user?._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
    );
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
    res.redirect(process.env.FRONTEND_URL_DEV || "/");
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
    const token = req.cookies.refreshToken;
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "No refresh token" });
    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err)
        return res
          .status(403)
          .json({ success: false, message: "Invalid refresh token" });
      const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      });
      res.cookie("token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.json({ success: true });
    });
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
};
