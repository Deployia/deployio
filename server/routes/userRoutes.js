const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const userController = require("../controllers/user/userController");
const profileController = require("../controllers/user/profileController");
const multer = require("multer");
const { getRateLimiters } = require("../middleware/rateLimitMiddleware");

// Use memory storage for multer (no local uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// User profile update (with Cloudinary image upload)
router.put(
  "/profile",
  protect,
  getRateLimiters().user.profileUpdate,
  upload.single("profileImage"),
  profileController.updateProfile
);

// Get user profile
router.get("/profile", protect, profileController.getProfile);

// Update password
router.put(
  "/update-password",
  protect,
  getRateLimiters().user.passwordUpdate,
  userController.updatePassword
);

// Notification preferences
router.get(
  "/notification-preferences",
  protect,
  userController.getNotificationPreferences
);
router.put(
  "/notification-preferences",
  protect,
  userController.updateNotificationPreferences
);

// User activity
router.get("/activity", protect, userController.getUserActivity);
router.post("/activity", protect, userController.logUserActivity);

// Dashboard stats
router.get("/dashboard-stats", protect, userController.getDashboardStats);

// API Keys management
router.get("/api-keys", protect, userController.getApiKeys);
router.post("/api-keys", protect, userController.createApiKey);
router.delete("/api-keys/:keyId", protect, userController.deleteApiKey);

module.exports = router;
