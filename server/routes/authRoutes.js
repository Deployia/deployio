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

module.exports = router;
