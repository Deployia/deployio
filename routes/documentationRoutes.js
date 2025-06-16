const express = require("express");
const {
  getAllDocs,
  getDocBySlug,
  getDocsByCategory,
  searchDocs,
  getFeaturedDocs,
  getPopularDocs,
  getDocStats,
  syncDocsFromFiles,
  createDoc,
  updateDoc,
  deleteDoc,
  markHelpful,
  markNotHelpful,
} = require("../controllers/documentationController");

const router = express.Router();

// GET /api/v1/documentation - Get all documentation with filters
router.get("/", getAllDocs);

// GET /api/v1/documentation/search - Search documentation
router.get("/search", searchDocs);

// GET /api/v1/documentation/featured - Get featured documentation
router.get("/featured", getFeaturedDocs);

// GET /api/v1/documentation/popular - Get popular documentation
router.get("/popular", getPopularDocs);

// GET /api/v1/documentation/stats - Get documentation statistics
router.get("/stats", getDocStats);

// POST /api/v1/documentation/sync - Sync documentation from files
router.post("/sync", syncDocsFromFiles);

// GET /api/v1/documentation/category/:category - Get documentation by category
router.get("/category/:category", getDocsByCategory);

// POST /api/v1/documentation - Create new documentation
router.post("/", createDoc);

// PUT /api/v1/documentation/:id - Update documentation
router.put("/:id", updateDoc);

// DELETE /api/v1/documentation/:id - Delete documentation
router.delete("/:id", deleteDoc);

// GET /api/v1/documentation/:category/:slug - Get single documentation by category and slug
router.get("/:category/:slug", getDocBySlug);

// POST /api/v1/documentation/:slug/helpful - Mark documentation as helpful
router.post("/:slug/helpful", markHelpful);

// POST /api/v1/documentation/:slug/not-helpful - Mark documentation as not helpful
router.post("/:slug/not-helpful", markNotHelpful);

// GET /api/v1/documentation/:slug - Get single documentation by slug (must be last)
router.get("/:slug", getDocBySlug);

module.exports = router;
