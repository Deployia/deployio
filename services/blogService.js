const Blog = require("../models/Blog");
const logger = require("../config/logger");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

/**
 * BlogService - Manages markdown-based blog posts with database caching
 *
 * This service provides a hybrid approach:
 * - Blog content stored as markdown files in /blogs folder
 * - Metadata and cached content stored in MongoDB
 * - Automatic syncing between files and database
 * - Support for categories, tags, and SEO optimization
 */
class BlogService {
  constructor() {
    this.blogsPath = path.join(__dirname, "..", "blogs");
    this.metadataPath = path.join(this.blogsPath, "metadata.json");
    this.metadata = null;
    this.supportedCategories = [
      "engineering",
      "product",
      "tutorials",
      "company",
      "case-studies",
      "devops",
      "ai-ml",
      "security",
      "announcements",
    ];
  }

  /**
   * Load metadata from JSON file
   */
  async loadMetadata() {
    try {
      if (!this.metadata) {
        const metadataContent = await fs.readFile(this.metadataPath, "utf8");
        this.metadata = JSON.parse(metadataContent);
      }
      return this.metadata;
    } catch (error) {
      logger.warn(
        "Could not load blogs metadata.json, using defaults:",
        error.message
      );
      return {
        categories: {},
        storage: {
          local: { basePath: "blogs/", enabled: true },
        },
        settings: {
          defaultAuthor: "Deployio Team",
          fallbackToLocal: true,
          postsPerPage: 10,
          featuredLimit: 6,
        },
      };
    }
  }

  /**
   * Get metadata for a specific blog post
   */
  getBlogMetadata(category, slug) {
    const categoryData = this.metadata?.categories?.[category];
    if (!categoryData) {
      return this.getDefaultMetadata();
    }

    const blogData = categoryData.posts?.find((post) => post.slug === slug);
    if (!blogData) {
      return this.getDefaultMetadata();
    }

    return {
      ...this.getDefaultMetadata(),
      ...blogData,
      // Map metadata fields to database fields
      featured: blogData.featured || false,
      readingTime: blogData.readingTime || 5,
    };
  }

  /**
   * Get default metadata values
   */
  getDefaultMetadata() {
    return {
      author: {
        name: this.metadata?.settings?.defaultAuthor || "Deployio Team",
        email: "blog@deployio.dev",
      },
      status: "published",
      featured: false,
      readingTime: 5,
      tags: [],
      commentsEnabled: true,
      includeInNewsletter: false,
    };
  }

  /**
   * Get all blog posts
   */
  async getAllBlogs(options = {}) {
    try {
      const {
        category,
        status = "published",
        featured,
        limit = 10,
        skip = 0,
        sort = { publishedAt: -1 },
      } = options;

      const query = { status };
      if (category) query.category = category;
      if (featured !== undefined) query.featured = featured;

      const blogs = await Blog.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .select("-content") // Don't return full content in list
        .lean();

      return blogs;
    } catch (error) {
      logger.error("Error getting all blogs:", error);
      throw error;
    }
  }

