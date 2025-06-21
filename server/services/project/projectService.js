const Project = require("../../models/Project");
const Deployment = require("../../models/Deployment");
const { getRedisClient } = require("../../config/redisClient");
const crypto = require("crypto");
const aiService = require("../aiService");

// Cache management utilities
const invalidateProjectCache = async (projectId, userId) => {
  try {
    const redisClient = getRedisClient();
    const patterns = [
      `project:${projectId}`,
      `project_details:${projectId}`,
      `user_projects:${userId}`,
      `user_projects:${userId}:*`,
      `project_collaborators:${projectId}`,
      `project_deployments:${projectId}:*`,
    ];

    // Delete all project-related cache keys
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
    console.error("Error invalidating project cache:", error);
    // Don't throw error as this is not critical
  }
};

const invalidateUserProjectsCache = async (userId) => {
  try {
    const redisClient = getRedisClient();
    const patterns = [`user_projects:${userId}`, `user_projects:${userId}:*`];

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
    console.error("Error invalidating user projects cache:", error);
  }
};

// Create a new project
const createProject = async (userId, projectData) => {
  try {
    const project = new Project({
      ...projectData,
      owner: userId,
    });

    await project.save();

    // Populate the owner and collaborators
    await project.populate("owner", "username email profileImage");

    // Invalidate user projects cache
    await invalidateUserProjectsCache(userId);

    return project;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("A project with this repository URL already exists");
    }
    throw error;
  }
};

