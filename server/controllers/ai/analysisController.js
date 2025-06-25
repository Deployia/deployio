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

    // Enhanced error handling to pass through AI service errors properly
    let statusCode = 500;
    let errorMessage = "Error analyzing repository";

    if (error.response) {
      // AI service returned an error response - forward it directly
      statusCode = error.response.status;
      errorMessage =
        error.response.data?.detail ||
        error.response.data?.message ||
        errorMessage;
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      statusCode = 503;
      errorMessage = "AI analysis service is temporarily unavailable";
    } else if (error.code === "ECONNABORTED") {
      statusCode = 408;
      errorMessage = "Analysis request timed out";
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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

    // Enhanced error handling to pass through AI service errors properly
    let statusCode = 500;
    let errorMessage = "Error detecting technology stack";

    if (error.response) {
      // AI service returned an error response - forward it directly
      statusCode = error.response.status;
      errorMessage =
        error.response.data?.detail ||
        error.response.data?.message ||
        errorMessage;
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      statusCode = 503;
      errorMessage = "AI analysis service is temporarily unavailable";
    } else if (error.code === "ECONNABORTED") {
      statusCode = 408;
      errorMessage = "Analysis request timed out";
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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

    // Enhanced error handling to pass through AI service errors properly
    let statusCode = 500;
    let errorMessage = "Error analyzing code quality";

    if (error.response) {
      // AI service returned an error response - forward it directly
      statusCode = error.response.status;
      errorMessage =
        error.response.data?.detail ||
        error.response.data?.message ||
        errorMessage;
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      statusCode = 503;
      errorMessage = "AI analysis service is temporarily unavailable";
    } else if (error.code === "ECONNABORTED") {
      statusCode = 408;
      errorMessage = "Analysis request timed out";
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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

    // Enhanced error handling to pass through AI service errors properly
    let statusCode = 500;
    let errorMessage = "Error analyzing dependencies";

    if (error.response) {
      // AI service returned an error response - forward it directly
      statusCode = error.response.status;
      errorMessage =
        error.response.data?.detail ||
        error.response.data?.message ||
        errorMessage;
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      statusCode = 503;
      errorMessage = "AI analysis service is temporarily unavailable";
    } else if (error.code === "ECONNABORTED") {
      statusCode = 408;
      errorMessage = "Analysis request timed out";
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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

    // Enhanced error handling to pass through AI service errors properly
    let statusCode = 500;
    let errorMessage = "Error retrieving analysis progress";

    if (error.response) {
      statusCode = error.response.status;
      errorMessage =
        error.response.data?.detail ||
        error.response.data?.message ||
        errorMessage;

      if (statusCode === 404) {
        errorMessage = "Operation not found";
      }
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      statusCode = 503;
      errorMessage = "AI analysis service is temporarily unavailable";
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc Get analysis progress for demo operation (public endpoint)
 * @route GET /api/v1/ai/analysis/demo/progress/:operationId
 * @access Public (Rate Limited)
 */
const getDemoAnalysisProgress = async (req, res) => {
  try {
    const { operationId } = req.params;

    // For demo, we'll use a mock user object
    const demoUser = { _id: "demo", email: "demo@demo.com" };
    const result = await ai.getAnalysisProgress(operationId, demoUser);

    res.status(200).json({
      success: true,
      message: "Demo analysis progress retrieved successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error getting demo analysis progress:", error);

    // Enhanced error handling to pass through AI service errors properly
    let statusCode = 500;
    let errorMessage = "Error retrieving analysis progress";

    if (error.response) {
      statusCode = error.response.status;
      errorMessage =
        error.response.data?.detail ||
        error.response.data?.message ||
        errorMessage;

      if (statusCode === 404) {
        errorMessage = "Operation not found";
      }
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      statusCode = 503;
      errorMessage = "AI analysis service is temporarily unavailable";
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc Demo analyze repository (public endpoint with IP-based rate limiting)
 * @route POST /api/v1/ai/analysis/demo
 * @access Public (Rate Limited by IP)
 */
const demoAnalyzeRepository = async (req, res) => {
  try {
    const {
      repositoryUrl,
      branch = "main",
      analysisTypes = ["stack", "dependencies", "quality"],
      forceLlm = true,
      includeReasoning = true,
      includeRecommendations = true,
      includeInsights = true,
      explainNullFields = true,
      trackProgress = true,
    } = req.body;

    if (!repositoryUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    // Demo gets full access with enhanced features
    const analysisOptions = {
      branch,
      analysisTypes,
      forceLlm, // Enable LLM enhancement for demo
      includeReasoning,
      includeRecommendations, // Full recommendations for demo
      includeInsights,
      explainNullFields,
      trackProgress,
      // No user provided for demo - uses demo token
    };

    const result = await ai.analyzeRepository(repositoryUrl, analysisOptions);

    // Add demo branding
    result.demo_mode = true;
    result.demo_features = [
      "Full AI-powered analysis with LLM enhancement",
      "Complete technology stack detection",
      "Comprehensive dependency analysis",
      "Code quality assessment with recommendations",
      "Real-time progress tracking",
      "Detailed reasoning and insights",
    ];

    logger.info("Demo repository analysis completed", {
      repositoryUrl,
      analysisTypes,
      confidence: result.confidence_score,
      llmUsed: result.llm_used,
      clientIp: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Demo analysis completed successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error in demo repository analysis:", error);

    // Enhanced error handling to pass through AI service errors properly
    let statusCode = error.status || 500;
    let errorMessage = error.message || "Error analyzing repository";

    // Handle clean error objects from service layer
    if (error.responseData) {
      errorMessage =
        error.responseData.detail || error.responseData.message || errorMessage;
      statusCode = error.responseData.status || statusCode;
    }

    // Add specific context for common errors
    if (statusCode === 404 && errorMessage.toLowerCase().includes("branch")) {
      errorMessage = `Branch '${branch}' not found in repository`;
    } else if (statusCode === 404) {
      errorMessage = "Repository not found or not accessible";
    } else if (statusCode === 403) {
      errorMessage = "Repository is private or access is restricted";
    } else if (statusCode === 422) {
      errorMessage = "Invalid repository URL or unsupported repository format";
    } else if (statusCode === 429) {
      errorMessage = "Analysis rate limit exceeded. Please try again later";
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      statusCode = 503;
      errorMessage = "AI analysis service is temporarily unavailable";
    } else if (error.code === "ECONNABORTED") {
      statusCode = 408;
      errorMessage =
        "Analysis request timed out. Repository might be too large";
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
  getDemoAnalysisProgress,

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
