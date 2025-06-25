// Git Connect Routes - Clean State-Based OAuth Implementation
// /api/v1/git/connect/*
// ONLY handles Git provider connection/disconnection (OAuth flows)

const express = require("express");
const { protect } = require("@middleware/authMiddleware");
const { getRateLimiters } = require("@middleware/rateLimitMiddleware");
const passport = require("passport");
const { git } = require("@controllers");

const router = express.Router();

// =============================================================================
// PROVIDER INFORMATION ENDPOINTS
// =============================================================================

// Get available git providers (public endpoint)
router.get("/providers", git.connect.getProviders);

// Get user's connected providers (protected)
router.get("/connected", protect, git.connect.getConnectedProviders);

// =============================================================================
// OAUTH INITIATION ENDPOINTS (Protected - require user login)
// =============================================================================

// GitHub OAuth initiation
router.get(
  "/github",
  protect,
  getRateLimiters().oauthInit,
  git.connect.initiateConnection("github"),
  (req, res, next) => {
    passport.authenticate("github-integration", {
      session: false, // Disable session usage
      scope: ["user:email", "repo", "workflow", "admin:repo_hook", "read:org"],
      state: req.oauthState,
    })(req, res, next);
  }
);

// GitLab OAuth initiation
router.get(
  "/gitlab",
  protect,
  getRateLimiters().oauthInit,
  git.connect.initiateConnection("gitlab"),
  (req, res, next) => {
    passport.authenticate("gitlab-integration", {
      session: false, // Disable session usage
      scope: ["read_user", "read_repository", "api"],
      state: req.oauthState,
    })(req, res, next);
  }
);

// Azure DevOps OAuth initiation
router.get(
  "/azuredevops",
  protect,
  getRateLimiters().oauthInit,
  git.connect.initiateConnection("azuredevops"),
  (req, res, next) => {
    passport.authenticate("azuredevops-integration", {
      session: false, // Disable session usage
      scope: ["vso.code", "vso.identity", "vso.project"],
      state: req.oauthState,
    })(req, res, next);
  }
);

// =============================================================================
// OAUTH CALLBACK ENDPOINTS (Public - no auth required, state validation instead)
// =============================================================================

// GitHub OAuth callback
router.get(
  "/github/callback",
  getRateLimiters().oauthCallback,
  (req, res, next) => {
    // Validate state parameter exists
    if (!req.query.state) {
      const frontUrl =
        process.env.NODE_ENV === "development"
          ? process.env.FRONTEND_URL_DEV
          : process.env.FRONTEND_URL_PROD;
      return res.redirect(
        `${frontUrl}/dashboard/integrations?connected=github&status=error&error=missing_state`
      );
    }

    passport.authenticate("github-integration", {
      session: false, // Disable session usage
      failureRedirect: `${
        process.env.NODE_ENV === "development"
          ? process.env.FRONTEND_URL_DEV
          : process.env.FRONTEND_URL_PROD
      }/dashboard/integrations?connected=github&status=error&error=auth_failed`,
    })(req, res, next);
  },
  git.connect.connectGitHub
);

// GitLab OAuth callback
router.get(
  "/gitlab/callback",
  getRateLimiters().oauthCallback,
  (req, res, next) => {
    if (!req.query.state) {
      const frontUrl =
        process.env.NODE_ENV === "development"
          ? process.env.FRONTEND_URL_DEV
          : process.env.FRONTEND_URL_PROD;
      return res.redirect(
        `${frontUrl}/dashboard/integrations?connected=gitlab&status=error&error=missing_state`
      );
    }

    passport.authenticate("gitlab-integration", {
      session: false, // Disable session usage
      failureRedirect: `${
        process.env.NODE_ENV === "development"
          ? process.env.FRONTEND_URL_DEV
          : process.env.FRONTEND_URL_PROD
      }/dashboard/integrations?connected=gitlab&status=error&error=auth_failed`,
    })(req, res, next);
  },
  git.connect.connectGitLab
);

// Azure DevOps OAuth callback
router.get(
  "/azuredevops/callback",
  getRateLimiters().oauthCallback,
  (req, res, next) => {
    if (!req.query.state) {
      const frontUrl =
        process.env.NODE_ENV === "development"
          ? process.env.FRONTEND_URL_DEV
          : process.env.FRONTEND_URL_PROD;
      return res.redirect(
        `${frontUrl}/dashboard/integrations?connected=azuredevops&status=error&error=missing_state`
      );
    }

    passport.authenticate("azuredevops-integration", {
      session: false, // Disable session usage
      failureRedirect: `${
        process.env.NODE_ENV === "development"
          ? process.env.FRONTEND_URL_DEV
          : process.env.FRONTEND_URL_PROD
      }/dashboard/integrations?connected=azuredevops&status=error&error=auth_failed`,
    })(req, res, next);
  },
  git.connect.connectAzureDevOps
);

// =============================================================================
// PROVIDER MANAGEMENT ENDPOINTS (Protected)
// =============================================================================

// Disconnect a provider
router.delete(
  "/:provider",
  protect,
  getRateLimiters().apiStrict,
  git.connect.disconnectProvider
);

// Test provider connection
router.post(
  "/:provider/test",
  protect,
  getRateLimiters().apiModerate,
  git.connect.testConnection
);

module.exports = router;
