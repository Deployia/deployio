const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

const blogSchema = new mongoose.Schema(
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
    excerpt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    content: {
      type: String,
      default: "", // Cached content for performance
    },
    filePath: {
      type: String,
      required: true, // Path to markdown file
    },
    contentHash: {
      type: String, // MD5 hash to detect file changes
      index: true,
    },

    // Blog-specific fields
    author: {
      name: {
        type: String,
        required: true,
        default: "Deployio Team",
      },
      email: {
        type: String,
      },
      avatar: {
        type: String,
      },
      bio: {
        type: String,
        maxlength: 500,
      },
    },

    // Publication details
    publishedAt: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived", "scheduled"],
      default: "draft",
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Categorization
    category: {
      type: String,
      required: true,
      enum: [
        "engineering",
        "product",
        "tutorials",
        "company",
        "case-studies",
        "devops",
        "ai-ml",
        "security",
        "announcements",
      ],
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // SEO & Metadata
    metaTitle: {
      type: String,
      maxlength: 60,
    },
    metaDescription: {
      type: String,
      maxlength: 160,
    },
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],

    // Media
    image: {
      type: String, // URL to blog post featured image
      trim: true,
    },

    // Social sharing
    socialImage: {
      type: String, // URL to social sharing image
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
    shares: {
      type: Number,
      default: 0,
    },
    readingTime: {
      type: Number, // in minutes
      default: 0,
    },

    // Comments (if enabled)
    commentsEnabled: {
      type: Boolean,
      default: true,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },

    // File sync status
    lastFileModified: {
      type: Date,
    },
    lastSynced: {
      type: Date,
    },
    syncStatus: {
      type: String,
      enum: ["synced", "pending", "error"],
      default: "pending",
    },
    syncError: {
      type: String,
    },

    // Related content
    relatedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blog",
      },
    ],

    // Newsletter inclusion
    includeInNewsletter: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1, status: 1, publishedAt: -1 });
blogSchema.index({ tags: 1, status: 1 });
blogSchema.index({ featured: 1, status: 1, publishedAt: -1 });
blogSchema.index({ author: 1, status: 1, publishedAt: -1 });
blogSchema.index({ slug: 1, category: 1 });

// Text search index
blogSchema.index({
  title: "text",
  excerpt: "text",
  content: "text",
  tags: "text",
});

// Virtual for URL
blogSchema.virtual("url").get(function () {
  return `/blog/${this.category}/${this.slug}`;
});

// Virtual for published status
blogSchema.virtual("isPublished").get(function () {
  return this.status === "published" && this.publishedAt <= new Date();
});

// Virtual for reading time display
blogSchema.virtual("readingTimeDisplay").get(function () {
  if (this.readingTime <= 1) return "1 min read";
  return `${this.readingTime} min read`;
});

// Virtual for formatted date
blogSchema.virtual("publishedAtFormatted").get(function () {
  if (!this.publishedAt) return null;
  return this.publishedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Static methods
blogSchema.statics.findBySlug = function (slug, category = null) {
  const query = { slug, status: "published" };
  if (category) query.category = category;
  return this.findOne(query);
};

blogSchema.statics.findByCategory = function (category, options = {}) {
  const { limit = 10, skip = 0, sort = { publishedAt: -1 } } = options;
  return this.find({ category, status: "published" })
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .select("-content");
};

blogSchema.statics.getFeatured = function (limit = 6) {
  return this.find({ featured: true, status: "published" })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select("-content");
};

blogSchema.statics.getPopular = function (limit = 10) {
  return this.find({ status: "published" })
    .sort({ views: -1, publishedAt: -1 })
    .limit(limit)
    .select("-content");
};

blogSchema.statics.getRecent = function (limit = 10) {
  return this.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select("-content");
};

blogSchema.statics.search = function (query, options = {}) {
  const { category, tags, limit = 20, skip = 0 } = options;

  const searchQuery = {
    $text: { $search: query },
    status: "published",
  };

  if (category) searchQuery.category = category;
  if (tags && tags.length > 0) searchQuery.tags = { $in: tags };

  return this.find(searchQuery, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" }, publishedAt: -1 })
    .limit(limit)
    .skip(skip)
    .select("-content");
};

// Instance methods
blogSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

blogSchema.methods.addLike = function () {
  this.likes += 1;
  return this.save();
};

blogSchema.methods.addShare = function () {
  this.shares += 1;
  return this.save();
};

blogSchema.methods.needsSync = function () {
  if (!this.lastSynced || !this.lastFileModified) return true;
  return this.lastFileModified > this.lastSynced;
};

blogSchema.methods.loadFromFile = async function () {
  try {
    if (!this.filePath) throw new Error("No file path specified");

    const fullPath = path.resolve(this.filePath);
    const content = await fs.readFile(fullPath, "utf8");
    const stats = await fs.stat(fullPath);

    // Calculate content hash
    const contentHash = crypto.createHash("md5").update(content).digest("hex");

    // Update content and metadata
    this.content = content;
    this.contentHash = contentHash;
    this.lastFileModified = stats.mtime;
    this.lastSynced = new Date();
    this.syncStatus = "synced";
    this.syncError = null;

    // Extract title from content if not set
    if (!this.title) {
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        this.title = titleMatch[1].trim();
      }
    }

    // Calculate reading time (average 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);

    return this;
  } catch (error) {
    this.syncStatus = "error";
    this.syncError = error.message;
    throw error;
  }
};

blogSchema.methods.generateExcerpt = function () {
  if (!this.content) return "";

  // Remove markdown formatting and extract first paragraph
  const text = this.content
    .replace(/#{1,6}\s/g, "") // Remove headers
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.*?)\*/g, "$1") // Remove italic
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`(.*?)`/g, "$1") // Remove inline code
    .trim();

  const sentences = text.split(/[.!?]+/);
  let excerpt = sentences[0];

  // Add more sentences if excerpt is too short
  for (let i = 1; i < sentences.length && excerpt.length < 150; i++) {
    excerpt += ". " + sentences[i];
  }

  // Limit to 300 characters
  if (excerpt.length > 300) {
    excerpt = excerpt.substring(0, 297) + "...";
  }

  return excerpt;
};

// Pre-save middleware
blogSchema.pre("save", function (next) {
  // Generate slug from title if not provided
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  }

  // Generate excerpt if not provided
  if (this.isModified("content") && !this.excerpt) {
    this.excerpt = this.generateExcerpt();
  }

  // Set published date if status changed to published
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  next();
});

module.exports = mongoose.model("Blog", blogSchema);