// Get user's projects (owned + collaborated)
const getUserProjects = async (userId, options = {}) => {
  const redisClient = getRedisClient();
  const {
    page = 1,
    limit = 10,
    sort = "updatedAt",
    order = "desc",
    status,
  } = options;
  const skip = (page - 1) * limit;
  const sortOrder = order === "desc" ? -1 : 1;

  // Create cache key with options
  const cacheKey = `user_projects:${userId}:page_${page}_limit_${limit}_sort_${sort}_order_${order}_status_${
    status || "all"
  }`;
  try {
    // Try to get from cache (only if Redis is available)
    if (redisClient) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return JSON.parse(cachedData);
        }
      } catch (cacheError) {
        console.warn("Redis cache read error:", cacheError.message);
      }
    }

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          $or: [{ owner: userId }, { "collaborators.user": userId }],
          isArchived: { $ne: true },
        },
      },
    ];

    // Add status filter if provided
    if (status && status !== "all") {
      pipeline.push({
        $match: { "deployment.status": status },
      });
    }

    // Add search filter if provided
    if (options.search) {
      pipeline.unshift({
        $match: {
          $or: [
            { name: { $regex: options.search, $options: "i" } },
            { description: { $regex: options.search, $options: "i" } },
            { "repository.url": { $regex: options.search, $options: "i" } },
          ],
        },
      });
    }

    // Add framework filter if provided
    if (options.framework) {
      pipeline.unshift({
        $match: { "technology.framework": options.framework },
      });
    }

    // Add sorting
    const sortObj = {};
    sortObj[sort] = sortOrder;
    pipeline.push({ $sort: sortObj });

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Add population
    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [{ $project: { username: 1, email: 1, profileImage: 1 } }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "collaborators.user",
          foreignField: "_id",
          as: "collaboratorUsers",
          pipeline: [{ $project: { username: 1, email: 1, profileImage: 1 } }],
        },
      },
      {
        $addFields: {
          owner: { $arrayElemAt: ["$owner", 0] },
          collaborators: {
            $map: {
              input: "$collaborators",
              as: "collab",
              in: {
                $mergeObjects: [
                  "$$collab",
                  {
                    user: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$collaboratorUsers",
                            cond: { $eq: ["$$this._id", "$$collab.user"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: { collaboratorUsers: 0 },
      }
    );

    const projects = await Project.aggregate(pipeline);

    // Get total count for pagination
    const totalCountPipeline = [
      {
        $match: {
          $or: [{ owner: userId }, { "collaborators.user": userId }],
          isArchived: { $ne: true },
        },
      },
    ];

    if (status && status !== "all") {
      totalCountPipeline.push({
        $match: { "deployment.status": status },
      });
    }

    totalCountPipeline.push({ $count: "total" });

    const totalCountResult = await Project.aggregate(totalCountPipeline);
    const totalProjects = totalCountResult[0]?.total || 0;

    const result = {
      projects,
      pagination: {
        page,
        limit,
        total: totalProjects,
        pages: Math.ceil(totalProjects / limit),
        hasNext: page < Math.ceil(totalProjects / limit),
        hasPrev: page > 1,
      },
    }; // Cache for 5 minutes (only if Redis is available)
    if (redisClient) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
      } catch (cacheError) {
        console.warn("Redis cache write error:", cacheError.message);
      }
    }

    return result;
  } catch (error) {
    console.error("Redis error in getUserProjects:", error);
    // Fallback to direct DB query
    const projects = await Project.find({
      $or: [{ owner: userId }, { "collaborators.user": userId }],
      isArchived: { $ne: true },
    })
      .populate("owner", "username email profileImage")
      .populate("collaborators.user", "username email profileImage")
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments({
      $or: [{ owner: userId }, { "collaborators.user": userId }],
      isArchived: { $ne: true },
    });

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }
};

// Get project by ID with caching
const getProjectById = async (projectId, userId) => {
  const redisClient = getRedisClient();
  const cacheKey = `project_details:${projectId}`;
  try {
    // Try to get from cache (only if Redis is available)
    if (redisClient) {
      try {
        const cachedProject = await redisClient.get(cacheKey);
        if (cachedProject) {
          const project = JSON.parse(cachedProject);

          // Verify user has access to this project
          const hasAccess =
            project.owner._id.toString() === userId.toString() ||
            project.collaborators.some(
              (c) => c.user._id.toString() === userId.toString()
            );

          if (!hasAccess) {
            throw new Error(
              "Access denied: You don't have permission to view this project"
            );
          }

          return project;
        }
      } catch (cacheError) {
        console.warn("Redis cache read error:", cacheError.message);
      }
    }

    // Get from DB
    const project = await Project.findById(projectId)
      .populate("owner", "username email profileImage")
      .populate("collaborators.user", "username email profileImage")
      .populate("deployment.lastDeployment.deployedBy", "username email");

    if (!project) {
      throw new Error("Project not found");
    }

    // Check if user has access
    const hasAccess =
      project.owner._id.toString() === userId.toString() ||
      project.collaborators.some(
        (c) => c.user._id.toString() === userId.toString()
      );

    if (!hasAccess) {
      throw new Error(
        "Access denied: You don't have permission to view this project"
      );
    } // Cache for 10 minutes (only if Redis is available)
    if (redisClient) {
      try {
        await redisClient.setEx(cacheKey, 600, JSON.stringify(project));
      } catch (cacheError) {
        console.warn("Redis cache write error:", cacheError.message);
      }
    }

    return project;
  } catch (error) {
    if (
      error.message.includes("Access denied") ||
      error.message === "Project not found"
    ) {
      throw error;
    }

    console.error("Redis error in getProjectById:", error);

    // Fallback to DB
    const project = await Project.findById(projectId)
      .populate("owner", "username email profileImage")
      .populate("collaborators.user", "username email profileImage");

    if (!project) {
      throw new Error("Project not found");
    }

    const hasAccess =
      project.owner._id.toString() === userId.toString() ||
      project.collaborators.some(
        (c) => c.user._id.toString() === userId.toString()
      );

    if (!hasAccess) {
      throw new Error(
        "Access denied: You don't have permission to view this project"
      );
    }

    return project;
  }
};

// Update project
const updateProject = async (projectId, userId, updateData) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  // Check if user has permission to update (owner or admin)
  const isOwner = project.owner.toString() === userId.toString();
  const isAdmin = project.collaborators.some(
    (c) => c.user.toString() === userId.toString() && c.role === "admin"
  );

  if (!isOwner && !isAdmin) {
    throw new Error(
      "Access denied: You don't have permission to update this project"
    );
  }

  // Update the project
  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate("owner", "username email profileImage")
    .populate("collaborators.user", "username email profileImage");

  // Invalidate caches
  await invalidateProjectCache(projectId, project.owner);
  await invalidateUserProjectsCache(project.owner);

  // Invalidate cache for all collaborators
  for (const collaborator of project.collaborators) {
    await invalidateUserProjectsCache(collaborator.user);
  }

  return updatedProject;
};

// Delete project
const deleteProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  // Only owner can delete project
  if (project.owner.toString() !== userId.toString()) {
    throw new Error(
      "Access denied: Only the project owner can delete this project"
    );
  }

  // Delete associated deployments
  await Deployment.deleteMany({ project: projectId });

  // Delete the project
  await Project.findByIdAndDelete(projectId);

  // Invalidate caches
  await invalidateProjectCache(projectId, userId);
  await invalidateUserProjectsCache(userId);

  // Invalidate cache for all collaborators
  for (const collaborator of project.collaborators) {
    await invalidateUserProjectsCache(collaborator.user);
  }

  return "Project deleted successfully";
};

// Archive/Unarchive project
const toggleArchiveProject = async (projectId, userId, archive = true) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  // Only owner can archive/unarchive
  if (project.owner.toString() !== userId.toString()) {
    throw new Error(
      "Access denied: Only the project owner can archive/unarchive this project"
    );
  }

  const updateData = {
    isArchived: archive,
    archivedAt: archive ? new Date() : null,
  };

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    updateData,
    { new: true }
  )
    .populate("owner", "username email profileImage")
    .populate("collaborators.user", "username email profileImage");

  // Invalidate caches
  await invalidateProjectCache(projectId, userId);
  await invalidateUserProjectsCache(userId);

  return updatedProject;
};

