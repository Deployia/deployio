// Project Routes - /api/v1/projects/*
// Project management endpoints

const express = require("express");
const router = express.Router();
const requireAuth = require("../../../middleware/authMiddleware");

// Import modular project controllers
const projectController = require("../../../controllers/project/projectController");
const repositoryController = require("../../../controllers/project/repositoryController");
const settingsController = require("../../../controllers/project/settingsController");

// All project routes require authentication
router.use(requireAuth);

// Project management
router.use("/", projectController);
router.use("/repositories", repositoryController);
router.use("/settings", settingsController);

module.exports = router;
