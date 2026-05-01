const mongoose = require("mongoose");

const reservedSubdomainSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    deployment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deployment",
      default: null,
      index: true,
    },
    environment: {
      type: String,
      enum: ["development", "staging", "production"],
      required: true,
      index: true,
    },
    subdomain: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["reserved", "active", "hold", "released", "expired"],
      default: "reserved",
      index: true,
    },
    reservedAt: {
      type: Date,
      default: Date.now,
    },
    releasedAt: Date,
    holdUntil: Date,
    expiresAt: Date,
    metadata: {
      source: {
        type: String,
        default: "subdomain-manager",
      },
      reason: String,
      suggestions: [String],
    },
  },
  {
    timestamps: true,
  },
);

reservedSubdomainSchema.index({ project: 1, environment: 1, status: 1 });
reservedSubdomainSchema.index({ deployment: 1, status: 1 });
reservedSubdomainSchema.index(
  { subdomain: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["reserved", "active", "hold"] },
    },
    name: "unique_active_reserved_hold_subdomain",
  },
);

module.exports = mongoose.model("ReservedSubdomain", reservedSubdomainSchema);
