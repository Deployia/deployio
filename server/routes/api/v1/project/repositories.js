// Repository Routes - /api/v1/projects/repositories/*
// GitHub integration and repository management

const express = require("express");
const router = express.Router();
const repositoryController = require("../../../../controllers/project/repositoryController");

// Repository operations
router.get("/", repositoryController.getUserRepositories);
router.post("/connect", repositoryController.connectRepository);
router.post(
  "/disconnect/:projectId",
  repositoryController.disconnectRepository
);
router.get("/:projectId/repository", repositoryController.getProjectRepository);

// Repository analysis
router.post("/:projectId/analyze", repositoryController.analyzeRepository);
router.get("/:projectId/analysis", repositoryController.getRepositoryAnalysis);

// Repository synchronization
router.post("/:projectId/sync", repositoryController.syncRepository);
router.get("/:projectId/sync-status", repositoryController.getSyncStatus);

// Repository webhooks
router.post("/:projectId/webhooks", repositoryController.setupWebhooks);
router.get("/:projectId/webhooks", repositoryController.getWebhooks);
router.delete(
  "/:projectId/webhooks/:webhookId",
  repositoryController.removeWebhook
);

// Repository branches and commits
router.get("/:projectId/branches", repositoryController.getBranches);
router.get("/:projectId/commits", repositoryController.getCommits);
router.get("/:projectId/commit/:sha", repositoryController.getCommit);

module.exports = router;
