// Git Connect Routes - /api/v1/git/connect/*
// ONLY handles Git provider connection/disconnection (OAuth flows)

const express = require("express");
const { protect } = require("@middleware/authMiddleware");
const { getRateLimiters } = require("@middleware/rateLimitMiddleware");
const passport = require("passport");
const { git } = require("@controllers");

const router = express.Router();

// =============================================================================
// PROVIDER CONNECTION ENDPOINTS
// =============================================================================

// Get available git providers
router.get("/providers", git.connect.getProviders);

// Get user's connected providers
router.get("/connected", protect, git.connect.getConnectedProviders);

// =============================================================================
// PROVIDER-SPECIFIC CONNECTION ROUTES
// =============================================================================

// GitHub Integration
router.get(
  "/github",
  protect,
  passport.authenticate("github-integration", {
    scope: ["user:email", "repo", "workflow", "admin:repo_hook", "read:org"],
  })
);

router.get(
  "/github/callback",
  protect,
  passport.authenticate("github-integration", { session: false }),
  git.connect.connectGitHub
);

// GitLab Integration
router.get(
  "/gitlab",
  protect,
  passport.authenticate("gitlab", {
    scope: ["read_user", "read_repository", "api", "read_api"],
  })
);

router.get(
  "/gitlab/callback",
  protect,
  passport.authenticate("gitlab", { session: false }),
  git.connect.connectGitLab
);

// Azure DevOps Integration
router.get(
  "/azuredevops",
  protect,
  passport.authenticate("azuredevops", {
    scope: ["vso.code", "vso.identity", "vso.project", "vso.build"],
  })
);

router.get(
  "/azuredevops/callback",
  protect,
  passport.authenticate("azuredevops", { session: false }),
  git.connect.connectAzureDevOps
);

// Bitbucket Integration (placeholder for future implementation)
router.get("/bitbucket", protect, (req, res) => {
  res.status(501).json({
    success: false,
    message: "Bitbucket integration coming soon",
  });
});

// =============================================================================
// PROVIDER MANAGEMENT ENDPOINTS
// =============================================================================

// Disconnect a provider
router.delete(
  "/:provider",
  protect,
  getRateLimiters().gitProviders.disconnect,
  git.connect.disconnectProvider
);

// Test provider connection
router.get(
  "/:provider/test",
  protect,
  getRateLimiters().gitProviders.test,
  git.connect.testConnection
);

module.exports = router;
