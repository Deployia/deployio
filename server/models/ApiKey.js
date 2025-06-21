const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema(
  {
    // Core Information
    name: {
      type: String,
      required: [true, "API key name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [250, "Description cannot exceed 250 characters"],
    },

    // Key Details
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    keyPrefix: {
      type: String,
      required: true,
      index: true,
    },

    // Ownership
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Permissions
    permissions: [
      {
        type: String,
        enum: [
          "projects:read",
          "projects:write",
          "projects:delete",
          "deployments:read",
          "deployments:write",
          "deployments:deploy",
          "deployments:stop",
          "containers:read",
          "containers:write",
          "logs:read",
          "analytics:read",
        ],
      },
    ],

    // Access Control
    ipWhitelist: [
      {
        type: String,
        validate: {
          validator: function (ip) {
            // Basic IP validation (supports CIDR notation)
            return /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(ip);
          },
          message: "Invalid IP address format",
        },
      },
    ],

    // Status and Expiry
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: Date,

    // Usage Tracking
    usage: {
      totalRequests: {
        type: Number,
        default: 0,
      },
      lastUsed: Date,
      lastIP: String,
      lastUserAgent: String,
      requestsToday: {
        type: Number,
        default: 0,
      },
      requestsThisMonth: {
        type: Number,
        default: 0,
      },
    },

    // Rate Limiting
    rateLimit: {
      requestsPerHour: {
        type: Number,
        default: 1000,
      },
      requestsPerDay: {
        type: Number,
        default: 10000,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.keyHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
apiKeySchema.index({ user: 1, isActive: 1 });
apiKeySchema.index({ expiresAt: 1 });
apiKeySchema.index({ keyHash: 1, isActive: 1 });

// Virtual for masked key
apiKeySchema.virtual("maskedKey").get(function () {
  if (this.keyPrefix) {
    return `${this.keyPrefix}***`;
  }
  return "***";
});

// Methods
apiKeySchema.methods.isExpired = function () {
  return this.expiresAt && this.expiresAt < new Date();
};

apiKeySchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

apiKeySchema.methods.canMakeRequest = function () {
  if (!this.isActive || this.isExpired()) {
    return false;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hour = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours()
  );

  // Check daily limit
  if (this.usage.requestsToday >= this.rateLimit.requestsPerDay) {
    return false;
  }

  // Check hourly limit (would need to implement hourly tracking)
  return true;
};

apiKeySchema.methods.recordUsage = function (ip, userAgent) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  this.usage.totalRequests += 1;
  this.usage.lastUsed = now;
  this.usage.lastIP = ip;
  this.usage.lastUserAgent = userAgent;

  // Reset daily counter if it's a new day
  if (this.updatedAt < today) {
    this.usage.requestsToday = 1;
  } else {
    this.usage.requestsToday += 1;
  }

  // Reset monthly counter if it's a new month
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (this.updatedAt < thisMonth) {
    this.usage.requestsThisMonth = 1;
  } else {
    this.usage.requestsThisMonth += 1;
  }
};

module.exports = mongoose.model("ApiKey", apiKeySchema);
