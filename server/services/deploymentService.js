const Deployment = require("../models/Deployment");
const Project = require("../models/Project");
const { getRedisClient } = require("../config/redisClient");
const crypto = require("crypto");

// Cache management utilities
const invalidateDeploymentCache = async (projectId, deploymentId) => {
  try {
    const redisClient = getRedisClient();
    const patterns = [
      `deployment:${deploymentId}`,
      `project_deployments:${projectId}:*`,
      `deployment_stats:${projectId}:*`,
    ];

    for (const pattern of patterns) {
      if (pattern.includes("*")) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        await redisClient.del(pattern);
      }
    }
  } catch (error) {
    console.error("Error invalidating deployment cache:", error);
  }
};

// Create a new deployment
const createDeployment = async (projectId, userId, deploymentData) => {
  try {
    // Verify user has access to project
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const hasAccess =
      project.owner.toString() === userId.toString() ||
      project.collaborators.some(
        (c) => c.user.toString() === userId.toString()
      );

    if (!hasAccess) {
      throw new Error(
        "Access denied: You don't have permission to deploy this project"
      );
    }

    // Generate unique deployment ID
    const deploymentId = `dep_${crypto.randomBytes(16).toString("hex")}`;

    const deployment = new Deployment({
      ...deploymentData,
      project: projectId,
      deployedBy: userId,
      deployment: {
        ...deploymentData.deployment,
        id: deploymentId,
      },
    });

    await deployment.save();

    // Populate the deployment
    await deployment.populate([
      { path: "project", select: "name owner" },
      { path: "deployedBy", select: "username email profileImage" },
    ]);

    // Update project's last deployment info
    project.deployment.lastDeployment = {
      id: deploymentId,
      status: deployment.deployment.status,
      startedAt: new Date(),
      deployedBy: userId,
    };
    await project.save();

    // Invalidate caches
    await invalidateDeploymentCache(projectId, deploymentId);

    return deployment;
  } catch (error) {
    throw error;
  }
};

// Get deployment by ID
const getDeploymentById = async (deploymentId, userId) => {
  const redisClient = getRedisClient();
  const cacheKey = `deployment:${deploymentId}`;
  try {
    // Try cache first (only if Redis is available)
    if (redisClient) {
      try {
        const cachedDeployment = await redisClient.get(cacheKey);
        if (cachedDeployment) {
          const deployment = JSON.parse(cachedDeployment);
          // Verify user has access
          const project = await Project.findById(
            deployment.project._id || deployment.project
          );
          const hasAccess =
            project.owner.toString() === userId.toString() ||
            project.collaborators.some(
              (c) => c.user.toString() === userId.toString()
            );

          if (!hasAccess) {
            throw new Error(
              "Access denied: You don't have permission to view this deployment"
            );
          }

          return deployment;
        }
      } catch (cacheError) {
        console.warn("Redis cache read error:", cacheError.message);
      }
    }

    // Get from DB
    const deployment = await Deployment.findOne({
      "deployment.id": deploymentId,
    })
      .populate("project", "name owner collaborators")
      .populate("deployedBy", "username email profileImage");

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    // Check access
    const hasAccess =
      deployment.project.owner.toString() === userId.toString() ||
      deployment.project.collaborators.some(
        (c) => c.user.toString() === userId.toString()
      );

    if (!hasAccess) {
      throw new Error(
        "Access denied: You don't have permission to view this deployment"
      );
    } // Cache for 5 minutes (only if Redis is available)
    if (redisClient) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(deployment));
      } catch (cacheError) {
        console.warn("Redis cache write error:", cacheError.message);
      }
    }

    return deployment;
  } catch (error) {
    if (
      error.message.includes("Access denied") ||
      error.message === "Deployment not found"
    ) {
      throw error;
    }

    console.error("Redis error in getDeploymentById:", error);

    // Fallback to DB
    const deployment = await Deployment.findOne({
      "deployment.id": deploymentId,
    })
      .populate("project", "name owner collaborators")
      .populate("deployedBy", "username email profileImage");

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    const hasAccess =
      deployment.project.owner.toString() === userId.toString() ||
      deployment.project.collaborators.some(
        (c) => c.user.toString() === userId.toString()
      );

    if (!hasAccess) {
      throw new Error(
        "Access denied: You don't have permission to view this deployment"
      );
    }

    return deployment;
  }
};

// Update deployment status
const updateDeploymentStatus = async (
  deploymentId,
  userId,
  status,
  updateData = {}
) => {
  try {
    const deployment = await Deployment.findOne({
      "deployment.id": deploymentId,
    }).populate("project", "name owner collaborators");

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    // Check access
    const hasAccess =
      deployment.project.owner.toString() === userId.toString() ||
      deployment.project.collaborators.some(
        (c) => c.user.toString() === userId.toString()
      );

    if (!hasAccess) {
      throw new Error(
        "Access denied: You don't have permission to update this deployment"
      );
    }

    // Update deployment status
    deployment.deployment.status = status;

    if (updateData.url) deployment.deployment.url = updateData.url;
    if (updateData.domain) deployment.deployment.domain = updateData.domain;

    // Update timing information
    if (status === "building" && !deployment.build.startedAt) {
      deployment.build.startedAt = new Date();
    }

    if (status === "success" || status === "failed") {
      if (deployment.build.startedAt && !deployment.build.completedAt) {
        deployment.build.completedAt = new Date();
        deployment.build.duration = Math.floor(
          (deployment.build.completedAt - deployment.build.startedAt) / 1000
        );
      }

      // Update project analytics
      const project = await Project.findById(deployment.project._id);
      if (status === "success") {
        project.analytics.successfulDeployments += 1;
      } else {
        project.analytics.failedDeployments += 1;
      }
      project.analytics.totalDeployments += 1;

      // Update average build time
      if (deployment.build.duration) {
        const totalTime =
          project.analytics.averageBuildTime *
          (project.analytics.totalDeployments - 1);
        project.analytics.averageBuildTime = Math.floor(
          (totalTime + deployment.build.duration) /
            project.analytics.totalDeployments
        );
      }

      await project.save();
    }

    await deployment.save();

    // Update project's last deployment
    const project = await Project.findById(deployment.project._id);
    project.deployment.lastDeployment.status = status;
    if (status === "success" || status === "failed") {
      project.deployment.lastDeployment.completedAt = new Date();
      project.deployment.lastDeployment.duration = deployment.build.duration;
    }
    await project.save();

    // Invalidate caches
    await invalidateDeploymentCache(deployment.project._id, deploymentId);

    return deployment;
  } catch (error) {
    throw error;
  }
};

