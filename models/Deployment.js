const mongoose = require("mongoose");

const deploymentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    deployedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Deployed by user is required"],
    },
    deployment: {
      id: {
        type: String,
        required: true,
        unique: true,
      },
      status: {
        type: String,
        enum: ["pending", "building", "deploying", "success", "failed", "cancelled"],
        default: "pending",
      },
      environment: {
        type: String,
        enum: ["development", "staging", "production"],
        required: true,
      },
      branch: {
        type: String,
        required: true,
      },
      commit: {
        hash: {
          type: String,
          required: true,
        },
        message: String,
        author: String,
        timestamp: Date,
      },
      url: String,
      domain: String,
    },
    build: {
      startedAt: Date,
      completedAt: Date,
      duration: Number, // in seconds
      buildCommand: String,
      buildOutput: String,
      buildLogs: String,
      artifactSize: Number, // in bytes
      buildCache: {
        used: {
          type: Boolean,
          default: false,
        },
        size: Number,
      },
    },
    runtime: {
      platform: {
        type: String,
        enum: ["docker", "serverless", "static", "nodejs", "python"],
        default: "docker",
      },
      version: String, // Runtime version (Node 18, Python 3.9, etc.)
      memory: Number, // in MB
      cpu: Number, // in cores
      instances: {
        type: Number,
        default: 1,
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
          default: 30,
        },
      },
    },
    performance: {
      buildTime: Number, // in seconds
      deployTime: Number, // in seconds
      coldStartTime: Number, // in seconds
      memoryUsage: {
        average: Number,
        peak: Number,
      },
      cpuUsage: {
        average: Number,
        peak: Number,
      },
    },
    monitoring: {
      uptime: {
        type: Number,
        default: 100,
      },
      responseTime: {
        average: Number,
        p95: Number,
        p99: Number,
      },
      errorRate: {
        type: Number,
        default: 0,
      },
      requests: {
        total: {
          type: Number,
          default: 0,
        },
        successful: {
          type: Number,
          default: 0,
        },
        failed: {
          type: Number,
          default: 0,
        },
      },
    },
    configuration: {
      environmentVariables: [
        {
          key: String,
          value: String, // This should be encrypted for secrets
          isSecret: {
            type: Boolean,
            default: false,
          },
        },
      ],
      buildSettings: {
        nodeVersion: String,
        pythonVersion: String,
        installCommand: String,
        buildCommand: String,
        outputDirectory: String,
        dockerfilePath: String,
      },
      scaling: {
        autoScale: {
          type: Boolean,
          default: false,
        },
        minInstances: {
          type: Number,
          default: 1,
        },
        maxInstances: {
          type: Number,
          default: 10,
        },
        targetCPU: {
          type: Number,
          default: 70,
        },
      },
    },
    logs: {
      build: String,
      deployment: String,
      runtime: String,
      lastFetched: Date,
    },
    security: {
      vulnerabilities: [
        {
          severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
          },
          package: String,
          version: String,
          description: String,
          fixed: {
            type: Boolean,
            default: false,
          },
          detectedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      securityScan: {
        completed: {
          type: Boolean,
          default: false,
        },
        score: Number, // 0-100
        lastScannedAt: Date,
      },
    },
    rollback: {
      canRollback: {
        type: Boolean,
        default: true,
      },
      previousDeployment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deployment",
      },
      rollbackReason: String,
      rolledBackAt: Date,
      rolledBackBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    events: [
      {
        type: {
          type: String,
          enum: [
            "deployment_started",
            "build_started",
            "build_completed",
            "build_failed",
            "deployment_completed",
            "deployment_failed",
            "health_check_passed",
            "health_check_failed",
            "scaling_event",
            "rollback_initiated",
            "security_scan_completed",
          ],
        },
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],
    cost: {
      buildCost: Number, // in USD
      runtimeCost: Number, // in USD per hour
      totalCost: Number, // in USD
      billingPeriod: {
        start: Date,
        end: Date,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
deploymentSchema.index({ project: 1, createdAt: -1 });
deploymentSchema.index({ deployedBy: 1 });
deploymentSchema.index({ "deployment.status": 1 });
deploymentSchema.index({ "deployment.environment": 1 });
deploymentSchema.index({ "deployment.id": 1 }, { unique: true });

// Virtual for total duration
deploymentSchema.virtual("totalDuration").get(function () {
  if (this.build.startedAt && this.build.completedAt) {
    return Math.round((this.build.completedAt - this.build.startedAt) / 1000);
  }
  return null;
});

// Virtual for deployment URL with protocol
deploymentSchema.virtual("fullUrl").get(function () {
  if (this.deployment.url) {
    return this.deployment.url.startsWith("http")
      ? this.deployment.url
      : `https://${this.deployment.url}`;
  }
  return null;
});

// Pre-save middleware
deploymentSchema.pre("save", function (next) {
  // Generate deployment ID if not exists
  if (!this.deployment.id) {
    this.deployment.id = `dep_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  // Calculate total duration if build is completed
  if (this.build.startedAt && this.build.completedAt && !this.build.duration) {
    this.build.duration = Math.round(
      (this.build.completedAt - this.build.startedAt) / 1000
    );
  }

  next();
});

// Static methods
deploymentSchema.statics.findByProject = function (projectId, options = {}) {
  return this.find({ project: projectId })
    .populate("project", "name description")
    .populate("deployedBy", "username email profileImage")
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 0);
};

deploymentSchema.statics.findByUser = function (userId, options = {}) {
  return this.find({ deployedBy: userId })
    .populate("project", "name description owner")
    .populate("deployedBy", "username email profileImage")
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 0);
};

deploymentSchema.statics.getActiveDeployments = function () {
  return this.find({
    "deployment.status": { $in: ["pending", "building", "deploying"] },
  })
    .populate("project", "name description")
    .populate("deployedBy", "username email");
};

deploymentSchema.statics.getDeploymentStats = function (projectId, timeframe = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);

  return this.aggregate([
    {
      $match: {
        project: mongoose.Types.ObjectId(projectId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$deployment.status",
        count: { $sum: 1 },
        avgDuration: { $avg: "$build.duration" },
      },
    },
  ]);
};

// Instance methods
deploymentSchema.methods.addEvent = function (type, message, metadata = {}) {
  this.events.push({
    type,
    message,
    metadata,
  });
  return this.save();
};

deploymentSchema.methods.updateStatus = function (status, additionalData = {}) {
  this.deployment.status = status;

  // Add event for status change
  this.addEvent(`deployment_${status}`, `Deployment status changed to ${status}`);

  // Update timestamps based on status
  if (status === "building" && !this.build.startedAt) {
    this.build.startedAt = new Date();
  } else if (
    (status === "success" || status === "failed") &&
    !this.build.completedAt
  ) {
    this.build.completedAt = new Date();
  }

  // Update additional data
  Object.assign(this.deployment, additionalData);

  return this.save();
};

deploymentSchema.methods.rollback = function (userId, reason) {
  if (!this.rollback.canRollback) {
    throw new Error("This deployment cannot be rolled back");
  }

  this.rollback.rollbackReason = reason;
  this.rollback.rolledBackAt = new Date();
  this.rollback.rolledBackBy = userId;

  this.addEvent("rollback_initiated", reason, { userId });

  return this.save();
};

const Deployment = mongoose.model("Deployment", deploymentSchema);

module.exports = Deployment;
