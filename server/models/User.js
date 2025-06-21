const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const logger = require("../config/logger"); // Import logger

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      unique: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    profileImage: {
      type: String,
      default: "",
    },
    firstName: {
      type: String,
      trim: true,
      default: "",
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },
    otp: {
      type: String,
    },
    otpExpire: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // 2FA fields
    twoFactorSecret: {
      type: String,
      select: false, // Don't include in queries by default
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    backupCodes: [
      {
        code: {
          type: String,
          required: true,
        },
        used: {
          type: Boolean,
          default: false,
        },
        usedAt: {
          type: Date,
        },
      },
    ],
    // Track used TOTP tokens for additional security
    lastTOTPToken: {
      type: String,
      select: false, // Don't include in queries by default
    },
    lastTOTPTimestamp: {
      type: Date,
      select: false, // Don't include in queries by default
    },
    // Security and account protection fields
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
    lastLoginIP: {
      type: String,
    },
    // Account role and permissions
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    }, // Notification preferences
    notificationPreferences: {
      // Basic delivery methods
      email: {
        type: Boolean,
        default: true,
      },
      inApp: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: false,
      },

      // Legacy preferences (maintain backward compatibility)
      deployments: {
        type: Boolean,
        default: true,
      },
      security: {
        type: Boolean,
        default: true,
      },
      marketing: {
        type: Boolean,
        default: false,
      },
      updates: {
        type: Boolean,
        default: true,
      },

      // Deployment notifications
      deploymentSuccess: {
        type: Boolean,
        default: true,
      },
      deploymentFailure: {
        type: Boolean,
        default: true,
      },
      deploymentStarted: {
        type: Boolean,
        default: true,
      },

      // Security & Account notifications
      securityAlerts: {
        type: Boolean,
        default: true,
      },
      accountChanges: {
        type: Boolean,
        default: true,
      },
      newDeviceLogin: {
        type: Boolean,
        default: true,
      },

      // Communication notifications
      productUpdates: {
        type: Boolean,
        default: true,
      },
      tips: {
        type: Boolean,
        default: false,
      },

      // Quiet hours settings
      quietHours: {
        enabled: {
          type: Boolean,
          default: false,
        },
        startTime: {
          type: String,
          default: "22:00",
        },
        endTime: {
          type: String,
          default: "08:00",
        },
      },

      // Digest settings
      digestSettings: {
        enabled: {
          type: Boolean,
          default: false,
        },
        frequency: {
          type: String,
          enum: ["daily", "weekly", "monthly"],
          default: "weekly",
        },
        day: {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
          default: "monday",
        },
        time: {
          type: String,
          default: "09:00",
        },
      },
    },
    // Track user sessions for multi-session management
    sessions: [
      {
        ip: { type: String },
        userAgent: { type: String },
        location: { type: String, default: "Unknown" },
        createdAt: { type: Date, default: Date.now },
        // If user opts to remember device, skip 2FA until this date
        rememberedUntil: { type: Date },
      },
    ], // Store valid refresh tokens for rotation protection
    refreshTokens: [
      {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date },
      },
    ],
    // User activity log
    activities: [
      {
        action: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["auth", "security", "profile", "general", "system"],
          default: "general",
        },
        details: {
          type: String,
        },
        ip: {
          type: String,
        },
        userAgent: {
          type: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // API Keys for programmatic access
    apiKeys: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        key: {
          type: String,
          required: true,
        },
        keyType: {
          type: String,
          enum: ["live", "test"],
          default: "test",
        },
        permissions: [
          {
            type: String,
            enum: ["read", "write"],
            default: "read",
          },
        ],
        lastUsed: {
          type: Date,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash the password before saving
userSchema.pre("save", async function (next) {
  try {
    // Only run if password was modified
    if (!this.isModified("password")) return next();

    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Clean up expired tokens before saving
userSchema.pre("save", function (next) {
  try {
    const now = new Date();

    // Clean up expired refresh tokens
    if (this.refreshTokens && this.refreshTokens.length > 0) {
      this.refreshTokens = this.refreshTokens.filter(
        (rt) => rt.expiresAt && rt.expiresAt > now
      );
    }

    // Clean up expired remembered sessions
    if (this.sessions && this.sessions.length > 0) {
      this.sessions = this.sessions.filter(
        (s) => !s.rememberedUntil || s.rememberedUntil > now
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password is correct
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!candidatePassword || !this.password) {
      return false;
    }

    const result = await bcrypt.compare(candidatePassword, this.password);
    return result;
  } catch (error) {
    logger.error("Password comparison error", {
      error: { message: error.message, stack: error.stack, name: error.name },
    });
    return false;
  }
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set token expiry time (30 minutes)
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

// Performance optimizations: Add database indexes
// email, username, googleId, and githubId indexes are already created by unique: true in schema definition
userSchema.index({ resetPasswordToken: 1 }, { sparse: true }); // For password reset
userSchema.index({ createdAt: 1 }); // For sorting/filtering by creation date
userSchema.index({ isVerified: 1, createdAt: -1 }); // Compound index for verified users

// API Keys sparse unique index - only enforce uniqueness for non-null values
userSchema.index({ "apiKeys.key": 1 }, { unique: true, sparse: true });

// Text index for search functionality (if needed)
userSchema.index(
  {
    username: "text",
    email: "text",
  },
  {
    weights: { username: 10, email: 5 },
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
