const {
  aiServiceClient,
  generateAiServiceToken,
  generateDemoToken,
  checkAiServiceHealth,
  getDetailedAiServiceHealth,
} = require("./aiServiceClient");
const { getRedisClient } = require("@config/redisClient");
const logger = require("@config/logger");

// Complete repository analysis with new structure
const analyzeRepository = async (repositoryData, options = {}) => {
  const redisClient = getRedisClient();

  // Create cache key from repository data instead of URL
  const repoIdentifier =
    repositoryData.repository?.name ||
    repositoryData.repository?.full_name ||
    "unknown";
  const cacheKey = `ai_analysis:${Buffer.from(repoIdentifier).toString(
    "base64"
  )}:${options.branch || "main"}`;

  try {
    // Check cache first (if not forced refresh)
    if (!options.forceRefresh) {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        logger.info(`AI repository analysis cache hit for ${repoIdentifier}`);
        return JSON.parse(cachedResult);
      }
    }

    // Generate appropriate token
    const token = options.user
      ? generateAiServiceToken(options.user)
      : generateDemoToken();

    // Call AI service for repository analysis with new structure
    const response = await aiServiceClient.post(
      "/analysis/analyze-repository",
      {
        repository_data: repositoryData, // NEW: Complete repository data
        analysis_types: options.analysisTypes || [
          "stack",
          "dependencies",
          "quality",
        ],
        generate_configs: options.generateConfigs || false,
        config_types: options.configTypes || ["dockerfile", "docker_compose", "github_actions"],
        options: {
          force_llm_enhancement: options.forceLlm || false,
          include_reasoning: options.includeReasoning !== false,
          include_recommendations: options.includeRecommendations !== false,
          include_insights: options.includeInsights !== false,
          explain_null_fields: options.explainNullFields !== false,
          track_progress: options.trackProgress || false,
          session_id: options.sessionId || `session_${Date.now()}`,
          cache_enabled: !options.forceRefresh,
          include_llm_enhancement: true
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const result = response.data; // Get the full response data

    // Cache for appropriate duration based on user type
    const cacheTime = options.user ? 3600 : 1800; // 1 hour for users, 30 min for demo
    await redisClient.setEx(cacheKey, cacheTime, JSON.stringify(result));
    logger.info(`AI repository analysis completed for ${repoIdentifier}`);
    return result;
  } catch (error) {
    logger.error(
      `AI repository analysis failed for ${repoIdentifier}:`,
      error.response?.data?.detail || error.message
    );

    // Create a clean error object to avoid circular structure issues
    const cleanError = new Error(
      error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message
    );
    cleanError.status = error.response?.status || 500;
    cleanError.code = error.code;

    // Add response data without circular references
    if (error.response?.data) {
      cleanError.responseData = {
        detail: error.response.data.detail,
        message: error.response.data.message,
        status: error.response.status,
      };
    }

    throw cleanError;
  }
};

// Technology stack detection
const detectTechnologyStack = async (repositoryUrl, options = {}) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_stack:${Buffer.from(repositoryUrl).toString("base64")}:${
    options.branch || "main"
  }`;

  try {
    // Check cache first
    if (!options.forceRefresh) {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        logger.info(`AI stack detection cache hit for ${repositoryUrl}`);
        return JSON.parse(cachedResult);
      }
    }

    // Generate appropriate token
    const token = options.user
      ? generateAiServiceToken(options.user)
      : generateDemoToken();

    // Call AI service for stack detection
    const response = await aiServiceClient.post(
      "/analysis/detect-stack",
      {
        repository_url: repositoryUrl,
        branch: options.branch || "main",
        include_reasoning: options.includeReasoning !== false,
        explain_null_fields: options.explainNullFields !== false,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data.data; // Cache for appropriate duration
    const cacheTime = options.user ? 3600 : 1800;
    await redisClient.setEx(cacheKey, cacheTime, JSON.stringify(result));
    logger.info(`AI stack detection completed for ${repositoryUrl}`);
    return result;
  } catch (error) {
    logger.error(
      `AI stack detection failed for ${repositoryUrl}:`,
      error.response?.data?.detail || error.message
    );

    // Create a clean error object to avoid circular structure issues
    const cleanError = new Error(
      error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message
    );
    cleanError.status = error.response?.status || 500;
    cleanError.code = error.code;

    if (error.response?.data) {
      cleanError.responseData = {
        detail: error.response.data.detail,
        message: error.response.data.message,
        status: error.response.status,
      };
    }

    throw cleanError;
  }
};

// Code quality analysis
const analyzeCodeQuality = async (repositoryUrl, options = {}) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_code_quality:${Buffer.from(repositoryUrl).toString(
    "base64"
  )}:${options.branch || "main"}`;

  try {
    // Check cache first
    if (!options.forceRefresh) {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        logger.info(`AI code quality analysis cache hit for ${repositoryUrl}`);
        return JSON.parse(cachedResult);
      }
    }

    // Generate appropriate token
    const token = options.user
      ? generateAiServiceToken(options.user)
      : generateDemoToken();

    // Call AI service for code quality analysis
    const response = await aiServiceClient.post(
      "/analysis/analyze-code-quality",
      {
        repository_url: repositoryUrl,
        branch: options.branch || "main",
        include_reasoning: options.includeReasoning !== false,
        explain_null_fields: options.explainNullFields !== false,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data.data; // Cache for appropriate duration
    const cacheTime = options.user ? 7200 : 3600; // 2 hours for users, 1 hour for demo
    await redisClient.setEx(cacheKey, cacheTime, JSON.stringify(result));
    logger.info(`AI code quality analysis completed for ${repositoryUrl}`);
    return result;
  } catch (error) {
    logger.error(
      `AI code quality analysis failed for ${repositoryUrl}:`,
      error.response?.data?.detail || error.message
    );

    // Create a clean error object to avoid circular structure issues
    const cleanError = new Error(
      error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message
    );
    cleanError.status = error.response?.status || 500;
    cleanError.code = error.code;

    if (error.response?.data) {
      cleanError.responseData = {
        detail: error.response.data.detail,
        message: error.response.data.message,
        status: error.response.status,
      };
    }

    throw cleanError;
  }
};

// Dependency analysis
const analyzeDependencies = async (repositoryUrl, options = {}) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_dependencies:${Buffer.from(repositoryUrl).toString(
    "base64"
  )}:${options.branch || "main"}`;

  try {
    // Check cache first
    if (!options.forceRefresh) {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        logger.info(`AI dependency analysis cache hit for ${repositoryUrl}`);
        return JSON.parse(cachedResult);
      }
    }

    // Generate appropriate token
    const token = options.user
      ? generateAiServiceToken(options.user)
      : generateDemoToken();

    // Call AI service for dependency analysis
    const response = await aiServiceClient.post(
      "/analysis/analyze-dependencies",
      {
        repository_url: repositoryUrl,
        branch: options.branch || "main",
        include_reasoning: options.includeReasoning !== false,
        explain_null_fields: options.explainNullFields !== false,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data.data; // Cache for appropriate duration
    const cacheTime = options.user ? 14400 : 7200; // 4 hours for users, 2 hours for demo
    await redisClient.setEx(cacheKey, cacheTime, JSON.stringify(result));

    logger.info(`AI dependency analysis completed for ${repositoryUrl}`);
    return result;
  } catch (error) {
    logger.error(
      `AI dependency analysis failed for ${repositoryUrl}:`,
      error.response?.data?.detail || error.message
    );

    // Create a clean error object to avoid circular structure issues
    const cleanError = new Error(
      error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message
    );
    cleanError.status = error.response?.status || 500;
    cleanError.code = error.code;

    if (error.response?.data) {
      cleanError.responseData = {
        detail: error.response.data.detail,
        message: error.response.data.message,
        status: error.response.status,
      };
    }

    throw cleanError;
  }
};

// Get analysis progress
const getAnalysisProgress = async (operationId, user) => {
  try {
    const token = generateAiServiceToken(user);

    const response = await aiServiceClient.get(
      `/analysis/progress/${operationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    logger.error(
      `Failed to get analysis progress for ${operationId}:`,
      error.message
    );
    throw error;
  }
};

// Get supported technologies from AI service
const getSupportedTechnologies = async () => {
  const redisClient = getRedisClient();
  const cacheKey = "ai_supported_technologies";

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    // Use demo token for this public endpoint
    const token = generateDemoToken();

    // Call AI service
    const response = await aiServiceClient.get(
      "/analysis/supported-technologies",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const result = response.data.data; // Cache for 24 hours
    await redisClient.setEx(cacheKey, 86400, JSON.stringify(result));

    return result;
  } catch (error) {
    logger.error("Failed to get supported technologies:", error.message);

    // Return fallback technologies
    return {
      languages: [
        "JavaScript",
        "TypeScript",
        "Python",
        "Java",
        "Go",
        "PHP",
        "C#",
        "Ruby",
      ],
      frameworks: [
        "React",
        "Vue",
        "Angular",
        "Express",
        "FastAPI",
        "Django",
        "Spring Boot",
        "Laravel",
        "Ruby on Rails",
        ".NET Core",
      ],
      databases: [
        "MongoDB",
        "PostgreSQL",
        "MySQL",
        "Redis",
        "SQLite",
        "DynamoDB",
      ],
      cloud_providers: ["AWS", "Google Cloud", "Azure", "DigitalOcean"],
      containerization: ["Docker", "Kubernetes", "Docker Compose"],
      ci_cd: ["GitHub Actions", "GitLab CI", "Jenkins", "CircleCI"],
    };
  }
};

// NEW: WebSocket-based analysis with real-time progress
const analyzeRepositoryWithWebSocket = async (repositoryData, options = {}) => {
  const sessionId = options.sessionId || `session_${Date.now()}`;

  try {
    // Generate appropriate token
    const token = options.user
      ? generateAiServiceToken(options.user)
      : generateDemoToken();

    // Get WebSocket manager (will implement this next)
    const { getWebSocketManager } = require("@config/webSocketManager");
    const wsManager = getWebSocketManager();

    // Emit analysis start to client
    wsManager.to(options.socketId).emit("analysis:started", {
      sessionId,
      status: "started",
      message: "Analysis initiated",
    });

    // Call AI service for analysis
    const response = await aiServiceClient.post(
      "/analysis/analyze-repository",
      {
        repository_data: repositoryData,
        analysis_types: options.analysisTypes || [
          "stack",
          "dependencies",
          "quality",
        ],
        force_llm_enhancement: options.forceLlm || false,
        include_reasoning: options.includeReasoning !== false,
        include_recommendations: options.includeRecommendations !== false,
        include_insights: options.includeInsights !== false,
        session_id: sessionId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data.data;

    // Emit analysis complete to client
    wsManager.to(options.socketId).emit("analysis:completed", {
      sessionId,
      status: "completed",
      data: result,
    });

    return result;
  } catch (error) {
    // Emit error to client
    const { getWebSocketManager } = require("@config/webSocketManager");
    const wsManager = getWebSocketManager();

    wsManager.to(options.socketId).emit("analysis:error", {
      sessionId,
      status: "error",
      error: error.message,
    });

    throw error;
  }
};

// NEW: Configuration generation from analysis results
const generateConfigurations = async (
  repositoryData,
  analysisResults,
  options = {}
) => {
  try {
    const token = options.user
      ? generateAiServiceToken(options.user)
      : generateDemoToken();

    const response = await aiServiceClient.post(
      "/generators/generate-configs",
      {
        session_id: options.sessionId || `session_${Date.now()}`,
        repository_data: repositoryData,
        analysis_results: analysisResults,
        config_types: options.configTypes || [
          "dockerfile",
          "github_actions",
          "docker_compose",
        ],
        optimization_level: options.optimizationLevel || "balanced",
        user_preferences: options.userPreferences || {},
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    logger.error(
      `Configuration generation failed:`,
      error.response?.data?.detail || error.message
    );
    throw error;
  }
};

module.exports = {
  analyzeRepository,
  analyzeRepositoryWithWebSocket,
  generateConfigurations,
  detectTechnologyStack,
  analyzeCodeQuality,
  analyzeDependencies,
  getAnalysisProgress,
  getSupportedTechnologies,
  checkAiServiceHealth,
  getDetailedAiServiceHealth,
};
