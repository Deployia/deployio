// Project Management Routes - /api/v1/projects/*
// Core project CRUD operations

const express = require("express");
const router = express.Router();
const projectController = require("../../../../controllers/project/projectController");

// Project CRUD operations
router.post("/", projectController.createProject);
router.get("/", projectController.getUserProjects);
router.get("/:projectId", projectController.getProjectById);
router.put("/:projectId", projectController.updateProject);
router.delete("/:projectId", projectController.deleteProject);

// Project actions
router.post("/:projectId/clone", projectController.cloneProject);
router.post("/:projectId/archive", projectController.archiveProject);
router.post("/:projectId/restore", projectController.restoreProject);

// Project sharing and collaboration
router.get(
  "/:projectId/collaborators",
  projectController.getProjectCollaborators
);
router.post("/:projectId/collaborators", projectController.addCollaborator);
router.delete(
  "/:projectId/collaborators/:userId",
  projectController.removeCollaborator
);

// Project analytics
router.get("/:projectId/analytics", projectController.getProjectAnalytics);
router.get("/:projectId/activity", projectController.getProjectActivity);

module.exports = router;
