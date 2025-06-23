const project = require("@services/project");
const ai = require("@services/ai");
const logger = require("@config/logger");

/**
 * @desc Complete repository analysis using AI
 * @route POST /api/v1/ai/analysis/repository
 * @access Private
 */
const analyzeRepository = async (req, res) => {
  try {
    const {
      repositoryUrl,
      branch = "main",
      analysisTypes,
      options = {},
    } = req.body;

    if (!repositoryUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    const analysisOptions = {
      branch,
      analysisTypes,
      user: req.user,
      ...options,
    };

    const result = await ai.analyzeRepository(repositoryUrl, analysisOptions);

    logger.info(`Repository analysis completed for ${repositoryUrl}`, {
      analysisApproach: result.analysis_approach,
      confidence: result.confidence_score,
      llmUsed: result.llm_used,
    });

    res.status(200).json({
      success: true,
      message: "Repository analysis completed successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error analyzing repository:", error);
    res.status(500).json({
      success: false,
      message: "Error analyzing repository",
      error: error.message,
    });
  }
};

/**
 * @desc Detect technology stack for repository
 * @route POST /api/v1/ai/analysis/stack
 * @access Private
 */
const detectTechnologyStack = async (req, res) => {
  try {
    const { repositoryUrl, branch = "main", options = {} } = req.body;

    if (!repositoryUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    const analysisOptions = {
      branch,
      user: req.user,
      ...options,
    };

    const result = await ai.detectTechnologyStack(
      repositoryUrl,
      analysisOptions
    );

    logger.info(`Technology stack detection completed for ${repositoryUrl}`, {
      primaryLanguage: result.technology_stack?.primary_language,
      framework: result.technology_stack?.framework,
      confidence: result.confidence_score,
    });

    res.status(200).json({
      success: true,
      message: "Technology stack detection completed successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error detecting technology stack:", error);
    res.status(500).json({
      success: false,
      message: "Error detecting technology stack",
      error: error.message,
    });
  }
};

/**
 * @desc Analyze code quality for repository
 * @route POST /api/v1/ai/analysis/code-quality
 * @access Private
 */
const analyzeCodeQuality = async (req, res) => {
  try {
    const { repositoryUrl, branch = "main", options = {} } = req.body;

    if (!repositoryUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    const analysisOptions = {
      branch,
      user: req.user,
      ...options,
    };

    const result = await ai.analyzeCodeQuality(repositoryUrl, analysisOptions);

    logger.info(`Code quality analysis completed for ${repositoryUrl}`, {
      overallScore: result.quality_metrics?.overall_score,
      confidence: result.confidence_score,
    });

    res.status(200).json({
      success: true,
      message: "Code quality analysis completed successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error analyzing code quality:", error);
    res.status(500).json({
      success: false,
      message: "Error analyzing code quality",
      error: error.message,
    });
  }
};

/**
 * @desc Analyze dependencies for repository
 * @route POST /api/v1/ai/analysis/dependencies
 * @access Private
 */
const analyzeDependencies = async (req, res) => {
  try {
    const { repositoryUrl, branch = "main", options = {} } = req.body;

    if (!repositoryUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    const analysisOptions = {
      branch,
      user: req.user,
      ...options,
    };

    const result = await ai.analyzeDependencies(repositoryUrl, analysisOptions);

    logger.info(`Dependency analysis completed for ${repositoryUrl}`, {
      totalDependencies: result.dependency_analysis?.total_dependencies,
      vulnerableDependencies:
        result.dependency_analysis?.vulnerable_dependencies,
    });

    res.status(200).json({
      success: true,
      message: "Dependency analysis completed successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error analyzing dependencies:", error);
    res.status(500).json({
      success: false,
      message: "Error analyzing dependencies",
      error: error.message,
    });
  }
};

/**
 * @desc Get analysis progress for operation
 * @route GET /api/v1/ai/analysis/progress/:operationId
 * @access Private
 */
const getAnalysisProgress = async (req, res) => {
  try {
    const { operationId } = req.params;

    const result = await ai.getAnalysisProgress(operationId, req.user);

    res.status(200).json({
      success: true,
      message: "Analysis progress retrieved successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error getting analysis progress:", error);

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Operation not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error retrieving analysis progress",
      error: error.message,
    });
  }
};

/**
 * @desc Demo analyze repository (public endpoint with heavy rate limiting)
 * @route POST /api/v1/ai/analysis/demo
 * @access Public (Rate Limited)
 */
const demoAnalyzeRepository = async (req, res) => {
  try {
    const { repositoryUrl, branch = "main", analysisType = "stack" } = req.body;

    if (!repositoryUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    // Demo options with limited features
    const analysisOptions = {
      branch,
      analysisTypes: [analysisType], // Limited to single analysis type for demo
      forceLlm: false, // No LLM enhancement for demo
      includeReasoning: true,
      includeRecommendations: false, // Limited recommendations for demo
      includeInsights: true,
      explainNullFields: true,
      trackProgress: false,
    };

    let result;

    // Choose analysis based on type
    switch (analysisType) {
      case "stack":
        result = await ai.detectTechnologyStack(repositoryUrl, analysisOptions);
        break;
      case "quality":
        result = await ai.analyzeCodeQuality(repositoryUrl, analysisOptions);
        break;
      case "dependencies":
        result = await ai.analyzeDependencies(repositoryUrl, analysisOptions);
        break;
      default:
        result = await ai.detectTechnologyStack(repositoryUrl, analysisOptions);
    }

    // Add demo disclaimer
    result.demo_mode = true;
    result.limitations = [
      "Demo mode has limited analysis depth",
      "Sign up for full features and detailed insights",
      "Results are cached and may not reflect latest changes",
    ];

    logger.info("Demo repository analysis completed", {
      repositoryUrl,
      analysisType,
      confidence: result.confidence_score,
    });

    res.status(200).json({
      success: true,
      message: "Demo analysis completed successfully",
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
    const technologies = await ai.getSupportedTechnologies();

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
    const healthStatus = await ai.checkAiServiceHealth();

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

/**
 * @desc Get detailed AI service health
 * @route GET /api/v1/ai/analysis/health/detailed
 * @access Private (Admin)
 */
const getDetailedServiceHealth = async (req, res) => {
  try {
    const healthStatus = await ai.getDetailedAiServiceHealth();

    res.status(200).json({
      success: true,
      message: "AI service detailed health check completed",
      data: healthStatus,
    });
  } catch (error) {
    logger.error("Error getting detailed AI service health:", error);
    res.status(500).json({
      success: false,
      message: "Error getting detailed AI service health",
      error: error.message,
    });
  }
};

// Legacy compatibility functions
/**
 * @desc Legacy: Analyze project technology stack using AI
 * @route POST /api/v1/ai/analysis/stack/:projectId
 * @access Private
 * @deprecated Use analyzeRepository or detectTechnologyStack instead
 */
const analyzeProjectStack = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Get project details
    const projectData = await project.project.getProjectById(projectId, userId);
    if (!projectData) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!projectData.repositoryUrl) {
      return res.status(400).json({
        success: false,
        message: "Project does not have a repository URL configured",
      });
    }

    const result = await ai.analyzeProjectStack(
      projectId,
      projectData.repositoryUrl,
      projectData.branch || "main",
      req.user
    );

    logger.info(`AI stack analysis completed for project ${projectId}`, {
      primaryLanguage: result.technology_stack?.primary_language,
      framework: result.technology_stack?.framework,
      confidence: result.confidence_score,
    });

    res.status(200).json({
      success: true,
      message: "Project analyzed successfully",
      data: {
        project: projectData,
        analysis: result,
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
 * @desc Legacy: Run full AI analysis on a project
 * @route POST /api/v1/ai/analysis/full/:projectId
 * @access Private
 * @deprecated Use individual analysis endpoints instead
 */
const runFullAnalysis = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Get project details
    const projectData = await project.project.getProjectById(projectId, userId);
    if (!projectData) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!projectData.repositoryUrl) {
      return res.status(400).json({
        success: false,
        message: "Project does not have a repository URL configured",
      });
    }

    // Run comprehensive AI analysis using new endpoints
    const analysisOptions = {
      branch: projectData.branch || "main",
      user: req.user,
      analysisTypes: ["stack", "dependencies", "quality"],
      includeRecommendations: true,
      includeInsights: true,
    };

    const result = await ai.analyzeRepository(
      projectData.repositoryUrl,
      analysisOptions
    );

    logger.info(`Full AI analysis completed for project ${projectId}`);

    res.status(200).json({
      success: true,
      message: "Full AI analysis completed successfully",
      data: {
        projectId,
        project: projectData,
        analysis: result,
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

module.exports = {
  // New API endpoints
  analyzeRepository,
  detectTechnologyStack,
  analyzeCodeQuality,
  analyzeDependencies,
  getAnalysisProgress,

  // Public endpoints
  demoAnalyzeRepository,
  getSupportedTechnologies,

  // Health checks
  checkServiceHealth,
  getDetailedServiceHealth,

  // Legacy compatibility (deprecated)
  analyzeProjectStack,
  runFullAnalysis,
};
