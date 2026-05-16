const Project = require("@models/Project");
const Deployment = require("@models/Deployment");
const deploymentService = require("../deployment/deploymentService");
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
  async _stopAllProjectDeployments(projectId, reason = "project-lifecycle") {
    const deployments = await Deployment.find({ project: projectId });

    for (const deploymentRecord of deployments) {
      if (ACTIVE_DEPLOYMENT_STATUSES.includes(deploymentRecord.status)) {
        await deploymentService.stopDeploymentBySystem(deploymentRecord, reason);
      }
      if (deploymentRecord.status !== "deleted") {
        await deploymentRecord.updateStatus("deleted", {
          deletedAt: new Date(),
          deleteReason: reason,
        });
      }
      await subdomainManager.releaseDeploymentReservation({
        deploymentId: deploymentRecord._id,
        reason,
      });
    }

    return deployments.length;
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

      const query = { owner: userId };

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

      const enrichedProjects = await Promise.all(
        projects.map(async (project) => {
          const deploymentCount = await Deployment.countDocuments({
            project: project._id,
          });

          return this.transformProject(project, { deploymentCount });
        }),
      );

      return {
        projects: enrichedProjects,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(totalCount / limit),
          total: totalCount,
        },
      };
    } catch (error) {
      logger.error("Error in getUserProjects:", error);
      throw error;
    }
  }

  async getProjectById(projectId, userId) {
    try {
      const project = await Project.findOne({
        _id: projectId,
        owner: userId,
      }).lean();

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      const recentDeployments = await Deployment.find({
        project: projectId,
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("deployedBy", "name email")
        .lean();

      const deploymentCount = await Deployment.countDocuments({
        project: projectId,
      });

      const successfulDeployments = await Deployment.countDocuments({
        project: projectId,
        status: "running",
      });

      const activeDeployments = await Deployment.countDocuments({
        project: projectId,
        status: { $in: ACTIVE_DEPLOYMENT_STATUSES },
      });

      return {
        project: this.transformProject(project, {
          deploymentCount,
          successfulDeployments,
          activeDeployments,
        }),
        recentDeployments: recentDeployments.map(this.transformDeployment),
      };
    } catch (error) {
      logger.error("Error in getProjectById:", error);
      throw error;
    }
  }

  async updateProject(projectId, userId, updateData) {
    try {
      const project = await Project.findOne({
        _id: projectId,
        owner: userId,
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      if (project.status === "archived" && updateData.status !== "active") {
        const allowedWhileArchived = ["status"];
        const keys = Object.keys(updateData);
        if (keys.some((k) => !allowedWhileArchived.includes(k))) {
          throw new Error("Archived projects are read-only. Unarchive to edit.");
        }
      }

      const previousStatus = project.status;
      const allowedUpdates = [
        "name",
        "description",
        "visibility",
        "settings",
        "deployment",
        "status",
      ];

      Object.keys(updateData).forEach((key) => {
        if (allowedUpdates.includes(key)) {
          project[key] = updateData[key];
        }
      });

      if (updateData.status === "archived" && previousStatus !== "archived") {
        project.archivedAt = new Date();
        await project.save();
        await this._stopAllProjectDeployments(projectId, "project-archived");
      } else if (updateData.status === "active" && previousStatus === "archived") {
        project.archivedAt = null;
        await project.save();
      } else {
        await project.save();
      }

      return this.transformProject(project.toObject());
    } catch (error) {
      logger.error("Error in updateProject:", error);
      throw error;
    }
  }

  /**
   * Hard-delete project and all related deployment records after stopping containers.
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

      await this._stopAllProjectDeployments(projectId, "project-deleted");
      await Deployment.deleteMany({ project: projectId });
      await Project.deleteOne({ _id: projectId });

      logger.info("Project hard-deleted", { projectId, userId });

      return {
        success: true,
        message: "Project and related records deleted",
      };
    } catch (error) {
      logger.error("Error in deleteProject:", error);
      throw error;
    }
  }

  async getProjectDeployments(projectId, userId, options = {}) {
    try {
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

      const query = { project: projectId };

      if (status) {
        query.status = status;
      }

      if (environment) {
        query["config.environment"] = environment;
      }

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
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(totalCount / limit),
          total: totalCount,
        },
      };
    } catch (error) {
      logger.error("Error in getProjectDeployments:", error);
      throw error;
    }
  }

  transformProject(project, additionalData = {}) {
    return {
      id: project._id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      owner: project.owner,
      repository: project.repository,
      technology: {
        primary:
          project.stack?.detected?.primary ||
          project.analysis?.technologyStack?.framework ||
          "other",
        frontend: project.stack?.detected?.frontend?.framework,
        backend: project.stack?.detected?.backend?.framework,
        database: project.stack?.detected?.database?.type,
      },
      analysis: {
        confidence: project.analysis?.confidence || 0,
        approach: project.analysis?.approach || "basic",
        stack: project.analysis?.detectedConfig?.stack || project.stack?.detected?.primary,
        detectedConfig: project.analysis?.detectedConfig,
        technologyStack: project.analysis?.technologyStack,
        insights: project.analysis?.insights,
        lastAnalyzed: project.analysis?.lastAnalyzed,
      },
      deployment: project.deployment,
      status: project.status,
      archivedAt: project.archivedAt,
      visibility: project.visibility,
      statistics: project.statistics,
      deploymentCount:
        additionalData.deploymentCount ||
        project.statistics?.totalDeployments ||
        0,
      successfulDeployments:
        additionalData.successfulDeployments ||
        project.statistics?.successfulDeployments ||
        0,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lastAccessed: project.lastAccessed,
      isActive: project.status === "active",
      isArchived: project.status === "archived",
      hasActiveDeployments: (additionalData.activeDeployments || 0) > 0,
      activeDeploymentCount: additionalData.activeDeployments || 0,
    };
  }

  transformDeployment(deploymentDoc) {
    return {
      id: deploymentDoc._id,
      deploymentId: deploymentDoc.deploymentId,
      project: deploymentDoc.project,
      deployedBy: deploymentDoc.deployedBy,
      status: deploymentDoc.status,
      environment: deploymentDoc.config?.environment,
      branch: deploymentDoc.config?.branch,
      commit: deploymentDoc.config?.commit,
      url: deploymentDoc.networking?.fullUrl,
      subdomain: deploymentDoc.config?.subdomain,
      buildDuration: deploymentDoc.build?.duration,
      healthStatus: deploymentDoc.runtime?.health?.status,
      createdAt: deploymentDoc.createdAt,
      updatedAt: deploymentDoc.updatedAt,
    };
  }
}

module.exports = new ProjectService();
