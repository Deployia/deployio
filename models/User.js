const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

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
    // Track user sessions for multi-session management
    sessions: [
      {
        ip: { type: String },
        userAgent: { type: String },
        createdAt: { type: Date, default: Date.now },
        // If user opts to remember device, skip 2FA until this date
        rememberedUntil: { type: Date },
      },
    ],
    // Store valid refresh tokens for rotation protection
    refreshTokens: [
      {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date },
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
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error("Password comparison error:", error);
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
