const projectService = require("../../services/project");
const logger = require("../../config/logger");
const { validationResult } = require("express-validator");

/**
 * @desc Create a new project
 * @route POST /api/v1/projects
 * @access Private
 */
const createProject = async (req, res) => {
  try {
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

    logger.info(`Project created: ${project.name} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    logger.error("Error creating project:", error);
    res.status(500).json({
      success: false,
      message: "Error creating project",
      error: error.message,
    });
  }
};

/**
 * @desc Get user's projects
 * @route GET /api/v1/projects
 * @access Private
 */
const getUserProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status, search } = req.query;

    const projects = await projectService.getUserProjects(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      search,
    });

    res.status(200).json({
      success: true,
      message: "Projects retrieved successfully",
      data: projects,
    });
  } catch (error) {
    logger.error("Error getting user projects:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving projects",
      error: error.message,
    });
  }
};

/**
 * @desc Get project by ID
 * @route GET /api/v1/projects/:projectId
 * @access Private
 */
const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await projectService.getProjectById(projectId, userId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project retrieved successfully",
      data: project,
    });
  } catch (error) {
    logger.error("Error getting project:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving project",
      error: error.message,
    });
  }
};

/**
 * @desc Update project
 * @route PUT /api/v1/projects/:projectId
 * @access Private
 */
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    const project = await projectService.updateProject(
      projectId,
      updateData,
      userId
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    logger.info(`Project updated: ${projectId} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    logger.error("Error updating project:", error);
    res.status(500).json({
      success: false,
      message: "Error updating project",
      error: error.message,
    });
  }
};

/**
 * @desc Delete project
 * @route DELETE /api/v1/projects/:projectId
 * @access Private
 */
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const result = await projectService.deleteProject(projectId, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    logger.info(`Project deleted: ${projectId} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting project:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting project",
      error: error.message,
    });
  }
};

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
