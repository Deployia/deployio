const {
  aiServiceClient,
  generateAiServiceToken,
  generateDemoToken,
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

    const result = response.data.data;

    // Cache for appropriate duration based on user type
    const cacheTime = options.user ? 3600 : 1800; // 1 hour for users, 30 min for demo
    await redisClient.setex(cacheKey, cacheTime, JSON.stringify(result));

    logger.info(`AI repository analysis completed for ${repositoryUrl}`);
    return result;
  } catch (error) {
    logger.error(
      `AI repository analysis failed for ${repositoryUrl}:`,
      error.response?.data?.detail || error.message
    );

    // Return fallback analysis
    return generateFallbackRepositoryAnalysis(repositoryUrl, error);
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

    const result = response.data.data;

    // Cache for appropriate duration
    const cacheTime = options.user ? 3600 : 1800;
    await redisClient.setex(cacheKey, cacheTime, JSON.stringify(result));

    logger.info(`AI stack detection completed for ${repositoryUrl}`);
    return result;
  } catch (error) {
    logger.error(
      `AI stack detection failed for ${repositoryUrl}:`,
      error.response?.data?.detail || error.message
    );

    // Return fallback analysis
    return generateFallbackStackAnalysis(repositoryUrl, error);
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

    const result = response.data.data;

    // Cache for appropriate duration
    const cacheTime = options.user ? 7200 : 3600; // 2 hours for users, 1 hour for demo
    await redisClient.setex(cacheKey, cacheTime, JSON.stringify(result));

    logger.info(`AI code quality analysis completed for ${repositoryUrl}`);
    return result;
  } catch (error) {
    logger.error(
      `AI code quality analysis failed for ${repositoryUrl}:`,
      error.response?.data?.detail || error.message
    );

    // Return fallback analysis
    return generateFallbackCodeQualityAnalysis(repositoryUrl, error);
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

    const result = response.data.data;

    // Cache for appropriate duration
    const cacheTime = options.user ? 14400 : 7200; // 4 hours for users, 2 hours for demo
    await redisClient.setex(cacheKey, cacheTime, JSON.stringify(result));

    logger.info(`AI dependency analysis completed for ${repositoryUrl}`);
    return result;
  } catch (error) {
    logger.error(
      `AI dependency analysis failed for ${repositoryUrl}:`,
      error.response?.data?.detail || error.message
    );

    // Return fallback analysis
    return generateFallbackDependencyAnalysis(repositoryUrl, error);
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
    const result = response.data.data;

    // Cache for 24 hours
    await redisClient.setex(cacheKey, 86400, JSON.stringify(result));

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

// Fallback functions with better error context
const generateFallbackRepositoryAnalysis = (repositoryUrl, error) => {
  return {
    repository_url: repositoryUrl,
    branch: "main",
    analysis_approach: "fallback",
    processing_time: 0,
    confidence_score: 0.1,
    confidence_level: "very_low",
    technology_stack: {
      primary_language: "Unknown",
      framework: "Unknown",
      runtime_version: null,
      package_manager: null,
      build_tool: null,
    },
    detected_files: [],
    recommendations: [
      "Analysis service is currently unavailable",
      "Please verify repository URL and accessibility",
      "Consider manual configuration or try again later",
    ],
    suggestions: [
      {
        type: "infrastructure",
        priority: "high",
        suggestion: "Verify AI service connectivity",
        reason: "Analysis service could not be reached",
      },
    ],
    insights: [],
    reasoning: `Analysis failed: ${error?.message || "Unknown error"}`,
    null_field_explanations: {
      technology_stack:
        "Unable to detect technology stack due to service unavailability",
    },
    llm_used: false,
    fallback: true,
    error_details: {
      type: error?.response?.status ? "api_error" : "network_error",
      status: error?.response?.status,
      message: error?.message,
    },
  };
};

const generateFallbackStackAnalysis = (repositoryUrl, error) => {
  return {
    repository_url: repositoryUrl,
    branch: "main",
    analysis_approach: "fallback",
    processing_time: 0,
    confidence_score: 0.1,
    confidence_level: "very_low",
    technology_stack: {
      primary_language: "Unknown",
      framework: "Unknown",
      runtime_version: null,
      package_manager: null,
      build_tool: null,
    },
    detected_files: [],
    insights: [],
    reasoning: `Stack detection failed: ${error?.message || "Unknown error"}`,
    null_field_explanations: {
      technology_stack:
        "Unable to detect technology stack due to service unavailability",
    },
    fallback: true,
  };
};

const generateFallbackCodeQualityAnalysis = (repositoryUrl, error) => {
  return {
    repository_url: repositoryUrl,
    branch: "main",
    analysis_approach: "fallback",
    processing_time: 0,
    confidence_score: 0.1,
    confidence_level: "very_low",
    quality_metrics: {
      overall_score: 50,
      maintainability: 50,
      reliability: 50,
      security: 30,
      performance: 50,
      test_coverage: 0,
    },
    recommendations: [
      "Code quality analysis service unavailable",
      "Run local linting tools",
      "Implement automated testing",
      "Set up code quality gates",
    ],
    suggestions: [
      {
        type: "quality",
        priority: "high",
        suggestion: "Set up local code quality tools",
        reason: "Remote analysis service unavailable",
      },
    ],
    insights: [],
    reasoning: `Code quality analysis failed: ${
      error?.message || "Unknown error"
    }`,
    null_field_explanations: {
      quality_metrics:
        "Unable to analyze code quality due to service unavailability",
    },
    fallback: true,
  };
};

const generateFallbackDependencyAnalysis = (repositoryUrl, error) => {
  return {
    repository_url: repositoryUrl,
    branch: "main",
    analysis_approach: "fallback",
    processing_time: 0,
    confidence_score: 0.1,
    confidence_level: "very_low",
    dependency_analysis: {
      total_dependencies: 0,
      direct_dependencies: 0,
      dev_dependencies: 0,
      outdated_dependencies: 0,
      vulnerable_dependencies: 0,
      license_issues: 0,
    },
    recommendations: [
      "Dependency analysis service unavailable",
      "Run npm audit or equivalent for your package manager",
      "Check for outdated packages manually",
      "Review licenses of your dependencies",
    ],
    suggestions: [
      {
        type: "security",
        priority: "high",
        suggestion: "Run local dependency audit",
        reason: "Remote dependency analysis unavailable",
      },
    ],
    insights: [],
    reasoning: `Dependency analysis failed: ${
      error?.message || "Unknown error"
    }`,
    null_field_explanations: {
      dependency_analysis:
        "Unable to analyze dependencies due to service unavailability",
    },
    fallback: true,
  };
};

module.exports = {
  analyzeRepository,
  detectTechnologyStack,
  analyzeCodeQuality,
  analyzeDependencies,
  getAnalysisProgress,
  getSupportedTechnologies,
  // Legacy compatibility
  analyzeProjectStack,
};
