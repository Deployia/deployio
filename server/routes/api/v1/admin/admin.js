// Admin Management Routes - /api/v1/admin/admin/*
// Core admin operations using existing adminController

const express = require("express");
const { admin } = require("@controllers");
const router = express.Router();

// Use existing admin routes to maintain frontend compatibility
router.use("/", admin.admin);

module.exports = router;
