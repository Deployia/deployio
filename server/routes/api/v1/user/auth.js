// Auth Routes - /api/v1/users/auth/*
// Authentication endpoints using new modular controller structure

const express = require("express");
const { user } = require("@controllers");
const { protect } = require("@middleware/authMiddleware");
const passport = require("passport");
// OAuth redirect middlewares for capturing and encoding redirect paths
const {
  captureOAuthRedirect,
  generateOAuthState,
} = require("@middleware/oauthRedirectMiddleware");
const { getRateLimiters } = require("@middleware/rateLimitMiddleware");

const router = express.Router();

// Determine front-end URL for redirects (if needed)
const frontUrl =
  process.env.NODE_ENV === "development"
    ? process.env.FRONTEND_URL_DEV
    : process.env.FRONTEND_URL_PROD;

// Public routes
router.post("/register", getRateLimiters().auth.register, user.auth.register);
router.post("/login", getRateLimiters().auth.login, user.auth.login);
router.post(
  "/forgot-password",
  getRateLimiters().auth.passwordReset,
  user.auth.forgotPassword
);
router.post(
  "/reset-password/:token",
  getRateLimiters().auth.passwordReset,
  user.auth.resetPassword
);
router.post("/verify-otp", getRateLimiters().auth.otp, user.auth.verifyOtp);
router.post("/resend-otp", getRateLimiters().auth.otp, user.auth.resendOtp);

// Protected routes
router.get("/logout", protect, user.auth.logout);
router.get("/me", protect, user.auth.getMe);

// Google OAuth with state for redirect
router.get(
  "/google",
  captureOAuthRedirect,
  generateOAuthState,
  (req, res, next) =>
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: req.oauthState,
    })(req, res, next)
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${frontUrl}/auth/login`,
  }),
  user.auth.googleAuthCallback
);

// GitHub OAuth (Basic login with limited scope) with state
router.get(
  "/github",
  captureOAuthRedirect,
  generateOAuthState,
  (req, res, next) =>
    passport.authenticate("github-basic", {
      scope: ["user:email"],
      state: req.oauthState,
    })(req, res, next)
);

router.get(
  "/github/callback",
  passport.authenticate("github-basic", {
    session: false,
    failureRedirect: `${frontUrl}/auth/login`,
  }),
  user.auth.githubAuthCallback
);

// Refresh token endpoint
router.post(
  "/refresh-token",
  getRateLimiters().auth.refreshToken,
  user.auth.refreshToken
);

// 2FA endpoints
router.post("/2fa/generate-secret", protect, user.auth.generate2FASecret);
router.post("/2fa/enable", protect, user.auth.enable2FA);
router.post("/2fa/verify", user.auth.verify2FALogin);
router.post("/2fa/disable", protect, user.auth.disable2FA);
router.get("/2fa/status", protect, user.auth.get2FAStatus);
router.post("/2fa/backup-codes", protect, user.auth.generateNewBackupCodes);

// Session management endpoints
router.get("/sessions", protect, user.auth.getActiveSessions);
router.delete("/sessions/:sessionId", protect, user.auth.revokeSession);
router.delete("/sessions/others", protect, user.auth.revokeAllOtherSessions);

module.exports = router;
