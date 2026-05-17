const mongoose = require("mongoose");

const GLOBAL_KEY = "global";

const platformStatsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: GLOBAL_KEY,
    },
    lifetime: {
      developers: { type: Number, default: 0, min: 0 },
      projects: { type: Number, default: 0, min: 0 },
      deployments: { type: Number, default: 0, min: 0 },
    },
    baseline: {
      developers: { type: Number, default: 5000, min: 0 },
      deployments: { type: Number, default: 10000, min: 0 },
      projects: { type: Number, default: 2500, min: 0 },
      countries: { type: Number, default: 50, min: 0 },
    },
    uniqueCountries: {
      type: [String],
      default: [],
    },
    lastReconciledAt: Date,
  },
  { timestamps: true },
);

platformStatsSchema.statics.GLOBAL_KEY = GLOBAL_KEY;

module.exports = mongoose.model("PlatformStats", platformStatsSchema);
