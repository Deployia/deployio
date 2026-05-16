const Project = require("@models/Project");
const User = require("@models/User");
const Deployment = require("@models/Deployment");
const deploymentService = require("../deployment/deploymentService");
const logger = require("@config/logger");
const subdomainManager = require("@services/deployment/subdomainManager");
const NotificationHelpers = require("../notification/notificationHelpers");
const {
  buildAccessibleProjectQuery,
  buildOwnedProjectQuery,
  getMembershipRole,
  toPublicUser,
  transformCollaboratorEntry,
  formatUserDisplayName,
  toObjectIdString,
} = require("@utils/projectAccess");

const COLLABORATOR_USER_FIELDS =
  "username email firstName lastName profileImage";

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

  _projectPopulateQuery() {
    return [
      { path: "owner", select: COLLABORATOR_USER_FIELDS },
      { path: "collaborators.user", select: COLLABORATOR_USER_FIELDS },
      { path: "collaborators.addedBy", select: COLLABORATOR_USER_FIELDS },
    ];
  }

  async _findAccessibleProject(projectId, userId, options = {}) {
    const { lean = false } = options;
    let query = Project.findOne({
      _id: projectId,
      ...buildAccessibleProjectQuery(userId),
    });

    for (const populateSpec of this._projectPopulateQuery()) {
      query = query.populate(populateSpec);
    }

    if (lean) {
      query = query.lean();
    }

    return query;
  }

  async _findOwnedProject(projectId, userId) {
    let query = Project.findOne({
      _id: projectId,
      ...buildOwnedProjectQuery(userId),
    });

    for (const populateSpec of this._projectPopulateQuery()) {
      query = query.populate(populateSpec);
    }

    return query;
  }

  /**
   * Get user projects with pagination and filtering (owned + collaborated)
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

      const query = buildAccessibleProjectQuery(userId);

      if (status) {
        query.status = status;
      }

      if (technology) {
        query["stack.detected.primary"] = new RegExp(technology, "i");
      }

      if (search) {
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { name: new RegExp(search, "i") },
            { description: new RegExp(search, "i") },
          ],
        });
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [projects, totalCount] = await Promise.all([
        Project.find(query)
          .populate("owner", COLLABORATOR_USER_FIELDS)
          .populate("collaborators.user", COLLABORATOR_USER_FIELDS)
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
          const successfulDeployments = await Deployment.countDocuments({
            project: project._id,
            status: "running",
          });

          return this.transformProject(project, {
            deploymentCount,
            successfulDeployments,
            viewerUserId: userId,
          });
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
      const project = await this._findAccessibleProject(projectId, userId, {
        lean: true,
      });

      if (!project) {
        throw new Error("Project not found or access denied");
      }

      const recentDeployments = await Deployment.find({
        project: projectId,
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("deployedBy", "username email firstName lastName profileImage")
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
          viewerUserId: userId,
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
      const project = await this._findOwnedProject(projectId, userId);

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

      const saved = await this._findAccessibleProject(projectId, userId, {
        lean: true,
      });

      return this.transformProject(saved, { viewerUserId: userId });
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
        ...buildOwnedProjectQuery(userId),
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
    return deploymentService.getProjectDeployments(projectId, userId, options);
  }

  async listCollaborators(projectId, userId) {
    const project = await this._findAccessibleProject(projectId, userId, {
      lean: true,
    });

    if (!project) {
      throw new Error("Project not found or access denied");
    }

    return {
      collaborators: (project.collaborators || []).map(transformCollaboratorEntry),
      membershipRole: getMembershipRole(project, userId),
    };
  }

  async addCollaborator(projectId, ownerId, targetUserId) {
    const project = await this._findOwnedProject(projectId, ownerId);

    if (!project) {
      throw new Error("Project not found or access denied");
    }

    const ownerIdStr = toObjectIdString(ownerId);
    const targetUserIdStr = toObjectIdString(targetUserId);

    if (ownerIdStr === targetUserIdStr) {
      throw new Error("You cannot add yourself as a collaborator");
    }

    if (toObjectIdString(project.owner) === targetUserIdStr) {
      throw new Error("Project owner cannot be added as a collaborator");
    }

    const alreadyAdded = (project.collaborators || []).some(
      (entry) => toObjectIdString(entry.user) === targetUserIdStr,
    );

    if (alreadyAdded) {
      throw new Error("User is already a collaborator on this project");
    }

    const targetUser = await User.findOne({
      _id: targetUserId,
      isVerified: true,
    }).select(COLLABORATOR_USER_FIELDS);

    if (!targetUser) {
      throw new Error("User not found. Only verified registered users can be added.");
    }

    project.collaborators.push({
      user: targetUser._id,
      role: "collaborator",
      addedBy: ownerId,
      addedAt: new Date(),
    });

    await project.save();

    try {
      await NotificationHelpers.projectCollaboratorAdded(targetUserId, {
        projectName: project.name,
        projectId: project._id,
        collaboratorName: formatUserDisplayName(targetUser),
        collaboratorEmail: targetUser.email,
        role: "collaborator",
        invited: true,
      });
    } catch (notifyError) {
      logger.warn("Collaborator added but notification failed", {
        projectId,
        targetUserId,
        error: notifyError.message,
      });
    }

    const updated = await this._findAccessibleProject(projectId, ownerId, {
      lean: true,
    });

    return {
      collaborator: transformCollaboratorEntry(
        updated.collaborators.find(
          (entry) => toObjectIdString(entry.user) === targetUserIdStr,
        ),
      ),
      project: this.transformProject(updated, { viewerUserId: ownerId }),
    };
  }

  async removeCollaborator(projectId, ownerId, targetUserId) {
    const project = await this._findOwnedProject(projectId, ownerId);

    if (!project) {
      throw new Error("Project not found or access denied");
    }

    const targetUserIdStr = toObjectIdString(targetUserId);
    const initialLength = project.collaborators.length;

    project.collaborators = project.collaborators.filter(
      (entry) => toObjectIdString(entry.user) !== targetUserIdStr,
    );

    if (project.collaborators.length === initialLength) {
      throw new Error("Collaborator not found on this project");
    }

    await project.save();

    const updated = await this._findAccessibleProject(projectId, ownerId, {
      lean: true,
    });

    return {
      success: true,
      project: this.transformProject(updated, { viewerUserId: ownerId }),
    };
  }

  transformProject(project, additionalData = {}) {
    const totalDeployments =
      additionalData.deploymentCount ??
      project.statistics?.totalDeployments ??
      0;
    const successfulDeployments =
      additionalData.successfulDeployments ??
      project.statistics?.successfulDeployments ??
      0;

    const viewerUserId = additionalData.viewerUserId;
    const membershipRole = viewerUserId
      ? getMembershipRole(project, viewerUserId)
      : null;

    const collaborators = (project.collaborators || []).map(
      transformCollaboratorEntry,
    );

    return {
      id: project._id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      owner: project.owner?._id
        ? toPublicUser(project.owner)
        : project.owner,
      collaborators,
      membershipRole,
      isOwner: membershipRole === "owner",
      isCollaborator: membershipRole === "collaborator",
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
      stack: project.stack,
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
      statistics: {
        ...(project.statistics || {}),
        totalDeployments,
        successfulDeployments,
        uptime: project.statistics?.uptime ?? 100,
      },
      deploymentCount: totalDeployments,
      successfulDeployments,
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
    const deployedBy = deploymentDoc.deployedBy;
    return {
      id: deploymentDoc._id,
      deploymentId: deploymentDoc.deploymentId,
      project: deploymentDoc.project,
      deployedBy: deployedBy?._id ? toPublicUser(deployedBy) : deployedBy,
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
