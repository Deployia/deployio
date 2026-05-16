// Admin Management Routes - /api/v1/admin/*

const express = require("express");
const { admin } = require("@controllers");
const router = express.Router();

router.get("/dashboard-stats", admin.admin.getDashboardStats);

router.get("/users", admin.admin.getAllUsers);
router.put("/users/:userId/role", admin.admin.updateUserRole);

router.get("/projects", admin.admin.getAllProjects);
router.get("/projects/:projectId", admin.admin.getProjectById);
router.patch("/projects/:projectId/archive", admin.admin.archiveProject);
router.delete("/projects/:projectId", admin.admin.deleteProject);

router.get("/deployments", admin.admin.getAllDeployments);
router.get("/deployments/:deploymentId", admin.admin.getDeploymentById);
router.post("/deployments/:deploymentId/cancel", admin.admin.cancelDeployment);
router.post("/deployments/:deploymentId/stop", admin.admin.stopDeployment);

router.get("/subdomains", admin.admin.getAllSubdomains);
router.get("/subdomains/platform-reserved", admin.admin.getPlatformReserved);
router.post("/subdomains/:reservationId/release", admin.admin.releaseSubdomain);

router.get("/activity", admin.admin.getActivity);

router.get("/notifications", admin.admin.getNotifications);
router.post("/notifications/send", admin.admin.sendNotification);

module.exports = router;
