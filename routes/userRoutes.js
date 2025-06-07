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

module.exports = router;
