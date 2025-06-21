// User Routes - /api/v1/users/users/*
// User management using new modular controller structure

const express = require("express");
const { user } = require("@controllers");
const { protect } = require("@middleware/authMiddleware");

const router = express.Router();

// Protected user routes
router.put("/password", protect, user.user.updatePassword);
router.delete("/account", protect, user.user.deleteAccount);

// Notification preferences
router.get("/notifications", protect, user.user.getNotificationPreferences);
router.put("/notifications", protect, user.user.updateNotificationPreferences);

// User activity
router.get("/activity", protect, user.user.getUserActivity);
router.post("/activity", protect, user.user.logUserActivity);

// Dashboard stats
router.get("/dashboard-stats", protect, user.user.getDashboardStats);

// API keys management
router.get("/api-keys", protect, user.user.getApiKeys);
router.post("/api-keys", protect, user.user.createApiKey);
router.delete("/api-keys/:keyId", protect, user.user.deleteApiKey);

module.exports = router;
