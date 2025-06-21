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

    // GitHub OAuth Integration (Primary for deployments)
    githubId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    // Google OAuth Integration (Alternative auth method)
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    // GitHub Integration Details (Primary for deployments)
    github: {
      username: {
        type: String,
        index: true,
      },
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
    },

    // User Preferences
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
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
      timezone: {
        type: String,
        default: "UTC",
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
    ],

    // Refresh Tokens for JWT
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
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ githubId: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ "github.username": 1 });
userSchema.index({ "refreshTokens.token": 1 });
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

// GitHub token management
userSchema.methods.isGitHubTokenValid = function () {
  return (
    this.github?.accessToken &&
    (!this.github.tokenExpiry || this.github.tokenExpiry > new Date())
  );
};

userSchema.methods.hasGitHubScope = function (scope) {
  return this.github?.scopes && this.github.scopes.includes(scope);
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