// Add collaborator to project
const addCollaborator = async (
  projectId,
  userId,
  collaboratorEmail,
  role = "developer"
) => {
  const User = require("../models/User");
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  // Check if user has permission (owner or admin)
  const isOwner = project.owner.toString() === userId.toString();
  const isAdmin = project.collaborators.some(
    (c) => c.user.toString() === userId.toString() && c.role === "admin"
  );

  if (!isOwner && !isAdmin) {
    throw new Error(
      "Access denied: You don't have permission to add collaborators"
    );
  }

  // Find the user to be added
  const collaboratorUser = await User.findOne({ email: collaboratorEmail });
  if (!collaboratorUser) {
    throw new Error("User not found with this email");
  }

  // Check if user is already a collaborator or owner
  if (project.owner.toString() === collaboratorUser._id.toString()) {
    throw new Error("User is already the owner of this project");
  }

  const existingCollaborator = project.collaborators.find(
    (c) => c.user.toString() === collaboratorUser._id.toString()
  );

  if (existingCollaborator) {
    throw new Error("User is already a collaborator");
  }

  // Add collaborator
  project.collaborators.push({
    user: collaboratorUser._id,
    role,
    addedBy: userId,
  });

  await project.save();
  await project.populate("collaborators.user", "username email profileImage");

  // Invalidate caches
  await invalidateProjectCache(projectId, project.owner);
  await invalidateUserProjectsCache(project.owner);
  await invalidateUserProjectsCache(collaboratorUser._id);

  return project;
};

// Remove collaborator from project
const removeCollaborator = async (projectId, userId, collaboratorId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  // Check permissions
  const isOwner = project.owner.toString() === userId.toString();
  const isAdmin = project.collaborators.some(
    (c) => c.user.toString() === userId.toString() && c.role === "admin"
  );
  const isSelfRemoval = userId.toString() === collaboratorId.toString();

  if (!isOwner && !isAdmin && !isSelfRemoval) {
    throw new Error(
      "Access denied: You don't have permission to remove this collaborator"
    );
  }

  // Remove collaborator
  project.collaborators = project.collaborators.filter(
    (c) => c.user.toString() !== collaboratorId.toString()
  );

  await project.save();

  // Invalidate caches
  await invalidateProjectCache(projectId, project.owner);
  await invalidateUserProjectsCache(project.owner);
  await invalidateUserProjectsCache(collaboratorId);

  return project;
};

