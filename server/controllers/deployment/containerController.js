const { deployment } = require("@services");
const logger = require("@config/logger");

/**
 * @desc Get container status
 * @route GET /api/v1/containers/:containerId/status
 * @access Private
 */
const getContainerStatus = async (req, res) => {
  try {
    const { containerId } = req.params;

    const status = await deployment.getContainerStatus(containerId);

    res.status(200).json({
      success: true,
      message: "Container status retrieved successfully",
      data: status,
    });
  } catch (error) {
    logger.error("Error getting container status:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving container status",
      error: error.message,
    });
  }
};

/**
 * @desc Get container logs
 * @route GET /api/v1/containers/:containerId/logs
 * @access Private
 */
const getContainerLogs = async (req, res) => {
  try {
    const { containerId } = req.params;
    const { lines = 100, follow = false, timestamps = false } = req.query;

    const logs = await deployment.getContainerLogs(containerId, {
      lines: parseInt(lines),
      follow: follow === "true",
      timestamps: timestamps === "true",
    });

    res.status(200).json({
      success: true,
      message: "Container logs retrieved successfully",
      data: logs,
    });
  } catch (error) {
    logger.error("Error getting container logs:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving container logs",
      error: error.message,
    });
  }
};

/**
 * @desc Restart container
 * @route POST /api/v1/containers/:containerId/restart
 * @access Private
 */
const restartContainer = async (req, res) => {
  try {
    const { containerId } = req.params;
    const userId = req.user._id;

    const result = await deployment.restartContainer(containerId);

    logger.info(`Container ${containerId} restarted by user ${userId}`);

    res.status(200).json({
      success: true,
      message: "Container restarted successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error restarting container:", error);
    res.status(500).json({
      success: false,
      message: "Error restarting container",
      error: error.message,
    });
  }
};

/**
 * @desc Update container configuration
 * @route PUT /api/v1/containers/:containerId
 * @access Private
 */
const updateContainer = async (req, res) => {
  try {
    const { containerId } = req.params;
    const config = req.body;

    const result = await deployment.updateContainer(containerId, config);

    logger.info(`Container ${containerId} updated successfully`);

    res.status(200).json({
      success: true,
      message: "Container updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error updating container:", error);
    res.status(500).json({
      success: false,
      message: "Error updating container",
      error: error.message,
    });
  }
};

/**
 * @desc Stop container
 * @route POST /api/v1/containers/:containerId/stop
 * @access Private
 */
const stopContainer = async (req, res) => {
  try {
    const { containerId } = req.params;
    const userId = req.user._id;

    const result = await deployment.stopContainer(containerId);

    logger.info(`Container ${containerId} stopped by user ${userId}`);

    res.status(200).json({
      success: true,
      message: "Container stopped successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error stopping container:", error);
    res.status(500).json({
      success: false,
      message: "Error stopping container",
      error: error.message,
    });
  }
};

/**
 * @desc Start container
 * @route POST /api/v1/containers/:containerId/start
 * @access Private
 */
const startContainer = async (req, res) => {
  try {
    const { containerId } = req.params;
    const userId = req.user._id;

    const result = await deployment.startContainer(containerId);

    logger.info(`Container ${containerId} started by user ${userId}`);

    res.status(200).json({
      success: true,
      message: "Container started successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error starting container:", error);
    res.status(500).json({
      success: false,
      message: "Error starting container",
      error: error.message,
    });
  }
};

/**
 * @desc Get container metrics
 * @route GET /api/v1/containers/:containerId/metrics
 * @access Private
 */
const getContainerMetrics = async (req, res) => {
  try {
    const { containerId } = req.params;
    const { timeframe = "1h" } = req.query;

    const metrics = await deployment.getContainerMetrics(containerId, {
      timeframe,
    });

    res.status(200).json({
      success: true,
      message: "Container metrics retrieved successfully",
      data: metrics,
    });
  } catch (error) {
    logger.error("Error getting container metrics:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving container metrics",
      error: error.message,
    });
  }
};

/**
 * @desc Get all containers for a user
 * @route GET /api/v1/containers
 * @access Private
 */
const getUserContainers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, projectId } = req.query;

    const containers = await deployment.getUserContainers(userId, {
      status,
      projectId,
    });

    res.status(200).json({
      success: true,
      message: "Containers retrieved successfully",
      data: containers,
    });
  } catch (error) {
    logger.error("Error getting user containers:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving containers",
      error: error.message,
    });
  }
};

module.exports = {
  getContainerStatus,
  getContainerLogs,
  restartContainer,
  updateContainer,
  stopContainer,
  startContainer,
  getContainerMetrics,
  getUserContainers,
};
