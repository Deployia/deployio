const PlatformStats = require("@models/PlatformStats");
const User = require("@models/User");
const Project = require("@models/Project");
const Deployment = require("@models/Deployment");
const logger = require("@config/logger");

const GLOBAL_KEY = PlatformStats.GLOBAL_KEY;

const DEFAULT_BASELINE = {
  developers: parseInt(process.env.PLATFORM_STATS_BASELINE_DEVELOPERS || "5000", 10),
  deployments: parseInt(
    process.env.PLATFORM_STATS_BASELINE_DEPLOYMENTS || "10000",
    10,
  ),
  projects: parseInt(process.env.PLATFORM_STATS_BASELINE_PROJECTS || "2500", 10),
  countries: parseInt(process.env.PLATFORM_STATS_BASELINE_COUNTRIES || "50", 10),
};

function formatCompact(value) {
  const n = Math.max(0, Math.floor(value));
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
  }
  if (n >= 10_000) {
    return `${Math.floor(n / 1000)}K+`;
  }
  if (n >= 1_000) {
    return `${n.toLocaleString("en-US")}+`;
  }
  return `${n}+`;
}

function formatUptime(value) {
  if (value == null || Number.isNaN(value)) {
    return "99.9%";
  }
  const clamped = Math.min(99.99, Math.max(90, value));
  return `${clamped.toFixed(1)}%`;
}

function formatDeployTime(seconds) {
  if (seconds == null || Number.isNaN(seconds) || seconds <= 0) {
    return "30s";
  }
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

class PlatformStatsService {
  async _ensureDocument() {
    return PlatformStats.findOneAndUpdate(
      { key: GLOBAL_KEY },
      {
        $setOnInsert: {
          key: GLOBAL_KEY,
          baseline: DEFAULT_BASELINE,
          lifetime: { developers: 0, projects: 0, deployments: 0 },
          uniqueCountries: [],
        },
      },
      { upsert: true, new: true },
    );
  }

  /**
   * Monotonic increment — survives user/project/deployment deletions.
   */
  async increment(metric, options = {}) {
    const allowed = ["developers", "projects", "deployments"];
    if (!allowed.includes(metric)) {
      return;
    }

    const update = {
      $inc: { [`lifetime.${metric}`]: options.amount ?? 1 },
    };

    if (options.country) {
      update.$addToSet = { uniqueCountries: options.country.toUpperCase() };
    }

    try {
      await PlatformStats.findOneAndUpdate({ key: GLOBAL_KEY }, update, {
        upsert: true,
        setDefaultsOnInsert: true,
      });
    } catch (error) {
      logger.warn("Platform stats increment failed", {
        metric,
        error: error.message,
      });
    }
  }

  recordDeveloper(country) {
    return this.increment("developers", { country });
  }

  recordProject() {
    return this.increment("projects");
  }

  recordDeployment() {
    return this.increment("deployments");
  }

  /**
   * Backfill lifetime counters from DB without lowering existing values.
   */
  async reconcile() {
    try {
      await this._ensureDocument();

      const [userCount, projectCount, deploymentCount] = await Promise.all([
        User.countDocuments(),
        Project.countDocuments(),
        Deployment.countDocuments(),
      ]);

      await PlatformStats.findOneAndUpdate(
        { key: GLOBAL_KEY },
        {
          $max: {
            "lifetime.developers": userCount,
            "lifetime.projects": projectCount,
            "lifetime.deployments": deploymentCount,
          },
          $set: { lastReconciledAt: new Date() },
        },
        { upsert: true },
      );

      logger.info("Platform stats reconciled", {
        userCount,
        projectCount,
        deploymentCount,
      });
    } catch (error) {
      logger.error("Platform stats reconcile failed", { error: error.message });
    }
  }

  async _getRuntimeMetrics() {
    const uptimeAgg = await Deployment.aggregate([
      {
        $match: {
          "metrics.uptime.percentage": { $exists: true, $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          avgUptime: { $avg: "$metrics.uptime.percentage" },
        },
      },
    ]);

    const deployTimeAgg = await Deployment.aggregate([
      {
        $match: {
          "build.duration": { $exists: true, $gt: 0 },
          status: { $in: ["running", "success", "completed"] },
        },
      },
      {
        $group: {
          _id: null,
          avgSeconds: { $avg: "$build.duration" },
        },
      },
    ]);

    return {
      avgUptime: uptimeAgg[0]?.avgUptime ?? null,
      avgDeploySeconds: deployTimeAgg[0]?.avgSeconds ?? null,
    };
  }

  async getPublicStats() {
    const [doc, runtime] = await Promise.all([
      this._ensureDocument(),
      this._getRuntimeMetrics(),
    ]);

    const baseline = {
      ...DEFAULT_BASELINE,
      ...(doc.baseline?.toObject?.() ?? doc.baseline ?? {}),
    };
    const lifetime = {
      developers: doc.lifetime?.developers ?? 0,
      projects: doc.lifetime?.projects ?? 0,
      deployments: doc.lifetime?.deployments ?? 0,
    };

    const developers = baseline.developers + lifetime.developers;
    const deployments = baseline.deployments + lifetime.deployments;
    const projects = baseline.projects + lifetime.projects;
    const countries =
      baseline.countries + (doc.uniqueCountries?.length ?? 0);

    return {
      developers: {
        value: developers,
        display: formatCompact(developers),
      },
      deployments: {
        value: deployments,
        display: formatCompact(deployments),
      },
      projects: {
        value: projects,
        display: formatCompact(projects),
      },
      countries: {
        value: countries,
        display: formatCompact(countries),
      },
      uptime: {
        value: runtime.avgUptime,
        display: formatUptime(runtime.avgUptime),
      },
      avgDeployTime: {
        value: runtime.avgDeploySeconds,
        display: formatDeployTime(runtime.avgDeploySeconds),
      },
      updatedAt: doc.updatedAt,
    };
  }
}

module.exports = new PlatformStatsService();
