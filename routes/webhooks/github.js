// GitHub Webhook Routes - /webhooks/github/*
// GitHub webhook event handlers

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const logger = require("../../config/logger");

// Middleware to verify GitHub webhook signature
const verifyGitHubSignature = (req, res, next) => {
  const signature = req.headers["x-hub-signature-256"];
  const payload = JSON.stringify(req.body);
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;

  if (signature !== digest) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  next();
};

// GitHub webhook endpoint
router.post("/", verifyGitHubSignature, (req, res) => {
  const event = req.headers["x-github-event"];
  const payload = req.body;

  logger.info("GitHub webhook received", {
    event,
    repository: payload.repository?.full_name,
    action: payload.action,
  });

  // Handle different GitHub events
  switch (event) {
    case "push":
      handlePushEvent(payload);
      break;
    case "pull_request":
      handlePullRequestEvent(payload);
      break;
    case "repository":
      handleRepositoryEvent(payload);
      break;
    default:
      logger.info("Unhandled GitHub event", { event });
  }

  res.status(200).json({ success: true });
});

// Event handlers
const handlePushEvent = (payload) => {
  // Handle push event - trigger deployments, etc.
  logger.info("Handling push event", {
    repository: payload.repository.full_name,
    ref: payload.ref,
    commits: payload.commits.length,
  });
};

const handlePullRequestEvent = (payload) => {
  // Handle pull request event
  logger.info("Handling pull request event", {
    repository: payload.repository.full_name,
    action: payload.action,
    number: payload.number,
  });
};

const handleRepositoryEvent = (payload) => {
  // Handle repository event
  logger.info("Handling repository event", {
    repository: payload.repository.full_name,
    action: payload.action,
  });
};

module.exports = router;
