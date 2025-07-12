// Git Provider Routes - /api/v1/users/git-providers/*
// Routes for repository access and provider management
// Note: Provider connections are handled by /api/v1/git/connect/*

const express = require("express");
const { protect } = require("@middleware/authMiddleware");
const { getRateLimiters } = require("@middleware/rateLimitMiddleware");
const { user } = require("@controllers");

const router = express.Router();

// Get available git providers
router.get("/", user.gitProvider.getProviders);

// Get user's connected providers
router.get("/connected", protect, user.gitProvider.getConnectedProviders);

// Get repositories for a specific provider
router.get(
  "/:provider/repositories",
  protect,
  getRateLimiters().gitProviders.repositories,
  user.gitProvider.getRepositories
);

// Get specific repository details
router.get(
  "/:provider/repositories/:owner/:repo",
  protect,
  user.gitProvider.getRepository
);

// Get repository branches
router.get(
  "/:provider/repositories/:owner/:repo/branches",
  protect,
  user.gitProvider.getBranches
);

// Get repository tree/file structure
router.get(
  "/:provider/repositories/:owner/:repo/tree",
  protect,
  getRateLimiters().gitProviders.repositories,
  user.gitProvider.getRepositoryTree
);

// Get file content
router.get(
  "/:provider/repositories/:owner/:repo/contents/*",
  protect,
  getRateLimiters().gitProviders.repositories,
  user.gitProvider.getFileContent
);

// // Analyze repository for AI suggestions
// router.post(
//   "/:provider/repositories/:owner/:repo/analyze",
//   protect,
//   getRateLimiters().gitProviders.analyze,
//   user.gitProvider.analyzeRepository
// );

// Test provider connection
router.get("/:provider/test", protect, user.gitProvider.testConnection);

// Refresh provider token
router.post(
  "/:provider/refresh",
  protect,
  getRateLimiters().gitProviders.refresh,
  user.gitProvider.refreshToken
);

// Update provider information
router.patch(
  "/:provider/info",
  protect,
  getRateLimiters().gitProviders.update,
  user.gitProvider.updateProviderInfo
);

// Get provider statistics
router.get("/:provider/stats", protect, user.gitProvider.getProviderStats);

module.exports = router;
