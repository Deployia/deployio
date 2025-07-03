require("dotenv").config();
const ai = require("@services/ai");
const GitProviderService = require("@services/gitProvider/GitProviderService");
const RepositoryDataFetcher = require("@services/gitProvider/RepositoryDataFetcher");
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
      repositoryData,
      branch = "main",
      analysisTypes,
      generateConfigs = false, // NEW: Support config generation
      configTypes = ["dockerfile", "docker_compose", "github_actions"], // NEW: Config types
      options = {},
    } = req.body;

    // Support both old URL-based and new repository-data-based requests
    if (!repositoryUrl && !repositoryData) {
      return res.status(400).json({
        success: false,
        message: "Either repositoryUrl or repositoryData is required",
      });
    }

    const analysisOptions = {
      branch,
      analysisTypes,
      generateConfigs, // NEW: Pass config generation flag
      configTypes, // NEW: Pass config types
      user: req.user,
      ...options,
    };

    let result;

    if (repositoryData) {
      // NEW: Use repository data directly
      result = await ai.analyzeRepository(repositoryData, analysisOptions);
    } else {
      // NEW: URL-based analysis - we need to fetch repository data from git provider
      // Extract provider from URL (GitHub, GitLab, etc.)
      const provider = extractProviderFromUrl(repositoryUrl);

      if (!provider) {
        return res.status(400).json({
          success: false,
          message:
            "Could not determine git provider from repository URL. Supported: GitHub, GitLab, Bitbucket, Azure DevOps",
        });
      }

      // Extract owner and repo from URL
      const urlMatch = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid repository URL format",
        });
      }

      const [, owner, repo] = urlMatch;
      const repoFullName = `${owner}/${repo.replace(/\.git$/, "")}`;

      // Fetch repository data from the git provider service
      const fetchedRepoData = await GitProviderService.getRepositoryData(
        req.user._id,
        provider,
        repoFullName,
        branch
      );

      result = await ai.analyzeRepository(fetchedRepoData, analysisOptions);
    }

    logger.info(
      `Repository analysis completed for ${
        repositoryUrl || repositoryData?.repository?.full_name
      }`,
      {
        analysisApproach:
          result.analysis?.analysis_approach || result.analysis_approach,
        confidence:
          result.analysis?.confidence_score || result.confidence_score,
        llmUsed: result.analysis?.llm_used || result.llm_used,
        configsGenerated: !!result.configurations,
      }
    );

    res.status(200).json({
      success: true,
      message: generateConfigs
        ? "Repository analysis and configuration generation completed successfully"
        : "Repository analysis completed successfully",
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
    } else if (
      error.message.includes("No valid token") ||
      error.message.includes("provider not connected")
    ) {
      statusCode = 401;
      errorMessage =
        "Git provider not connected or token expired. Please reconnect your git provider.";
    } else if (error.message.includes("Invalid repository URL")) {
      statusCode = 400;
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Helper function to extract git provider from repository URL
 */
function extractProviderFromUrl(repositoryUrl) {
  if (!repositoryUrl) return null;

  const url = repositoryUrl.toLowerCase();

  if (url.includes("github.com")) {
    return "github";
  } else if (url.includes("gitlab.com")) {
    return "gitlab";
  } else if (url.includes("bitbucket.org")) {
    return "bitbucket";
  } else if (
    url.includes("dev.azure.com") ||
    url.includes("visualstudio.com")
  ) {
    return "azuredevops";
  }

  return null;
}

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
 * @desc Demo complete pipeline (authenticated users only, heavy rate limited)
 * @route POST /api/v1/ai/analysis/demo/complete-pipeline
 * @access Private (Heavy Rate Limited)
 */
const demoCompletePipeline = async (req, res) => {
  try {
    const {
      repositoryUrl,
      branch = "main",
      analysisTypes = ["stack", "dependencies", "code"],
      configTypes = ["dockerfile", "github_actions", "docker_compose"],
      // autoApprove is ignored but accepted for compatibility
    } = req.body;

    if (!repositoryUrl) {
      return res.status(400).json({
        success: false,
        message: "Repository URL is required",
      });
    }

    // Fetch repository data using centralized fetcher
    const repositoryData = await fetchPublicRepositoryData(
      repositoryUrl,
      branch
    );

    const sessionId = `demo_${Date.now()}_${req.user.id}`;

    // Unified analysis and configuration generation options
    const analysisOptions = {
      user: null, // Force demo token usage
      sessionId,
      branch,
      analysisTypes,
      generateConfigs: true, // Always enable config generation for demo
      configTypes,
      forceLlm: true, // Enable LLM enhancement for demo
      includeReasoning: true,
      includeRecommendations: true,
      includeInsights: true,
      explainNullFields: true,
      trackProgress: true,
      demoMode: true,
    };

    logger.info(`Starting demo unified pipeline for session: ${sessionId}`, {
      repositoryUrl,
      userId: req.user.id,
      clientIp: req.ip,
    });

    // Call unified analysis with configuration generation
    const result = await ai.analyzeRepository(repositoryData, analysisOptions);

    logger.info(`Demo unified pipeline completed for session: ${sessionId}`, {
      hasAnalysis: !!result.analysis,
      hasConfigurations: !!result.configurations,
    });

    // Always return unified structure: { analysis, configurations, ... }
    const pipelineResult = {
      sessionId,
      analysis: result.analysis || result,
      configurations: result.configurations || null,
      timestamp: new Date().toISOString(),
      demo_mode: true,
      demo_features: [
        "Full AI-powered analysis with LLM enhancement",
        "Complete configuration generation",
        "Docker, GitHub Actions, and Docker Compose configs",
        "Real-time progress tracking via WebSocket",
        "Production-ready deployment files",
      ],
    };

    res.status(200).json({
      success: true,
      message: "Demo pipeline completed successfully",
      data: pipelineResult,
    });
  } catch (error) {
    logger.error("Error in demo complete pipeline:", error);

    let statusCode = error.status || 500;
    let errorMessage = error.message || "Error in demo complete pipeline";

    if (error.responseData) {
      errorMessage =
        error.responseData.detail || error.responseData.message || errorMessage;
      statusCode = error.responseData.status || statusCode;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc Get demo analysis progress (placeholder for future streaming implementation)
 * @route GET /api/v1/ai/analysis/demo/progress/:operationId
 * @access Private (Heavy Rate Limited)
 */
const getDemoAnalysisProgress = async (req, res) => {
  try {
    const { operationId } = req.params;

    // For now, return a simple progress response
    // TODO: Implement real-time progress tracking with WebSocket or SSE
    const progressData = {
      operation_id: operationId,
      status: "COMPLETED",
      progress: 100,
      step_name: "Complete",
      message: "Demo pipeline completed successfully",
      timestamp: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      message: "Demo progress retrieved successfully",
      data: progressData,
    });
  } catch (error) {
    logger.error("Error getting demo analysis progress:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving demo progress",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Fetch comprehensive public repository data using centralized fetcher
 */
async function fetchPublicRepositoryData(repositoryUrl, branch = "main") {
  try {
    const fetcher = new RepositoryDataFetcher();
    return await fetcher.fetchRepositoryData(repositoryUrl, branch, true);
  } catch (error) {
    logger.error(`Failed to fetch public repository data: ${error.message}`);
    throw error;
  }
}

module.exports = {
  // Core API endpoints
  analyzeRepository,

  // Public endpoints
  getSupportedTechnologies,

  // Health checks
  checkServiceHealth,
  getDetailedServiceHealth,

  // Demo endpoints
  demoCompletePipeline,
  getDemoAnalysisProgress,
};
