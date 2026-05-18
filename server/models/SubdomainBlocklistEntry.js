const mongoose = require("mongoose");

const subdomainBlocklistEntrySchema = new mongoose.Schema(
  {
    term: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    matchType: {
      type: String,
      enum: ["exact", "contains"],
      default: "contains",
      index: true,
    },
    category: {
      type: String,
      enum: ["reserved", "abusive", "illegal", "custom"],
      default: "custom",
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

subdomainBlocklistEntrySchema.index(
  { term: 1, matchType: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "SubdomainBlocklistEntry",
  subdomainBlocklistEntrySchema,
);
