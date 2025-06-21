const mongoose = require("mongoose");

const buildLogSchema = new mongoose.Schema(
  {
    // Core Build Information
    buildId: {
      type: String,
      required: true,
      unique: true,
    },

    // References
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
      index: true,
    },
    deployment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deployment",
      index: true,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Triggered by user is required"],
      index: true,
    },

    // Build Configuration
    config: {
      branch: {
        type: String,
        required: true,
        trim: true,
      },
      commit: {
        hash: {
          type: String,
          required: true,
        },
        message: String,
        author: String,
        timestamp: Date,
        url: String,
      },
      buildType: {
        type: String,
        enum: ["deploy", "preview", "manual"],
        default: "deploy",
      },
      environment: {
        type: String,
        enum: ["development", "staging", "production"],
        default: "production",
      },
    },

    // Build Status
    status: {
      type: String,
      enum: [
        "pending", // Build queued
        "cloning", // Cloning repository
        "analyzing", // AI analysis in progress
        "building", // Docker build in progress
        "pushing", // Pushing to ECR
        "success", // Build completed successfully
        "failed", // Build failed
        "cancelled", // Build cancelled
        "timeout", // Build timed out
      ],
      default: "pending",
      index: true,
    },

    // GitHub Actions Integration
    github: {
      workflowRunId: String,
      workflowRunUrl: String,
      actionId: String,
      repositoryDispatchSent: {
        type: Boolean,
        default: false,
      },
      webhookReceived: {
        type: Boolean,
        default: false,
      },
    },

    // Build Logs
    logs: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        level: {
          type: String,
          enum: ["info", "warn", "error", "debug"],
          default: "info",
        },
        message: String,
        source: {
          type: String,
          enum: ["platform", "github", "docker", "ecr", "ai"],
          default: "platform",
        },
        step: String, // e.g., "clone", "analyze", "build", "push"
      },
    ],

    // Build Results
    results: {
      images: [
        {
          name: String, // e.g., "frontend", "backend"
          tag: String, // e.g., "project-id-frontend"
          url: String, // ECR URL
          size: Number, // in bytes
          layers: Number,
          digest: String,
        },
      ],
      artifacts: [
        {
          name: String,
          url: String,
          size: Number,
          type: String,
        },
      ],
      analysis: {
        detectedFramework: String,
        detectedLanguage: String,
        confidence: Number,
        dockerfileGenerated: Boolean,
        dockerComposeGenerated: Boolean,
      },
    },

    // Timing Information
    timing: {
      startedAt: Date,
      completedAt: Date,
      duration: Number, // in seconds
      steps: [
        {
          name: String,
          startedAt: Date,
          completedAt: Date,
          duration: Number,
          status: {
            type: String,
            enum: ["pending", "running", "completed", "failed"],
          },
        },
      ],
    },

    // Error Information
    error: {
      code: String,
      message: String,
      stack: String,
      step: String,
      retryCount: {
        type: Number,
        default: 0,
      },
    },

    // Resource Usage
    resources: {
      cpu: Number, // CPU time in seconds
      memory: Number, // Peak memory usage in MB
      storage: Number, // Temporary storage used in MB
      networkOut: Number, // Network egress in MB
    },

    // Build Environment
    environment: {
      nodeVersion: String,
      dockerVersion: String,
      osVersion: String,
      architecture: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for performance
buildLogSchema.index({ project: 1, createdAt: -1 });
buildLogSchema.index({ triggeredBy: 1, createdAt: -1 });
buildLogSchema.index({ status: 1, createdAt: -1 });
buildLogSchema.index({ buildId: 1 });
buildLogSchema.index({ "config.commit.hash": 1 });

// Compound indexes
buildLogSchema.index({ project: 1, status: 1 });
buildLogSchema.index({ project: 1, "config.branch": 1 });

// Virtual for build duration
buildLogSchema.virtual("durationFormatted").get(function () {
  if (this.timing.duration) {
    const minutes = Math.floor(this.timing.duration / 60);
    const seconds = this.timing.duration % 60;
    return `${minutes}m ${seconds}s`;
  }
  return null;
});

// Virtual for build success rate
buildLogSchema.virtual("isSuccessful").get(function () {
  return this.status === "success";
});

// Pre-save middleware to calculate duration
buildLogSchema.pre("save", function (next) {
  if (this.timing.startedAt && this.timing.completedAt) {
    this.timing.duration = Math.round(
      (this.timing.completedAt - this.timing.startedAt) / 1000
    );
  }
  next();
});

// Methods
buildLogSchema.methods.addLog = function (
  level,
  message,
  source = "platform",
  step = null
) {
  this.logs.push({
    level,
    message,
    source,
    step,
    timestamp: new Date(),
  });

  // Keep only last 5000 logs per build
  if (this.logs.length > 5000) {
    this.logs = this.logs.slice(-5000);
  }
};

buildLogSchema.methods.updateStep = function (
  stepName,
  status,
  startTime = null,
  endTime = null
) {
  let step = this.timing.steps.find((s) => s.name === stepName);

  if (!step) {
    step = {
      name: stepName,
      status: status,
      startedAt: startTime || new Date(),
    };
    this.timing.steps.push(step);
  } else {
    step.status = status;
    if (endTime) {
      step.completedAt = endTime;
      step.duration = Math.round((endTime - step.startedAt) / 1000);
    }
  }
};

buildLogSchema.methods.markFailed = function (error, step = null) {
  this.status = "failed";
  this.timing.completedAt = new Date();
  this.error = {
    message: error.message,
    stack: error.stack,
    step: step,
    code: error.code,
  };
};

buildLogSchema.methods.markSuccess = function (images = [], artifacts = []) {
  this.status = "success";
  this.timing.completedAt = new Date();
  this.results.images = images;
  this.results.artifacts = artifacts;
};

// Static methods
buildLogSchema.statics.findByProject = function (projectId, limit = 50) {
  return this.find({ project: projectId }).sort({ createdAt: -1 }).limit(limit);
};

buildLogSchema.statics.findByUser = function (userId, limit = 50) {
  return this.find({ triggeredBy: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

buildLogSchema.statics.findRecent = function (limit = 100) {
  return this.find().sort({ createdAt: -1 }).limit(limit);
};

buildLogSchema.statics.getSuccessRate = function (projectId, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return this.aggregate([
    {
      $match: {
        project: mongoose.Types.ObjectId(projectId),
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        successful: {
          $sum: {
            $cond: [{ $eq: ["$status", "success"] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        total: 1,
        successful: 1,
        rate: {
          $cond: [
            { $eq: ["$total", 0] },
            0,
            { $multiply: [{ $divide: ["$successful", "$total"] }, 100] },
          ],
        },
      },
    },
  ]);
};

module.exports = mongoose.model("BuildLog", buildLogSchema);
