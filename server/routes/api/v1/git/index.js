// Git Routes - /api/v1/git/*
// Git provider integration and repository management endpoints

const express = require("express");
const router = express.Router();

// Import git route modules
const connectRoutes = require("./connect");

// Mount routes
router.use("/connect", connectRoutes);

module.exports = router;
