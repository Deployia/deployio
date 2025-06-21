const deploymentService = require("../services/deploymentService");
const logger = require("../config/logger");
const { validationResult } = require("express-validator");

/**
 * @desc Create a new deployment
 * @route POST /api/v1/deployments
 * @access Private
 */
const createDeployment = async (req, res) => {
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

    const { projectId, ...deploymentData } = req.body;
    const userId = req.user._id;

    const deployment = await deploymentService.createDeployment(projectId, userId, deploymentData);

    logger.info(`Deployment created: ${deployment.deployment.id} for project ${deployment.project.name}`);

    res.status(201).json({
      success: true,
      message: "Deployment created successfully",
      data: deployment,
    });
  } catch (error) {
    logger.error("Error creating deployment:", error);
    
    if (error.message.includes("not found") || error.message.includes("Access denied")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating deployment",
      error: error.message,
    });
  }
};

/**
 * @desc Get deployment by ID
 * @route GET /api/v1/deployments/:id
 * @access Private
 */
const getDeployment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const deployment = await deploymentService.getDeploymentById(id, userId);

    res.status(200).json({
      success: true,
      data: deployment,
    });
  } catch (error) {
    logger.error("Error fetching deployment:", error);
    
    if (error.message === "Deployment not found" || error.message.includes("Access denied")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching deployment",
      error: error.message,
    });
  }
};

/**
 * @desc Update deployment status
 * @route PATCH /api/v1/deployments/:id/status
 * @access Private
 */
const updateDeploymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, url, domain, logs, buildOutput } = req.body;
    const userId = req.user._id;

    const updateData = { url, domain, logs, buildOutput };
    const deployment = await deploymentService.updateDeploymentStatus(id, userId, status, updateData);

    logger.info(`Deployment status updated: ${id} - ${status}`);

    res.status(200).json({
      success: true,
      message: "Deployment status updated successfully",
      data: deployment,
    });
  } catch (error) {
    logger.error("Error updating deployment status:", error);
    
    if (error.message.includes("not found") || error.message.includes("Access denied")) {
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

/**
 * @desc Get deployment logs
 * @route GET /api/v1/deployments/:id/logs
 * @access Private
 */
const getDeploymentLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const logs = await deploymentService.getDeploymentLogs(id, userId);

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    logger.error("Error fetching deployment logs:", error);
    
    if (error.message.includes("not found") || error.message.includes("Access denied")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching deployment logs",
      error: error.message,
    });
  }
};

/**
 * @desc Cancel deployment
 * @route PATCH /api/v1/deployments/:id/cancel
 * @access Private
 */
const cancelDeployment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const deployment = await deploymentService.cancelDeployment(id, userId);

    logger.info(`Deployment cancelled: ${id}`);

    res.status(200).json({
      success: true,
      message: "Deployment cancelled successfully",
      data: deployment,
    });
  } catch (error) {
    logger.error("Error cancelling deployment:", error);
    
    if (error.message.includes("not found") || error.message.includes("Access denied") || 
        error.message.includes("Cannot cancel")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error cancelling deployment",
      error: error.message,
    });
  }
};

/**
 * @desc Get deployment statistics for a project
 * @route GET /api/v1/projects/:projectId/deployments/stats
 * @access Private
 */
const getDeploymentStats = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { timeframe = 30 } = req.query;
    const userId = req.user._id;

    const stats = await deploymentService.getDeploymentStats(projectId, userId, parseInt(timeframe));

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error fetching deployment statistics:", error);
    
    if (error.message.includes("not found") || error.message.includes("Access denied")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching deployment statistics",
      error: error.message,
    });
  }
};

module.exports = {
  createDeployment,
  getDeployment,
  updateDeploymentStatus,
  getDeploymentLogs,
  cancelDeployment,
  getDeploymentStats,
};
