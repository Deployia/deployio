// Profile Routes - /api/v1/users/profile/*
// User profile specific endpoints using existing userController

const express = require("express");
const router = express.Router();
const userController = require("../../../../controllers/userController");

// Use existing user profile routes to maintain frontend compatibility
router.use("/", userController);

module.exports = router;
