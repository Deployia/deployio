const Deployment = require("@models/Deployment");
const Project = require("@models/Project");
const logger = require("@config/logger");
const deploymentOrchestrator = require("./deploymentOrchestrator");

class DeploymentService {
  /**
   * Get all deployments with filtering and pagination
   */
  async getAllDeployments(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        environment,
        projectId,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // First get user's projects
      const userProjects = await Project.find({ owner: userId }).select("_id");
      const projectIds = userProjects.map((p) => p._id);

      // Build query
      const query = { project: { $in: projectIds } };

      // Add filters
      if (status) query.status = status;
      if (environment) query["config.environment"] = environment;
      if (projectId) query.project = projectId;

      if (search) {
        query.$or = [
          { "config.subdomain": new RegExp(search, "i") },
          { "config.commit.message": new RegExp(search, "i") },
        ];
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [deployments, totalCount] = await Promise.all([
        Deployment.find(query)
          .populate("project", "name repository.url stack.detected.primary")
          .populate("deployedBy", "name email")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .select("-__v")
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
      logger.error("Error in getAllDeployments:", error);
      throw error;
    }
  }

  /**
   * Get project deployments
   */
  async getProjectDeployments(projectId, userId, options = {}) {
    try {
      // Verify project ownership
      const project = await Project.findOne({ _id: projectId, owner: userId });
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
      if (status) query.status = status;
      if (environment) query["config.environment"] = environment;

      // Execute query
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [deployments, totalCount] = await Promise.all([
        Deployment.find(query)
          .populate("deployedBy", "name email")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .select("-__v")
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
   * Get deployment by ID
   */
  async getDeploymentById(deploymentId, userId) {
    try {
      const deployment = await Deployment.findById(deploymentId)
        .populate("project", "name repository.url owner")
        .populate("deployedBy", "name email")
        .lean();

      if (!deployment) {
        throw new Error("Deployment not found");
      }

      // Check access permissions
      if (deployment.project.owner.toString() !== userId.toString()) {
        throw new Error("Access denied");
      }

      return this.transformDeployment(deployment);
    } catch (error) {
      logger.error("Error in getDeploymentById:", error);
      throw error;
    }
  }

  /**
   * Create new deployment
   */
  async createDeployment(projectId, deploymentData, userId) {
    try {
      // Verify project ownership
      const project = await Project.findOne({ _id: projectId, owner: userId });
      if (!project) {
        throw new Error("Project not found or access denied");
      }

      // Generate unique subdomain
      const subdomain = await Deployment.generateSubdomain(
        project.name,
        deploymentData.environment || "dev",
      );

      // Create deployment
      const deployment = new Deployment({
        project: projectId,
        deployedBy: userId,
        config: {
          environment: deploymentData.environment || "development",
          branch: deploymentData.branch || project.repository.branch || "main",
          commit: deploymentData.commit,
          subdomain,
          customDomain: deploymentData.customDomain,
        },
        networking: {
          subdomain,
          fullUrl: `https://${subdomain}.deployio.tech`,
        },
        status: "pending",
      });

      await deployment.save();

      // Update project statistics
      await project.incrementDeploymentCount(false); // Will be true when successful

      // Trigger deployment on the agent via orchestrator
      try {
        await deploymentOrchestrator.triggerDeploy(deployment, project);
      } catch (orchErr) {
        logger.error("Orchestrator trigger failed (non-blocking):", orchErr);
      }

      // Populate for response
      await deployment.populate("project", "name repository.url");
      await deployment.populate("deployedBy", "name email");

      return this.transformDeployment(deployment.toObject());
    } catch (error) {
      logger.error("Error in createDeployment:", error);
      throw error;
    }
  }

  /**
   * Update deployment status
   */
  async updateDeploymentStatus(
    deploymentId,
    status,
    userId,
    additionalData = {},
  ) {
    try {
      const deployment = await Deployment.findById(deploymentId).populate(
        "project",
        "owner",
      );

      if (!deployment) {
        throw new Error("Deployment not found");
      }

      // Check access permissions
      if (deployment.project.owner.toString() !== userId.toString()) {
        throw new Error("Access denied");
      }

      // Update status with additional data
      await deployment.updateStatus(status, additionalData);

      return this.transformDeployment(deployment.toObject());
    } catch (error) {
      logger.error("Error in updateDeploymentStatus:", error);
      throw error;
    }
  }

  /**
   * Restart deployment
   */
  async restartDeployment(deploymentId, userId) {
    try {
      const result = await this.updateDeploymentStatus(
        deploymentId,
        "pending",
        userId,
        {
          restarted: true,
          restartedAt: new Date(),
        },
      );

      // Trigger re-deployment via orchestrator
      try {
        const deploymentOrchestrator = require("./deploymentOrchestrator");
        const deployment =
          await Deployment.findById(deploymentId).populate("project");
        if (deployment && deployment.project) {
          await deploymentOrchestrator.triggerDeploy(
            deployment,
            deployment.project,
          );
        }
      } catch (orchErr) {
        logger.warn(
          "Orchestrator restart trigger failed (non-blocking):",
          orchErr.message,
        );
      }

      return result;
    } catch (error) {
      logger.error("Error in restartDeployment:", error);
      throw error;
    }
  }

  /**
   * Cancel deployment
   */
  async cancelDeployment(deploymentId, userId) {
    try {
      const result = await this.updateDeploymentStatus(
        deploymentId,
        "cancelled",
        userId,
        {
          cancelled: true,
          cancelledAt: new Date(),
        },
      );

      // Stop the container on the agent via orchestrator
      try {
        const deploymentOrchestrator = require("./deploymentOrchestrator");
        const deployment = await Deployment.findById(deploymentId);
        if (deployment) {
          await deploymentOrchestrator.stopDeploy(deployment.deploymentId);
        }
      } catch (orchErr) {
        logger.warn(
          "Orchestrator stop trigger failed (non-blocking):",
          orchErr.message,
        );
      }

      return result;
    } catch (error) {
      logger.error("Error in cancelDeployment:", error);
      throw error;
    }
  }

  /**
   * Delete deployment
   */
  async deleteDeployment(deploymentId, userId) {
    try {
      const deployment = await Deployment.findById(deploymentId).populate(
        "project",
        "owner",
      );

      if (!deployment) {
        throw new Error("Deployment not found");
      }

      // Check access permissions
      if (deployment.project.owner.toString() !== userId.toString()) {
        throw new Error("Access denied");
      }

      // Can only delete stopped, failed, or cancelled deployments
      if (
        !["stopped", "failed", "cancelled", "error"].includes(deployment.status)
      ) {
        throw new Error("Cannot delete active deployment. Stop it first.");
      }

      await Deployment.findByIdAndDelete(deploymentId);

      return { success: true, message: "Deployment deleted successfully" };
    } catch (error) {
      logger.error("Error in deleteDeployment:", error);
      throw error;
    }
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(deploymentId, userId, options = {}) {
    try {
      const deployment = await Deployment.findById(deploymentId)
        .populate("project", "owner")
        .select("build.logs project");

      if (!deployment) {
        throw new Error("Deployment not found");
      }

      // Check access permissions
      if (deployment.project.owner.toString() !== userId.toString()) {
        throw new Error("Access denied");
      }

      const { level, source, limit = 100, offset = 0 } = options;
      let logs = deployment.build.logs || [];

      // Apply filters
      if (level) {
        logs = logs.filter((log) => log.level === level);
      }
      if (source) {
        logs = logs.filter((log) => log.source === source);
      }

      // Apply pagination
      const totalLogs = logs.length;
      logs = logs.slice(offset, offset + limit);

      return {
        logs,
        pagination: {
          total: totalLogs,
          offset: parseInt(offset),
          limit: parseInt(limit),
          hasMore: offset + limit < totalLogs,
        },
      };
    } catch (error) {
      logger.error("Error in getDeploymentLogs:", error);
      throw error;
    }
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
      customDomain: deployment.config?.customDomain,
      buildDuration: deployment.build?.duration,
      buildStatus: deployment.build?.status,
      healthStatus: deployment.runtime?.health?.status,
      metrics: {
        requests: deployment.metrics?.requests?.total || 0,
        errors: deployment.metrics?.errors?.total || 0,
        uptime: deployment.metrics?.uptime?.percentage || 100,
      },
      resources: deployment.runtime?.resources,
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt,
      buildStartedAt: deployment.build?.startedAt,
      buildCompletedAt: deployment.build?.completedAt,
      deployStartedAt: deployment.deployStartedAt,
      deployCompletedAt: deployment.deployCompletedAt,
      buildLogs: deployment.buildLogs || [],
    };
  }
}

module.exports = new DeploymentService();
