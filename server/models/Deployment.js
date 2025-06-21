const mongoose = require("mongoose");
const crypto = require("crypto");

const deploymentSchema = new mongoose.Schema(
  {
    // Core Information
    deploymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    
    // References
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    deployedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
    // Deployment Configuration
    config: {
      environment: {
        type: String,
        enum: ["development", "staging", "production"],
        default: "development",
      },
      branch: {
        type: String,
        required: true,
        default: "main",
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
      subdomain: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        index: true,
      },
      customDomain: String,
    },
    
    // Deployment Status & Lifecycle
    status: {
      type: String,
      enum: [
        "pending", "queued", "building", "deploying", 
        "running", "failed", "stopped", "cancelled", "error"
      ],
      default: "pending",
      index: true,
    },
    
    // Build Process
    build: {
      buildId: String,
      startedAt: Date,
      completedAt: Date,
      duration: {
        type: Number,
        default: 0, // seconds
      },
      logs: [{
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
          enum: ["build", "deploy", "runtime"],
          default: "build",
        },
      }],
      artifacts: {
        imageUrl: String,
        size: {
          type: Number,
          default: 0, // bytes
        },
        layers: [String],
      },
      githubAction: {
        runId: String,
        workflowId: String,
        url: String,
        status: String,
        conclusion: String,
      },
    },
    
    // Runtime Information
    runtime: {
      containerId: String,
      agentId: String, // which agent is hosting
      platform: {
        type: String,
        default: "linux/amd64",
      },
      resources: {
        memory: {
          allocated: String,
          used: String,
          peak: String,
        },
        cpu: {
          allocated: String,
          used: Number, // percentage
          peak: Number,
        },
        storage: {
          allocated: String,
          used: String,
        },
      },
      health: {
        status: {
          type: String,
          enum: ["healthy", "unhealthy", "unknown"],
          default: "unknown",
        },
        lastCheck: Date,
        checks: [{
          timestamp: {
            type: Date,
            default: Date.now,
          },
          status: {
            type: String,
            enum: ["healthy", "unhealthy"],
          },
          responseTime: Number, // ms
          message: String,
        }],
      },
    },
    
    // Database Configuration (Atlas Integration)
    database: {
      atlasConfig: {
        clusterId: String,
        databaseName: String,
        username: String, // per-deployment user
        connectionString: {
          type: String,
          select: false, // encrypted
        },
        createdAt: Date,
      },
      seeds: {
        executed: {
          type: Boolean,
          default: false,
        },
        executedAt: Date,
        logs: [String],
      },
    },
    
    // Networking & Access
    networking: {
      subdomain: String,
      fullUrl: String,
      ssl: {
        enabled: {
          type: Boolean,
          default: true,
        },
        certificateId: String,
        expiresAt: Date,
      },
      customDomain: {
        domain: String,
        verified: {
          type: Boolean,
          default: false,
        },
        verifiedAt: Date,
      },
    },
    
    // Performance Metrics
    metrics: {
      requests: {
        total: {
          type: Number,
          default: 0,
        },
        last24h: {
          type: Number,
          default: 0,
        },
        avgResponseTime: {
          type: Number,
          default: 0, // ms
        },
      },
      errors: {
        total: {
          type: Number,
          default: 0,
        },
        last24h: {
          type: Number,
          default: 0,
        },
        rate: {
          type: Number,
          default: 0, // percentage
        },
      },
      uptime: {
        percentage: {
          type: Number,
          default: 100,
        },
        downtimeMinutes: {
          type: Number,
          default: 0,
        },
        lastDowntime: Date,
      },
    },
    
    // Lifecycle Timestamps
    queuedAt: Date,
    buildStartedAt: Date,
    buildCompletedAt: Date,
    deployStartedAt: Date,
    deployCompletedAt: Date,
    firstAccessAt: Date,
    lastAccessAt: Date,
    stoppedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.database?.atlasConfig?.connectionString;
        return ret;
      },
    },
  }
);

// Indexes for performance
deploymentSchema.index({ deploymentId: 1 });
deploymentSchema.index({ project: 1 });
deploymentSchema.index({ deployedBy: 1 });
deploymentSchema.index({ status: 1 });
deploymentSchema.index({ "config.subdomain": 1 });
deploymentSchema.index({ createdAt: -1 });
deploymentSchema.index({ "config.environment": 1 });

// Generate unique deployment ID
deploymentSchema.statics.generateDeploymentId = function() {
  return `dep_${crypto.randomBytes(12).toString('hex')}`;
};

