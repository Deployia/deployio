const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

// Protected routes
router.put("/update-password", protect, authController.updatePassword);
router.get("/logout", protect, authController.logout);
router.get("/me", protect, authController.getMe);

module.exports = router;
