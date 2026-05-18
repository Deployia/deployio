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
const {
  buildAccessibleProjectQuery,
  COLLABORATOR_ROLES,
  toObjectIdString,
} = require("@utils/projectAccess");
const { snapshotProjectEnvForDeployment } = require("../../utils/envVarPayload");
const {
  assertCanDeploy,
  syncUserResourceUsage,
} = require("../user/resourceUsageService");

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
  "superseded",
];
const IN_FLIGHT_DEPLOYMENT_STATUSES = [
  "pending",
  "queued",
  "cloning",
  "detecting",
  "building",
  "deploying",
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
      ...buildAccessibleProjectQuery(userId),
    }).select("name slug owner repository branch collaborators statistics status deployment");
  }

  _userHasDeployCollaboratorAccess(project, userId) {
    if (!project) return false;
    const userIdStr = toObjectIdString(userId);
    if (toObjectIdString(project.owner) === userIdStr) return true;
    return (project.collaborators || []).some(
      (collab) =>
        toObjectIdString(collab.user) === userIdStr &&
        COLLABORATOR_ROLES.includes(collab.role),
    );
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

    if (!this._userHasDeployCollaboratorAccess(deployment.project, userId)) {
      throw new Error("Access denied");
    }

    return deployment;
  }

  _buildSlotKey(projectId, environment) {
    return `${projectId}:${environment}`;
  }

  async _getNextRevisionNumber(slotKey) {
    const latest = await Deployment.findOne({ slotKey })
      .sort({ revisionNumber: -1 })
      .select("revisionNumber")
      .lean();

    return (latest?.revisionNumber || 0) + 1;
  }

  async _supersedeDeploymentForRedeploy(sourceDeployment) {
    const originalSubdomain = sourceDeployment.config?.subdomain;
    if (!originalSubdomain) {
      throw new Error("Source deployment has no subdomain to supersede");
    }

    const suffix = String(sourceDeployment._id).slice(-6);
    const archivedSlug = `${originalSubdomain}-superseded-${suffix}`
      .toLowerCase()
      .slice(0, 40);

    sourceDeployment.status = "superseded";
    sourceDeployment.supersededAt = new Date();
    sourceDeployment.lineage = {
      ...(sourceDeployment.lineage || {}),
      originalSubdomain,
    };
    sourceDeployment.config.subdomain = archivedSlug;

    if (!sourceDeployment.networking) {
      sourceDeployment.networking = {};
    }
    sourceDeployment.networking.subdomain = archivedSlug;
    sourceDeployment.networking.fullUrl = `https://${archivedSlug}.${subdomainManager.baseDomain}`;

    sourceDeployment.markModified("config");
    sourceDeployment.markModified("networking");
    sourceDeployment.markModified("lineage");

    await sourceDeployment.save();
    return originalSubdomain;
  }

  async _prepareRedeploySource(redeployFromDeploymentId, userId, projectId, environment) {
    const source = await this._findAccessibleDeployment(
      redeployFromDeploymentId,
      userId,
    );

    if (String(source.project._id || source.project) !== String(projectId)) {
      throw new Error("Redeploy source does not belong to this project");
    }

    const sourceEnvironment = source.config?.environment;
    if (sourceEnvironment !== environment) {
      throw new Error(
        "Redeploy environment must match the source deployment environment",
      );
    }

    if (source.status === "superseded") {
      throw new Error("Cannot redeploy from a superseded deployment");
    }

    if (
      ACTIVE_DEPLOYMENT_STATUSES.includes(source.status) ||
      source.status === "stopping" ||
      IN_FLIGHT_DEPLOYMENT_STATUSES.includes(source.status)
    ) {
      await this.stopDeploymentBySystem(source, "redeploy-replace");
      await source.reload();
    }

    const originalSubdomain = await this._supersedeDeploymentForRedeploy(source);

    await subdomainManager.releaseReservationImmediate({
      deploymentId: source._id,
      reason: "redeploy-replace",
    });

    return {
      sourceDeployment: source,
      originalSubdomain,
    };
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
      const userProjects = await Project.find(
        buildAccessibleProjectQuery(userId),
      ).select("_id");
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
        currentPerEnv = true,
      } = options;

      if (currentPerEnv && !status && !environment) {
        const envs = ["development", "staging", "production"];
        const currentDeployments = await Promise.all(
          envs.map((env) =>
            Deployment.findOne({
              project: projectId,
              "config.environment": env,
              status: { $ne: "superseded" },
            })
              .populate("deployedBy", "name email")
              .sort({ revisionNumber: -1, createdAt: -1 })
              .select("-__v")
              .lean(),
          ),
        );

        const deployments = currentDeployments.filter(Boolean);

        return {
          deployments: deployments.map(this.transformDeployment),
          pagination: {
            page: 1,
            limit: deployments.length,
            totalPages: 1,
            total: deployments.length,
          },
        };
      }

      // Build query
      const query = { project: projectId, status: { $ne: "superseded" } };
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

  async getDeploymentHistory(projectId, userId, environment) {
    const project = await this._findAccessibleProject(projectId, userId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }

    if (!environment) {
      throw new Error("environment query parameter is required");
    }

    const deployments = await Deployment.find({
      project: projectId,
      "config.environment": environment,
    })
      .populate("deployedBy", "name email")
      .sort({ revisionNumber: 1, createdAt: 1 })
      .select("-__v")
      .lean();

    return {
      environment,
      slotKey: this._buildSlotKey(projectId, environment),
      deployments: deployments.map(this.transformDeployment),
    };
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

      const environment = deploymentData.environment || "development";
      const redeployFromDeploymentId =
        deploymentData.redeployFromDeploymentId || null;

      await assertCanDeploy(userId);

      let redeployContext = null;
      if (redeployFromDeploymentId) {
        redeployContext = await this._prepareRedeploySource(
          redeployFromDeploymentId,
          userId,
          projectId,
          environment,
        );
      }

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

      const slotKey = this._buildSlotKey(projectId, environment);
      const revisionNumber = await this._getNextRevisionNumber(slotKey);

      const preferredSubdomain =
        deploymentData.subdomain ||
        redeployContext?.originalSubdomain ||
        null;

      const reservation = await subdomainManager.reserveSubdomain({
        projectId,
        environment,
        preferredSubdomain,
      });

      const subdomain = reservation.reservation.subdomain;
      let deployment;

      const commitInput = deploymentData.commit || {};
      const commitHash = String(commitInput.hash || "").trim();
      if (!commitHash || commitHash.length < 7) {
        throw new Error(
          "A valid commit is required. Select a branch and commit in the deploy dialog.",
        );
      }

      const commitData = {
        hash: commitHash,
        message: commitInput.message || "Deployment",
        author: commitInput.author || "unknown",
        timestamp: commitInput.timestamp
          ? new Date(commitInput.timestamp)
          : new Date(),
        url: commitInput.url || undefined,
      };

      const environmentVariables = snapshotProjectEnvForDeployment(
        project.deployment?.environment?.[environment],
      );

      const triggerType = redeployFromDeploymentId
        ? "redeploy"
        : deploymentData.trigger?.type || "manual";

      try {
        // Create deployment
        deployment = new Deployment({
          project: projectId,
          deployedBy: userId,
          slotKey,
          revisionNumber,
          redeployedFrom: redeployContext?.sourceDeployment?._id || null,
          trigger: {
            type: triggerType,
            branch:
              deploymentData.branch || project.repository?.branch || "main",
            commitSha: commitHash,
            at: new Date(),
          },
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
          environmentVariables,
          status: "pending",
        });

        await deployment.save();

        if (redeployContext?.sourceDeployment) {
          redeployContext.sourceDeployment.supersededBy = deployment._id;
          await redeployContext.sourceDeployment.save();
        }

        const platformStatsService = require("../platform/platformStatsService");
        platformStatsService.recordDeployment().catch(() => {});

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
        await deploymentOrchestrator.triggerDeploy(deployment, project, {
          deployUserId: userId,
        });
      } catch (orchErr) {
        logger.error("Orchestrator trigger failed (non-blocking):", orchErr);
      }

      notifyDeploymentStarted(userId, deployment, project);
      await syncUserResourceUsage(userId);

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
            { deployUserId: userId },
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

      await syncUserResourceUsage(userId);
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

      await syncUserResourceUsage(userId);
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
        await syncUserResourceUsage(notifyUserId);
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
      await syncUserResourceUsage(notifyUserId);
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
      await syncUserResourceUsage(userId);

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
    const displaySubdomain =
      deployment.lineage?.originalSubdomain || deployment.config?.subdomain;

    return {
      id: deployment._id,
      _id: deployment._id,
      deploymentId: deployment.deploymentId,
      project: deployment.project,
      deployedBy: deployment.deployedBy,
      status: deployment.status,
      environment: deployment.config?.environment,
      branch: deployment.config?.branch,
      commit: deployment.config?.commit,
      url: deployment.networking?.fullUrl,
      subdomain: displaySubdomain,
      config: deployment.config,
      networking: deployment.networking,
      slotKey: deployment.slotKey,
      revisionNumber: deployment.revisionNumber,
      redeployedFrom: deployment.redeployedFrom,
      supersededBy: deployment.supersededBy,
      supersededAt: deployment.supersededAt,
      lineage: deployment.lineage,
      trigger: deployment.trigger,
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
