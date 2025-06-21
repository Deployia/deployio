const projectService = require("../../services/projectService");
const aiService = require("../../services/aiService");
const logger = require("../../config/logger");

/**
 * @desc Analyze project technology stack using AI
 * @route POST /api/v1/ai/analysis/stack/:projectId
 * @access Private
 */
const analyzeProjectStack = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const result = await projectService.analyzeProjectWithAI(projectId, userId);

    logger.info(`AI stack analysis completed for project ${projectId}`, {
      framework: result.analysis.technology.framework,
      language: result.analysis.technology.language,
      confidence: result.analysis.confidence_score,
    });

    res.status(200).json({
      success: true,
      message: "Project analyzed successfully",
      data: {
        project: result.project,
        analysis: result.analysis,
      },
    });
  } catch (error) {
    logger.error("Error analyzing project stack:", error);

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
      message: "Error analyzing project",
      error: error.message,
    });
  }
};

/**
 * @desc Run full AI analysis on a project
 * @route POST /api/v1/ai/analysis/full/:projectId
 * @access Private
 */
const runFullAnalysis = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Get project details
    const project = await projectService.getProjectById(projectId, userId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Run comprehensive AI analysis
    const analysisResults = await Promise.allSettled([
      aiService.analyzeProjectStack(
        projectId,
        project.repositoryUrl,
        project.branch || "main",
        req.user
      ),
      aiService.analyzeOptimization(
        projectId,
        project.deploymentConfig || {},
        project.performanceMetrics || {},
        req.user
      ),
    ]);

    const stackAnalysis =
      analysisResults[0].status === "fulfilled"
        ? analysisResults[0].value
        : { error: analysisResults[0].reason?.message };

    const optimizationAnalysis =
      analysisResults[1].status === "fulfilled"
        ? analysisResults[1].value
        : { error: analysisResults[1].reason?.message };

    // Update project with analysis results
    await projectService.updateProjectAnalysis(projectId, {
      stackAnalysis,
      optimizationAnalysis,
      lastAnalyzed: new Date(),
    });

    logger.info(`Full AI analysis completed for project ${projectId}`);

    res.status(200).json({
      success: true,
      message: "Full AI analysis completed successfully",
      data: {
        projectId,
        stackAnalysis,
        optimizationAnalysis,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error running full AI analysis:", error);
    res.status(500).json({
      success: false,
      message: "Error running full AI analysis",
      error: error.message,
    });
  }
};

/**
 * @desc Demo analyze repository (public endpoint)
 * @route POST /api/v1/ai/analysis/demo
 * @access Public
 */
const demoAnalyzeRepository = async (req, res) => {
  try {
    const { repositoryUrl, branch = "main" } = req.body;

    if (!repositoryUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    // Create a temporary user object for demo
    const demoUser = {
      _id: "demo_user",
      email: "demo@deployio.com",
      username: "demo",
    };

    const result = await aiService.analyzeProjectStack(
      "demo_project",
      repositoryUrl,
      branch,
      demoUser
    );

    logger.info("Demo repository analysis completed", {
      repositoryUrl,
      framework: result.technology?.framework,
      language: result.technology?.language,
    });

    res.status(200).json({
      success: true,
      message: "Repository analyzed successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error in demo repository analysis:", error);
    res.status(500).json({
      success: false,
      message: "Error analyzing repository",
      error: error.message,
    });
  }
};

/**
 * @desc Get supported technologies from AI service
 * @route GET /api/v1/ai/analysis/supported-technologies
 * @access Public
 */
const getSupportedTechnologies = async (req, res) => {
  try {
    const technologies = await aiService.getSupportedTechnologies();

    res.status(200).json({
      success: true,
      message: "Supported technologies retrieved successfully",
      data: technologies,
    });
  } catch (error) {
    logger.error("Error getting supported technologies:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving supported technologies",
      error: error.message,
    });
  }
};

/**
 * @desc Check AI service health
 * @route GET /api/v1/ai/analysis/health
 * @access Private (Admin)
 */
const checkServiceHealth = async (req, res) => {
  try {
    const healthStatus = await aiService.checkAiServiceHealth();

    res.status(200).json({
      success: true,
      message: "AI service health check completed",
      data: healthStatus,
    });
  } catch (error) {
    logger.error("Error checking AI service health:", error);
    res.status(500).json({
      success: false,
      message: "Error checking AI service health",
      error: error.message,
    });
  }
};

module.exports = {
  analyzeProjectStack,
  runFullAnalysis,
  demoAnalyzeRepository,
  getSupportedTechnologies,
  checkServiceHealth,
};
