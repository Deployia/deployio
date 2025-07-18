// Project Routes - /api/v1/projects/*
// Complete project management endpoints

const express = require("express");
const router = express.Router();
const { protect } = require("@middleware/authMiddleware");

// Import routes
const creationRoutes = require("./creation");
const projectRoutes = require("./projects"); // ADD THIS

// All project routes require authentication
router.use(protect);

// Mount routes
router.use("/creation", creationRoutes);
router.use("/", projectRoutes); // ADD THIS - Main project CRUD operations

module.exports = router;
