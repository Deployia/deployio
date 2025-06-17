const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  getAllBlogs,
  deleteBlog,
  getAllProjects,
  getSystemLogs,
} = require("../controllers/adminController");

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(protect);
router.use(adminOnly);

// Dashboard routes
router.get("/dashboard/stats", getDashboardStats);
router.get("/logs", getSystemLogs);

// User management routes
router.get("/users", getAllUsers);
router.put("/users/:userId/role", updateUserRole);

// Blog management routes
router.get("/blogs", getAllBlogs);
router.delete("/blogs/:blogId", deleteBlog);

// Project management routes
router.get("/projects", getAllProjects);

module.exports = router;
