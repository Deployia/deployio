// Admin Management Routes - /api/v1/admin/admin/*
// Core admin operations using existing adminController

const express = require("express");
const router = express.Router();
const adminController = require("../../../../controllers/adminController");

// Use existing admin routes to maintain frontend compatibility
router.use("/", adminController);

module.exports = router;
