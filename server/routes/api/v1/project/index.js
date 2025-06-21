// Project Routes - /api/v1/projects/*
// Project management endpoints

const express = require("express");
const router = express.Router();
const { protect } = require("@middleware/authMiddleware");

// Import sub-routes
const projectRoutes = require("./projects");
const repositoryRoutes = require("./repositories");
const settingsRoutes = require("./settings");

// All project routes require authentication
router.use(protect);

// Mount sub-routes
router.use("/", projectRoutes);
router.use("/repositories", repositoryRoutes);
router.use("/settings", settingsRoutes);

module.exports = router;
