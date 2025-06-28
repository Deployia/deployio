const mongoose = require("mongoose");

const projectCreationSessionSchema = new mongoose.Schema(
  {
    // Session identification
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // User ownership
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Current wizard state
    currentStep: {
      type: Number,
      min: 1,
      max: 6,
      default: 1,
    },

    // Step completion status
    completedSteps: [
      {
        type: Number,
        min: 1,
        max: 6,
      },
    ],

    // Wizard step data
    stepData: {
      // Step 1: Provider Selection
      selectedProvider: {
        type: String,
        enum: ["github", "gitlab", "azure-devops"],
      },

      // Step 2: Repository Selection
      repository: {
        provider: String,
        owner: String,
        name: String,
        url: String,
        isPrivate: Boolean,
        metadata: {
          size: Number,
          language: String,
          topics: [String],
          license: String,
          hasReadme: Boolean,
          hasDockerfile: Boolean,
          hasPackageJson: Boolean,
          hasRequirementsTxt: Boolean,
          lastCommit: {
            sha: String,
            message: String,
            author: String,
            date: Date,
          },
        },
      },

      // Step 3: Branch Selection
      branch: {
        name: String,
        isDefault: Boolean,
        lastCommit: {
          sha: String,
          message: String,
          author: String,
          date: Date,
        },
      },

      // Analysis settings
      analysisSettings: {
        enableAI: {
          type: Boolean,
          default: true,
        },
        analysisDepth: {
          type: String,
          enum: ["basic", "detailed"],
          default: "basic",
        },
        skipAnalysis: {
          type: Boolean,
          default: false,
        },
      },

      // Step 4: AI Analysis Results
      analysis: {
        analysisId: String,
        status: {
          type: String,
          enum: ["pending", "in-progress", "completed", "failed"],
          default: "pending",
        },
        progress: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        startedAt: Date,
        completedAt: Date,
        results: {
          confidence: Number,
          technologyStack: {
            primaryLanguage: String,
            framework: String,
            buildTool: String,
            packageManager: String,
            runtime: String,
            version: String,
          },
          detectedConfig: {
            buildCommand: String,
            startCommand: String,
            installCommand: String,
            testCommand: String,
            port: Number,
            environmentVariables: [
              {
                key: String,
                value: String,
                isSecret: Boolean,
                confidence: Number,
              },
            ],
          },
          insights: {
            projectType: String,
            complexity: String,
            deploymentReadiness: String,
            recommendations: [String],
            warnings: [String],
          },
        },
        error: {
          message: String,
          code: String,
          details: mongoose.Schema.Types.Mixed,
        },
      },

      // Step 5: Project Configuration
      projectConfig: {
        name: String,
        description: String,
        visibility: {
          type: String,
          enum: ["private", "public"],
          default: "private",
        },

        // Build configuration
        buildConfig: {
          buildCommand: String,
          startCommand: String,
          installCommand: String,
          testCommand: String,
          outputDir: String,
          nodeVersion: String,
        },

        // Runtime configuration
        runtime: {
          port: Number,
          memory: String,
          cpu: String,
          instances: Number,
          platform: String,
        },

        // Environment variables
        environmentVariables: {
          development: [
            {
              key: String,
              value: String,
              isSecret: Boolean,
            },
          ],
          staging: [
            {
              key: String,
              value: String,
              isSecret: Boolean,
            },
          ],
          production: [
            {
              key: String,
              value: String,
              isSecret: Boolean,
            },
          ],
        },

        // Advanced settings
        advanced: {
          customDomain: String,
          autoDeployment: {
            enabled: Boolean,
            branch: String,
            environments: [String],
          },
          notifications: {
            email: Boolean,
            webhook: String,
          },
        },
      },

      // Step 6: Review & Deployment
      review: {
        userConfirmed: Boolean,
        deploymentPlan: {
          estimatedBuildTime: Number,
          estimatedCost: Number,
          resourcesRequired: [String],
        },
        deploymentOptions: {
          deployNow: Boolean,
          environment: String,
          createBranch: Boolean,
        },
      },
    },

    // Session metadata
    metadata: {
      userAgent: String,
      ipAddress: String,
      startedAt: {
        type: Date,
        default: Date.now,
      },
      lastActivityAt: {
        type: Date,
        default: Date.now,
      },
      timeSpentInSession: Number, // seconds
      stepsNavigated: [
        {
          step: Number,
          timestamp: Date,
          action: String, // 'entered', 'completed', 'skipped'
        },
      ],
    },

    // Session expiration
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expireAfterSeconds: 0 },
    },

    // Session status
    status: {
      type: String,
      enum: ["active", "completed", "abandoned", "expired"],
      default: "active",
    },

    // Final project ID if session completed successfully
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        // Remove sensitive data from JSON output
        delete ret.metadata?.ipAddress;
        return ret;
      },
    },
  }
);

