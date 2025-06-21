// User Routes - /api/v1/users/*
// User management endpoints using existing userController

const express = require("express");
const router = express.Router();
const requireAuth = require("../../../middleware/authMiddleware");

// Import existing controllers (keeping your working frontend integration)
const authController = require("../../../controllers/authController");
const userController = require("../../../controllers/userController");

// Auth routes (public)
router.use("/auth", authController);

// User routes (require authentication)
router.use("/profile", requireAuth, userController);
router.use("/me", requireAuth, userController);

// Legacy compatibility routes
router.use("/", requireAuth, userController);

module.exports = router;
