const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const passport = require("passport");

const router = express.Router();

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);

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
    failureRedirect: "/login",
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
    failureRedirect: "/login",
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
    failureRedirect: "/login",
  }),
  authController.githubAuthCallback
);

// Refresh token endpoint
router.post("/refresh-token", authController.refreshToken);

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
  passport.authorize("google", {
    session: false,
    failureRedirect: "/profile",
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
    failureRedirect: "/profile",
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
    failureRedirect: "/profile",
  }),
  authController.linkProviderCallback("github")
);

// Unlink OAuth provider
router.delete("/unlink/:provider", protect, authController.unlinkProvider);

// Session management
router.get("/sessions", protect, authController.getSessions);
router.delete("/sessions/:sessionId", protect, authController.deleteSession);

module.exports = router;
