const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const logger = require("../config/logger");

const userSchema = new mongoose.Schema(
  {
    // Core Identity
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, hyphens, and underscores",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    }, // Authentication (Dual OAuth Strategy)
    password: {
      type: String,
      required: false, // OAuth is primary auth method
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,

    // Password Reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Multi-Provider Git Integration (Enhanced)
    // GitHub OAuth Integration (Primary for deployments)
    githubId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // GitLab OAuth Integration
    gitlabId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Azure DevOps OAuth Integration
    azureDevOpsId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Bitbucket OAuth Integration
    bitbucketId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Google OAuth Integration (Alternative auth method)
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Enhanced Git Provider Integrations
    gitProviders: {
      // GitHub Integration Details (Primary for deployments)
      github: {
        id: String,
        username: String,
        email: String,
        avatarUrl: String,
        profileUrl: String,
        accessToken: {
          type: String,
          select: false,
        },
        refreshToken: {
          type: String,
          select: false,
        },
        tokenExpiry: Date,
        scopes: [
          {
            type: String,
            enum: ["user:email", "repo", "workflow", "admin:repo_hook"],
          },
        ],
        // Repository access level
        repoAccess: {
          public: {
            type: Boolean,
            default: true,
          },
          private: {
            type: Boolean,
            default: false,
          },
        },
        isConnected: {
          type: Boolean,
          default: false,
        },
        connectedAt: Date,
        lastUsed: Date,
      },

      // GitLab Integration Details
      gitlab: {
        id: String,
        username: String,
        email: String,
        name: String,
        avatarUrl: String,
        profileUrl: String,
        accessToken: {
          type: String,
          select: false,
        },
        refreshToken: {
          type: String,
          select: false,
        },
        tokenExpiry: Date,
        scopes: [
          {
            type: String,
            enum: ["read_user", "read_repository", "api", "read_registry"],
          },
        ],
        repoAccess: {
          public: {
            type: Boolean,
            default: true,
          },
          private: {
            type: Boolean,
            default: false,
          },
        },
        isConnected: {
          type: Boolean,
          default: false,
        },
        connectedAt: Date,
        lastUsed: Date,
      },

      // Azure DevOps Integration Details
      azureDevOps: {
        id: String,
        displayName: String,
        email: String,
        avatarUrl: String,
        profileUrl: String,
        accessToken: {
          type: String,
          select: false,
        },
        refreshToken: {
          type: String,
          select: false,
        },
        tokenExpiry: Date,
        scopes: [
          {
            type: String,
            enum: ["vso.code", "vso.identity", "vso.project", "vso.build"],
          },
        ],
        repoAccess: {
          public: {
            type: Boolean,
            default: true,
          },
          private: {
            type: Boolean,
            default: false,
          },
        },
        isConnected: {
          type: Boolean,
          default: false,
        },
        connectedAt: Date,
        lastUsed: Date,
      },

      // Bitbucket Integration Details
      bitbucket: {
        id: String,
        username: String,
        displayName: String,
        email: String,
        avatarUrl: String,
        profileUrl: String,
        accessToken: {
          type: String,
          select: false,
        },
        refreshToken: {
          type: String,
          select: false,
        },
        tokenExpiry: Date,
        scopes: [
          {
            type: String,
            enum: ["account", "repository", "repository:write", "pullrequest"],
          },
        ],
        repoAccess: {
          public: {
            type: Boolean,
            default: true,
          },
          private: {
            type: Boolean,
            default: false,
          },
        },
        isConnected: {
          type: Boolean,
          default: false,
        },
        connectedAt: Date,
        lastUsed: Date,
      },
    },

    // Google Integration Details (Alternative auth method)
    google: {
      email: String,
      name: String,
      avatarUrl: String,
      accessToken: {
        type: String,
        select: false,
      },
      refreshToken: {
        type: String,
        select: false,
      },
      tokenExpiry: Date,
    },

    // Profile Information
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    profileImage: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [250, "Bio cannot exceed 250 characters"],
    }, // User Preferences
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      timezone: {
        type: String,
        default: "UTC",
      },
    },

    // Comprehensive Notification Preferences
    notificationPreferences: {
      // Delivery methods
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      push: { type: Boolean, default: false },

      // Deployment notifications
      deploymentSuccess: { type: Boolean, default: true },
      deploymentFailure: { type: Boolean, default: true },
      deploymentStarted: { type: Boolean, default: true },
      deploymentStopped: { type: Boolean, default: true },

      // Project notifications
      projectAnalysisComplete: { type: Boolean, default: true },
      projectAnalysisFailed: { type: Boolean, default: true },
      projectCollaboratorAdded: { type: Boolean, default: true },

      // Security notifications
      securityAlerts: { type: Boolean, default: true },
      accountChanges: { type: Boolean, default: true },
      newDeviceLogin: { type: Boolean, default: true },
      passwordChanged: { type: Boolean, default: true },
      twoFactorEnabled: { type: Boolean, default: true },
      twoFactorDisabled: { type: Boolean, default: true },
      apiKeyCreated: { type: Boolean, default: true },

      // System notifications
      systemMaintenance: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: false },
      quotaWarning: { type: Boolean, default: true },
      quotaExceeded: { type: Boolean, default: true },

      // General notifications
      welcomeMessage: { type: Boolean, default: true },
      announcements: { type: Boolean, default: false },
      productUpdates: { type: Boolean, default: false },
      tips: { type: Boolean, default: false },

      // Advanced settings
      quietHours: {
        enabled: { type: Boolean, default: false },
        start: { type: String, default: "22:00" },
        end: { type: String, default: "08:00" },
        timezone: { type: String, default: "UTC" },
      },

      digestSettings: {
        enabled: { type: Boolean, default: false },
        frequency: {
          type: String,
          enum: ["daily", "weekly"],
          default: "daily",
        },
        time: { type: String, default: "09:00" },
        timezone: { type: String, default: "UTC" },
      },

      // Legacy compatibility (maintain old structure for backward compatibility)
      notifications: {
        email: {
          deployments: { type: Boolean, default: true },
          security: { type: Boolean, default: true },
          updates: { type: Boolean, default: false },
        },
        push: {
          deployments: { type: Boolean, default: true },
          security: { type: Boolean, default: true },
        },
      },
    },

    // Account Status
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "pending",
    },

    // 2FA Security
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false,
      },
      secret: {
        type: String,
        select: false,
      },
      backupCodes: [
        {
          code: String,
          used: { type: Boolean, default: false },
          usedAt: Date,
        },
      ],
    },

    // Security & Session Management
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    lastLogin: Date,
    lastLoginIP: String,
    // Resource Usage & Limits (Per Architecture)
    resourceLimits: {
      maxProjects: {
        type: Number,
        default: 5, // Free tier limit
      },
      maxDeployments: {
        type: Number,
        default: 10, // Concurrent deployments
      },
      memoryPerApp: {
        type: String,
        default: "512MB", // 256MB frontend + 256MB backend
      },
      cpuPerApp: {
        type: String,
        default: "0.25", // 0.25 cores max per application
      },
      storagePerApp: {
        type: String,
        default: "1GB", // Storage per application
      },
      mongoDbPerApp: {
        type: String,
        default: "100MB", // MongoDB per app database
      },
    },

    // Current Usage
    currentUsage: {
      projects: {
        type: Number,
        default: 0,
      },
      activeDeployments: {
        type: Number,
        default: 0,
      },
      totalMemoryUsed: {
        type: Number,
        default: 0, // in MB
      },
      totalStorageUsed: {
        type: Number,
        default: 0, // in MB
      },
    },

    // Audit Trail (Limited to recent entries)
    loginHistory: [
      {
        ip: String,
        userAgent: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        location: {
          country: String,
          city: String,
        },
      },
    ], // Refresh Tokens for JWT
    refreshTokens: [
      {
        token: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: Date,
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // User Sessions for tracking active sessions
    sessions: [
      {
        ip: String,
        userAgent: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        rememberedUntil: Date, // For "Remember this device" functionality
        location: {
          country: String,
          city: String,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.emailVerificationToken;
        delete ret.twoFactorAuth?.secret;
        // Enhanced security: remove all git provider tokens
        if (ret.gitProviders) {
          Object.keys(ret.gitProviders).forEach((provider) => {
            if (ret.gitProviders[provider]) {
              delete ret.gitProviders[provider].accessToken;
              delete ret.gitProviders[provider].refreshToken;
            }
          });
        }
        // Legacy cleanup
        delete ret.github?.accessToken;
        delete ret.github?.refreshToken;
        delete ret.google?.accessToken;
        delete ret.google?.refreshToken;
        delete ret.refreshTokens;
        return ret;
      },
    },
  }
);

// Indexes for performance (Updated for dual OAuth)
// Note: email, username, githubId, googleId have unique: true so don't need explicit indexes
userSchema.index({ "github.username": 1 });
userSchema.index({ "refreshTokens.token": 1 });
userSchema.index({ "sessions.ip": 1, "sessions.userAgent": 1 });
userSchema.index({ status: 1, role: 1 });

// Virtual for account lock status
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Generate email verification token
userSchema.methods.getEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return verificationToken;
};

