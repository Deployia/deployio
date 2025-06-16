const documentationService = require("../services/documentationService");
const logger = require("../config/logger");

// @desc    Get all documentation with navigation structure
// @route   GET /api/v1/documentation
// @access  Public
const getAllDocs = async (req, res) => {
  try {
    const { category, search, tag, limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let docs;

    if (search) {
      // Use search functionality
      docs = await documentationService.searchDocumentation(search, {
        category,
        limit: parseInt(limit),
        skip,
      });
    } else {
      // Get all docs with optional category filter
      docs = await documentationService.getAllDocumentation({
        category,
        limit: parseInt(limit),
        skip,
        sort: { category: 1, order: 1, createdAt: -1 },
      });
    }

    // Get stats for navigation
    const stats = await documentationService.getDocumentationStats();

    res.status(200).json({
      success: true,
      data: {
        docs,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: docs.length,
        },
      },
    });
  } catch (error) {
    logger.error("Error getting all docs:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching documentation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get single documentation by slug
// @route   GET /api/v1/documentation/:slug or /api/v1/documentation/:category/:slug
// @access  Public
const getDocBySlug = async (req, res) => {
  try {
    const { slug, category } = req.params;

    const doc = await documentationService.getDocumentationBySlug(
      slug,
      category
    );

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Documentation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    logger.error(`Error getting doc by slug ${req.params.slug}:`, error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching documentation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get documentation by category
// @route   GET /api/v1/documentation/category/:category
// @access  Public
const getDocsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const docs = await documentationService.getDocumentationByCategory(
      category,
      {
        limit: parseInt(limit),
        skip,
        sort: { order: 1, createdAt: -1 },
      }
    );

    res.status(200).json({
      success: true,
      data: docs,
    });
  } catch (error) {
    logger.error(
      `Error getting docs by category ${req.params.category}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: "Server error while fetching documentation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Search documentation
// @route   GET /api/v1/documentation/search
// @access  Public
const searchDocs = async (req, res) => {
  try {
    const { q, category, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const docs = await documentationService.searchDocumentation(q, {
      category,
      limit: parseInt(limit),
      skip,
    });

    res.status(200).json({
      success: true,
      data: docs,
    });
  } catch (error) {
    logger.error("Error searching documentation:", error);
    res.status(500).json({
      success: false,
      message: "Server error while searching documentation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get featured documentation
// @route   GET /api/v1/documentation/featured
// @access  Public
const getFeaturedDocs = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const docs = await documentationService.getFeaturedDocumentation(
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: docs,
    });
  } catch (error) {
    logger.error("Error getting featured documentation:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching featured documentation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get popular documentation
// @route   GET /api/v1/documentation/popular
// @access  Public
const getPopularDocs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const docs = await documentationService.getPopularDocumentation(
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: docs,
    });
  } catch (error) {
    logger.error("Error getting popular documentation:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching popular documentation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get documentation statistics
// @route   GET /api/v1/documentation/stats
// @access  Public
const getDocStats = async (req, res) => {
  try {
    const stats = await documentationService.getDocumentationStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error getting documentation stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching documentation statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Sync documentation from files
// @route   POST /api/v1/documentation/sync
// @access  Private (Admin only)
const syncDocsFromFiles = async (req, res) => {
  try {
    const result = await documentationService.syncDocumentationFromFiles();

    res.status(200).json({
      success: true,
      message: "Documentation sync completed",
      data: result,
    });
  } catch (error) {
    logger.error("Error syncing documentation from files:", error);
    res.status(500).json({
      success: false,
      message: "Server error while syncing documentation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Create new documentation
// @route   POST /api/v1/documentation
// @access  Private (Admin only)
const createDoc = async (req, res) => {
  try {
    const doc = await documentationService.createDocumentation(req.body);

    res.status(201).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    logger.error("Error creating documentation:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating documentation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update documentation
// @route   PUT /api/v1/documentation/:id
// @access  Private (Admin only)
const updateDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await documentationService.updateDocumentation(id, req.body);

    res.status(200).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    logger.error("Error updating documentation:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating documentation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete documentation
// @route   DELETE /api/v1/documentation/:id
// @access  Private (Admin only)
const deleteDoc = async (req, res) => {
  try {
    const { id } = req.params;
    await documentationService.deleteDocumentation(id);

    res.status(200).json({
      success: true,
      message: "Documentation deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting documentation:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting documentation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Mark documentation as helpful
// @route   POST /api/v1/documentation/:slug/helpful
// @access  Public
const markHelpful = async (req, res) => {
  try {
    const { slug } = req.params;
    const { category } = req.body;

    const doc = await documentationService.getDocumentationBySlug(
      slug,
      category
    );

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Documentation not found",
      });
    }

    await doc.markHelpful();

    res.status(200).json({
      success: true,
      message: "Marked as helpful",
      data: {
        helpfulCount: doc.helpfulCount,
        notHelpfulCount: doc.notHelpfulCount,
      },
    });
  } catch (error) {
    logger.error("Error marking documentation as helpful:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking as helpful",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Mark documentation as not helpful
// @route   POST /api/v1/documentation/:slug/not-helpful
// @access  Public
const markNotHelpful = async (req, res) => {
  try {
    const { slug } = req.params;
    const { category } = req.body;

    const doc = await documentationService.getDocumentationBySlug(
      slug,
      category
    );

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Documentation not found",
      });
    }

    await doc.markNotHelpful();

    res.status(200).json({
      success: true,
      message: "Marked as not helpful",
      data: {
        helpfulCount: doc.helpfulCount,
        notHelpfulCount: doc.notHelpfulCount,
      },
    });
  } catch (error) {
    logger.error("Error marking documentation as not helpful:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking as not helpful",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
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
};
