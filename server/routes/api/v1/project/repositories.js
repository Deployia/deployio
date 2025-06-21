// Repository Routes - /api/v1/projects/repositories/*
// GitHub integration and repository management

const express = require("express");
const { project } = require("@controllers");
const router = express.Router();

// IMPLEMENTED ROUTES
router.post("/connect", project.repository.connectRepository);
router.get("/:projectId/repository", project.repository.getRepositoryInfo);
router.post("/:projectId/sync", project.repository.syncRepository);
router.get("/:projectId/branches", project.repository.getRepositoryBranches);
router.put("/:projectId/settings", project.repository.updateRepositorySettings);

// PLANNED ROUTES - TO BE IMPLEMENTED
// router.get("/", project.repository.getUserRepositories);
// router.post("/disconnect/:projectId", project.repository.disconnectRepository);
// router.post("/:projectId/analyze", project.repository.analyzeRepository);
// router.get("/:projectId/analysis", project.repository.getRepositoryAnalysis);
// router.get("/:projectId/sync-status", project.repository.getSyncStatus);
// router.post("/:projectId/webhooks", project.repository.setupWebhooks);
// router.get("/:projectId/webhooks", project.repository.getWebhooks);
// router.delete("/:projectId/webhooks/:webhookId", project.repository.removeWebhook);
// router.get("/:projectId/commits", project.repository.getCommits);
// router.get("/:projectId/commit/:sha", project.repository.getCommit);
// router.get("/:projectId/files", project.repository.browseFiles);

module.exports = router;
