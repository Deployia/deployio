const { project } = require("@services");
const logger = require("@config/logger");

/**
 * @desc Get project settings
 * @route GET /api/v1/projects/:projectId/settings
 * @access Private
 */
const getProjectSettings = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const settings = await project.project.getProjectSettings(
      projectId,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Project settings retrieved successfully",
      data: settings,
    });
  } catch (error) {
    logger.error("Error getting project settings:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving project settings",
      error: error.message,
    });
  }
};

/**
 * @desc Update project settings
 * @route PUT /api/v1/projects/:projectId/settings
 * @access Private
 */
const updateProjectSettings = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const settings = req.body;

    const result = await project.project.updateProjectSettings(
      projectId,
      settings,
      userId
    );

    logger.info(`Project settings updated for project ${projectId}`);

    res.status(200).json({
      success: true,
      message: "Project settings updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error updating project settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating project settings",
      error: error.message,
    });
  }
};

/**
 * @desc Get project environment variables
 * @route GET /api/v1/projects/:projectId/settings/env
 * @access Private
 */
const getEnvironmentVariables = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const envVars = await project.project.getEnvironmentVariables(
      projectId,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Environment variables retrieved successfully",
      data: envVars,
    });
  } catch (error) {
    logger.error("Error getting environment variables:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving environment variables",
      error: error.message,
    });
  }
};

/**
 * @desc Update project environment variables
 * @route PUT /api/v1/projects/:projectId/settings/env
 * @access Private
 */
const updateEnvironmentVariables = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const { environmentVariables } = req.body;

    const result = await project.project.updateEnvironmentVariables(
      projectId,
      environmentVariables,
      userId
    );

    logger.info(`Environment variables updated for project ${projectId}`);

    res.status(200).json({
      success: true,
      message: "Environment variables updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error updating environment variables:", error);
    res.status(500).json({
      success: false,
      message: "Error updating environment variables",
      error: error.message,
    });
  }
};

/**
 * @desc Get project build settings
 * @route GET /api/v1/projects/:projectId/settings/build
 * @access Private
 */
const getBuildSettings = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const buildSettings = await project.project.getBuildSettings(
      projectId,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Build settings retrieved successfully",
      data: buildSettings,
    });
  } catch (error) {
    logger.error("Error getting build settings:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving build settings",
      error: error.message,
    });
  }
};

/**
 * @desc Update project build settings
 * @route PUT /api/v1/projects/:projectId/settings/build
 * @access Private
 */
const updateBuildSettings = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const buildSettings = req.body;

    const result = await project.project.updateBuildSettings(
      projectId,
      buildSettings,
      userId
    );

    logger.info(`Build settings updated for project ${projectId}`);

    res.status(200).json({
      success: true,
      message: "Build settings updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error updating build settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating build settings",
      error: error.message,
    });
  }
};

module.exports = {
  getProjectSettings,
  updateProjectSettings,
  getEnvironmentVariables,
  updateEnvironmentVariables,
  getBuildSettings,
  updateBuildSettings,
};
