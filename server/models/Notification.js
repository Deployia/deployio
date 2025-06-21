const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Core Information
    type: {
      type: String,
      required: true,
      enum: [
        // Authentication notifications
        "auth.otp_verification",
        "auth.password_reset",
        "auth.welcome",
        "auth.account_security",
        "auth.login_attempt",

        // Deployment notifications
        "deployment.started",
        "deployment.success",
        "deployment.failed",
        "deployment.stopped",

        // Project notifications
        "project.analysis_complete",
        "project.analysis_failed",
        "project.collaborator_added",

        // Security notifications
        "security.login_new_device",
        "security.password_changed",
        "security.2fa_enabled",
        "security.2fa_disabled",
        "security.api_key_created", // System notifications
        "system.maintenance",
        "system.update",
        "system.quota_warning",
        "system.quota_exceeded",
        "system.test", // For testing purposes

        // General
        "general.welcome",
        "general.announcement",
      ],
      index: true,
    },

    // Recipients
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Content
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },

    // Context and Actions
    context: {
      // Related entities
      project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
      deployment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deployment",
      },

      // Metadata
      data: mongoose.Schema.Types.Mixed,
    },

    // Call to Action
    action: {
      label: String,
      url: String,
      type: {
        type: String,
        enum: ["link", "button", "none"],
        default: "none",
      },
    },

    // Status
    status: {
      type: String,
      enum: ["unread", "read", "archived"],
      default: "unread",
      index: true,
    },

    // Delivery
    channels: [
      {
        type: String,
        enum: ["in_app", "email", "push"],
        default: "in_app",
      },
    ],
    delivery: {
      email: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        error: String,
      },
      push: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        error: String,
      },
    },

    // Priority and Expiry
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },
    expiresAt: Date,

    // Interaction
    readAt: Date,
    clickedAt: Date,
    archivedAt: Date,
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
notificationSchema.index({ user: 1, status: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1, createdAt: -1 });
notificationSchema.index({ user: 1, priority: 1, status: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ createdAt: -1 });

// Compound indexes for common queries
notificationSchema.index({ user: 1, status: 1, priority: 1, createdAt: -1 });

// Virtual for age
notificationSchema.virtual("age").get(function () {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for formatted time ago
notificationSchema.virtual("timeAgo").get(function () {
  const diff = Date.now() - this.createdAt.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Methods
notificationSchema.methods.markAsRead = function () {
  this.status = "read";
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsArchived = function () {
  this.status = "archived";
  this.archivedAt = new Date();
  return this.save();
};

notificationSchema.methods.recordClick = function () {
  this.clickedAt = new Date();
  if (this.status === "unread") {
    this.status = "read";
    this.readAt = new Date();
  }
  return this.save();
};

notificationSchema.methods.isExpired = function () {
  return this.expiresAt && this.expiresAt < new Date();
};

// Static methods
notificationSchema.statics.createForUser = function (
  userId,
  type,
  title,
  message,
  options = {}
) {
  return this.create({
    user: userId,
    type,
    title,
    message,
    context: options.context || {},
    action: options.action || {},
    channels: options.channels || ["in_app"],
    priority: options.priority || "normal",
    expiresAt: options.expiresAt,
  });
};

notificationSchema.statics.createDeploymentNotification = function (
  userId,
  deploymentId,
  type,
  title,
  message
) {
  return this.createForUser(userId, type, title, message, {
    context: { deployment: deploymentId },
    channels: ["in_app", "email"],
    priority: type.includes("failed") ? "high" : "normal",
  });
};

notificationSchema.statics.createSecurityNotification = function (
  userId,
  type,
  title,
  message
) {
  return this.createForUser(userId, type, title, message, {
    channels: ["in_app", "email"],
    priority: "high",
  });
};

notificationSchema.statics.findUnreadForUser = function (userId) {
  return this.find({
    user: userId,
    status: "unread",
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  }).sort({ createdAt: -1 });
};

notificationSchema.statics.findForUser = function (userId, options = {}) {
  const query = { user: userId };

  if (options.status) {
    query.status = options.status;
  }

  if (options.type) {
    query.type = options.type;
  }

  // Exclude expired notifications by default
  if (!options.includeExpired) {
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ];
  }

  return this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .limit(options.limit || 50);
};

notificationSchema.statics.markAllAsReadForUser = function (userId) {
  return this.updateMany(
    { user: userId, status: "unread" },
    {
      status: "read",
      readAt: new Date(),
    }
  );
};

notificationSchema.statics.getUnreadCountForUser = function (userId) {
  return this.countDocuments({
    user: userId,
    status: "unread",
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  });
};

// Clean up expired notifications periodically
notificationSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

module.exports = mongoose.model("Notification", notificationSchema);