// Handle failed login attempts
userSchema.methods.incLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        loginAttempts: 1,
        lockUntil: 1,
      },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1,
    },
    $set: {
      lastLogin: new Date(),
    },
  });
};

// Cleanup old login history (keep only last 10)
userSchema.pre("save", function (next) {
  if (this.loginHistory && this.loginHistory.length > 10) {
    this.loginHistory = this.loginHistory.slice(-10);
  }
  next();
});

// Cleanup expired refresh tokens
userSchema.methods.cleanupRefreshTokens = function () {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter(
    (token) => token.isActive && token.expiresAt > now
  );
};

// Resource management methods
userSchema.methods.canCreateProject = function () {
  return this.currentUsage.projects < this.resourceLimits.maxProjects;
};

userSchema.methods.canDeploy = function () {
  return (
    this.currentUsage.activeDeployments < this.resourceLimits.maxDeployments
  );
};

userSchema.methods.updateResourceUsage = function (
  projectCount,
  activeDeployments,
  memoryUsed,
  storageUsed
) {
  this.currentUsage.projects = projectCount;
  this.currentUsage.activeDeployments = activeDeployments;
  this.currentUsage.totalMemoryUsed = memoryUsed;
  this.currentUsage.totalStorageUsed = storageUsed;
};

// Enhanced Git Provider token management
userSchema.methods.isGitHubTokenValid = function () {
  return (
    this.gitProviders?.github?.accessToken &&
    (!this.gitProviders.github.tokenExpiry ||
      this.gitProviders.github.tokenExpiry > new Date())
  );
};

