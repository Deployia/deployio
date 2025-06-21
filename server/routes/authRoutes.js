const express = require("express");
const authController = require("../controllers/user/authController");
const { protect } = require("../middleware/authMiddleware");
const passport = require("passport");
const { getRateLimiters } = require("../middleware/rateLimitMiddleware");

const router = express.Router();
// Determine front-end URL for redirects
const frontUrl =
  process.env.NODE_ENV === "development"
    ? process.env.FRONTEND_URL_DEV
    : process.env.FRONTEND_URL_PROD;

// Public routes
router.post(
  "/register",
  getRateLimiters().auth.register,
  authController.register
);
router.post("/login", getRateLimiters().auth.login, authController.login);
router.post(
  "/forgot-password",
  getRateLimiters().auth.passwordReset,
  authController.forgotPassword
);
router.post(
  "/reset-password/:token",
  getRateLimiters().auth.passwordReset,
  authController.resetPassword
);
router.post(
  "/verify-otp",
  getRateLimiters().auth.otp,
  authController.verifyOtp
);
router.post(
  "/resend-otp",
  getRateLimiters().auth.otp,
  authController.resendOtp
);

// Protected routes
router.get("/logout", protect, authController.logout);
router.get("/me", protect, authController.getMe);

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
  require("../controllers/authController").googleAuthCallback
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
  authController.githubAuthCallback
);

// Refresh token endpoint
router.post(
  "/refresh-token",
  getRateLimiters().auth.refreshToken,
  authController.refreshToken
);

// Get linked OAuth providers
router.get("/providers", protect, authController.getLinkedProviders);

// Link OAuth providers
router.get(
  "/link/google",
  protect,
  passport.authorize("google", { scope: ["profile", "email"], session: false })
);
router.get(
  "/link/google/callback",
  protect,
  passport.authorize("google", { scope: ["profile", "email"], session: false }),
  passport.authorize("google", {
    session: false,
    failureRedirect: `${frontUrl}/dashboard/profile`,
  }),
  authController.linkProviderCallback("google")
);

router.get(
  "/link/github",
  protect,
  passport.authorize("github", { scope: ["user:email"], session: false })
);
router.get(
  "/link/github/callback",
  protect,
  passport.authorize("github", {
    session: false,
    failureRedirect: `${frontUrl}/dashboard/profile`,
  }),
  authController.linkProviderCallback("github")
);

// Unlink OAuth provider
router.delete("/unlink/:provider", protect, authController.unlinkProvider);

// Session management
router.get("/sessions", protect, authController.getSessions);
router.delete("/sessions/:sessionId", protect, authController.deleteSession);

// 2FA routes
router.get("/2fa/generate", protect, authController.generate2FASecret);
router.post("/2fa/enable", protect, authController.enable2FA);
router.post(
  "/2fa/verify",
  (req, res, next) => {
    // Normalize rememberDevice to boolean
    req.body.rememberDevice =
      req.body.rememberDevice === true || req.body.rememberDevice === "true";
    next();
  },
  authController.verify2FALogin
);
router.post("/2fa/disable", protect, authController.disable2FA);
router.get("/2fa/status", protect, authController.get2FAStatus);
router.post(
  "/2fa/backup-codes",
  protect,
  authController.generateNewBackupCodes
);

module.exports = router;
