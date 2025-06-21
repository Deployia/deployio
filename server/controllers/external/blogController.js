const external = require("@services/external");
const logger = require("@config/logger");

// @desc    Get all blog posts with filtering and pagination
// @route   GET /api/v1/blog
// @access  Public
const getAllBlogs = async (req, res) => {
  try {
    const {
      category,
      featured,
      search,
      tags,
      limit = 10,
      page = 1,
      sort = "latest",
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let blogs;
    let sortOptions = { publishedAt: -1 }; // Default: latest first

    // Handle different sort options
    switch (sort) {
      case "popular":
        sortOptions = { views: -1, publishedAt: -1 };
        break;
      case "oldest":
        sortOptions = { publishedAt: 1 };
        break;
      case "alphabetical":
        sortOptions = { title: 1 };
        break;
      default:
        sortOptions = { publishedAt: -1 };
    }

    if (search) {
      // Use search functionality
      const tagsArray = tags ? tags.split(",").map((tag) => tag.trim()) : [];
      blogs = await external.blog.searchBlogs(search, {
        category,
        tags: tagsArray,
        limit: parseInt(limit),
        skip,
      });
    } else {
      // Get all blogs with optional filters
      blogs = await external.blog.getAllBlogs({
        category,
        featured: featured === "true" ? true : undefined,
        limit: parseInt(limit),
        skip,
        sort: sortOptions,
      });
    }

    // Get stats for navigation and sidebar
    const stats = await external.blog.getBlogStats();

    res.status(200).json({
      success: true,
      data: {
        blogs,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: blogs.length,
        },
      },
    });
  } catch (error) {
    logger.error("Error getting all blogs:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching blog posts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get single blog post by slug
// @route   GET /api/v1/blog/:slug or /api/v1/blog/:category/:slug
// @access  Public
const getBlogBySlug = async (req, res) => {
  try {
    const { slug, category } = req.params;

    const blog = await external.blog.getBlogBySlug(slug, category);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Get related posts
    const relatedPosts = await external.blog.getRelatedPosts(blog._id, 4);

    res.status(200).json({
      success: true,
      data: {
        blog,
        relatedPosts,
      },
    });
  } catch (error) {
    logger.error(`Error getting blog by slug ${req.params.slug}:`, error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching blog post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get blog posts by category
// @route   GET /api/v1/blog/category/:category
// @access  Public
const getBlogsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10, page = 1, sort = "latest" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sortOptions = { publishedAt: -1 };
    switch (sort) {
      case "popular":
        sortOptions = { views: -1, publishedAt: -1 };
        break;
      case "oldest":
        sortOptions = { publishedAt: 1 };
        break;
      default:
        sortOptions = { publishedAt: -1 };
    }

    const blogs = await external.blog.getBlogsByCategory(category, {
      limit: parseInt(limit),
      skip,
      sort: sortOptions,
    });

    const totalCount = await external.blog.getAllBlogs({
      category,
      limit: 1000, // Get count
    });

    res.status(200).json({
      success: true,
      data: {
        blogs,
        category,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount.length,
          totalPages: Math.ceil(totalCount.length / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error(
      `Error getting blogs by category ${req.params.category}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: "Server error while fetching category blogs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get featured blog posts
// @route   GET /api/v1/blog/featured
// @access  Public
const getFeaturedBlogs = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const blogs = await external.blog.getFeaturedBlogs(parseInt(limit));

    res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    logger.error("Error getting featured blogs:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching featured blogs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get popular blog posts
// @route   GET /api/v1/blog/popular
// @access  Public
const getPopularBlogs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const blogs = await external.blog.getPopularBlogs(parseInt(limit));

    res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    logger.error("Error getting popular blogs:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching popular blogs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get recent blog posts
// @route   GET /api/v1/blog/recent
// @access  Public
const getRecentBlogs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const blogs = await external.blog.getRecentBlogs(parseInt(limit));

    res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    logger.error("Error getting recent blogs:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching recent blogs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Search blog posts
// @route   GET /api/v1/blog/search
// @access  Public
const searchBlogs = async (req, res) => {
  try {
    const { q: query, category, tags, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const tagsArray = tags ? tags.split(",").map((tag) => tag.trim()) : [];

    const blogs = await external.blog.searchBlogs(query, {
      category,
      tags: tagsArray,
      limit: parseInt(limit),
      skip,
    });

    res.status(200).json({
      success: true,
      data: {
        blogs,
        query,
        filters: { category, tags: tagsArray },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: blogs.length,
        },
      },
    });
  } catch (error) {
    logger.error(`Error searching blogs with query "${req.query.q}":`, error);
    res.status(500).json({
      success: false,
      message: "Server error while searching blogs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Like a blog post
// @route   POST /api/v1/blog/:id/like
// @access  Public
const likeBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await external.blog.toggleLike(id);

    res.status(200).json({
      success: true,
      data: {
        likes: blog.likes,
        message: "Blog liked successfully",
      },
    });
  } catch (error) {
    logger.error(`Error liking blog ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Server error while liking blog",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Share a blog post (record share count)
// @route   POST /api/v1/blog/:id/share
// @access  Public
const shareBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await external.blog.recordShare(id);

    res.status(200).json({
      success: true,
      data: {
        shares: blog.shares,
        message: "Share recorded successfully",
      },
    });
  } catch (error) {
    logger.error(`Error recording share for blog ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Server error while recording share",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get blog statistics
// @route   GET /api/v1/blog/stats
// @access  Public
const getBlogStats = async (req, res) => {
  try {
    const stats = await external.blog.getBlogStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error getting blog stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching blog statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Sync blogs from metadata (Admin only)
// @route   POST /api/v1/blog/sync
// @access  Private (Admin)
const syncBlogs = async (req, res) => {
  try {
    const { dryRun = false, force = false } = req.body;

    logger.info(`Starting blog sync - dryRun: ${dryRun}, force: ${force}`);

    const results = await external.blog.syncFromMetadata(dryRun);

    res.status(200).json({
      success: true,
      message: `Blog sync completed ${dryRun ? "(dry run)" : ""}`,
      data: results,
    });
  } catch (error) {
    logger.error("Error syncing blogs:", error);
    res.status(500).json({
      success: false,
      message: "Server error while syncing blogs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Sync specific blog from file (Admin only)
// @route   POST /api/v1/blog/:id/sync
// @access  Private (Admin)
const syncBlogFromFile = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await external.blog.syncBlogFromFile(id);

    res.status(200).json({
      success: true,
      message: "Blog synced from file successfully",
      data: blog,
    });
  } catch (error) {
    logger.error(`Error syncing blog ${req.params.id} from file:`, error);
    res.status(500).json({
      success: false,
      message: "Server error while syncing blog from file",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get blog categories with counts
// @route   GET /api/v1/blog/categories
// @access  Public
const getBlogCategories = async (req, res) => {
  try {
    const categories = await external.blog.getBlogCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error("Error fetching blog categories:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching blog categories",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getAllBlogs,
  getBlogBySlug,
  getBlogsByCategory,
  getBlogCategories,
  getFeaturedBlogs,
  getPopularBlogs,
  getRecentBlogs,
  searchBlogs,
  likeBlog,
  shareBlog,
  getBlogStats,
  syncBlogs,
  syncBlogFromFile,
};
