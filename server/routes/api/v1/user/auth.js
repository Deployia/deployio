// Auth Routes - /api/v1/users/auth/*
// Authentication endpoints using new modular controller structure

const express = require("express");
const router = express.Router();
const authController = require("../../../../controllers/user/authController");
const { protect } = require("../../../../middleware/authMiddleware");
const passport = require("passport");
const {
  getRateLimiters,
} = require("../../../../middleware/rateLimitMiddleware");

// Determine front-end URL for redirects (if needed)
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

// Additional OAuth routes that might exist...
// (keeping structure consistent with existing authRoutes.js)

module.exports = router;
