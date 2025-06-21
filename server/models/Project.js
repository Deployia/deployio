const mongoose = require("mongoose");
const crypto = require("crypto");

const projectSchema = new mongoose.Schema(
  {
    // Core Information
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [1, "Project name cannot be empty"],
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    // Ownership & Collaboration
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["viewer", "editor", "admin"],
          default: "viewer",
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Repository Integration
    repository: {
      url: {
        type: String,
        trim: true,
        match: [
          /^https:\/\/github\.com\/[^\/]+\/[^\/]+$/,
          "Please provide a valid GitHub repository URL",
        ],
      },
      provider: {
        type: String,
        enum: ["github", "gitlab", "bitbucket"],
        default: "github",
      },
      owner: String, // repo owner/org
      name: String, // repo name
      branch: {
        type: String,
        default: "main",
      },
      isPrivate: {
        type: Boolean,
        default: false,
      },
      lastSync: Date,
      webhookId: String,
      accessLevel: {
        type: String,
        enum: ["read", "write", "admin"],
        default: "read",
      },
    },

    // Technology Stack (Stack Agnostic)
    stack: {
      detected: {
        primary: {
          type: String,
          enum: [
            "mern",
            "mean",
            "django",
            "laravel",
            "nextjs",
            "nuxtjs",
            "spring-boot",
            "flask",
            "rails",
            "express",
            "fastapi",
            "vue",
            "angular",
            "react",
            "svelte",
            "gatsby",
            "other",
          ],
        },
        frontend: {
          framework: String, // react, vue, angular, etc.
          version: String,
          buildTool: String, // vite, webpack, etc.
          packageManager: {
            type: String,
            enum: ["npm", "yarn", "pnpm", "bun"],
            default: "npm",
          },
        },
        backend: {
          framework: String, // express, nestjs, django, etc.
          language: {
            type: String,
            enum: [
              "javascript",
              "typescript",
              "python",
              "java",
              "php",
              "go",
              "ruby",
              "other",
            ],
          },
          version: String,
          runtime: String, // node, python, etc.
        },
        database: {
          type: {
            type: String,
            enum: ["mongodb", "mysql", "postgresql", "sqlite", "redis", "none"],
          },
          version: String,
          orm: String, // mongoose, prisma, sqlalchemy, etc.
        },
        additional: [String], // redis, elasticsearch, etc.
      },
      configured: {
        // User overrides for detected stack
        useCustomConfig: {
          type: Boolean,
          default: false,
        },
        customDockerfile: String,
        customCompose: String,
        overrides: {
          frontend: {
            framework: String,
            buildCommand: String,
            outputDir: String,
          },
          backend: {
            framework: String,
            startCommand: String,
            port: Number,
          },
          database: {
            type: String,
            connectionString: String,
          },
        },
      },
    },

    // AI Analysis Results
    analysis: {
      structure: {
        hasValidStructure: {
          type: Boolean,
          default: false,
        },
        confidence: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        detectedPatterns: [String],
        suggestions: [String],
        issues: [String],
      },
      dependencies: {
        frontend: [
          {
            name: String,
            version: String,
            type: {
              type: String,
              enum: ["dependency", "devDependency", "peerDependency"],
            },
          },
        ],
        backend: [
          {
            name: String,
            version: String,
            type: {
              type: String,
              enum: ["dependency", "devDependency", "peerDependency"],
            },
          },
        ],
        devDependencies: [
          {
            name: String,
            version: String,
            type: String,
          },
        ],
        conflicts: [String],
      },
      recommendations: {
        performance: [String],
        security: [String],
        optimization: [String],
        updates: [String],
      },
      lastAnalyzed: Date,
    },

    // Deployment Configuration
    deployment: {
      // Environment Variables
      environment: {
        development: [
          {
            key: {
              type: String,
              required: true,
            },
            value: String,
            isSecret: {
              type: Boolean,
              default: false,
            },
          },
        ],
        staging: [
          {
            key: {
              type: String,
              required: true,
            },
            value: String,
            isSecret: {
              type: Boolean,
              default: false,
            },
          },
        ],
        production: [
          {
            key: {
              type: String,
              required: true,
            },
            value: String,
            isSecret: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },

      // Build Configuration
      build: {
        commands: {
          install: {
            type: String,
            default: "npm install",
          },
          build: {
            type: String,
            default: "npm run build",
          },
          start: {
            type: String,
            default: "npm start",
          },
          test: String,
        },
        outputDir: {
          type: String,
          default: "dist",
        },
        nodeVersion: {
          type: String,
          default: "18",
        },
        buildTimeout: {
          type: Number,
          default: 600, // seconds
        },
      },

      // Runtime Configuration
      runtime: {
        platform: {
          type: String,
          default: "linux/amd64",
        },
        memory: {
          type: String,
          default: "512MB",
        },
        cpu: {
          type: String,
          default: "0.25",
        },
        instances: {
          type: Number,
          default: 1,
          min: 1,
          max: 5,
        },
        healthCheck: {
          enabled: {
            type: Boolean,
            default: true,
          },
          path: {
            type: String,
            default: "/health",
          },
          interval: {
            type: Number,
            default: 30, // seconds
          },
          timeout: {
            type: Number,
            default: 10,
          },
          retries: {
            type: Number,
            default: 3,
          },
        },
      },

      // Database Configuration (Dynamic provisioning)
      database: {
        provider: {
          type: String,
          enum: ["atlas", "local", "none"],
          default: "atlas",
        },
        atlasConfig: {
          clusterId: String,
          databaseName: String, // project_id_db
          username: String,
          connectionString: {
            type: String,
            select: false, // encrypted
          },
        },
        seeds: [
          {
            name: String,
            script: String,
            runOnDeploy: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },
    },

    // Project Status & Analytics
    status: {
      type: String,
      enum: ["active", "archived", "deleted"],
      default: "active",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },

    statistics: {
      totalDeployments: {
        type: Number,
        default: 0,
      },
      successfulDeployments: {
        type: Number,
        default: 0,
      },
      failedDeployments: {
        type: Number,
        default: 0,
      },
      lastDeployment: Date,
      averageBuildTime: {
        type: Number,
        default: 0, // seconds
      },
      totalBuilds: {
        type: Number,
        default: 0,
      },
      uptime: {
        type: Number,
        default: 100, // percentage
      },
    },

    // Settings & Preferences
    settings: {
      autoDeployment: {
        enabled: {
          type: Boolean,
          default: false,
        },
        branch: {
          type: String,
          default: "main",
        },
        environments: [
          {
            type: String,
            enum: ["development", "staging", "production"],
          },
        ],
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        webhook: String, // external webhook URL
        slack: String, // slack webhook
      },
      advanced: {
        customDomain: String,
        sslEnabled: {
          type: Boolean,
          default: true,
        },
        customNginx: String,
        customDocker: {
          type: Boolean,
          default: false,
        },
      },
    },

    // Timestamps & Metadata
    lastAccessed: Date,
    archivedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.deployment?.database?.atlasConfig?.connectionString;
        return ret;
      },
    },
  }
);

// Indexes for performance
projectSchema.index({ owner: 1 });
projectSchema.index({ slug: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ "repository.url": 1 });
projectSchema.index({ "stack.detected.primary": 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ "collaborators.user": 1 });

// Virtual for full repository URL
projectSchema.virtual("repositoryFullUrl").get(function () {
  if (!this.repository.owner || !this.repository.name)
    return this.repository.url;
  return `https://github.com/${this.repository.owner}/${this.repository.name}`;
});

// Generate unique slug
projectSchema.statics.generateSlug = async function (name, ownerId) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);

  let slug = baseSlug;
  let counter = 1;

  while (await this.findOne({ slug, owner: ownerId })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// Check if project is MERN stack
projectSchema.methods.isMERNStack = function () {
  return (
    this.stack?.detected?.primary === "mern" ||
    (this.stack?.detected?.frontend?.framework === "react" &&
      this.stack?.detected?.backend?.framework === "express" &&
      this.stack?.detected?.database?.type === "mongodb")
  );
};

// Check if user can access project
projectSchema.methods.canUserAccess = function (
  userId,
  requiredRole = "viewer"
) {
  if (this.owner.toString() === userId.toString()) return true;

  const collaborator = this.collaborators.find(
    (c) => c.user.toString() === userId.toString()
  );

  if (!collaborator) return false;

  const roleHierarchy = { viewer: 0, editor: 1, admin: 2 };
  return roleHierarchy[collaborator.role] >= roleHierarchy[requiredRole];
};

// Get stack information
projectSchema.methods.getStackInfo = function () {
  const detected = this.stack?.detected || {};
  const configured = this.stack?.configured || {};

  return {
    primary: detected.primary || "other",
    frontend: detected.frontend || {},
    backend: detected.backend || {},
    database: detected.database || {},
    isCustom: configured.useCustomConfig || false,
    supportsMERN: this.isMERNStack(),
  };
};

// Update analysis results
projectSchema.methods.updateAnalysis = function (analysisResults) {
  this.analysis = {
    ...this.analysis,
    ...analysisResults,
    lastAnalyzed: new Date(),
  };
  return this.save();
};

// Increment deployment count
projectSchema.methods.incrementDeploymentCount = function (success = true) {
  this.statistics.totalDeployments += 1;
  if (success) {
    this.statistics.successfulDeployments += 1;
  } else {
    this.statistics.failedDeployments += 1;
  }
  this.statistics.lastDeployment = new Date();
  return this.save();
};

// Update build statistics
projectSchema.methods.updateBuildStats = function (buildTime) {
  this.statistics.totalBuilds += 1;
  const currentAvg = this.statistics.averageBuildTime || 0;
  const totalBuilds = this.statistics.totalBuilds;

  this.statistics.averageBuildTime =
    (currentAvg * (totalBuilds - 1) + buildTime) / totalBuilds;

  return this.save();
};

// Pre-save middleware to generate slug
projectSchema.pre("save", async function (next) {
  if (this.isNew && !this.slug) {
    this.slug = await this.constructor.generateSlug(this.name, this.owner);
  }
  next();
});

// Pre-save middleware to update lastAccessed
projectSchema.pre("save", function (next) {
  if (!this.isNew) {
    this.lastAccessed = new Date();
  }
  next();
});

module.exports = mongoose.model("Project", projectSchema);
