// User Profile Routes - /api/v1/users/users/*
// User profile management using existing userController

const express = require("express");
const router = express.Router();
const userController = require("../../../../controllers/userController");

// Use existing user routes to maintain frontend compatibility
router.use("/", userController);

module.exports = router;
