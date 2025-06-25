// User Routes - /api/v1/users/*
// User management endpoints using new modular controller structure

const express = require("express");
const router = express.Router();

// Import new modular routes
const authRoutes = require("./auth");
const profileRoutes = require("./profile");
const userRoutes = require("./users");
const apiKeyRoutes = require("./apiKeys");
const gitProviderRoutes = require("./gitProviders");

// Mount routes
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/api-keys", apiKeyRoutes);
router.use("/git-providers", gitProviderRoutes);
router.use("/", userRoutes);

module.exports = router;
