const { deployment: deploymentService } = require("@services");
const { validationResult } = require("express-validator");
const logger = require("@config/logger");

class DeploymentController {
  /**
   * @desc Get all user deployments
   * @route GET /api/v1/deployments
   * @access Private
   */
  async getAllDeployments(req, res) {
    try {
      const userId = req.user._id;
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        environment: req.query.environment,
        projectId: req.query.projectId,
        search: req.query.search,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await deploymentService.getAllDeployments(userId, options);

      res.status(200).json({
        success: true,
        message: "Deployments retrieved successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Error in getAllDeployments:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch deployments",
      });
    }
  }

  /**
   * @desc Get project deployments
   * @route GET /api/v1/projects/:projectId/deployments
   * @access Private
   */
  async getProjectDeployments(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user._id;
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        environment: req.query.environment,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await deploymentService.getProjectDeployments(
        projectId,
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

  /**
   * @desc Get deployment by ID
   * @route GET /api/v1/deployments/:id
   * @access Private
   */
  async getDeploymentById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const deployment = await deploymentService.getDeploymentById(id, userId);

      res.status(200).json({
        success: true,
        message: "Deployment retrieved successfully",
        data: { deployment },
      });
    } catch (error) {
      logger.error("Error in getDeploymentById:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to fetch deployment",
      });
    }
  }

  /**
   * @desc Create new deployment
   * @route POST /api/v1/projects/:projectId/deployments
   * @access Private
   */
  async createDeployment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { projectId } = req.params;
      const userId = req.user._id;
      const deploymentData = req.body;

      const deployment = await deploymentService.createDeployment(
        projectId,
        deploymentData,
        userId
      );

      res.status(201).json({
        success: true,
        message: "Deployment created successfully",
        data: { deployment },
      });
    } catch (error) {
      logger.error("Error in createDeployment:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to create deployment",
      });
    }
  }

  /**
   * @desc Update deployment status
   * @route PATCH /api/v1/deployments/:id/status
   * @access Private
   */
  async updateDeploymentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, ...additionalData } = req.body;
      const userId = req.user._id;

      const deployment = await deploymentService.updateDeploymentStatus(
        id,
        status,
        userId,
        additionalData
      );

      res.status(200).json({
        success: true,
        message: "Deployment status updated successfully",
        data: { deployment },
      });
    } catch (error) {
      logger.error("Error in updateDeploymentStatus:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to update deployment status",
      });
    }
  }

  /**
   * @desc Restart deployment
   * @route POST /api/v1/deployments/:id/restart
   * @access Private
   */
  async restartDeployment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const deployment = await deploymentService.restartDeployment(id, userId);

      res.status(200).json({
        success: true,
        message: "Deployment restart initiated",
        data: { deployment },
      });
    } catch (error) {
      logger.error("Error in restartDeployment:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to restart deployment",
      });
    }
  }

  /**
   * @desc Cancel deployment
   * @route POST /api/v1/deployments/:id/cancel
   * @access Private
   */
  async cancelDeployment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const deployment = await deploymentService.cancelDeployment(id, userId);

      res.status(200).json({
        success: true,
        message: "Deployment cancelled successfully",
        data: { deployment },
      });
    } catch (error) {
      logger.error("Error in cancelDeployment:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to cancel deployment",
      });
    }
  }

  /**
   * @desc Delete deployment
   * @route DELETE /api/v1/deployments/:id
   * @access Private
   */
  async deleteDeployment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const result = await deploymentService.deleteDeployment(id, userId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: null,
      });
    } catch (error) {
      logger.error("Error in deleteDeployment:", error);
      res.status(error.message.includes("not found") ? 404 : 400).json({
        success: false,
        message: error.message || "Failed to delete deployment",
      });
    }
  }

  /**
   * @desc Get deployment logs
   * @route GET /api/v1/deployments/:id/logs
   * @access Private
   */
  async getDeploymentLogs(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      const options = {
        level: req.query.level,
        source: req.query.source,
        limit: req.query.limit,
        offset: req.query.offset,
      };

      const result = await deploymentService.getDeploymentLogs(
        id,
        userId,
        options
      );

      res.status(200).json({
        success: true,
        message: "Deployment logs retrieved successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Error in getDeploymentLogs:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to fetch deployment logs",
      });
    }
  }
}

module.exports = new DeploymentController();