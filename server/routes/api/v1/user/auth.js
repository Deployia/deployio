// Auth Routes - /api/v1/users/auth/*
// Authentication endpoints using new modular controller structure

const express = require("express");
const { user } = require("@controllers");
const { protect } = require("@middleware/authMiddleware");
const passport = require("passport");
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

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${frontUrl}/auth/login`,
  }),
  user.auth.googleAuthCallback
);

// GitHub OAuth
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
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

// Get linked OAuth providers
router.get("/providers", protect, user.auth.getLinkedProviders);

// Link OAuth providers (for existing users)
router.get(
  "/link/google",
  protect,
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/link/google/callback",
  protect,
  passport.authenticate("google", { session: false }),
  user.auth.linkProviderCallback("google")
);

router.get(
  "/link/github",
  protect,
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/link/github/callback",
  protect,
  passport.authenticate("github", { session: false }),
  user.auth.linkProviderCallback("github")
);

// Unlink OAuth providers
router.delete("/providers/:provider", protect, user.auth.unlinkProvider);

// Session management
router.get("/sessions", protect, user.auth.getSessions);
router.delete("/sessions/:sessionId", protect, user.auth.deleteSession);

// 2FA endpoints
router.post("/2fa/generate-secret", protect, user.auth.generate2FASecret);
router.post("/2fa/enable", protect, user.auth.enable2FA);
router.post("/2fa/verify", user.auth.verify2FALogin);
router.post("/2fa/disable", protect, user.auth.disable2FA);
router.get("/2fa/status", protect, user.auth.get2FAStatus);
router.post("/2fa/backup-codes", protect, user.auth.generateNewBackupCodes);

module.exports = router;
