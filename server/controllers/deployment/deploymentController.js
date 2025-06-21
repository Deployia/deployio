const { deployment } = require("@services");
const logger = require("@config/logger");
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

    const deployment = await deployment.deployProject(projectId, {
      userId,
      ...deploymentData,
    });

    logger.info(
      `Deployment created: ${deployment.id} for project ${projectId}`
    );

    res.status(201).json({
      success: true,
      message: "Deployment created successfully",
      data: deployment,
    });
  } catch (error) {
    logger.error("Error creating deployment:", error);

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
      message: "Error creating deployment",
      error: error.message,
    });
  }
};

/**
 * @desc Get deployment details
 * @route GET /api/v1/deployments/:deploymentId
 * @access Private
 */
const getDeployment = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const userId = req.user._id;

    const deployment = await deployment.getDeploymentStatus(deploymentId);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: "Deployment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Deployment retrieved successfully",
      data: deployment,
    });
  } catch (error) {
    logger.error("Error getting deployment:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving deployment",
      error: error.message,
    });
  }
};

/**
 * @desc Update deployment status
 * @route PUT /api/v1/deployments/:deploymentId/status
 * @access Private
 */
const updateDeploymentStatus = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { status, statusMessage } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // This would typically be called by the deployment agent
    const updatedDeployment = await deployment.updateDeploymentStatus(
      deploymentId,
      status,
      statusMessage
    );

    logger.info(`Deployment ${deploymentId} status updated to: ${status}`);

    res.status(200).json({
      success: true,
      message: "Deployment status updated successfully",
      data: updatedDeployment,
    });
  } catch (error) {
    logger.error("Error updating deployment status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating deployment status",
      error: error.message,
    });
  }
};

/**
 * @desc Stop/cancel deployment
 * @route DELETE /api/v1/deployments/:deploymentId
 * @access Private
 */
const stopDeployment = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const userId = req.user._id;

    const result = await deployment.stopDeployment(deploymentId);

    logger.info(`Deployment ${deploymentId} stopped by user ${userId}`);

    res.status(200).json({
      success: true,
      message: "Deployment stopped successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error stopping deployment:", error);
    res.status(500).json({
      success: false,
      message: "Error stopping deployment",
      error: error.message,
    });
  }
};

/**
 * @desc Get deployment logs
 * @route GET /api/v1/deployments/:deploymentId/logs
 * @access Private
 */
const getDeploymentLogs = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { lines = 100, follow = false } = req.query;

    const logs = await deployment.getDeploymentLogs(deploymentId, {
      lines: parseInt(lines),
      follow: follow === "true",
    });

    res.status(200).json({
      success: true,
      message: "Deployment logs retrieved successfully",
      data: logs,
    });
  } catch (error) {
    logger.error("Error getting deployment logs:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving deployment logs",
      error: error.message,
    });
  }
};

/**
 * @desc Get deployment statistics
 * @route GET /api/v1/deployments/stats
 * @access Private
 */
const getDeploymentStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeframe = "30d" } = req.query;

    // For now, return basic stats - this would be implemented in the deployment service
    const stats = {
      totalDeployments: 0,
      successfulDeployments: 0,
      failedDeployments: 0,
      averageDeploymentTime: 0,
      timeframe,
    };

    res.status(200).json({
      success: true,
      message: "Deployment statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    logger.error("Error getting deployment stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving deployment statistics",
      error: error.message,
    });
  }
};

/**
 * @desc Get user's deployments
 * @route GET /api/v1/deployments
 * @access Private
 */
const getUserDeployments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status, projectId } = req.query;

    const deployments = await deployment.getUserDeployments(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      projectId,
    });

    res.status(200).json({
      success: true,
      message: "Deployments retrieved successfully",
      data: deployments,
    });
  } catch (error) {
    logger.error("Error getting user deployments:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving deployments",
      error: error.message,
    });
  }
};

module.exports = {
  createDeployment,
  getDeployment,
  updateDeploymentStatus,
  stopDeployment,
  getDeploymentLogs,
  getDeploymentStats,
  getUserDeployments,
};
