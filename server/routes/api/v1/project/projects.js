// Project Management Routes - /api/v1/projects/*
// Core project CRUD operations

const express = require("express");
const { project } = require("@controllers");
const router = express.Router();

// IMPLEMENTED ROUTES
router.post("/", project.project.createProject);
router.get("/", project.project.getUserProjects);
router.get("/:projectId", project.project.getProjectById);
router.put("/:projectId", project.project.updateProject);
router.delete("/:projectId", project.project.deleteProject);

// PLANNED ROUTES - TO BE IMPLEMENTED
// router.post("/:projectId/clone", project.project.cloneProject);
// router.post("/:projectId/fork", project.project.forkProject);
// router.post("/:projectId/archive", project.project.archiveProject);
// router.post("/:projectId/restore", project.project.restoreProject);
// router.get("/:projectId/collaborators", project.project.getProjectCollaborators);
// router.post("/:projectId/collaborators", project.project.addCollaborator);
// router.delete("/:projectId/collaborators/:userId", project.project.removeCollaborator);
// router.put("/:projectId/collaborators/:userId", project.project.updateCollaboratorPermissions);
// router.get("/:projectId/analytics", project.project.getProjectAnalytics);
// router.get("/:projectId/activity", project.project.getProjectActivity);

module.exports = router;
