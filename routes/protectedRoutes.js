const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Protected data endpoint (similar to FastAPI)
router.get("/data", protect, (req, res) => {
  res.json({
    success: true,
    message: "Protected data retrieved successfully",
    data: {
      message: "This is protected data that requires authentication",
      user_id: req.user._id,
      username: req.user.username,
      access_level: "authenticated",
      service: "Backend Express.js",
      timestamp: new Date().toISOString(),
    },
  });
});

// Protected user profile endpoint
router.get("/profile", protect, (req, res) => {
  res.json({
    success: true,
    message: "User profile retrieved successfully",
    data: {
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        session_id: req.sessionId,
      },
      access_granted: new Date().toISOString(),
    },
  });
});

// Protected action endpoint
router.post("/action", protect, (req, res) => {
  res.json({
    success: true,
    message: "Action performed successfully",
    data: {
      action: "completed",
      performed_by: req.user._id,
      username: req.user.username,
      timestamp: new Date().toISOString(),
      service: "Backend Express.js",
    },
  });
});

module.exports = router;
