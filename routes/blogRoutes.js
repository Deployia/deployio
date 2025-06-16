const express = require("express");
const {
  getAllBlogs,
  getBlogBySlug,
  getBlogsByCategory,
  getFeaturedBlogs,
  getPopularBlogs,
  getRecentBlogs,
  searchBlogs,
  likeBlog,
  shareBlog,
  getBlogStats,
  syncBlogs,
  syncBlogFromFile,
} = require("../controllers/blogController");

const { protect } = require("../middleware/authMiddleware");
const { getRateLimiters } = require("../middleware/rateLimitMiddleware");

const router = express.Router();

// Public routes - Apply rate limiting
router.use(getRateLimiters().api.read); // 500 requests per 15 minutes

// @desc    Get all blog posts
// @route   GET /api/v1/blog
// @access  Public
router.get("/", getAllBlogs);

// @desc    Search blog posts
// @route   GET /api/v1/blog/search
// @access  Public
router.get("/search", searchBlogs);

// @desc    Get blog statistics
// @route   GET /api/v1/blog/stats
// @access  Public
router.get("/stats", getBlogStats);

// @desc    Get featured blog posts
// @route   GET /api/v1/blog/featured
// @access  Public
router.get("/featured", getFeaturedBlogs);

// @desc    Get popular blog posts
// @route   GET /api/v1/blog/popular
// @access  Public
router.get("/popular", getPopularBlogs);

// @desc    Get recent blog posts
// @route   GET /api/v1/blog/recent
// @access  Public
router.get("/recent", getRecentBlogs);

// @desc    Get blog posts by category
// @route   GET /api/v1/blog/category/:category
// @access  Public
router.get("/category/:category", getBlogsByCategory);

// Blog interaction routes with stricter rate limiting
router.use(getRateLimiters().api.write); // 100 requests per 15 minutes

// @desc    Like a blog post
// @route   POST /api/v1/blog/:id/like
// @access  Public
router.post("/:id/like", likeBlog);

// @desc    Share a blog post (record share count)
// @route   POST /api/v1/blog/:id/share
// @access  Public
router.post("/:id/share", shareBlog);

// Admin routes - Require authentication
router.use(protect);

// @desc    Sync blogs from metadata
// @route   POST /api/v1/blog/sync
// @access  Private (Admin)
router.post("/sync", syncBlogs);

// @desc    Sync specific blog from file
// @route   POST /api/v1/blog/:id/sync
// @access  Private (Admin)
router.post("/:id/sync", syncBlogFromFile);

// Blog slug routes (must be last to avoid conflicts)
// @desc    Get single blog post by slug (with optional category)
// @route   GET /api/v1/blog/:slug
// @route   GET /api/v1/blog/:category/:slug
// @access  Public
router.get("/:category/:slug", getBlogBySlug);
router.get("/:slug", getBlogBySlug);

module.exports = router;
