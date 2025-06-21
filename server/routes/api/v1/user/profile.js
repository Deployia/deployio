// Profile Routes - /api/v1/users/profile/*
// User profile specific endpoints using new modular controller structure

const express = require("express");
const router = express.Router();
const profileController = require("../../../../controllers/user/profileController");
const { protect } = require("../../../../middleware/authMiddleware");
const multer = require("multer");

// Set up multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Protected profile routes
router.get("/", protect, profileController.getProfile);
router.put(
  "/",
  protect,
  upload.single("profileImage"),
  profileController.updateProfile
);

module.exports = router;
