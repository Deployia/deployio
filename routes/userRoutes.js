const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");
const multer = require("multer");

// Use memory storage for multer (no local uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// User profile update (with Cloudinary image upload)
router.put(
  "/profile",
  protect,
  upload.single("profileImage"),
  userController.updateProfile
);

// Update password
router.put("/update-password", protect, userController.updatePassword);

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