  /**
   * Get blog post by slug and category
   */
  async getBlogBySlug(slug, category = null) {
    try {
      let blog = await Blog.findBySlug(slug, category);

      if (!blog) {
        logger.warn(`Blog post not found: ${slug} in category ${category}`);
        return null;
      }

      // Check if we need to sync from file
      if (blog.needsSync()) {
        logger.info(`Syncing blog post from file: ${blog.filePath}`);
        await blog.loadFromFile();
        await blog.save();
      }

      // Increment view count
      await blog.incrementViews();

      return blog;
    } catch (error) {
      logger.error(`Error getting blog by slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Get blog posts by category
   */
  async getBlogsByCategory(category, options = {}) {
    try {
      const { limit = 10, skip = 0, sort = { publishedAt: -1 } } = options;

      const blogs = await Blog.findByCategory(category, {
        limit,
        skip,
        sort,
      });

      return blogs;
    } catch (error) {
      logger.error(`Error getting blogs by category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get featured blog posts
   */
  async getFeaturedBlogs(limit = 6) {
    try {
      return await Blog.getFeatured(limit);
    } catch (error) {
      logger.error("Error getting featured blogs:", error);
      throw error;
    }
  }

  /**
   * Get popular blog posts
   */
  async getPopularBlogs(limit = 10) {
    try {
      return await Blog.getPopular(limit);
    } catch (error) {
      logger.error("Error getting popular blogs:", error);
      throw error;
    }
  }

  /**
   * Get recent blog posts
   */
  async getRecentBlogs(limit = 10) {
    try {
      return await Blog.getRecent(limit);
    } catch (error) {
      logger.error("Error getting recent blogs:", error);
      throw error;
    }
  }

  /**
   * Search blog posts
   */
  async searchBlogs(query, options = {}) {
    try {
      const { category, tags, limit = 20, skip = 0 } = options;

      const blogs = await Blog.search(query, {
        category,
        tags,
        limit,
        skip,
      });

      return blogs;
    } catch (error) {
      logger.error(`Error searching blogs with query "${query}":`, error);
      throw error;
    }
  }

  /**
   * Get blog stats for admin/analytics
   */
  async getBlogStats() {
    try {
      const [
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        featuredBlogs,
        categoryStats,
        popularBlogs,
      ] = await Promise.all([
        Blog.countDocuments(),
        Blog.countDocuments({ status: "published" }),
        Blog.countDocuments({ status: "draft" }),
        Blog.countDocuments({ featured: true, status: "published" }),
        Blog.aggregate([
          { $match: { status: "published" } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Blog.aggregate([
          { $match: { status: "published" } },
          { $sort: { views: -1 } },
          { $limit: 5 },
          { $project: { title: 1, slug: 1, category: 1, views: 1 } },
        ]),
      ]);

      return {
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        featuredBlogs,
        categoryStats,
        popularBlogs,
      };
    } catch (error) {
      logger.error("Error getting blog stats:", error);
      throw error;
    }
  }

  /**
   * Sync all blogs from metadata
   */
  async syncFromMetadata(dryRun = false) {
    try {
      await this.loadMetadata();
      const results = {
        processed: 0,
        created: 0,
        updated: 0,
        errors: 0,
        operations: [],
      };

      logger.info(`Starting blog sync ${dryRun ? "(DRY RUN)" : ""}`);

      for (const [categoryName, categoryData] of Object.entries(
        this.metadata.categories || {}
      )) {
        if (!categoryData.posts) continue;

        for (const postData of categoryData.posts) {
          results.processed++;

          try {
            const filePath = path.join(
              this.blogsPath,
              categoryData.basePath || categoryName,
              postData.file
            );

            // Check if file exists
            try {
              await fs.access(filePath);
            } catch (error) {
              logger.warn(`Blog file not found: ${filePath}`);
              results.errors++;
              results.operations.push({
                operation: "error",
                category: categoryName,
                slug: postData.slug,
                error: `File not found: ${filePath}`,
              });
              continue;
            }

            // Check if blog exists in database
            let blog = await Blog.findOne({
              slug: postData.slug,
              category: categoryName,
            });

            if (blog) {
              // Update existing blog
              const metadata = this.getBlogMetadata(
                categoryName,
                postData.slug
              );
              Object.assign(blog, {
                ...metadata,
                title: postData.title || blog.title,
                excerpt: postData.excerpt || blog.excerpt,
                filePath: filePath,
                tags: postData.tags || blog.tags,
                metaTitle: postData.metaTitle || blog.metaTitle,
                metaDescription:
                  postData.metaDescription || blog.metaDescription,
                socialImage: postData.socialImage || blog.socialImage,
              });

              if (!dryRun) {
                await blog.loadFromFile();
                await blog.save();
              }

              results.updated++;
              results.operations.push({
                operation: "updated",
                category: categoryName,
                slug: postData.slug,
                title: postData.title,
              });
            } else {
              // Create new blog
              const metadata = this.getBlogMetadata(
                categoryName,
                postData.slug
              );
              blog = new Blog({
                ...metadata,
                title: postData.title,
                slug: postData.slug,
                excerpt: postData.excerpt || "",
                category: categoryName,
                filePath: filePath,
                tags: postData.tags || [],
                metaTitle: postData.metaTitle,
                metaDescription: postData.metaDescription,
                socialImage: postData.socialImage,
              });

              if (!dryRun) {
                await blog.loadFromFile();
                await blog.save();
              }

              results.created++;
              results.operations.push({
                operation: "created",
                category: categoryName,
                slug: postData.slug,
                title: postData.title,
              });
            }

            logger.info(
              `${dryRun ? "[DRY RUN] " : ""}Synced blog: ${categoryName}/${
                postData.slug
              }`
            );
          } catch (error) {
            logger.error(
              `Error syncing blog ${categoryName}/${postData.slug}:`,
              error
            );
            results.errors++;
            results.operations.push({
              operation: "error",
              category: categoryName,
              slug: postData.slug,
              error: error.message,
            });
          }
        }
      }

      logger.info(
        `Blog sync completed ${dryRun ? "(DRY RUN)" : ""}: ${
          results.created
        } created, ${results.updated} updated, ${results.errors} errors`
      );

      return results;
    } catch (error) {
      logger.error("Error in blog sync:", error);
      throw error;
    }
  }

  /**
   * Sync specific blog from file
   */
  async syncBlogFromFile(blogId) {
    try {
      const blog = await Blog.findById(blogId);
      if (!blog) {
        throw new Error("Blog not found");
      }

      await blog.loadFromFile();
      await blog.save();

      logger.info(`Synced blog from file: ${blog.title}`);
      return blog;
    } catch (error) {
      logger.error(`Error syncing blog from file:`, error);
      throw error;
    }
  }

  /**
   * Get related posts based on category and tags
   */
  async getRelatedPosts(blogId, limit = 4) {
    try {
      const blog = await Blog.findById(blogId);
      if (!blog) return [];

      // Find posts with same category or matching tags
      const relatedPosts = await Blog.find({
        _id: { $ne: blogId },
        status: "published",
        $or: [{ category: blog.category }, { tags: { $in: blog.tags } }],
      })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .select("title slug category excerpt publishedAt readingTime");

      return relatedPosts;
    } catch (error) {
      logger.error("Error getting related posts:", error);
      throw error;
    }
  }

  /**
   * Toggle blog like
   */
  async toggleLike(blogId) {
    try {
      const blog = await Blog.findById(blogId);
      if (!blog) {
        throw new Error("Blog not found");
      }

      await blog.addLike();
      return blog;
    } catch (error) {
      logger.error("Error toggling blog like:", error);
      throw error;
    }
  }

  /**
   * Record blog share
   */
  async recordShare(blogId) {
    try {
      const blog = await Blog.findById(blogId);
      if (!blog) {
        throw new Error("Blog not found");
      }

      await blog.addShare();
      return blog;
    } catch (error) {
      logger.error("Error recording blog share:", error);
      throw error;
    }
  }
}

module.exports = new BlogService();
