const crypto = require("crypto");
const Deployment = require("@models/Deployment");
const Project = require("@models/Project");
const logger = require("@config/logger");
const deploymentOrchestrator = require("./deploymentOrchestrator");
const subdomainManager = require("./subdomainManager");
const { buildDeploymentLookup } = require("../../utils/deploymentLookup");
const {
  notifyDeploymentStarted,
  notifyDeploymentStatusChange,
} = require("../notification/deploymentNotifications");

const ACTIVE_DEPLOYMENT_STATUSES = [
  "pending",
  "queued",
  "cloning",
  "detecting",
  "building",
  "deploying",
  "running",
];
const TERMINAL_DEPLOYMENT_STATUSES = [
  "stopped",
  "failed",
  "cancelled",
  "error",
  "deleted",
];
const ALLOWED_STATUS_TRANSITIONS = {
  pending: ["queued", "building", "deploying", "running", "cancelled", "failed", "error", "deleted"],
  queued: ["building", "deploying", "running", "cancelled", "failed", "error", "deleted"],
  building: ["deploying", "running", "failed", "cancelled", "error", "deleted"],
  deploying: ["running", "failed", "cancelled", "error", "deleted"],
  running: ["stopping", "stopped", "failed", "error", "deleted"],
  stopping: ["stopped", "failed", "error", "deleted"],
  stopped: ["pending", "queued", "deleted"],
  failed: ["pending", "queued", "deleted"],
  cancelled: ["pending", "queued", "deleted"],
  error: ["pending", "queued", "deleted"],
  deleted: [],
};

class DeploymentService {
  async _findAccessibleProject(projectId, userId) {
    return Project.findOne({
      _id: projectId,
      $or: [
        { owner: userId },
        {
          collaborators: {
            $elemMatch: {
              user: userId,
              role: { $in: ["admin", "editor"] },
            },
          },
        },
      ],
    }).select("name slug owner repository branch collaborators statistics status deployment");
  }

