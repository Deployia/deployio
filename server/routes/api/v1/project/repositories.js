// Repository Routes - /api/v1/projects/repositories/*
// GitHub integration and repository management

const express = require("express");
const { project } = require("@controllers");
const router = express.Router();

// Repository operations
router.get("/", project.repository.getUserRepositories);
router.post("/connect", project.repository.connectRepository);
router.post("/disconnect/:projectId", project.repository.disconnectRepository);
router.get("/:projectId/repository", project.repository.getProjectRepository);

// Repository analysis
router.post("/:projectId/analyze", project.repository.analyzeRepository);
router.get("/:projectId/analysis", project.repository.getRepositoryAnalysis);

// Repository synchronization
router.post("/:projectId/sync", project.repository.syncRepository);
router.get("/:projectId/sync-status", project.repository.getSyncStatus);

// Repository webhooks
router.post("/:projectId/webhooks", project.repository.setupWebhooks);
router.get("/:projectId/webhooks", project.repository.getWebhooks);
router.delete(
  "/:projectId/webhooks/:webhookId",
  project.repository.removeWebhook
);

// Repository branches and commits
router.get("/:projectId/branches", project.repository.getBranches);
router.get("/:projectId/commits", project.repository.getCommits);
router.get("/:projectId/commit/:sha", project.repository.getCommit);

module.exports = router;
