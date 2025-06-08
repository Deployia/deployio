const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const passport = require("passport");
const rateLimit = require("express-rate-limit");

const router = express.Router();
// Determine front-end URL for redirects
const frontUrl =
  process.env.NODE_ENV === "development"
    ? process.env.FRONTEND_URL_DEV
    : process.env.FRONTEND_URL_PROD;

// Rate limiters for sensitive auth routes
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts, please try again later.",
  },
});
const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many token requests, please try again later.",
  },
});
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many OTP requests, please try again later.",
  },
});

// Public routes
router.post("/register", authController.register);
router.post("/login", loginLimiter, authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.post("/verify-otp", otpLimiter, authController.verifyOtp);
router.post("/resend-otp", otpLimiter, authController.resendOtp);

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

// Facebook OAuth
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: `${frontUrl}/auth/login`,
  }),
  authController.facebookAuthCallback
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
router.post("/refresh-token", refreshLimiter, authController.refreshToken);

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
    failureRedirect: `${frontUrl}/profile`,
  }),
  authController.linkProviderCallback("google")
);

router.get(
  "/link/facebook",
  protect,
  passport.authorize("facebook", { scope: ["email"], session: false })
);
router.get(
  "/link/facebook/callback",
  protect,
  passport.authorize("facebook", {
    session: false,
    failureRedirect: `${frontUrl}/profile`,
  }),
  authController.linkProviderCallback("facebook")
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
    failureRedirect: `${frontUrl}/profile`,
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
