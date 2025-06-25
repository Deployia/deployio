const {
  aiServiceClient,
  generateAiServiceToken,
  generateDemoToken,
  checkAiServiceHealth,
  getDetailedAiServiceHealth,
} = require("./aiServiceClient");
const { getRedisClient } = require("@config/redisClient");
const logger = require("@config/logger");

// Complete repository analysis
const analyzeRepository = async (repositoryUrl, options = {}) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_analysis:${Buffer.from(repositoryUrl).toString(
    "base64"
  )}:${options.branch || "main"}`;

  try {
    // Check cache first (if not forced refresh)
    if (!options.forceRefresh) {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        logger.info(`AI repository analysis cache hit for ${repositoryUrl}`);
        return JSON.parse(cachedResult);
      }
    }

    // Generate appropriate token
    const token = options.user
      ? generateAiServiceToken(options.user)
      : generateDemoToken();

    // Call AI service for repository analysis
    const response = await aiServiceClient.post(
      "/analysis/analyze-repository",
      {
        repository_url: repositoryUrl,
        branch: options.branch || "main",
        analysis_types: options.analysisTypes || [
          "stack",
          "dependencies",
          "quality",
        ],
        force_llm_enhancement: options.forceLlm || false,
        include_reasoning: options.includeReasoning !== false,
        include_recommendations: options.includeRecommendations !== false,
        include_insights: options.includeInsights !== false,
        explain_null_fields: options.explainNullFields !== false,
        track_progress: options.trackProgress || false,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const result = response.data.data; // Extract the actual data from the response

    // Cache for appropriate duration based on user type
    const cacheTime = options.user ? 3600 : 1800; // 1 hour for users, 30 min for demo
    await redisClient.setEx(cacheKey, cacheTime, JSON.stringify(result));
    logger.info(`AI repository analysis completed for ${repositoryUrl}`);
    return result;
  } catch (error) {
    logger.error(
      `AI repository analysis failed for ${repositoryUrl}:`,
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

// Legacy compatibility for existing controllers
const analyzeProjectStack = (
  projectId,
  repositoryUrl,
  branch = "main",
  user
) => {
  return detectTechnologyStack(repositoryUrl, { branch, user, projectId });
};

module.exports = {
  analyzeRepository,
  detectTechnologyStack,
  analyzeCodeQuality,
  analyzeDependencies,
  getAnalysisProgress,
  getSupportedTechnologies,
  checkAiServiceHealth,
  getDetailedAiServiceHealth,
  // Legacy compatibility
  analyzeProjectStack,
};
