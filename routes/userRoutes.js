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

// 2FA Routes
router.get("/2fa/generate", protect, userController.generate2FASecret);
router.post("/2fa/enable", protect, userController.enable2FA);
router.post("/2fa/verify", userController.verify2FALogin);
router.post("/2fa/disable", protect, userController.disable2FA);
router.get("/2fa/status", protect, userController.get2FAStatus);
router.post(
  "/2fa/backup-codes",
  protect,
  userController.generateNewBackupCodes
);

module.exports = router;
