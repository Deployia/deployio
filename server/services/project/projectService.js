const Project = require("@models/Project");
const Deployment = require("@models/Deployment");
const { deployment } = require("@services");
const logger = require("@config/logger");
const subdomainManager = require("@services/deployment/subdomainManager");

const ACTIVE_DEPLOYMENT_STATUSES = [
  "pending",
  "queued",
  "building",
  "deploying",
  "running",
  "stopping",
];

class ProjectService {
  _scheduleProjectCleanup(projectId) {
    setImmediate(async () => {
      await this._runProjectCleanup(projectId);
    });
  }

  async _runProjectCleanup(projectId) {
    const project = await Project.findById(projectId);
    if (!project) return;

    try {
      project.deletion.cleanupStatus = "in_progress";
      project.deletion.cleanupStartedAt = new Date();
      project.deletion.cleanupError = null;
      await project.save();

      const deployments = await Deployment.find({ project: projectId });
      for (const deploymentRecord of deployments) {
        if (ACTIVE_DEPLOYMENT_STATUSES.includes(deploymentRecord.status)) {
          await deployment.stopDeploymentBySystem(
            deploymentRecord,
            "project-cleanup",
          );
        }
        if (deploymentRecord.status !== "deleted") {
          await deploymentRecord.updateStatus("deleted", {
            deletedAt: new Date(),
            deleteReason: "project-cleanup",
          });
        }
        await subdomainManager.releaseDeploymentReservation({
          deploymentId: deploymentRecord._id,
          reason: "project-cleanup",
        });
      }

      project.deletion.cleanupStatus = "completed";
      project.deletion.cleanupCompletedAt = new Date();
      project.deletion.hardDeleteEligibleAt = new Date(
        Date.now() + 12 * 60 * 60 * 1000,
      );
      await project.save();
    } catch (error) {
      logger.error("Error in project cleanup:", error);
      project.deletion.cleanupStatus = "failed";
      project.deletion.cleanupCompletedAt = new Date();
      project.deletion.cleanupError = error.message;
      await project.save();
    }
  }

  /**
   * Get user projects with pagination and filtering
   */
  async getUserProjects(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        technology,
        search,
        sortBy = "updatedAt",
        sortOrder = "desc",
      } = options;

      // Build query
      const query = { owner: userId };

      // Add filters
      if (status) {
        query.status = status;
      }

      if (technology) {
        query["stack.detected.primary"] = new RegExp(technology, "i");
      }

