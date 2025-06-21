const { project } = require("@services");
const logger = require("@config/logger");

/**
 * @desc Connect GitHub repository
 * @route POST /api/v1/repositories/connect
 * @access Private
 */
const connectRepository = async (req, res) => {
  try {
    const { repositoryUrl, branch = "main", projectId } = req.body;
    const userId = req.user._id;

    if (!repositoryUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    const result = await project.repository.connectRepository({
      userId,
      projectId,
      repositoryUrl,
      branch,
    });

    logger.info(
      `Repository connected: ${repositoryUrl} for project ${projectId}`
    );

    res.status(200).json({
      success: true,
      message: "Repository connected successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error connecting repository:", error);
    res.status(500).json({
      success: false,
      message: "Error connecting repository",
      error: error.message,
    });
  }
};

/**
 * @desc Get repository information
 * @route GET /api/v1/repositories/:projectId
 * @access Private
 */
const getRepositoryInfo = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const repoInfo = await project.repository.getRepositoryInfo(
      projectId,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Repository information retrieved successfully",
      data: repoInfo,
    });
  } catch (error) {
    logger.error("Error getting repository info:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving repository information",
      error: error.message,
    });
  }
};

/**
 * @desc Sync repository (pull latest changes)
 * @route POST /api/v1/repositories/:projectId/sync
 * @access Private
 */
const syncRepository = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const result = await project.repository.syncRepository(projectId, userId);

    logger.info(`Repository synced for project ${projectId}`);

    res.status(200).json({
      success: true,
      message: "Repository synced successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error syncing repository:", error);
    res.status(500).json({
      success: false,
      message: "Error syncing repository",
      error: error.message,
    });
  }
};

/**
 * @desc Get repository branches
 * @route GET /api/v1/repositories/:projectId/branches
 * @access Private
 */
const getRepositoryBranches = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const branches = await project.repository.getRepositoryBranches(
      projectId,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Repository branches retrieved successfully",
      data: branches,
    });
  } catch (error) {
    logger.error("Error getting repository branches:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving repository branches",
      error: error.message,
    });
  }
};

/**
 * @desc Update repository settings
 * @route PUT /api/v1/repositories/:projectId/settings
 * @access Private
 */
const updateRepositorySettings = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const settings = req.body;

    const result = await project.repository.updateRepositorySettings(
      projectId,
      settings,
      userId
    );

    logger.info(`Repository settings updated for project ${projectId}`);

    res.status(200).json({
      success: true,
      message: "Repository settings updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error updating repository settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating repository settings",
      error: error.message,
    });
  }
};

module.exports = {
  connectRepository,
  getRepositoryInfo,
  syncRepository,
  getRepositoryBranches,
  updateRepositorySettings,
};
