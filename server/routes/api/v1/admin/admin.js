// Admin Management Routes - /api/v1/admin/admin/*
// Core admin operations using existing adminController

const express = require("express");
const { admin } = require("@controllers");
const router = express.Router();

// IMPLEMENTED ROUTES
router.get("/dashboard-stats", admin.admin.getDashboardStats);
router.get("/users", admin.admin.getAllUsers);
router.put("/users/:userId/role", admin.admin.updateUserRole);
router.get("/blogs", admin.admin.getAllBlogs);
router.delete("/blogs/:blogId", admin.admin.deleteBlog);
router.get("/projects", admin.admin.getAllProjects);
router.get("/system-logs", admin.admin.getSystemLogs);

// PLANNED ROUTES - TO BE IMPLEMENTED
// router.get("/stats", admin.admin.getSystemStats);
// router.get("/deployments", admin.admin.getAllDeployments);
// router.post("/maintenance", admin.admin.enableMaintenance);
// router.delete("/maintenance", admin.admin.disableMaintenance);
// router.post("/backup", admin.admin.createSystemBackup);
// router.get("/health", admin.admin.getSystemHealth);

module.exports = router;
