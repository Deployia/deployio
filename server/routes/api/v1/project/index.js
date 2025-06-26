// Project Routes - /api/v1/projects/*
// New intelligent project creation endpoints

const express = require("express");
const router = express.Router();
const { protect } = require("@middleware/authMiddleware");

// Import creation routes only (new architecture)
const creationRoutes = require("./creation");

// All project routes require authentication
router.use(protect);

// Mount creation routes
router.use("/creation", creationRoutes);

module.exports = router;
