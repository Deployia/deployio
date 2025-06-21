const express = require("express");
const { external } = require("@controllers");
const { protect } = require("@middleware/authMiddleware");
const { getRateLimiters } = require("@middleware/rateLimitMiddleware");

const router = express.Router();

// Public routes - Apply rate limiting
router.use(getRateLimiters().api.read);

// @desc    Get all documentation
// @route   GET /api/v1/external/docs
// @access  Public
router.get("/", external.documentation.getAllDocs);

// @desc    Search documentation
// @route   GET /api/v1/external/docs/search
// @access  Public
router.get("/search", external.documentation.searchDocs);

// @desc    Get featured documentation
// @route   GET /api/v1/external/docs/featured
// @access  Public
router.get("/featured", external.documentation.getFeaturedDocs);

// @desc    Get popular documentation
// @route   GET /api/v1/external/docs/popular
// @access  Public
router.get("/popular", external.documentation.getPopularDocs);

// @desc    Get documentation statistics
// @route   GET /api/v1/external/docs/stats
// @access  Public
router.get("/stats", external.documentation.getDocStats);

// @desc    Get documentation by category
// @route   GET /api/v1/external/docs/category/:category
// @access  Public
router.get("/category/:category", external.documentation.getDocsByCategory);

// @desc    Get single documentation by slug
// @route   GET /api/v1/external/docs/:slug or /api/v1/external/docs/:category/:slug
// @access  Public
router.get("/:slug", external.documentation.getDocBySlug);
router.get("/:category/:slug", external.documentation.getDocBySlug);

// Protected routes
// @desc    Mark documentation as helpful
// @route   POST /api/v1/external/docs/:id/helpful
// @access  Private
router.post("/:id/helpful", protect, external.documentation.markHelpful);

// @desc    Mark documentation as not helpful
// @route   POST /api/v1/external/docs/:id/not-helpful
// @access  Private
router.post("/:id/not-helpful", protect, external.documentation.markNotHelpful);

// Admin routes
// @desc    Sync documentation from files
// @route   POST /api/v1/external/docs/sync
// @access  Private/Admin
router.post("/sync", protect, external.documentation.syncDocsFromFiles);

// @desc    Create new documentation
// @route   POST /api/v1/external/docs
// @access  Private/Admin
router.post("/", protect, external.documentation.createDoc);

// @desc    Update documentation
// @route   PUT /api/v1/external/docs/:id
// @access  Private/Admin
router.put("/:id", protect, external.documentation.updateDoc);

// @desc    Delete documentation
// @route   DELETE /api/v1/external/docs/:id
// @access  Private/Admin
router.delete("/:id", protect, external.documentation.deleteDoc);

module.exports = router;