// Generate unique subdomain
deploymentSchema.statics.generateSubdomain = async function(projectName, environment = "dev") {
  const baseSubdomain = `${projectName}-${environment}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, 30);
  
  let subdomain = baseSubdomain;
  let counter = 1;
  
  while (await this.findOne({ "config.subdomain": subdomain })) {
    subdomain = `${baseSubdomain}-${counter}`;
    counter++;
  }
  
  return subdomain;
};

// Update deployment status
deploymentSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  const previousStatus = this.status;
  this.status = newStatus;
  
  // Update timestamps based on status
  const now = new Date();
  switch (newStatus) {
    case "queued":
      this.queuedAt = now;
      break;
    case "building":
      this.buildStartedAt = now;
      break;
    case "deploying":
      this.deployStartedAt = now;
      if (this.buildStartedAt && !this.buildCompletedAt) {
        this.buildCompletedAt = now;
        this.build.completedAt = now;
        this.build.duration = Math.floor((now - this.buildStartedAt) / 1000);
      }
      break;
    case "running":
      this.deployCompletedAt = now;
      if (!this.firstAccessAt) {
        this.firstAccessAt = now;
      }
      break;
    case "stopped":
    case "failed":
    case "cancelled":
    case "error":
      this.stoppedAt = now;
      break;
  }
  
  // Update networking URL
  if (this.config.subdomain && !this.networking.fullUrl) {
    this.networking.subdomain = this.config.subdomain;
    this.networking.fullUrl = `https://${this.config.subdomain}.deployio.tech`;
  }
  
  return this.save();
};

// Add build log entry
deploymentSchema.methods.addBuildLog = function(level, message, source = "build") {
  this.build.logs.push({
    timestamp: new Date(),
    level,
    message,
    source,
  });
  
  // Keep only last 1000 log entries
  if (this.build.logs.length > 1000) {
    this.build.logs = this.build.logs.slice(-1000);
  }
  
  return this.save();
};

// Calculate uptime percentage
deploymentSchema.methods.calculateUptime = function() {
  if (!this.deployCompletedAt) return 0;
  
  const totalTime = Date.now() - this.deployCompletedAt.getTime();
  const downtimeMs = (this.metrics.uptime.downtimeMinutes || 0) * 60 * 1000;
  
  const uptimePercentage = Math.max(0, Math.min(100, 
    ((totalTime - downtimeMs) / totalTime) * 100
  ));
  
  this.metrics.uptime.percentage = Math.round(uptimePercentage * 100) / 100;
  return this.metrics.uptime.percentage;
};

// Get resource usage summary
deploymentSchema.methods.getResourceUsage = function() {
  return {
    memory: {
      allocated: this.runtime.resources.memory.allocated || "512MB",
      used: this.runtime.resources.memory.used || "0MB",
      peak: this.runtime.resources.memory.peak || "0MB",
    },
    cpu: {
      allocated: this.runtime.resources.cpu.allocated || "0.25",
      used: this.runtime.resources.cpu.used || 0,
      peak: this.runtime.resources.cpu.peak || 0,
    },
    storage: {
      allocated: this.runtime.resources.storage.allocated || "1GB",
      used: this.runtime.resources.storage.used || "0MB",
    },
  };
};

// Check if deployment is healthy
deploymentSchema.methods.isHealthy = function() {
  if (this.status !== "running") return false;
  
  const lastCheck = this.runtime.health.lastCheck;
  if (!lastCheck) return false;
  
  // Consider unhealthy if no health check in last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (lastCheck < fiveMinutesAgo) return false;
  
  return this.runtime.health.status === "healthy";
};

// Update health status
deploymentSchema.methods.updateHealthStatus = function(status, responseTime = 0, message = "") {
  this.runtime.health.status = status;
  this.runtime.health.lastCheck = new Date();
  
  this.runtime.health.checks.push({
    timestamp: new Date(),
    status,
    responseTime,
    message,
  });
  
  // Keep only last 100 health checks
  if (this.runtime.health.checks.length > 100) {
    this.runtime.health.checks = this.runtime.health.checks.slice(-100);
  }
  
  return this.save();
};

// Pre-save middleware to generate deployment ID
deploymentSchema.pre("save", async function(next) {
  if (this.isNew && !this.deploymentId) {
    this.deploymentId = this.constructor.generateDeploymentId();
  }
  next();
});

// Pre-save middleware to update lastAccessAt
deploymentSchema.pre("save", function(next) {
  if (!this.isNew && this.status === "running") {
    this.lastAccessAt = new Date();
  }
  next();
});

module.exports = mongoose.model("Deployment", deploymentSchema);
