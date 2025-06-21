// Auth Routes - /api/v1/users/auth/*
// Authentication endpoints using existing authController

const express = require("express");
const router = express.Router();
const authController = require("../../../../controllers/authController");

// Use existing auth routes to maintain frontend compatibility
router.use("/", authController);

module.exports = router;
