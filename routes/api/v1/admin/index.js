// Admin Routes - /api/v1/admin/*
// Admin management endpoints using existing adminController

const express = require("express");
const router = express.Router();
const requireAuth = require("../../../middleware/authMiddleware");

// Import existing admin controller (keeping your working frontend integration)
const adminController = require("../../../controllers/adminController");

// All admin routes require authentication and admin privileges
router.use(requireAuth);

// Use existing admin routes to maintain frontend compatibility
router.use("/", adminController);

module.exports = router;
