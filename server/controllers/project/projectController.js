const { project: projectService } = require("@services");
const { validationResult } = require("express-validator");
const logger = require("@config/logger");

class ProjectController {
  /**
   * @desc Get user projects
   * @route GET /api/v1/projects
   * @access Private
   */
  async getProjects(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const userId = req.user._id;
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        technology: req.query.technology,
        search: req.query.search,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await projectService.getUserProjects(userId, options);

      res.status(200).json({
        success: true,
        message: "Projects retrieved successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Error in getProjects:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch projects",
      });
    }
  }

  /**
   * @desc Get project by ID
   * @route GET /api/v1/projects/:id
   * @access Private
   */
  async getProjectById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const result = await projectService.getProjectById(id, userId);

      res.status(200).json({
        success: true,
        message: "Project retrieved successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Error in getProjectById:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to fetch project",
      });
    }
  }

  /**
   * @desc Update project
   * @route PUT /api/v1/projects/:id
   * @access Private
   */
  async updateProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const userId = req.user._id;
      const updateData = req.body;

      const project = await projectService.updateProject(
        id,
        userId,
        updateData
      );

      res.status(200).json({
        success: true,
        message: "Project updated successfully",
        data: { project },
      });
    } catch (error) {
      logger.error("Error in updateProject:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to update project",
      });
    }
  }

  /**
   * @desc Delete project
   * @route DELETE /api/v1/projects/:id
   * @access Private
   */
  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const result = await projectService.deleteProject(id, userId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: null,
      });
    } catch (error) {
      logger.error("Error in deleteProject:", error);
      res.status(error.message.includes("not found") ? 404 : 400).json({
        success: false,
        message: error.message || "Failed to delete project",
      });
    }
  }

  /**
   * @desc Get project deployments
   * @route GET /api/v1/projects/:id/deployments
   * @access Private
   */
  async getProjectDeployments(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        environment: req.query.environment,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await projectService.getProjectDeployments(
        id,
        userId,
        options
      );

      res.status(200).json({
        success: true,
        message: "Project deployments retrieved successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Error in getProjectDeployments:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to fetch project deployments",
      });
    }
  }
}

module.exports = new ProjectController();
