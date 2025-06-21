// Project Settings Routes - /api/v1/projects/settings/*
// Project configuration and settings management

const express = require("express");
const { project } = require("@controllers");
const router = express.Router();

// Project settings CRUD
router.get("/:projectId", project.settings.getProjectSettings);
router.put("/:projectId", project.settings.updateProjectSettings);
router.delete("/:projectId", project.settings.resetProjectSettings);

// Environment variables
router.get("/:projectId/env", project.settings.getEnvironmentVariables);
router.post("/:projectId/env", project.settings.addEnvironmentVariable);
router.put(
  "/:projectId/env/:envId",
  project.settings.updateEnvironmentVariable
);
router.delete(
  "/:projectId/env/:envId",
  project.settings.deleteEnvironmentVariable
);

// Build settings
router.get("/:projectId/build", project.settings.getBuildSettings);
router.put("/:projectId/build", project.settings.updateBuildSettings);

// Deployment settings
router.get("/:projectId/deployment", project.settings.getDeploymentSettings);
router.put("/:projectId/deployment", project.settings.updateDeploymentSettings);

// Domain and subdomain settings
router.get("/:projectId/domains", project.settings.getDomainSettings);
router.post("/:projectId/domains", project.settings.addDomain);
router.put("/:projectId/domains/:domainId", project.settings.updateDomain);
router.delete("/:projectId/domains/:domainId", project.settings.removeDomain);

// Security settings
router.get("/:projectId/security", project.settings.getSecuritySettings);
router.put("/:projectId/security", project.settings.updateSecuritySettings);

module.exports = router;
