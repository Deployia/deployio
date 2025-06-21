// Logs Routes - /api/v1/deployments/logs/*
// Log management and streaming endpoints

const express = require("express");
const { deployment } = require("@controllers");
const router = express.Router();

// Generic logs endpoints
router.get("/", deployment.logs.getLogs);
router.get("/stream", deployment.logs.streamLogs);
router.get("/download", deployment.logs.downloadLogs);
router.get("/search", deployment.logs.searchLogs);

module.exports = router;
