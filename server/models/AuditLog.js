const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // Core Information
    action: {
      type: String,
      required: true,
      enum: [
        // User actions
        "user.login",
        "user.logout",
        "user.register",
        "user.update",
        "user.delete",
        "user.password_change",
        "user.2fa_enable",
        "user.2fa_disable",

        // Profile actions
        "profile.update",
        "profile.updated",
        "profile.image_change",

        // Project actions
        "project.create",
        "project.update",
        "project.delete",
        "project.archive",
        "project.restore",
        "project.analyze",

        // Deployment actions
        "deployment.create",
        "deployment.start",
        "deployment.stop",
        "deployment.restart",
        "deployment.delete",
        "deployment.rollback",

        // Container actions
        "container.start",
        "container.stop",
        "container.restart",
        "container.update",
        "container.delete",

        // API actions
        "api.key_create",
        "api.key_delete",
        "api.key_used",

        // Security actions
        "security.api_key_created",
        "security.api_key_updated",
        "security.api_key_deleted",
        "security.login_attempt",
        "security.password_changed",
        "security.2fa_enabled",
        "security.2fa_disabled",
        "security.session_terminated",
        "api.key_used",

        // Admin actions
        "admin.user_suspend",
        "admin.user_activate",
        "admin.system_maintenance",
      ],
      index: true,
    },

    // Actor (who performed the action)
    actor: {
      type: {
        type: String,
        enum: ["user", "system", "api"],
        required: true,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "actor.type === 'user' ? 'User' : null",
      },
      email: String,
      username: String,
      apiKeyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ApiKey",
      },
    },

    // Target (what was acted upon)
    target: {
      type: {
        type: String,
        enum: [
          "user",
          "project",
          "deployment",
          "container",
          "api_key",
          "system",
        ],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath:
          "target.type === 'user' ? 'User' : target.type === 'project' ? 'Project' : target.type === 'deployment' ? 'Deployment' : null",
      },
      name: String,
    },

    // Context
    context: {
      ip: String,
      userAgent: String,
      location: {
        country: String,
        city: String,
      },
      endpoint: String,
      method: String,
    },

    // Details
    details: {
      changes: mongoose.Schema.Types.Mixed, // before/after for updates
      reason: String,
      metadata: mongoose.Schema.Types.Mixed,
    },

    // Result
    result: {
      type: String,
      enum: ["success", "failure", "partial"],
      default: "success",
    },
    error: {
      message: String,
      code: String,
    },

    // Categorization
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    category: {
      type: String,
      enum: ["authentication", "authorization", "data", "system", "security"],
      required: true,
      index: true,
    },

    // Retention
    expiresAt: {
      type: Date,
      default: function () {
        // Default retention: 1 year
        return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      },
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for performance and queries
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ "actor.id": 1, createdAt: -1 });
auditLogSchema.index({ "target.id": 1, createdAt: -1 });
auditLogSchema.index({ category: 1, severity: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for common queries
auditLogSchema.index({ "actor.id": 1, action: 1, createdAt: -1 });
auditLogSchema.index({ "target.id": 1, action: 1, createdAt: -1 });

// Static methods for creating audit logs
auditLogSchema.statics.logUserAction = function (
  action,
  actorId,
  targetId = null,
  details = {},
  context = {}
) {
  return this.create({
    action,
    actor: {
      type: "user",
      id: actorId,
    },
    target: targetId
      ? {
          type: this.getTargetType(action),
          id: targetId,
        }
      : undefined,
    details,
    context,
    category: this.getCategory(action),
    severity: this.getSeverity(action),
  });
};

auditLogSchema.statics.logSystemAction = function (action, details = {}) {
  return this.create({
    action,
    actor: {
      type: "system",
    },
    details,
    category: this.getCategory(action),
    severity: this.getSeverity(action),
  });
};

auditLogSchema.statics.logApiAction = function (
  action,
  apiKeyId,
  actorId,
  targetId = null,
  details = {},
  context = {}
) {
  return this.create({
    action,
    actor: {
      type: "api",
      id: actorId,
      apiKeyId,
    },
    target: targetId
      ? {
          type: this.getTargetType(action),
          id: targetId,
        }
      : undefined,
    details,
    context,
    category: this.getCategory(action),
    severity: this.getSeverity(action),
  });
};

// Helper methods
auditLogSchema.statics.getCategory = function (action) {
  const categoryMap = {
    "user.login": "authentication",
    "user.logout": "authentication",
    "user.register": "authentication",
    "user.password_change": "security",
    "user.2fa_enable": "security",
    "user.2fa_disable": "security",
    "profile.": "data",
    "project.": "data",
    "deployment.": "system",
    "container.": "system",
    "api.": "authorization",
    "admin.": "system",
  };

  for (const [prefix, category] of Object.entries(categoryMap)) {
    if (action.startsWith(prefix)) {
      return category;
    }
  }
  return "system";
};

auditLogSchema.statics.getSeverity = function (action) {
  const highSeverityActions = [
    "user.delete",
    "user.2fa_disable",
    "project.delete",
    "deployment.delete",
    "admin.user_suspend",
    "admin.system_maintenance",
  ];

  const criticalActions = ["admin.user_delete", "system.breach"];

  if (criticalActions.includes(action)) return "critical";
  if (highSeverityActions.includes(action)) return "high";
  if (action.includes("delete") || action.includes("suspend")) return "high";
  if (action.includes("create") || action.includes("update")) return "medium";
  return "low";
};

auditLogSchema.statics.getTargetType = function (action) {
  if (action.startsWith("user.")) return "user";
  if (action.startsWith("project.")) return "project";
  if (action.startsWith("deployment.")) return "deployment";
  if (action.startsWith("container.")) return "container";
  if (action.startsWith("api.")) return "api_key";
  return "system";
};

module.exports = mongoose.model("AuditLog", auditLogSchema);
