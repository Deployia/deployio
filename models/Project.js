const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project owner is required"],
    },
    repository: {
      url: {
        type: String,
        required: [true, "Repository URL is required"],
        match: [
          /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/,
          "Please provide a valid GitHub repository URL",
        ],
      },
      branch: {
        type: String,
        default: "main",
        trim: true,
      },
      lastCommit: {
        hash: String,
        message: String,
        author: String,
        timestamp: Date,
      },
    },
    technology: {
      framework: {
        type: String,
        enum: [
          "React",
          "Vue.js",
          "Angular",
          "Node.js",
          "Express",
          "Next.js",
          "Nuxt.js",
          "Django",
          "Flask",
          "FastAPI",
          "Spring Boot",
          "Laravel",
          "Other",
        ],
      },
      language: {
        type: String,
        enum: [
          "JavaScript",
          "TypeScript",
          "Python",
          "Java",
          "PHP",
          "Go",
          "Rust",
          "C#",
          "Ruby",
          "Other",
        ],
      },
      database: {
        type: String,
        enum: ["MongoDB", "PostgreSQL", "MySQL", "Redis", "SQLite", "None"],
        default: "None",
      },
      buildTool: String, // npm, yarn, pip, maven, gradle, etc.
      detectedAt: Date,
      confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },
    deployment: {
      status: {
        type: String,
        enum: ["none", "pending", "building", "deploying", "success", "failed"],
        default: "none",
      },
      environment: {
        type: String,
        enum: ["development", "staging", "production"],
        default: "development",
      },
      url: String,
      domain: String,
      buildCommand: String,
      startCommand: String,
      outputDirectory: String,
      environmentVariables: [
        {
          key: {
            type: String,
            required: true,
          },
          value: {
            type: String,
            required: true,
          },
          isSecret: {
            type: Boolean,
            default: false,
          },
        },
      ],
      lastDeployment: {
        id: String,
        status: String,
        startedAt: Date,
        completedAt: Date,
        duration: Number, // in seconds
        logs: String,
        deployedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["owner", "admin", "developer", "viewer"],
          default: "developer",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    settings: {
      autoDeployment: {
        type: Boolean,
        default: false,
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        slack: {
          type: Boolean,
          default: false,
        },
        discord: {
          type: Boolean,
          default: false,
        },
      },
      buildSettings: {
        nodeVersion: String,
        pythonVersion: String,
        installCommand: String,
        buildCommand: String,
        outputDirectory: String,
      },
    },
    analytics: {
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
      averageBuildTime: {
        type: Number,
        default: 0,
      },
      lastActivity: Date,
    },
    ai: {
      stackDetectionCompleted: {
        type: Boolean,
        default: false,
      },
      dockerfileGenerated: {
        type: Boolean,
        default: false,
      },
      pipelineGenerated: {
        type: Boolean,
        default: false,
      },
      optimizationSuggestions: [
        {
          type: {
            type: String,
            enum: ["performance", "security", "cost", "reliability"],
          },
          title: String,
          description: String,
          priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
          },
          implemented: {
            type: Boolean,
            default: false,
          },
          suggestedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ "repository.url": 1 });
projectSchema.index({ "deployment.status": 1 });
projectSchema.index({ isArchived: 1 });

// Virtual for deployment count
projectSchema.virtual("deploymentCount").get(function () {
  return this.analytics.totalDeployments;
});

// Virtual for success rate
projectSchema.virtual("successRate").get(function () {
  if (this.analytics.totalDeployments === 0) return 0;
  return (
    (this.analytics.successfulDeployments / this.analytics.totalDeployments) *
    100
  ).toFixed(1);
});

// Pre-save middleware
projectSchema.pre("save", function (next) {
  // Update lastActivity when project is modified
  this.analytics.lastActivity = new Date();
  next();
});

// Static methods
projectSchema.statics.findByOwner = function (userId, options = {}) {
  const query = { owner: userId, isArchived: { $ne: true } };
  return this.find(query)
    .populate("owner", "username email profileImage")
    .populate("collaborators.user", "username email profileImage")
    .sort(options.sort || { updatedAt: -1 })
    .limit(options.limit || 0);
};

projectSchema.statics.findByCollaborator = function (userId, options = {}) {
  const query = {
    "collaborators.user": userId,
    isArchived: { $ne: true },
  };
  return this.find(query)
    .populate("owner", "username email profileImage")
    .populate("collaborators.user", "username email profileImage")
    .sort(options.sort || { updatedAt: -1 })
    .limit(options.limit || 0);
};

// Instance methods
projectSchema.methods.addCollaborator = function (userId, role = "developer", addedBy) {
  // Check if user is already a collaborator
  const existingCollaborator = this.collaborators.find(
    (c) => c.user.toString() === userId.toString()
  );

  if (existingCollaborator) {
    throw new Error("User is already a collaborator");
  }

  this.collaborators.push({
    user: userId,
    role,
    addedBy,
  });

  return this.save();
};

projectSchema.methods.removeCollaborator = function (userId) {
  this.collaborators = this.collaborators.filter(
    (c) => c.user.toString() !== userId.toString()
  );
  return this.save();
};

projectSchema.methods.updateDeploymentStatus = function (status, additionalData = {}) {
  this.deployment.status = status;
  
  if (additionalData.url) {
    this.deployment.url = additionalData.url;
  }
  
  if (status === "success") {
    this.analytics.successfulDeployments += 1;
  } else if (status === "failed") {
    this.analytics.failedDeployments += 1;
  }
  
  this.analytics.totalDeployments += 1;
  
  return this.save();
};

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
