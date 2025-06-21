// Project Settings Routes - /api/v1/projects/settings/*
// Project configuration and settings management

const express = require("express");
const { project } = require("@controllers");
const router = express.Router();

// IMPLEMENTED ROUTES
router.get("/:projectId", project.settings.getProjectSettings);
router.put("/:projectId", project.settings.updateProjectSettings);
router.get("/:projectId/env", project.settings.getEnvironmentVariables);
router.put("/:projectId/env", project.settings.updateEnvironmentVariables);
router.get("/:projectId/build", project.settings.getBuildSettings);
router.put("/:projectId/build", project.settings.updateBuildSettings);

// PLANNED ROUTES - TO BE IMPLEMENTED
// router.delete("/:projectId", project.settings.resetProjectSettings);
// router.post("/:projectId/env", project.settings.addEnvironmentVariable);
// router.put("/:projectId/env/:envId", project.settings.updateEnvironmentVariable);
// router.delete("/:projectId/env/:envId", project.settings.deleteEnvironmentVariable);
// router.get("/:projectId/deployment", project.settings.getDeploymentSettings);
// router.put("/:projectId/deployment", project.settings.updateDeploymentSettings);
// router.get("/:projectId/domains", project.settings.getDomainSettings);
// router.post("/:projectId/domains", project.settings.addDomain);
// router.put("/:projectId/domains/:domainId", project.settings.updateDomain);
// router.delete("/:projectId/domains/:domainId", project.settings.removeDomain);
// router.get("/:projectId/security", project.settings.getSecuritySettings);
// router.put("/:projectId/security", project.settings.updateSecuritySettings);

module.exports = router;
