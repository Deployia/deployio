const Project = require("@models/Project");
const Deployment = require("@models/Deployment");
const mongoose = require("mongoose");

class AnalyticsService {
  /**
   * Get analytics overview for user
   * @param {string} userId
   * @param {Object} options
   * @returns {Object} Analytics overview
   */
  async getAnalyticsOverview(userId, options = {}) {
    try {
      const { timeRange = "7d" } = options;
      const dateRange = this._getDateRange(timeRange);

      // Get basic counts using correct field names from models
      const [
        totalProjects,
        totalDeployments,
        activeProjects,
        failedDeployments,
      ] = await Promise.all([
        Project.countDocuments({
          owner: new mongoose.Types.ObjectId(userId),
          status: { $ne: "deleted" },
        }),
        Deployment.countDocuments({
          deployedBy: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        }),
        Project.countDocuments({
          owner: new mongoose.Types.ObjectId(userId),
          status: "active",
        }),
        Deployment.countDocuments({
          deployedBy: new mongoose.Types.ObjectId(userId),
          status: "failed",
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        }),
      ]);

      // Get deployment success rate using correct field names
      const totalDeploymentsInRange = await Deployment.countDocuments({
        deployedBy: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: dateRange.start, $lte: dateRange.end },
      });

      const successfulDeployments = await Deployment.countDocuments({
        deployedBy: new mongoose.Types.ObjectId(userId),
        status: "running",
        createdAt: { $gte: dateRange.start, $lte: dateRange.end },
      });

      const successRate =
        totalDeploymentsInRange > 0
          ? Math.round((successfulDeployments / totalDeploymentsInRange) * 100)
          : 0;

      // Get recent activity
      const recentActivity = await this._getRecentActivity(userId, 10);

      // Get technology distribution
      const techDistribution = await this._getTechnologyDistribution(userId);

      return {
        overview: {
          totalProjects,
          totalDeployments,
          activeProjects,
          successRate,
          failedDeployments,
        },
        recentActivity,
        techDistribution,
        timeRange,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to get analytics overview: ${error.message}`);
    }
  }

  /**
   * Get deployment analytics for user
   * @param {string} userId
   * @param {Object} options
   * @returns {Object} Deployment analytics
   */
  async getDeploymentAnalytics(userId, options = {}) {
    try {
      const { timeRange = "30d", projectId = null } = options;
      const dateRange = this._getDateRange(timeRange);

      const matchConditions = {
        deployedBy: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: dateRange.start, $lte: dateRange.end },
      };

      if (projectId) {
        matchConditions.project = new mongoose.Types.ObjectId(projectId);
      }

      // Get deployment trends over time
      const deploymentTrends = await Deployment.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              status: "$status",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.date",
            deployments: {
              $push: {
                status: "$_id.status",
                count: "$count",
              },
            },
            total: { $sum: "$count" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get status distribution
      const statusDistribution = await Deployment.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            avgBuildTime: { $avg: "$build.duration" },
          },
        },
      ]);

      // Get environment distribution (using config.environment from model)
      const environmentDistribution = await Deployment.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: "$config.environment",
            count: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $eq: ["$status", "running"] }, 1, 0] },
            },
          },
        },
      ]);

      // Get performance metrics (using build.duration from model)
      const performanceMetrics = await Deployment.aggregate([
        {
          $match: {
            ...matchConditions,
            "build.duration": { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: null,
            avgBuildTime: { $avg: "$build.duration" },
            minBuildTime: { $min: "$build.duration" },
            maxBuildTime: { $max: "$build.duration" },
            totalDeployments: { $sum: 1 },
          },
        },
      ]);

      return {
        deploymentTrends: this._formatDeploymentTrends(deploymentTrends),
        statusDistribution,
        environmentDistribution: environmentDistribution.map((env) => ({
          ...env,
          successRate:
            env.count > 0
              ? Math.round((env.successCount / env.count) * 100)
              : 0,
        })),
        performanceMetrics: performanceMetrics[0] || {
          avgBuildTime: 0,
          minBuildTime: 0,
          maxBuildTime: 0,
          totalDeployments: 0,
        },
        timeRange,
        projectId,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to get deployment analytics: ${error.message}`);
    }
  }

  /**
   * Get project analytics for user
   * @param {string} userId
   * @param {Object} options
   * @returns {Object} Project analytics
   */
  async getProjectAnalytics(userId, options = {}) {
    try {
      const { timeRange = "30d" } = options;
      const dateRange = this._getDateRange(timeRange);

      // Get project creation trends using correct field names
      const projectTrends = await Project.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get status distribution
      const statusDistribution = await Project.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId),
            status: { $ne: "deleted" },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      // Get most active projects (by deployment count) using correct field references
      const mostActiveProjects = await Project.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId),
            status: { $ne: "deleted" },
          },
        },
        {
          $lookup: {
            from: "deployments",
            localField: "_id",
            foreignField: "project",
            pipeline: [
              {
                $match: {
                  createdAt: { $gte: dateRange.start, $lte: dateRange.end },
                },
              },
            ],
            as: "deployments",
          },
        },
        {
          $addFields: {
            deploymentCount: { $size: "$deployments" },
            lastDeployment: { $max: "$deployments.createdAt" },
            successfulDeployments: {
              $size: {
                $filter: {
                  input: "$deployments",
                  cond: { $eq: ["$$this.status", "running"] },
                },
              },
            },
          },
        },
        {
          $addFields: {
            successRate: {
              $cond: [
                { $gt: ["$deploymentCount", 0] },
                {
                  $multiply: [
                    { $divide: ["$successfulDeployments", "$deploymentCount"] },
                    100,
                  ],
                },
                0,
              ],
            },
          },
        },
        {
          $project: {
            name: 1,
            status: 1,
            deploymentCount: 1,
            lastDeployment: 1,
            successRate: { $round: ["$successRate", 0] },
            technology: "$technology.primary",
          },
        },
        { $sort: { deploymentCount: -1 } },
        { $limit: 10 },
      ]);

      // Get technology usage
      const technologyUsage = await this._getTechnologyDistribution(userId);

      return {
        projectTrends: this._formatProjectTrends(projectTrends),
        statusDistribution,
        mostActiveProjects,
        technologyUsage,
        timeRange,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to get project analytics: ${error.message}`);
    }
  }

  /**
   * Get resource usage analytics
   * @param {string} userId
   * @param {Object} options
   * @returns {Object} Resource usage analytics
   */
  async getResourceUsage(userId, options = {}) {
    try {
      const { timeRange = "7d", projectId = null } = options;
      const dateRange = this._getDateRange(timeRange);

      const matchConditions = {
        deployedBy: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        status: "running",
      };

      if (projectId) {
        matchConditions.project = new mongoose.Types.ObjectId(projectId);
      }

      // Get resource usage over time
      const resourceUsage = await Deployment.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            totalMemory: { $sum: "$runtime.resources.memory" },
            totalCpu: { $sum: "$runtime.resources.cpu" },
            totalStorage: { $sum: "$runtime.resources.storage" },
            deploymentCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get current active resources using correct field names
      const activeResources = await Deployment.aggregate([
        {
          $match: {
            deployedBy: new mongoose.Types.ObjectId(userId),
            status: "running",
          },
        },
        {
          $group: {
            _id: null,
            totalMemory: {
              $sum: {
                $toDouble: {
                  $ifNull: ["$runtime.resources.memory.allocated", "0"],
                },
              },
            },
            totalCpu: {
              $sum: {
                $toDouble: {
                  $ifNull: ["$runtime.resources.cpu.allocated", "0"],
                },
              },
            },
            totalStorage: {
              $sum: {
                $toDouble: {
                  $ifNull: ["$runtime.resources.storage.allocated", "0"],
                },
              },
            },
            activeDeployments: { $sum: 1 },
          },
        },
      ]);

      // Get resource usage by project using correct field names
      const resourceByProject = await Deployment.aggregate([
        {
          $match: {
            deployedBy: new mongoose.Types.ObjectId(userId),
            status: "running",
          },
        },
        {
          $lookup: {
            from: "projects",
            localField: "project",
            foreignField: "_id",
            as: "project",
          },
        },
        { $unwind: "$project" },
        {
          $group: {
            _id: "$project._id",
            projectName: { $first: "$project.name" },
            totalMemory: {
              $sum: {
                $toDouble: {
                  $ifNull: ["$runtime.resources.memory.allocated", "0"],
                },
              },
            },
            totalCpu: {
              $sum: {
                $toDouble: {
                  $ifNull: ["$runtime.resources.cpu.allocated", "0"],
                },
              },
            },
            totalStorage: {
              $sum: {
                $toDouble: {
                  $ifNull: ["$runtime.resources.storage.allocated", "0"],
                },
              },
            },
            deploymentCount: { $sum: 1 },
          },
        },
        { $sort: { totalMemory: -1 } },
      ]);

      return {
        resourceUsage: this._formatResourceUsage(resourceUsage),
        activeResources: activeResources[0] || {
          totalMemory: 0,
          totalCpu: 0,
          totalStorage: 0,
          activeDeployments: 0,
        },
        resourceByProject,
        timeRange,
        projectId,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to get resource usage: ${error.message}`);
    }
  }

  /**
   * Get recent activity for user
   * @param {string} userId
   * @param {number} limit
   * @returns {Array} Recent activities
   */
  async _getRecentActivity(userId, limit = 10) {
    try {
      // Get recent deployments using correct field names
      const recentDeployments = await Deployment.find({
        deployedBy: new mongoose.Types.ObjectId(userId),
      })
        .populate("project", "name")
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("project status config.environment createdAt updatedAt")
        .lean();

      return recentDeployments.map((deployment) => ({
        type: "deployment",
        action: `Deployment ${deployment.status}`,
        projectName: deployment.project?.name || "Unknown Project",
        environment: deployment.config?.environment || "unknown",
        status: deployment.status,
        timestamp: deployment.updatedAt || deployment.createdAt,
      }));
    } catch (error) {
      throw new Error(`Failed to get recent activity: ${error.message}`);
    }
  }

  /**
   * Get technology distribution for user
   * @param {string} userId
   * @returns {Array} Technology distribution
   */
  async _getTechnologyDistribution(userId) {
    try {
      // Get all projects for the user
      const projects = await Project.find({
        owner: new mongoose.Types.ObjectId(userId),
        status: { $ne: "deleted" },
      })
        .select(
          "analysis.technologyStack repository.metadata.language repository.url name"
        )
        .lean();

      // Manually aggregate technology distribution
      const techCounts = {};

      projects.forEach((project) => {
        const tech = project.analysis?.technologyStack;
        const repoLang = project.repository?.metadata?.language;
        const repoUrl = project.repository?.url;

        // Primary source: AI analysis
        if (tech) {
          if (tech.primaryLanguage) {
            techCounts[tech.primaryLanguage] =
              (techCounts[tech.primaryLanguage] || 0) + 1;
          }
          if (tech.framework) {
            techCounts[tech.framework] = (techCounts[tech.framework] || 0) + 1;
          }
        }
        // Fallback: Repository metadata
        else if (repoLang) {
          techCounts[repoLang] = (techCounts[repoLang] || 0) + 1;
        }
        // Last resort: detect from repo URL
        else if (repoUrl) {
          // Basic detection from common patterns
          const url = repoUrl.toLowerCase();
          if (url.includes("react") || url.includes("next")) {
            techCounts["React"] = (techCounts["React"] || 0) + 1;
          } else if (url.includes("vue")) {
            techCounts["Vue"] = (techCounts["Vue"] || 0) + 1;
          } else if (url.includes("angular")) {
            techCounts["Angular"] = (techCounts["Angular"] || 0) + 1;
          } else if (
            url.includes("python") ||
            url.includes("django") ||
            url.includes("flask")
          ) {
            techCounts["Python"] = (techCounts["Python"] || 0) + 1;
          } else if (url.includes("node") || url.includes("express")) {
            techCounts["Node.js"] = (techCounts["Node.js"] || 0) + 1;
          } else {
            // Default to JavaScript for web projects
            techCounts["JavaScript"] = (techCounts["JavaScript"] || 0) + 1;
          }
        }
      });

      // Convert to array and sort by count
      const result = Object.entries(techCounts)
        .map(([name, count]) => ({
          _id: name,
          count,
          avgConfidence: 0.8,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return result;
    } catch (error) {
      throw new Error(
        `Failed to get technology distribution: ${error.message}`
      );
    }
  }

  /**
   * Get date range based on time range string
   * @param {string} timeRange
   * @returns {Object} Date range object
   */
  _getDateRange(timeRange) {
    const end = new Date();
    const start = new Date();

    switch (timeRange) {
      case "24h":
        start.setDate(start.getDate() - 1);
        break;
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }

    return { start, end };
  }

  /**
   * Format deployment trends data
   * @param {Array} trends
   * @returns {Array} Formatted trends
   */
  _formatDeploymentTrends(trends) {
    return trends.map((trend) => ({
      date: trend._id,
      total: trend.total,
      byStatus: trend.deployments.reduce((acc, dep) => {
        acc[dep.status] = dep.count;
        return acc;
      }, {}),
    }));
  }

  /**
   * Format project trends data
   * @param {Array} trends
   * @returns {Array} Formatted trends
   */
  _formatProjectTrends(trends) {
    return trends.map((trend) => ({
      date: trend._id,
      count: trend.count,
    }));
  }

  /**
   * Format resource usage data
   * @param {Array} usage
   * @returns {Array} Formatted usage
   */
  _formatResourceUsage(usage) {
    return usage.map((item) => ({
      date: item._id,
      memory: item.totalMemory || 0,
      cpu: item.totalCpu || 0,
      storage: item.totalStorage || 0,
      deployments: item.deploymentCount,
    }));
  }
}

module.exports = new AnalyticsService();