// Get deployment logs
const getDeploymentLogs = async (deploymentId, userId) => {
  try {
    const deployment = await getDeploymentById(deploymentId, userId);

    return {
      buildLogs: deployment.build.buildLogs || "",
      buildOutput: deployment.build.buildOutput || "",
      deployment: {
        id: deployment.deployment.id,
        status: deployment.deployment.status,
        startedAt: deployment.build.startedAt,
        completedAt: deployment.build.completedAt,
        duration: deployment.build.duration,
      },
    };
  } catch (error) {
    throw error;
  }
};

// Cancel deployment
const cancelDeployment = async (deploymentId, userId) => {
  try {
    const deployment = await Deployment.findOne({
      "deployment.id": deploymentId,
    }).populate("project", "name owner collaborators");

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    // Check access
    const hasAccess =
      deployment.project.owner.toString() === userId.toString() ||
      deployment.project.collaborators.some(
        (c) => c.user.toString() === userId.toString()
      );

    if (!hasAccess) {
      throw new Error(
        "Access denied: You don't have permission to cancel this deployment"
      );
    }

    // Can only cancel pending or building deployments
    if (
      !["pending", "building", "deploying"].includes(
        deployment.deployment.status
      )
    ) {
      throw new Error("Cannot cancel deployment in current status");
    }

    deployment.deployment.status = "cancelled";
    deployment.build.completedAt = new Date();

    if (deployment.build.startedAt) {
      deployment.build.duration = Math.floor(
        (deployment.build.completedAt - deployment.build.startedAt) / 1000
      );
    }

    await deployment.save();

    // Update project stats
    const project = await Project.findById(deployment.project._id);
    project.analytics.failedDeployments += 1;
    project.analytics.totalDeployments += 1;
    await project.save();

    // Invalidate caches
    await invalidateDeploymentCache(deployment.project._id, deploymentId);

    return deployment;
  } catch (error) {
    throw error;
  }
};

// Get deployment statistics
const getDeploymentStats = async (projectId, userId, timeframe = 30) => {
  try {
    // Verify access to project
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const hasAccess =
      project.owner.toString() === userId.toString() ||
      project.collaborators.some(
        (c) => c.user.toString() === userId.toString()
      );

    if (!hasAccess) {
      throw new Error(
        "Access denied: You don't have permission to view this project"
      );
    }

    const redisClient = getRedisClient();
    const cacheKey = `deployment_stats:${projectId}:${timeframe}`;
    try {
      // Try cache first (only if Redis is available)
      if (redisClient) {
        try {
          const cachedStats = await redisClient.get(cacheKey);
          if (cachedStats) {
            return JSON.parse(cachedStats);
          }
        } catch (cacheError) {
          console.warn("Redis cache read error:", cacheError.message);
        }
      }
    } catch (error) {
      console.error("Redis error in getDeploymentStats:", error);
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    // Aggregate deployment statistics
    const stats = await Deployment.aggregate([
      {
        $match: {
          project: project._id,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalDeployments: { $sum: 1 },
          successfulDeployments: {
            $sum: { $cond: [{ $eq: ["$deployment.status", "success"] }, 1, 0] },
          },
          failedDeployments: {
            $sum: { $cond: [{ $eq: ["$deployment.status", "failed"] }, 1, 0] },
          },
          averageBuildTime: { $avg: "$build.duration" },
          totalBuildTime: { $sum: "$build.duration" },
        },
      },
    ]);

    const result = stats[0] || {
      totalDeployments: 0,
      successfulDeployments: 0,
      failedDeployments: 0,
      averageBuildTime: 0,
      totalBuildTime: 0,
    };

    // Calculate success rate
    result.successRate =
      result.totalDeployments > 0
        ? (
            (result.successfulDeployments / result.totalDeployments) *
            100
          ).toFixed(1)
        : 0;

    // Get daily deployment counts for chart data
    const dailyStats = await Deployment.aggregate([
      {
        $match: {
          project: project._id,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          deployments: { $sum: 1 },
          successful: {
            $sum: { $cond: [{ $eq: ["$deployment.status", "success"] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ["$deployment.status", "failed"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    result.dailyStats = dailyStats;
    result.timeframe = timeframe; // Cache for 10 minutes (only if Redis is available)
    if (redisClient) {
      try {
        await redisClient.setEx(cacheKey, 600, JSON.stringify(result));
      } catch (cacheError) {
        console.warn("Redis cache write error:", cacheError.message);
      }
    }

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createDeployment,
  getDeploymentById,
  updateDeploymentStatus,
  getDeploymentLogs,
  cancelDeployment,
  getDeploymentStats,
  invalidateDeploymentCache,
};
