const express = require("express");
const { external } = require("@controllers");
const { protect } = require("@middleware/authMiddleware");
const { getRateLimiters } = require("@middleware/rateLimitMiddleware");

const router = express.Router();

// Public routes - Apply rate limiting
router.use(getRateLimiters().api.read); // 500 requests per 15 minutes

// @desc    Get all blog posts
// @route   GET /api/v1/external/blog
// @access  Public
router.get("/", external.blog.getAllBlogs);

// @desc    Search blog posts
// @route   GET /api/v1/external/blog/search
// @access  Public
router.get("/search", external.blog.searchBlogs);

// @desc    Get blog statistics
// @route   GET /api/v1/external/blog/stats
// @access  Public
router.get("/stats", external.blog.getBlogStats);

// @desc    Get featured blog posts
// @route   GET /api/v1/external/blog/featured
// @access  Public
router.get("/featured", external.blog.getFeaturedBlogs);

// @desc    Get popular blog posts
// @route   GET /api/v1/external/blog/popular
// @access  Public
router.get("/popular", external.blog.getPopularBlogs);

// @desc    Get recent blog posts
// @route   GET /api/v1/external/blog/recent
// @access  Public
router.get("/recent", external.blog.getRecentBlogs);

// @desc    Get blog categories
// @route   GET /api/v1/external/blog/categories
// @access  Public
router.get("/categories", external.blog.getBlogCategories);

// @desc    Get blog posts by category
// @route   GET /api/v1/external/blog/category/:category
// @access  Public
router.get("/category/:category", external.blog.getBlogsByCategory);

// @desc    Get single blog post by slug
// @route   GET /api/v1/external/blog/:slug or /api/v1/external/blog/:category/:slug
// @access  Public
router.get("/:slug", external.blog.getBlogBySlug);
router.get("/:category/:slug", external.blog.getBlogBySlug);

// Protected routes
// @desc    Like a blog post
// @route   POST /api/v1/external/blog/:id/like
// @access  Private
router.post("/:id/like", protect, external.blog.likeBlog);

// @desc    Share a blog post
// @route   POST /api/v1/external/blog/:id/share
// @access  Private
router.post("/:id/share", protect, external.blog.shareBlog);

// Admin routes - sync operations
// @desc    Sync all blogs from file system
// @route   POST /api/v1/external/blog/sync
// @access  Private/Admin
router.post("/sync", protect, external.blog.syncBlogs);

// @desc    Sync single blog from file
// @route   POST /api/v1/external/blog/sync/:filename
// @access  Private/Admin
router.post("/sync/:filename", protect, external.blog.syncBlogFromFile);

module.exports = router;
