// Admin Routes - /api/v1/admin/*
// Admin management endpoints using existing adminController

const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("@middleware/authMiddleware");

// Import sub-routes
const adminRoutes = require("./admin");

// All admin routes require authentication and admin privileges
router.use(protect, adminOnly);

// Mount sub-routes
router.use("/", adminRoutes);

module.exports = router;
