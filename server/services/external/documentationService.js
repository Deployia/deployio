const Documentation = require("@models/Documentation");
const logger = require("@config/logger");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

/**
 * DocumentationService - Manages file-based documentation with database caching
 *
 * This service provides a hybrid approach:
 * - Documentation content stored as markdown files in /docs folder
 * - Metadata and cached content stored in MongoDB
 * - Automatic syncing between files and database
 * - Support for future CDN migration
 */
class DocumentationService {
  constructor() {
    this.docsPath = path.join(__dirname, "..", "docs");
    this.metadataPath = path.join(this.docsPath, "metadata.json");
    this.metadata = null;
    this.supportedCategories = [
      "getting-started",
      "products",
      "downloads",
      "guides",
      "api",
      "security",
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
        "Could not load metadata.json, using defaults:",
        error.message
      );
      return {
        documentation: {},
        storage: {
          local: { basePath: "docs/", enabled: true },
        },
        settings: {
          defaultAuthor: "Deployio Team",
          fallbackToLocal: true,
        },
      };
    }
  }
  /**
   * Get metadata for a specific document
   */
  getDocumentMetadata(category, slug) {
    // Updated to work with new metadata.json structure
    const categoryData = this.metadata?.categories?.[category];
    if (!categoryData) {
      return this.getDefaultMetadata();
    }

    const documentData = categoryData.documents?.find(
      (doc) => doc.slug === slug
    );
    if (!documentData) {
      return this.getDefaultMetadata();
    }

    return {
      ...this.getDefaultMetadata(),
      ...documentData,
      // Map metadata fields to database fields
      isFeatured: documentData.featured || false,
      readingTimeMinutes: documentData.readingTime || 5,
    };
  }

  /**
   * Get default metadata values
   */
  getDefaultMetadata() {
    return {
      author: this.metadata?.settings?.defaultAuthor || "Deployio Team",
      order: 0,
      tags: [],
      difficulty: "beginner",
      isFeatured: false,
      readingTimeMinutes: 5,
    };
  }

  /**
   * Get all documentation entries
   */
  async getAllDocumentation(options = {}) {
    try {
      const {
        category,
        limit = 50,
        skip = 0,
        sort = { category: 1, order: 1 },
      } = options;

      const query = { isPublished: true };
      if (category) query.category = category;

      const docs = await Documentation.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .select("-content") // Don't return full content in list
        .lean();

      return docs;
    } catch (error) {
      logger.error("Error getting all documentation:", error);
      throw error;
    }
  }
  /**
   * Get documentation by slug and category
   */
  async getDocumentationBySlug(slug, category = null) {
    try {
      let doc = await Documentation.findBySlug(slug, category);

      if (!doc) {
        logger.warn(
          `Documentation not found: ${slug} in category ${category || "any"}`
        );
        return null;
      }

      // If category was provided but document doesn't match, return null
      if (category && doc.category !== category) {
        logger.warn(
          `Document ${slug} found but in wrong category: ${doc.category} (expected: ${category})`
        );
        return null;
      }

      // Check if we need to sync from file
      if (doc.needsSync()) {
        logger.info(`Syncing documentation from file: ${doc.filePath}`);
        await doc.loadFromFile();
        await doc.save();
      }

      // Increment view count
      await doc.incrementViews();

      return doc;
    } catch (error) {
      logger.error(`Error getting documentation by slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Search documentation
   */
  async searchDocumentation(query, options = {}) {
    try {
      const { category, limit = 20, skip = 0 } = options;

      const docs = await Documentation.search(query, { category, limit, skip });
      return docs;
    } catch (error) {
      logger.error("Error searching documentation:", error);
      throw error;
    }
  }

  /**
   * Get documentation by category
   */
  async getDocumentationByCategory(category, options = {}) {
    try {
      const docs = await Documentation.findByCategory(category, options);
      return docs;
    } catch (error) {
      logger.error(
        `Error getting documentation by category ${category}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get featured documentation
   */
  async getFeaturedDocumentation(limit = 6) {
    try {
      const docs = await Documentation.getFeatured(limit);
      return docs;
    } catch (error) {
      logger.error("Error getting featured documentation:", error);
      throw error;
    }
  }

  /**
   * Get popular documentation
   */
  async getPopularDocumentation(limit = 10) {
    try {
      const docs = await Documentation.getPopular(limit);
      return docs;
    } catch (error) {
      logger.error("Error getting popular documentation:", error);
      throw error;
    }
  }

  /**
   * Scan docs folder and sync with database
   */
  async syncDocumentationFromFiles() {
    try {
      logger.info("Starting documentation sync from files...");
      let syncCount = 0;
      let errorCount = 0;

      for (const category of this.supportedCategories) {
        const categoryPath = path.join(this.docsPath, category);

        try {
          const exists = await fs
            .access(categoryPath)
            .then(() => true)
            .catch(() => false);
          if (!exists) {
            logger.info(`Category folder not found: ${category}`);
            continue;
          }

          const files = await fs.readdir(categoryPath);
          const markdownFiles = files.filter((file) => file.endsWith(".md"));

          for (const file of markdownFiles) {
            try {
              const filePath = path.join(categoryPath, file);
              const relativePath = path.relative(process.cwd(), filePath);
              const slug = path.basename(file, ".md");

              await this.syncDocumentationFile(relativePath, category, slug);
              syncCount++;
            } catch (error) {
              logger.error(`Error syncing file ${file}:`, error);
              errorCount++;
            }
          }
        } catch (error) {
          logger.error(`Error processing category ${category}:`, error);
          errorCount++;
        }
      }

      logger.info(
        `Documentation sync completed. Synced: ${syncCount}, Errors: ${errorCount}`
      );
      return { syncCount, errorCount };
    } catch (error) {
      logger.error("Error syncing documentation from files:", error);
      throw error;
    }
  }

  /**
   * Sync a single documentation file
   */ async syncDocumentationFile(filePath, category, slug) {
    try {
      // Load metadata if not already loaded
      await this.loadMetadata();

      // Read file content
      const fullPath = path.resolve(filePath);
      const content = await fs.readFile(fullPath, "utf8");
      const stats = await fs.stat(fullPath);

      // Calculate content hash
      const contentHash = crypto
        .createHash("md5")
        .update(content)
        .digest("hex");

      // Get metadata for this document
      const docMetadata = this.getDocumentMetadata(category, slug); // Find existing document
      let doc = await Documentation.findOne({ slug });

      if (doc) {
        // Check if file has changed
        if (doc.contentHash === contentHash && doc.syncStatus === "synced") {
          logger.debug(`Document ${slug} is up to date`);
          return doc;
        }

        // Update existing document
        doc.content = content;
        doc.contentHash = contentHash;
        doc.lastFileModified = stats.mtime;
        doc.lastSynced = new Date();
        doc.syncStatus = "synced";
        doc.syncError = null;
        doc.filePath = filePath;
        doc.category = category; // Ensure category is updated

        // Extract title from content if available, otherwise use metadata
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch && titleMatch[1]) {
          doc.title = titleMatch[1].trim();
        } else if (docMetadata.title) {
          doc.title = docMetadata.title;
        }

        // Update metadata fields
        if (docMetadata.description) doc.description = docMetadata.description;
        if (docMetadata.author) doc.author = docMetadata.author;
        if (docMetadata.tags) doc.tags = docMetadata.tags;
        if (docMetadata.order !== undefined) doc.order = docMetadata.order;
        if (docMetadata.difficulty) doc.difficulty = docMetadata.difficulty;
        if (docMetadata.isFeatured !== undefined)
          doc.isFeatured = docMetadata.isFeatured;
        if (docMetadata.metaDescription)
          doc.metaDescription = docMetadata.metaDescription;
        if (docMetadata.keywords) doc.keywords = docMetadata.keywords;
      } else {
        // Create new document
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch
          ? titleMatch[1].trim()
          : docMetadata.title || this.generateTitleFromSlug(slug);

        doc = new Documentation({
          title,
          slug,
          category,
          description:
            docMetadata.description || this.extractDescription(content),
          content,
          filePath,
          contentHash,
          lastFileModified: stats.mtime,
          lastSynced: new Date(),
          syncStatus: "synced",
          status: "published",
          isPublished: true,
          author: docMetadata.author,
          tags: docMetadata.tags || [],
          order: docMetadata.order || 0,
          difficulty: docMetadata.difficulty || "beginner",
          isFeatured: docMetadata.isFeatured || false,
          metaDescription: docMetadata.metaDescription,
          keywords: docMetadata.keywords || [],
        });
      }

      await doc.save();
      logger.info(`Synced documentation: ${category}/${slug}`);
      return doc;
    } catch (error) {
      logger.error(`Error syncing documentation file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Generate title from slug
   */
  generateTitleFromSlug(slug) {
    return slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Extract description from markdown content
   */
  extractDescription(content) {
    // Try to find the first paragraph after the title
    const lines = content.split("\n");
    let description = "";

    let foundTitle = false;
    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("#")) {
        foundTitle = true;
        continue;
      }

      if (
        foundTitle &&
        trimmed &&
        !trimmed.startsWith("#") &&
        !trimmed.startsWith("```")
      ) {
        description = trimmed;
        break;
      }
    }

    // If no description found, create a default one
    if (!description) {
      const firstNonHeader = lines.find((line) => {
        const trimmed = line.trim();
        return (
          trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("```")
        );
      });
      description = firstNonHeader
        ? firstNonHeader.trim()
        : "Documentation content";
    }

    // Limit description length
    if (description.length > 500) {
      description = description.substring(0, 497) + "...";
    }

    return description;
  }

  /**
   * Create documentation entry
   */
  async createDocumentation(data) {
    try {
      const doc = new Documentation(data);
      await doc.save();
      logger.info(`Created documentation: ${data.category}/${data.slug}`);
      return doc;
    } catch (error) {
      logger.error("Error creating documentation:", error);
      throw error;
    }
  }

  /**
   * Update documentation entry
   */
  async updateDocumentation(id, data) {
    try {
      const doc = await Documentation.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!doc) {
        throw new Error("Documentation not found");
      }

      logger.info(`Updated documentation: ${doc.category}/${doc.slug}`);
      return doc;
    } catch (error) {
      logger.error(`Error updating documentation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete documentation entry
   */
  async deleteDocumentation(id) {
    try {
      const doc = await Documentation.findByIdAndDelete(id);

      if (!doc) {
        throw new Error("Documentation not found");
      }

      logger.info(`Deleted documentation: ${doc.category}/${doc.slug}`);
      return doc;
    } catch (error) {
      logger.error(`Error deleting documentation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get documentation statistics
   */
  async getDocumentationStats() {
    try {
      const total = await Documentation.countDocuments({ isPublished: true });
      const byCategory = await Documentation.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]);
      const totalViews = await Documentation.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } },
      ]);

      return {
        total,
        byCategory: byCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        totalViews: totalViews[0]?.totalViews || 0,
      };
    } catch (error) {
      logger.error("Error getting documentation stats:", error);
      throw error;
    }
  }

  /**
   * Initialize documentation from seed data (for backwards compatibility)
   */
  async initializeDocumentation() {
    try {
      logger.info("Initializing documentation...");

      // First, try to sync from files
      const syncResult = await this.syncDocumentationFromFiles();

      // If no files were synced, create some basic entries
      if (syncResult.syncCount === 0) {
        logger.info(
          "No markdown files found, creating basic documentation entries..."
        );
        await this.createBasicDocumentation();
      }

      logger.info("Documentation initialization completed");
      return true;
    } catch (error) {
      logger.error("Error initializing documentation:", error);
      throw error;
    }
  }

  /**
   * Create basic documentation entries if no files exist
   */
  async createBasicDocumentation() {
    const basicDocs = [
      {
        title: "Quick Start Guide",
        slug: "quick-start",
        category: "getting-started",
        description: "Get up and running with Deployio in minutes.",
        content:
          "# Quick Start Guide\n\nWelcome to Deployio! This guide will help you get started.",
        filePath: "docs/getting-started/quick-start.md",
        order: 1,
        isFeatured: true,
        tags: ["getting-started", "quick-start", "deployment", "beginner"],
      },
      {
        title: "Installation Guide",
        slug: "installation",
        category: "getting-started",
        description: "Complete installation guide for Deployio CLI and tools.",
        content:
          "# Installation Guide\n\nChoose your preferred way to interact with Deployio.",
        filePath: "docs/getting-started/installation.md",
        order: 2,
        tags: ["getting-started", "installation", "cli", "setup"],
      },
    ];

    for (const docData of basicDocs) {
      const exists = await Documentation.findOne({
        slug: docData.slug,
        category: docData.category,
      });

      if (!exists) {
        await this.createDocumentation(docData);
      }
    }
  }

  /**
   * Get all documents from metadata.json structure
   */
  getAllDocumentsFromMetadata() {
    if (!this.metadata?.categories) {
      return [];
    }

    const allDocs = [];
    Object.entries(this.metadata.categories).forEach(
      ([category, categoryData]) => {
        if (categoryData.documents) {
          categoryData.documents.forEach((doc) => {
            allDocs.push({
              ...doc,
              category,
              categoryTitle: categoryData.title,
              categoryIcon: categoryData.icon,
              categoryOrder: categoryData.order,
            });
          });
        }
      }
    );

    return allDocs.sort((a, b) => {
      // Sort by category order first, then by document order
      if (a.categoryOrder !== b.categoryOrder) {
        return a.categoryOrder - b.categoryOrder;
      }
      return (a.order || 0) - (b.order || 0);
    });
  }
}

module.exports = new DocumentationService();
