// Webhook Routes - /webhooks/*
// External webhook handling system

const express = require("express");
const router = express.Router();
const githubWebhooks = require("./github");
const deploymentWebhooks = require("./deployment");

// Mount webhook handlers
router.use("/github", githubWebhooks);
router.use("/deployment", deploymentWebhooks);

// Webhook health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "webhook-handler",
    timestamp: new Date().toISOString(),
    message: "Webhook service is running",
  });
});

module.exports = router;
