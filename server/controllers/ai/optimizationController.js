const { project, ai } = require("@services");
const logger = require("@config/logger");

/**
 * @desc Get optimization recommendations for a project
 * @route GET /api/v1/ai/optimization/:projectId
 * @access Private
 */
const getOptimizations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Get project details
    const project = await project.project.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const result = await ai.analyzeOptimization(
      projectId,
      project.deploymentConfig || {},
      project.performanceMetrics || {},
      req.user
    );

    logger.info(`Optimization analysis completed for project ${projectId}`, {
      suggestions_count: result.suggestions?.length || 0,
      overall_score: result.overall_score,
    });

    res.status(200).json({
      success: true,
      message: "Optimization recommendations retrieved successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error getting optimization recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving optimization recommendations",
      error: error.message,
    });
  }
};

/**
 * @desc Generate build optimizations for a project
 * @route POST /api/v1/ai/optimization/build/:projectId
 * @access Private
 */
const generateBuildOptimization = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const optimizationConfig = req.body;

    // Get project details
    const project = await project.project.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!project.technologyStack) {
      return res.status(400).json({
        success: false,
        message:
          "Project must be analyzed first to generate build optimizations",
      });
    }

    const result = await ai.generateBuildOptimization(
      projectId,
      project.technologyStack,
      optimizationConfig,
      req.user
    );

    // Update project with build optimization
    await project.project.updateProject(projectId, {
      buildOptimization: result,
      lastBuildOptimized: new Date(),
    });

    logger.info(`Build optimization generated for project ${projectId}`);

    res.status(200).json({
      success: true,
      message: "Build optimization generated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error generating build optimization:", error);
    res.status(500).json({
      success: false,
      message: "Error generating build optimization",
      error: error.message,
    });
  }
};

/**
 * @desc Mark optimization as implemented
 * @route PUT /api/v1/ai/optimization/:projectId/implement
 * @access Private
 */
const markOptimizationImplemented = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { optimizationId, implementationNotes } = req.body;
    const userId = req.user._id;

    if (!optimizationId) {
      return res.status(400).json({
        success: false,
        message: "Optimization ID is required",
      });
    }

    // Get project details
    const project = await project.project.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Update the optimization status
    const implementedOptimizations = project.implementedOptimizations || [];
    implementedOptimizations.push({
      optimizationId,
      implementedAt: new Date(),
      implementedBy: userId,
      notes: implementationNotes,
    });

    await project.project.updateProject(projectId, {
      implementedOptimizations,
      lastOptimizationImplemented: new Date(),
    });

    logger.info(
      `Optimization ${optimizationId} marked as implemented for project ${projectId}`
    );

    res.status(200).json({
      success: true,
      message: "Optimization marked as implemented successfully",
      data: {
        optimizationId,
        implementedAt: new Date(),
        implementedBy: userId,
      },
    });
  } catch (error) {
    logger.error("Error marking optimization as implemented:", error);
    res.status(500).json({
      success: false,
      message: "Error marking optimization as implemented",
      error: error.message,
    });
  }
};

/**
 * @desc Get performance optimization recommendations
 * @route POST /api/v1/ai/optimization/performance/:projectId
 * @access Private
 */
const optimizePerformance = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const { currentMetrics } = req.body;

    // Get project details
    const project = await project.project.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const result = await ai.analyzeOptimization(
      projectId,
      project.deploymentConfig || {},
      currentMetrics || project.performanceMetrics || {},
      req.user
    );

    // Filter for performance-specific recommendations
    const performanceOptimizations = {
      ...result,
      suggestions:
        result.suggestions?.filter(
          (suggestion) => suggestion.type === "performance"
        ) || [],
    };

    logger.info(
      `Performance optimization analysis completed for project ${projectId}`
    );

    res.status(200).json({
      success: true,
      message:
        "Performance optimization recommendations generated successfully",
      data: performanceOptimizations,
    });
  } catch (error) {
    logger.error("Error generating performance optimizations:", error);
    res.status(500).json({
      success: false,
      message: "Error generating performance optimizations",
      error: error.message,
    });
  }
};

/**
 * @desc Get security optimization recommendations
 * @route POST /api/v1/ai/optimization/security/:projectId
 * @access Private
 */
const optimizeSecurity = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const { securityConfig } = req.body;

    // Get project details
    const project = await project.project.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const result = await ai.analyzeOptimization(
      projectId,
      securityConfig || project.securityConfig || {},
      {},
      req.user
    );

    // Filter for security-specific recommendations
    const securityOptimizations = {
      ...result,
      suggestions:
        result.suggestions?.filter(
          (suggestion) => suggestion.type === "security"
        ) || [],
    };

    logger.info(
      `Security optimization analysis completed for project ${projectId}`
    );

    res.status(200).json({
      success: true,
      message: "Security optimization recommendations generated successfully",
      data: securityOptimizations,
    });
  } catch (error) {
    logger.error("Error generating security optimizations:", error);
    res.status(500).json({
      success: false,
      message: "Error generating security optimizations",
      error: error.message,
    });
  }
};

/**
 * @desc Get cost optimization recommendations
 * @route POST /api/v1/ai/optimization/costs/:projectId
 * @access Private
 */
const optimizeCosts = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const { costConfig } = req.body;

    // Get project details
    const project = await project.project.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const result = await ai.analyzeOptimization(
      projectId,
      costConfig || project.costConfig || {},
      {},
      req.user
    );

    // Filter for cost-specific recommendations
    const costOptimizations = {
      ...result,
      suggestions:
        result.suggestions?.filter(
          (suggestion) =>
            suggestion.type === "cost" || suggestion.type === "resource"
        ) || [],
    };

    logger.info(
      `Cost optimization analysis completed for project ${projectId}`
    );

    res.status(200).json({
      success: true,
      message: "Cost optimization recommendations generated successfully",
      data: costOptimizations,
    });
  } catch (error) {
    logger.error("Error generating cost optimizations:", error);
    res.status(500).json({
      success: false,
      message: "Error generating cost optimizations",
      error: error.message,
    });
  }
};

module.exports = {
  getOptimizations,
  generateBuildOptimization,
  markOptimizationImplemented,
  optimizePerformance,
  optimizeSecurity,
  optimizeCosts,
};