userSchema.methods.isGitLabTokenValid = function () {
  return (
    this.gitProviders?.gitlab?.accessToken &&
    (!this.gitProviders.gitlab.tokenExpiry ||
      this.gitProviders.gitlab.tokenExpiry > new Date())
  );
};

userSchema.methods.isAzureDevOpsTokenValid = function () {
  return (
    this.gitProviders?.azureDevOps?.accessToken &&
    (!this.gitProviders.azureDevOps.tokenExpiry ||
      this.gitProviders.azureDevOps.tokenExpiry > new Date())
  );
};

userSchema.methods.isBitbucketTokenValid = function () {
  return (
    this.gitProviders?.bitbucket?.accessToken &&
    (!this.gitProviders.bitbucket.tokenExpiry ||
      this.gitProviders.bitbucket.tokenExpiry > new Date())
  );
};

userSchema.methods.hasGitHubScope = function (scope) {
  return (
    this.gitProviders?.github?.scopes &&
    this.gitProviders.github.scopes.includes(scope)
  );
};

userSchema.methods.hasGitLabScope = function (scope) {
  return (
    this.gitProviders?.gitlab?.scopes &&
    this.gitProviders.gitlab.scopes.includes(scope)
  );
};

userSchema.methods.hasAzureDevOpsScope = function (scope) {
  return (
    this.gitProviders?.azureDevOps?.scopes &&
    this.gitProviders.azureDevOps.scopes.includes(scope)
  );
};

userSchema.methods.hasBitbucketScope = function (scope) {
  return (
    this.gitProviders?.bitbucket?.scopes &&
    this.gitProviders.bitbucket.scopes.includes(scope)
  );
};

// Get connected git providers
userSchema.methods.getConnectedGitProviders = function () {
  const providers = [];
  if (this.gitProviders?.github?.isConnected) providers.push("github");
  if (this.gitProviders?.gitlab?.isConnected) providers.push("gitlab");
  if (this.gitProviders?.azureDevOps?.isConnected)
    providers.push("azureDevOps");
  if (this.gitProviders?.bitbucket?.isConnected) providers.push("bitbucket");
  return providers;
};

// Get primary git provider (first connected one, prioritizing GitHub)
userSchema.methods.getPrimaryGitProvider = function () {
  if (this.gitProviders?.github?.isConnected) return "github";
  if (this.gitProviders?.gitlab?.isConnected) return "gitlab";
  if (this.gitProviders?.azureDevOps?.isConnected) return "azureDevOps";
  if (this.gitProviders?.bitbucket?.isConnected) return "bitbucket";
  return null;
};

// Update provider last used timestamp
userSchema.methods.updateProviderLastUsed = function (provider) {
  if (this.gitProviders && this.gitProviders[provider]) {
    this.gitProviders[provider].lastUsed = new Date();
  }
};

// Google token management
userSchema.methods.isGoogleTokenValid = function () {
  return (
    this.google?.accessToken &&
    (!this.google.tokenExpiry || this.google.tokenExpiry > new Date())
  );
};

// Determine preferred OAuth provider
userSchema.methods.getPreferredOAuthProvider = function () {
  if (this.github?.accessToken && this.isGitHubTokenValid()) return "github";
  if (this.google?.accessToken && this.isGoogleTokenValid()) return "google";
  return null;
};

module.exports = mongoose.model("User", userSchema);