// Get project deployments with caching
const getProjectDeployments = async (projectId, userId, options = {}) => {
  const redisClient = getRedisClient();
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;

  const cacheKey = `project_deployments:${projectId}:page_${page}_limit_${limit}_status_${
    status || "all"
  }`;

  try {
    // Verify user has access to project
    await getProjectById(projectId, userId);

    // Try cache first (only if Redis is available)
    if (redisClient) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return JSON.parse(cachedData);
        }
      } catch (cacheError) {
        console.warn("Redis cache read error:", cacheError.message);
      }
    }

    // Build query
    const query = { project: projectId };
    if (status && status !== "all") {
      query["deployment.status"] = status;
    }

    const deployments = await Deployment.find(query)
      .populate("deployedBy", "username email profileImage")
      .populate("project", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Deployment.countDocuments(query);

    const result = {
      deployments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };

    // Cache for 2 minutes (deployments change frequently) - only if Redis is available
    if (redisClient) {
      try {
        await redisClient.setEx(cacheKey, 120, JSON.stringify(result));
      } catch (cacheError) {
        console.warn("Redis cache write error:", cacheError.message);
      }
    }

    return result;
  } catch (error) {
    console.error("Error in getProjectDeployments:", error);
    throw error;
  }
};

// Update project deployment status
const updateDeploymentStatus = async (
  projectId,
  userId,
  status,
  deploymentData = {}
) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  // Check if user has permission
  const hasAccess =
    project.owner.toString() === userId.toString() ||
    project.collaborators.some((c) => c.user.toString() === userId.toString());

  if (!hasAccess) {
    throw new Error(
      "Access denied: You don't have permission to update this project"
    );
  }

  // Update deployment status
  project.deployment.status = status;

  if (deploymentData.url) {
    project.deployment.url = deploymentData.url;
  }

  if (deploymentData.domain) {
    project.deployment.domain = deploymentData.domain;
  }

  // Update analytics
  if (status === "success") {
    project.analytics.successfulDeployments += 1;
  } else if (status === "failed") {
    project.analytics.failedDeployments += 1;
  }

  if (status === "success" || status === "failed") {
    project.analytics.totalDeployments += 1;
  }

  await project.save();

  // Invalidate caches
  await invalidateProjectCache(projectId, project.owner);
  await invalidateUserProjectsCache(project.owner);

  return project;
};

// AI-powered project analysis
const analyzeProjectWithAI = async (projectId, userId) => {
  try {
    const project = await getProjectById(projectId, userId);

    // Get user info for AI service authentication
    const User = require("../models/User");
    const user = await User.findById(userId).select("username email");

    // Analyze technology stack using AI
    const stackAnalysis = await aiService.analyzeProjectStack(
      projectId,
      project.repository.url,
      project.repository.branch,
      user
    );

    // Update project with AI analysis results
    const updateData = {
      "technology.framework": stackAnalysis.technology.framework,
      "technology.language": stackAnalysis.technology.language,
      "technology.database": stackAnalysis.technology.database,
      "technology.buildTool": stackAnalysis.technology.build_tool,
      "technology.confidence": stackAnalysis.technology.confidence,
      "technology.detectedAt": new Date(),
      "ai.stackDetectionCompleted": true,
    };

    // Add optimization suggestions if available
    if (
      stackAnalysis.recommendations &&
      stackAnalysis.recommendations.length > 0
    ) {
      updateData["ai.optimizationSuggestions"] =
        stackAnalysis.recommendations.map((rec) => ({
          type: rec.type || "general",
          title: rec.title,
          description: rec.description,
          priority: "medium",
          implemented: false,
          suggestedAt: new Date(),
        }));
    }

    const updatedProject = await updateProject(projectId, userId, updateData);

    // Invalidate caches
    await invalidateProjectCache(projectId, userId);

    return {
      project: updatedProject,
      analysis: stackAnalysis,
    };
  } catch (error) {
    throw new Error(`AI project analysis failed: ${error.message}`);
  }
};