      if (search) {
        query.$or = [
          { name: new RegExp(search, "i") },
          { description: new RegExp(search, "i") },
        ];
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [projects, totalCount] = await Promise.all([
        Project.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .select("-__v")
          .lean(),
        Project.countDocuments(query),
      ]);

      // Enrich projects with deployment counts and transform data
      const enrichedProjects = await Promise.all(
        projects.map(async (project) => {
          const deploymentCount = await Deployment.countDocuments({
            project: project._id,
          });

          return this.transformProject(project, { deploymentCount });
        })
      );

      return {
        projects: enrichedProjects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / limit),
          total: totalCount,
        },
      };
    } catch (error) {
      logger.error("Error in getUserProjects:", error);
      throw error;
    }
  }

  /**
   * Get project by ID with deployment info
   */
  async getProjectById(projectId, userId) {
    try {
      const project = await Project.findOne({
        _id: projectId,
        owner: userId,
      }).lean();

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      // Get recent deployments for this project
      const recentDeployments = await Deployment.find({
        project: projectId,
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("deployedBy", "name email")
        .lean();

      // Get deployment statistics
      const deploymentCount = await Deployment.countDocuments({
        project: projectId,
      });

      const successfulDeployments = await Deployment.countDocuments({
        project: projectId,
        status: "running",
      });

      return {
        project: this.transformProject(project, {
          deploymentCount,
          successfulDeployments,
        }),
        recentDeployments: recentDeployments.map(this.transformDeployment),
      };
    } catch (error) {
      logger.error("Error in getProjectById:", error);
      throw error;
    }
  }

  /**
   * Update project
   */
  async updateProject(projectId, userId, updateData) {
    try {
      const project = await Project.findOne({
        _id: projectId,
        owner: userId,
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      // Update allowed fields
      const allowedUpdates = [
        "name",
        "description",
        "visibility",
        "settings",
        "deployment",
      ];

      Object.keys(updateData).forEach((key) => {
        if (allowedUpdates.includes(key)) {
          project[key] = updateData[key];
        }
      });

      await project.save();

      return this.transformProject(project.toObject());
    } catch (error) {
      logger.error("Error in updateProject:", error);
      throw error;
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectId, userId) {
    try {
      const project = await Project.findOne({
        _id: projectId,
        owner: userId,
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      if (project.deletion?.cleanupStatus === "queued") {
        return {
          success: true,
          message: "Project deletion already requested",
        };
      }

      // Soft delete - mark as archived + queue cleanup
      project.status = "archived";
      project.archivedAt = new Date();
      project.deletion.requestedAt = new Date();
      project.deletion.requestedBy = userId;
      project.deletion.cleanupStatus = "queued";
      project.deletion.cleanupCompletedAt = null;
      project.deletion.cleanupError = null;
      await project.save();
      this._scheduleProjectCleanup(project._id);

      return {
        success: true,
        message: "Project archived and cleanup requested",
      };
    } catch (error) {
      logger.error("Error in deleteProject:", error);
      throw error;
    }
  }

  /**
   * Get project deployments with pagination
   */
  async getProjectDeployments(projectId, userId, options = {}) {
    try {
      // Verify project ownership
      const project = await Project.findOne({
        _id: projectId,
        owner: userId,
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      const {
        page = 1,
        limit = 10,
        status,
        environment,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Build query
      const query = { project: projectId };

      if (status) {
        query.status = status;
      }

      if (environment) {
        query["config.environment"] = environment;
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [deployments, totalCount] = await Promise.all([
        Deployment.find(query)
          .populate("deployedBy", "name email")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Deployment.countDocuments(query),
      ]);

      return {
        deployments: deployments.map(this.transformDeployment),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / limit),
          total: totalCount,
        },
      };
    } catch (error) {
      logger.error("Error in getProjectDeployments:", error);
      throw error;
    }
  }

  /**
   * Transform project for API response
   */
  transformProject(project, additionalData = {}) {
    return {
      id: project._id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      owner: project.owner,
      collaborators: project.collaborators,

      // Repository information
      repository: project.repository,

      // Technology stack (frontend expects this structure)
      technology: {
        primary: project.stack?.detected?.primary || "other",
        frontend: project.stack?.detected?.frontend?.framework,
        backend: project.stack?.detected?.backend?.framework,
        database: project.stack?.detected?.database?.type,
      },

      // AI Analysis (transformed for frontend)
      aiAnalysis: {
        confidence: project.analysis?.confidence || 0,
        approach: project.analysis?.approach || "basic",
        insights: project.analysis?.insights,
        technologyStack: project.analysis?.technologyStack,
      },

      // Deployment configuration
      deployment: project.deployment,

      // Status and visibility
      status: project.status,
      deletion: project.deletion,
      visibility: project.visibility,

      // Statistics (frontend expects deploymentCount)
      statistics: project.statistics,
      deploymentCount:
        additionalData.deploymentCount ||
        project.statistics?.totalDeployments ||
        0,
      successfulDeployments:
        additionalData.successfulDeployments ||
        project.statistics?.successfulDeployments ||
        0,

      // Settings
      settings: project.settings,

      // Timestamps
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lastAccessed: project.lastAccessed,

      // Additional computed fields
      isActive: project.status === "active",
      hasActiveDeployments: (additionalData.deploymentCount || 0) > 0,
    };
  }

  /**
   * Transform deployment for API response
   */
  transformDeployment(deployment) {
    return {
      id: deployment._id,
      deploymentId: deployment.deploymentId,
      project: deployment.project,
      deployedBy: deployment.deployedBy,
      status: deployment.status,
      environment: deployment.config?.environment,
      branch: deployment.config?.branch,
      commit: deployment.config?.commit,
      url: deployment.networking?.fullUrl,
      subdomain: deployment.config?.subdomain,
      buildDuration: deployment.build?.duration,
      healthStatus: deployment.runtime?.health?.status,
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt,
    };
  }
}

module.exports = new ProjectService();
