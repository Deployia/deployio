const {
  aiServiceClient,
  AI_SERVICE_ANALYSIS_TIMEOUT_MS,
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
  const requestedTimeoutMs = Number.parseInt(options.requestTimeoutMs, 10);
  const analysisTimeoutMs =
    Number.isFinite(requestedTimeoutMs) && requestedTimeoutMs > 0
      ? requestedTimeoutMs
      : AI_SERVICE_ANALYSIS_TIMEOUT_MS;

  // Create cache key from repository data instead of URL
  const repoIdentifier =
    repositoryData.repository?.name ||
    repositoryData.repository?.full_name ||
    "unknown";
  const cacheKey = `ai_analysis:${Buffer.from(repoIdentifier).toString(
    "base64",
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

    // --- CLEANED: Only log a summary of file counts and empty files if any ---
    if (repositoryData.files) {
      const fileCount = Object.keys(repositoryData.files).length;
      const emptyFiles = Object.entries(repositoryData.files)
        .filter(([_, content]) => !content)
        .map(([filename]) => filename);
      logger.info(`AI analysis: Sending ${fileCount} key files to AI service`);
      if (emptyFiles.length > 0) {
        logger.warn(
          `AI analysis: ${emptyFiles.length} key files have empty content`,
          emptyFiles,
        );
      }
    } else {
      logger.warn("AI analysis: No files field present in repositoryData");
    }

    // Call AI service for repository analysis with new structure
    const response = await aiServiceClient.post(
      "/analysis/analyze-repository",
      {
        repository_data: repositoryData, // NEW: Complete repository data
        analysis_types: options.analysisTypes || [
          "stack",
          "dependencies",
          "code", // Fixed: Use 'code' instead of 'quality'
        ],
        generate_configs: options.generateConfigs || false,
        config_types: options.configTypes || [
          "dockerfile",
          "docker_compose",
          "github_actions",
        ],
        options: {
          force_llm_enhancement: options.forceLlm || false,
          include_reasoning: options.includeReasoning !== false,
          include_recommendations: options.includeRecommendations !== false,
          include_insights: options.includeInsights !== false,
          explain_null_fields: options.explainNullFields !== false,
          track_progress: options.trackProgress || false,
          session_id: options.sessionId || `session_${Date.now()}`,
          cache_enabled: !options.forceRefresh,
          include_llm_enhancement: true,
        },
      },
      {
        timeout: analysisTimeoutMs,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const result = response.data; // Get the full AnalysisResponse

    // Log the analysis structure for debugging
    logger.debug("Analysis response structure:", {
      hasAnalysis: !!result.analysis,
      hasConfigurations: !!result.configurations,
      status: result.status,
      executionTime: result.execution_time,
    });

    // Cache for appropriate duration based on user type
    const cacheTime = options.user ? 3600 : 1800; // 1 hour for users, 30 min for demo
    await redisClient.setEx(cacheKey, cacheTime, JSON.stringify(result));
    logger.info(`AI repository analysis completed for ${repoIdentifier}`);
    return result;
  } catch (error) {
    logger.error(
      `AI repository analysis failed for ${repoIdentifier}:`,
      error.response?.data?.detail || error.message,
    );

    // Create a clean error object to avoid circular structure issues
    const cleanError = new Error(
      error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message,
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
    const response = await aiServiceClient.get("/analysis/technologies", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
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

module.exports = {
  analyzeRepository,
  getSupportedTechnologies,
  checkAiServiceHealth,
  getDetailedAiServiceHealth,
};
