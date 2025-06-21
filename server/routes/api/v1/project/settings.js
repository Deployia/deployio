// Project Settings Routes - /api/v1/projects/settings/*
// Project configuration and settings management

const express = require("express");
const router = express.Router();
const settingsController = require("../../../../controllers/project/settingsController");

// Project settings CRUD
router.get("/:projectId", settingsController.getProjectSettings);
router.put("/:projectId", settingsController.updateProjectSettings);
router.delete("/:projectId", settingsController.resetProjectSettings);

// Environment variables
router.get("/:projectId/env", settingsController.getEnvironmentVariables);
router.post("/:projectId/env", settingsController.addEnvironmentVariable);
router.put(
  "/:projectId/env/:envId",
  settingsController.updateEnvironmentVariable
);
router.delete(
  "/:projectId/env/:envId",
  settingsController.deleteEnvironmentVariable
);

// Build settings
router.get("/:projectId/build", settingsController.getBuildSettings);
router.put("/:projectId/build", settingsController.updateBuildSettings);

// Deployment settings
router.get("/:projectId/deployment", settingsController.getDeploymentSettings);
router.put(
  "/:projectId/deployment",
  settingsController.updateDeploymentSettings
);

// Domain and subdomain settings
router.get("/:projectId/domains", settingsController.getDomainSettings);
router.post("/:projectId/domains", settingsController.addDomain);
router.put("/:projectId/domains/:domainId", settingsController.updateDomain);
router.delete("/:projectId/domains/:domainId", settingsController.removeDomain);

// Security settings
router.get("/:projectId/security", settingsController.getSecuritySettings);
router.put("/:projectId/security", settingsController.updateSecuritySettings);

module.exports = router;