  _canTransition(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) return true;
    return (ALLOWED_STATUS_TRANSITIONS[currentStatus] || []).includes(nextStatus);
  }

  _assertTransitionAllowed(currentStatus, nextStatus) {
    if (!this._canTransition(currentStatus, nextStatus)) {
      throw new Error(
        `Invalid deployment state transition: ${currentStatus} -> ${nextStatus}`,
      );
    }
  }

  async _findAccessibleDeployment(deploymentId, userId) {
    const lookup = buildDeploymentLookup(deploymentId);
    if (!lookup) {
      throw new Error("Deployment not found");
    }

    const deployment = await Deployment.findOne(lookup)
      .populate("project", "owner collaborators")
      .populate("deployedBy", "name email");

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    const isOwner = deployment.project?.owner?.toString() === userId.toString();
    const isCollaborator =
      deployment.project?.collaborators?.some(
        (collab) =>
          collab.user?.toString() === userId.toString() &&
          ["admin", "editor"].includes(collab.role),
      ) || false;

    if (!isOwner && !isCollaborator) {
      throw new Error("Access denied");
    }

    return deployment;
  }

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
      const userProjects = await Project.find({
        $or: [
          { owner: userId },
          {
            collaborators: {
              $elemMatch: {
                user: userId,
                role: { $in: ["admin", "editor"] },
              },
            },
          },
        ],
      }).select("_id");
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
      const project = await this._findAccessibleProject(projectId, userId);
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
      const deployment = await this._findAccessibleDeployment(deploymentId, userId);
      return this.transformDeployment(deployment.toObject());
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
      // Verify project access (owner or collaborator with admin/editor role)
      const project = await this._findAccessibleProject(projectId, userId);
      if (!project) {
        throw new Error("Project not found or access denied");
      }

      if (project.status === "archived") {
        throw new Error("Cannot deploy an archived project. Unarchive it first.");
      }

      const dockerfile = project.deployment?.dockerfile;
      if (!dockerfile?.path && !dockerfile?.content && !dockerfile?.isValid) {
        throw new Error(
          "No Dockerfile configured for this project. Add a Dockerfile path in project settings.",
        );
      }

      const environment = deploymentData.environment || "staging";

      const activeDeployments = await Deployment.countDocuments({
        project: projectId,
        status: { $in: ACTIVE_DEPLOYMENT_STATUSES },
      });

      if (activeDeployments >= 3) {
        throw new Error("This project already has 3 active deployments");
      }

      const environmentDeployment = await Deployment.countDocuments({
        project: projectId,
        status: { $in: ACTIVE_DEPLOYMENT_STATUSES },
        "config.environment": environment,
      });

      if (environmentDeployment > 0) {
        throw new Error(
          `A ${environment} deployment already exists for this project`,
        );
      }

      const reservation = await subdomainManager.reserveSubdomain({
        projectId,
        environment,
        preferredSubdomain: deploymentData.subdomain,
      });

      const subdomain = reservation.reservation.subdomain;
      let deployment;

      // Prepare commit information (from client or project's last commit)
      const commitData = deploymentData.commit || {
        hash:
          project.repository?.metadata?.lastCommit?.sha ||
          crypto.randomBytes(20).toString("hex"),
        message:
          project.repository?.metadata?.lastCommit?.message || "Auto-deploy",
        author: project.repository?.metadata?.lastCommit?.author || "deployio",
        timestamp: project.repository?.metadata?.lastCommit?.date || new Date(),
      };

      try {
        // Create deployment
        deployment = new Deployment({
          project: projectId,
          deployedBy: userId,
          config: {
            environment,
            branch:
              deploymentData.branch || project.repository.branch || "main",
            commit: commitData,
            subdomain,
            customDomain: deploymentData.customDomain,
          },
          networking: {
            subdomain,
            fullUrl: `https://${subdomain}.${subdomainManager.baseDomain}`,
          },
          status: "pending",
        });

        await deployment.save();

        await subdomainManager.linkDeployment({
          deploymentId: deployment._id,
          projectId,
          environment,
          subdomain,
        });
      } catch (saveError) {
        await subdomainManager.releaseReservation({
          projectId,
          environment,
          subdomain,
          reason: "deployment-save-failed",
        });
        throw saveError;
      }

      // Trigger deployment on the agent via orchestrator
      try {
        await deploymentOrchestrator.triggerDeploy(deployment, project);
      } catch (orchErr) {
        logger.error("Orchestrator trigger failed (non-blocking):", orchErr);
      }

      notifyDeploymentStarted(userId, deployment, project);

      // Populate for response
      await deployment.populate("project", "name repository.url");
      await deployment.populate("deployedBy", "name email");

      return this.transformDeployment(deployment.toObject());
    } catch (error) {
      if (error && error.message && error.message.includes("subdomain")) {
        throw error;
      }

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
      const deployment = await this._findAccessibleDeployment(deploymentId, userId);
      this._assertTransitionAllowed(deployment.status, status);

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
        const lookup = buildDeploymentLookup(deploymentId);
        const deployment = lookup
          ? await Deployment.findOne(lookup).populate("project")
          : null;
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
      const deployment = await this._findAccessibleDeployment(deploymentId, userId);

      if (
        deployment.status === "cancelled" ||
        deployment.status === "deleted" ||
        TERMINAL_DEPLOYMENT_STATUSES.includes(deployment.status)
      ) {
        throw new Error(
          `Cannot cancel a deployment in ${deployment.status} state`,
        );
      }

      if (!ACTIVE_DEPLOYMENT_STATUSES.includes(deployment.status)) {
        throw new Error(
          `Cannot cancel a deployment in ${deployment.status} state`,
        );
      }

      try {
        await deploymentOrchestrator.stopDeploy(deployment.deploymentId);
      } catch (orchErr) {
        logger.warn("Orchestrator stop trigger failed (non-blocking):", orchErr.message);
      }

      const previousStatus = deployment.status;

      await deployment.updateStatus("cancelled", {
        cancelled: true,
        cancelledAt: new Date(),
      });

      notifyDeploymentStatusChange({
        userId,
        previousStatus,
        newStatus: "cancelled",
        deployment,
        message: "Cancelled",
      });

      return this.transformDeployment(deployment.toObject());
    } catch (error) {
      logger.error("Error in cancelDeployment:", error);
      throw error;
    }
  }

  async stopDeployment(deploymentId, userId) {
    try {
      const deployment = await this._findAccessibleDeployment(deploymentId, userId);
      if (["stopped", "deleted"].includes(deployment.status)) {
        return this.transformDeployment(deployment.toObject());
      }

      if (deployment.status !== "running") {
        throw new Error("Only running deployments can be stopped");
      }

      const previousStatus = deployment.status;

      await deployment.updateStatus("stopping", { stoppingAt: new Date() });
      try {
        await deploymentOrchestrator.stopDeploy(deployment.deploymentId);
      } catch (orchErr) {
        logger.warn("Orchestrator stop trigger failed (non-blocking):", orchErr.message);
      }
      await deployment.updateStatus("stopped", { stoppedAt: new Date() });

      notifyDeploymentStatusChange({
        userId,
        previousStatus,
        newStatus: "stopped",
        deployment,
        message: "Manual stop",
      });

      return this.transformDeployment(deployment.toObject());
    } catch (error) {
      logger.error("Error in stopDeployment:", error);
      throw error;
    }
  }

  async stopDeploymentBySystem(deployment, reason = "project-cleanup") {
    if (!deployment || TERMINAL_DEPLOYMENT_STATUSES.includes(deployment.status)) {
      return deployment;
    }

    const deploymentId = deployment.deploymentId;
    const priorStatus = deployment.status;
    const isRunningLike = priorStatus === "running" || priorStatus === "stopping";

    if (isRunningLike) {
      await deployment.updateStatus("stopping", { reason, stoppingAt: new Date() });
    }

    if (
      deploymentId &&
      (ACTIVE_DEPLOYMENT_STATUSES.includes(priorStatus) || priorStatus === "stopping")
    ) {
      try {
        await deploymentOrchestrator.stopDeploy(deploymentId);
      } catch (orchErr) {
        logger.warn("System stop failed (non-blocking):", orchErr.message);
      }
    }

    if (isRunningLike) {
      await deployment.updateStatus("stopped", { reason, stoppedAt: new Date() });

      const notifyUserId = deployment.deployedBy?.toString?.() || deployment.deployedBy;
      if (notifyUserId) {
        notifyDeploymentStatusChange({
          userId: notifyUserId,
          previousStatus: priorStatus,
          newStatus: "stopped",
          deployment,
          message: reason,
        });
      }

      return deployment;
    }

    await deployment.updateStatus("cancelled", {
      reason,
      cancelled: true,
      cancelledAt: new Date(),
    });

    const notifyUserId = deployment.deployedBy?.toString?.() || deployment.deployedBy;
    if (notifyUserId) {
      notifyDeploymentStatusChange({
        userId: notifyUserId,
        previousStatus: priorStatus,
        newStatus: "cancelled",
        deployment,
        message: reason,
      });
    }

    return deployment;
  }

  /**
   * Delete deployment
   */
  async deleteDeployment(deploymentId, userId) {
    try {
      const deployment = await this._findAccessibleDeployment(deploymentId, userId);
      const deletableStatuses = ["stopped", "failed", "cancelled"];

      if (
        ACTIVE_DEPLOYMENT_STATUSES.includes(deployment.status) ||
        deployment.status === "stopping"
      ) {
        await this.stopDeploymentBySystem(deployment, "deployment-delete");
        await deployment.reload();
      }

      if (!deletableStatuses.includes(deployment.status)) {
        throw new Error(
          `Cannot delete a deployment in ${deployment.status} state. Stop or cancel it first.`,
        );
      }

      await subdomainManager.releaseDeploymentReservation({
        deploymentId: deployment._id,
        reason: "deployment-deleted",
      });

      await Deployment.findByIdAndDelete(deployment._id);

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
      const deployment = await this._findAccessibleDeployment(deploymentId, userId);

      const { level, source, limit = 100, offset = 0 } = options;
      const parsedLimit = Number.parseInt(limit, 10) || 100;
      const parsedOffset = Number.parseInt(offset, 10) || 0;
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
      logs = logs.slice(parsedOffset, parsedOffset + parsedLimit);

      return {
        logs,
        pagination: {
          total: totalLogs,
          offset: parsedOffset,
          limit: parsedLimit,
          hasMore: parsedOffset + parsedLimit < totalLogs,
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
      buildLogs: deployment.build?.logs || [],
    };
  }
}

module.exports = new DeploymentService();
