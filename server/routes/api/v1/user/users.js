// User Routes - /api/v1/users/users/*
// User management using new modular controller structure

const express = require("express");
const { query } = require("express-validator");
const { user } = require("@controllers");
const { protect } = require("@middleware/authMiddleware");

const router = express.Router();

const validateUserSearch = [
  query("q")
    .isLength({ min: 2, max: 100 })
    .withMessage("Search query must be between 2 and 100 characters"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Limit must be between 1 and 10"),
];

// Protected user routes
router.get("/search", protect, validateUserSearch, user.user.searchUsers);
router.put("/password", protect, user.user.updatePassword);
router.post("/set-initial-password", protect, user.user.setInitialPassword);
router.delete("/account", protect, user.user.deleteAccount);

// Notification preferences
router.get("/notifications", protect, user.user.getNotificationPreferences);
router.put("/notifications", protect, user.user.updateNotificationPreferences);

// User activity
router.get("/activity", protect, user.user.getUserActivity);
router.post("/activity", protect, user.user.logUserActivity);

// Dashboard stats
router.get("/dashboard-stats", protect, user.user.getDashboardStats);

module.exports = router;