// Generate Dockerfile for project
const generateProjectDockerfile = async (
  projectId,
  userId,
  buildConfig = {}
) => {
  try {
    const project = await getProjectById(projectId, userId);

    // Get user info for AI service authentication
    const User = require("../models/User");
    const user = await User.findById(userId).select("username email");

    // Generate Dockerfile using AI
    const dockerfileConfig = await aiService.generateDockerfile(
      projectId,
      project.technology,
      {
        buildCommand:
          buildConfig.buildCommand ||
          project.settings?.buildSettings?.buildCommand,
        startCommand:
          buildConfig.startCommand || project.deployment?.startCommand,
        port: buildConfig.port || 3000,
      },
      user
    );

    // Update project with Dockerfile generation status
    const updateData = {
      "ai.dockerfileGenerated": true,
      "deployment.buildCommand":
        buildConfig.buildCommand || dockerfileConfig.build_instructions?.[0],
    };

    await updateProject(projectId, userId, updateData);

    return dockerfileConfig;
  } catch (error) {
    throw new Error(`Dockerfile generation failed: ${error.message}`);
  }
};

// Get optimization suggestions for project
const getProjectOptimizations = async (projectId, userId) => {
  try {
    const project = await getProjectById(projectId, userId);

    // Get user info for AI service authentication
    const User = require("../models/User");
    const user = await User.findById(userId).select("username email");

    // Prepare current configuration
    const currentConfig = {
      technology: project.technology,
      deployment: project.deployment,
      settings: project.settings,
      analytics: project.analytics,
    };

    // Get performance metrics (mock data for now)
    const performanceMetrics = {
      averageBuildTime: project.analytics.averageBuildTime,
      successRate: parseFloat(project.successRate),
      totalDeployments: project.analytics.totalDeployments,
    };

    // Analyze optimization opportunities
    const optimizationAnalysis = await aiService.analyzeOptimization(
      projectId,
      currentConfig,
      performanceMetrics,
      user
    );

    // Update project with optimization suggestions
    if (
      optimizationAnalysis.suggestions &&
      optimizationAnalysis.suggestions.length > 0
    ) {
      const updateData = {
        "ai.optimizationSuggestions": optimizationAnalysis.suggestions.map(
          (suggestion) => ({
            type: suggestion.type,
            title: suggestion.title,
            description: suggestion.description,
            priority: suggestion.priority,
            implemented: false,
            suggestedAt: new Date(),
          })
        ),
      };

      await updateProject(projectId, userId, updateData);
    }

    return optimizationAnalysis;
  } catch (error) {
    throw new Error(`Optimization analysis failed: ${error.message}`);
  }
};

// Mark optimization suggestion as implemented
const markOptimizationImplemented = async (
  projectId,
  userId,
  suggestionIndex
) => {
  try {
    const project = await getProjectById(projectId, userId);

    if (
      project.ai.optimizationSuggestions &&
      project.ai.optimizationSuggestions[suggestionIndex]
    ) {
      project.ai.optimizationSuggestions[suggestionIndex].implemented = true;
      project.ai.optimizationSuggestions[suggestionIndex].implementedAt =
        new Date();

      await project.save();

      // Invalidate caches
      await invalidateProjectCache(projectId, userId);

      return project;
    } else {
      throw new Error("Optimization suggestion not found");
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  toggleArchiveProject,
  addCollaborator,
  removeCollaborator,
  getProjectDeployments,
  updateDeploymentStatus,
  invalidateProjectCache,
  invalidateUserProjectsCache,
  analyzeProjectWithAI,
  generateProjectDockerfile,
  getProjectOptimizations,
  markOptimizationImplemented,
};
