// User Routes - /api/v1/users/users/*
// User management using new modular controller structure

const express = require("express");
const router = express.Router();
const userController = require("../../../../controllers/user/userController");
const { protect } = require("../../../../middleware/authMiddleware");

// Protected user routes
router.put("/password", protect, userController.updatePassword);
router.delete("/account", protect, userController.deleteAccount);

// Notification preferences
router.get(
  "/notifications",
  protect,
  userController.getNotificationPreferences
);
router.put(
  "/notifications",
  protect,
  userController.updateNotificationPreferences
);

// User activity
router.get("/activity", protect, userController.getUserActivity);
router.post("/activity", protect, userController.logUserActivity);

// Dashboard stats
router.get("/dashboard-stats", protect, userController.getDashboardStats);

// API keys management
router.get("/api-keys", protect, userController.getApiKeys);
router.post("/api-keys", protect, userController.createApiKey);
router.delete("/api-keys/:keyId", protect, userController.deleteApiKey);

module.exports = router;