// Indexes for performance
// projectCreationSessionSchema.index({ sessionId: 1 }); // removed duplicate
// projectCreationSessionSchema.index({ user: 1 }); // removed duplicate
projectCreationSessionSchema.index({ status: 1 });
// projectCreationSessionSchema.index({ expiresAt: 1 }); // removed duplicate
projectCreationSessionSchema.index({ createdAt: -1 });

// Generate unique session ID
projectCreationSessionSchema.statics.generateSessionId = function () {
  return require("crypto").randomBytes(16).toString("hex");
};

// Create new session
projectCreationSessionSchema.statics.createSession = async function (
  userId,
  metadata = {}
) {
  const sessionId = this.generateSessionId();

  return await this.create({
    sessionId,
    user: userId,
    metadata: {
      ...metadata,
      startedAt: new Date(),
      lastActivityAt: new Date(),
    },
  });
};

// Update session step
projectCreationSessionSchema.methods.updateStep = function (
  stepNumber,
  stepData = {}
) {
  this.currentStep = stepNumber;

  // Mark step as completed
  if (!this.completedSteps.includes(stepNumber)) {
    this.completedSteps.push(stepNumber);
  }

  // Update step data
  this.stepData = {
    ...this.stepData,
    ...stepData,
  };

  // Update activity timestamp
  this.metadata.lastActivityAt = new Date();

  // Track navigation
  this.metadata.stepsNavigated.push({
    step: stepNumber,
    timestamp: new Date(),
    action: "completed",
  });

  return this.save();
};

// Update analysis progress
projectCreationSessionSchema.methods.updateAnalysisProgress = function (
  progress,
  status = "in-progress"
) {
  this.stepData.analysis = {
    ...this.stepData.analysis,
    progress,
    status,
  };

  if (status === "in-progress" && !this.stepData.analysis.startedAt) {
    this.stepData.analysis.startedAt = new Date();
  }

  if (status === "completed" || status === "failed") {
    this.stepData.analysis.completedAt = new Date();
  }

  this.metadata.lastActivityAt = new Date();

  return this.save();
};

// Set analysis results
projectCreationSessionSchema.methods.setAnalysisResults = function (results) {
  this.stepData.analysis = {
    ...this.stepData.analysis,
    results,
    status: "completed",
    completedAt: new Date(),
    progress: 100,
  };

  return this.save();
};

// Set analysis error
projectCreationSessionSchema.methods.setAnalysisError = function (error) {
  this.stepData.analysis = {
    ...this.stepData.analysis,
    error,
    status: "failed",
    completedAt: new Date(),
  };

  return this.save();
};

// Complete session
projectCreationSessionSchema.methods.completeSession = function (projectId) {
  this.status = "completed";
  this.projectId = projectId;
  this.metadata.lastActivityAt = new Date();

  return this.save();
};

// Check if session is expired
projectCreationSessionSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

// Get session progress percentage
projectCreationSessionSchema.methods.getProgress = function () {
  return Math.round((this.completedSteps.length / 6) * 100);
};

// Get time spent in session
projectCreationSessionSchema.methods.getTimeSpent = function () {
  const start = this.metadata.startedAt;
  const end = this.metadata.lastActivityAt;
  return Math.round((end - start) / 1000); // seconds
};

// Pre-save middleware to update time spent
projectCreationSessionSchema.pre("save", function (next) {
  if (!this.isNew) {
    this.metadata.timeSpentInSession = this.getTimeSpent();
  }
  next();
});

// Automatically expire sessions
projectCreationSessionSchema.pre("save", function (next) {
  if (this.isExpired() && this.status === "active") {
    this.status = "expired";
  }
  next();
});

module.exports = mongoose.model(
  "ProjectCreationSession",
  projectCreationSessionSchema
);
