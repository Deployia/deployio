const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

const documentationSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // Content Management
    content: {
      type: String,
      default: "", // Cached content for performance
    },
    filePath: {
      type: String,
      required: true, // Path to markdown file (local/CDN/S3)
    },
    contentHash: {
      type: String, // MD5 hash to detect file changes
      index: true,
    },

    // Organization
    category: {
      type: String,
      required: true,
      enum: [
        "getting-started",
        "products",
        "downloads",
        "guides",
        "api",
        "security",
      ],
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Metadata
    author: {
      type: String,
      default: "Deployio Team",
    },
    version: {
      type: String,
      default: "1.0.0",
    },
    language: {
      type: String,
      default: "en",
      enum: ["en", "es", "fr", "de"], // Future i18n support
    },

    // SEO & Discovery
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],
    metaDescription: {
      type: String,
      maxlength: 160,
    },

    // Status & Visibility
    status: {
      type: String,
      enum: ["draft", "published", "archived", "deprecated"],
      default: "published",
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Analytics & Engagement
    views: {
      type: Number,
      default: 0,
      index: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    // Helpful/Not Helpful functionality
    helpfulCount: {
      type: Number,
      default: 0,
    },
    notHelpfulCount: {
      type: Number,
      default: 0,
    },
    readingTime: {
      type: Number, // in minutes
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    // Navigation & Relationships
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    parentDoc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Documentation",
    },
    previousDoc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Documentation",
    },
    nextDoc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Documentation",
    },
    relatedDocs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Documentation",
      },
    ],

    // Technical Details
    lastFileModified: {
      type: Date, // Last modification time of source file
    },
    lastSynced: {
      type: Date, // Last time content was synced from file
    },
    syncStatus: {
      type: String,
      enum: ["synced", "pending", "error"],
      default: "pending",
    },
    syncError: {
      type: String,
    },

    // Cache Control
    cacheControl: {
      type: String,
      default: "public, max-age=3600", // 1 hour
    },
    lastCached: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
documentationSchema.index({ category: 1, order: 1 });
documentationSchema.index({ slug: 1, category: 1 });
documentationSchema.index({ status: 1, isPublished: 1 });
documentationSchema.index({ views: -1 });
documentationSchema.index({ createdAt: -1 });
documentationSchema.index(
  {
    title: "text",
    description: "text",
    content: "text",
    tags: "text",
  },
  {
    weights: {
      title: 10,
      description: 5,
      tags: 3,
      content: 1,
    },
  }
);

// Virtuals
documentationSchema.virtual("url").get(function () {
  return `/resources/docs/${this.category}/${this.slug}`;
});

documentationSchema.virtual("isStale").get(function () {
  if (!this.lastFileModified || !this.lastSynced) return true;
  return this.lastFileModified > this.lastSynced;
});

documentationSchema.virtual("readingTimeFormatted").get(function () {
  if (this.readingTime <= 1) return "1 min read";
  return `${this.readingTime} min read`;
});

// Pre-save middleware
documentationSchema.pre("save", function (next) {
  // Generate slug if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }

  // Generate meta description if not provided
  if (!this.metaDescription && this.description) {
    this.metaDescription =
      this.description.length > 160
        ? this.description.substring(0, 157) + "..."
        : this.description;
  }

  // Calculate reading time (average 200 words per minute)
  if (this.content) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }

  next();
});

// Static methods
documentationSchema.statics.findBySlug = function (slug, category = null) {
  const query = { slug, isPublished: true };
  if (category) {
    query.category = category;
  }
  return this.findOne(query);
};

documentationSchema.statics.findByCategory = function (category, options = {}) {
  const { limit = 50, skip = 0, sort = { order: 1, createdAt: -1 } } = options;

  return this.find({
    category,
    isPublished: true,
  })
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

documentationSchema.statics.search = function (query, options = {}) {
  const { category, limit = 20, skip = 0 } = options;

  const searchQuery = {
    $text: { $search: query },
    isPublished: true,
  };

  if (category) {
    searchQuery.category = category;
  }

  return this.find(searchQuery, {
    score: { $meta: "textScore" },
  })
    .sort({
      score: { $meta: "textScore" },
      views: -1,
    })
    .limit(limit)
    .skip(skip);
};

documentationSchema.statics.getFeatured = function (limit = 6) {
  return this.find({
    isFeatured: true,
    isPublished: true,
  })
    .sort({ views: -1, createdAt: -1 })
    .limit(limit);
};

documentationSchema.statics.getPopular = function (limit = 10) {
  return this.find({ isPublished: true })
    .sort({ views: -1, likes: -1 })
    .limit(limit);
};

// Instance methods
documentationSchema.methods.incrementViews = function () {
  this.views = (this.views || 0) + 1;
  return this.save();
};

documentationSchema.methods.like = function () {
  this.likes = (this.likes || 0) + 1;
  return this.save();
};

// Helpful/Not Helpful methods
documentationSchema.methods.markHelpful = function () {
  this.helpfulCount = (this.helpfulCount || 0) + 1;
  return this.save();
};

documentationSchema.methods.markNotHelpful = function () {
  this.notHelpfulCount = (this.notHelpfulCount || 0) + 1;
  return this.save();
};

documentationSchema.methods.needsSync = function () {
  return this.isStale || this.syncStatus !== "synced";
};

// File system methods
documentationSchema.methods.loadFromFile = async function () {
  try {
    const filePath = this.filePath;
    let content;

    if (filePath.startsWith("http")) {
      // Fetch from CDN/URL
      const response = await fetch(filePath);
      content = await response.text();
    } else {
      // Read from local file system
      const fullPath = path.resolve(filePath);
      content = await fs.readFile(fullPath, "utf8");
    }

    // Calculate hash
    const hash = crypto.createHash("md5").update(content).digest("hex");

    // Update document
    this.content = content;
    this.contentHash = hash;
    this.lastSynced = new Date();
    this.syncStatus = "synced";
    this.syncError = null;

    return content;
  } catch (error) {
    this.syncStatus = "error";
    this.syncError = error.message;
    throw error;
  }
};

documentationSchema.methods.getFileStats = async function () {
  try {
    if (this.filePath.startsWith("http")) {
      // For CDN files, we can't get file stats easily
      return null;
    }

    const fullPath = path.resolve(this.filePath);
    const stats = await fs.stat(fullPath);
    return {
      size: stats.size,
      modified: stats.mtime,
      exists: true,
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message,
    };
  }
};

module.exports = mongoose.model("Documentation", documentationSchema);
