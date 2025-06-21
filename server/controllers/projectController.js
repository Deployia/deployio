const projectService = require("../services/projectService");
const Project = require("../models/Project");
const Deployment = require("../models/Deployment");
const logger = require("../config/logger");
const { validationResult } = require("express-validator");

/**
 * @desc Get all projects for the authenticated user
 * @route GET /api/v1/projects
 * @access Private
 */
const getProjects = async (req, res) => {
  try {
    const { page, limit, search, status, framework, sort, order } = req.query;
    const userId = req.user._id;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sort: sort || "updatedAt",
      order: order || "desc",
      status,
      search,
      framework,
    };

    const result = await projectService.getUserProjects(userId, options);

    res.status(200).json({
      success: true,
      data: {
        projects: result.projects,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    logger.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching projects",
      error: error.message,
    });
  }
};

/**
 * @desc Get a single project by ID
 * @route GET /api/v1/projects/:id
 * @access Private
 */
const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const project = await projectService.getProjectById(id, userId);

    // Get recent deployments for this project
    const deploymentsResult = await projectService.getProjectDeployments(
      id,
      userId,
      {
        page: 1,
        limit: 5,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        project,
        recentDeployments: deploymentsResult.deployments,
      },
    });
  } catch (error) {
    logger.error("Error fetching project:", error);

    if (
      error.message === "Project not found" ||
      error.message.includes("Access denied")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching project",
      error: error.message,
    });
  }
};

/**
 * @desc Create a new project
 * @route POST /api/v1/projects
 * @access Private
 */
const createProject = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const userId = req.user._id;
    const projectData = req.body;

    const project = await projectService.createProject(userId, projectData);

    logger.info(`Project created: ${project.name} by ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    logger.error("Error creating project:", error);

    if (error.message.includes("already exists")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating project",
      error: error.message,
    });
  }
};

/**
 * @desc Update a project
 * @route PUT /api/v1/projects/:id
 * @access Private
 */
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const updateData = req.body;
    const updatedProject = await projectService.updateProject(
      id,
      userId,
      updateData
    );

    logger.info(
      `Project updated: ${updatedProject.name} by ${req.user.username}`
    );

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
    });
  } catch (error) {
    logger.error("Error updating project:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("Access denied")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating project",
      error: error.message,
    });
  }
};

/**
 * @desc Delete a project
 * @route DELETE /api/v1/projects/:id
 * @access Private
 */
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await projectService.deleteProject(id, userId);

    logger.info(`Project deleted by ${req.user.username}`);

    res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    logger.error("Error deleting project:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("Access denied")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error deleting project",
      error: error.message,
    });
  }
};

/**
 * @desc Add a collaborator to a project
 * @route POST /api/v1/projects/:id/collaborators
 * @access Private
 */
const addCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role = "developer" } = req.body;
    const userId = req.user._id;

    const updatedProject = await projectService.addCollaborator(
      id,
      userId,
      email,
      role
    );

    logger.info(
      `Collaborator added: ${email} to project ${updatedProject.name}`
    );

    res.status(200).json({
      success: true,
      message: "Collaborator added successfully",
      data: updatedProject,
    });
  } catch (error) {
    logger.error("Error adding collaborator:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("Access denied") ||
      error.message.includes("already")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error adding collaborator",
      error: error.message,
    });
  }
};

/**
 * @desc Remove a collaborator from a project
 * @route DELETE /api/v1/projects/:id/collaborators/:collaboratorId
 * @access Private
 */
const removeCollaborator = async (req, res) => {
  try {
    const { id, collaboratorId } = req.params;
    const userId = req.user._id;

    const updatedProject = await projectService.removeCollaborator(
      id,
      userId,
      collaboratorId
    );

    logger.info(`Collaborator removed from project ${updatedProject.name}`);

    res.status(200).json({
      success: true,
      message: "Collaborator removed successfully",
      data: updatedProject,
    });
  } catch (error) {
    logger.error("Error removing collaborator:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("Access denied")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error removing collaborator",
      error: error.message,
    });
  }
};

/**
 * @desc Get project analytics
 * @route GET /api/v1/projects/:id/analytics
 * @access Private
 */
const getProjectAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeframe = 30 } = req.query;
    const userId = req.user._id;

    // Check project access
    const project = await Project.findOne({
      _id: id,
      $or: [{ owner: userId }, { "collaborators.user": userId }],
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied",
      });
    }

    // Get deployment statistics
    const deploymentStats = await Deployment.getDeploymentStats(id, timeframe);

    // Get recent deployment history
    const recentDeployments = await Deployment.findByProject(id, { limit: 10 });

    // Calculate analytics
    const analytics = {
      project: {
        id: project._id,
        name: project.name,
        totalDeployments: project.analytics.totalDeployments,
        successfulDeployments: project.analytics.successfulDeployments,
        failedDeployments: project.analytics.failedDeployments,
        successRate: project.successRate,
        averageBuildTime: project.analytics.averageBuildTime,
        lastActivity: project.analytics.lastActivity,
      },
      deploymentStats,
      recentDeployments,
      timeframe: parseInt(timeframe),
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error("Error fetching project analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project analytics",
      error: error.message,
    });
  }
};

/**
 * @desc Archive/Unarchive a project
 * @route PATCH /api/v1/projects/:id/archive
 * @access Private
 */
const toggleArchiveProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { archive = true } = req.body;
    const userId = req.user._id;

    const updatedProject = await projectService.toggleArchiveProject(
      id,
      userId,
      archive
    );

    logger.info(
      `Project ${archive ? "archived" : "unarchived"}: ${updatedProject.name}`
    );

    res.status(200).json({
      success: true,
      message: `Project ${archive ? "archived" : "unarchived"} successfully`,
      data: updatedProject,
    });
  } catch (error) {
    logger.error("Error toggling project archive:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("Access denied")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating project archive status",
      error: error.message,
    });
  }
};

/**
 * @desc Get project deployments
 * @route GET /api/v1/projects/:id/deployments
 * @access Private
 */
const getProjectDeployments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, limit, status } = req.query;
    const userId = req.user._id;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status,
    };

    const result = await projectService.getProjectDeployments(
      id,
      userId,
      options
    );

    res.status(200).json({
      success: true,
      data: {
        deployments: result.deployments,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    logger.error("Error fetching project deployments:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("Access denied")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching project deployments",
      error: error.message,
    });
  }
};

/**
 * @desc Update project deployment status
 * @route PATCH /api/v1/projects/:id/deployment
 * @access Private
 */
const updateProjectDeploymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, url, domain } = req.body;
    const userId = req.user._id;

    const deploymentData = { url, domain };
    const updatedProject = await projectService.updateDeploymentStatus(
      id,
      userId,
      status,
      deploymentData
    );

    logger.info(
      `Project deployment status updated: ${updatedProject.name} - ${status}`
    );

    res.status(200).json({
      success: true,
      message: "Deployment status updated successfully",
      data: updatedProject,
    });
  } catch (error) {
    logger.error("Error updating deployment status:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("Access denied")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating deployment status",
      error: error.message,
    });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addCollaborator,
  removeCollaborator,
  getProjectAnalytics,
  toggleArchiveProject,
  getProjectDeployments,
  updateProjectDeploymentStatus,
};
