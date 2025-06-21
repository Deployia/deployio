const {
  aiServiceClient,
  generateAiServiceToken,
} = require("./aiServiceClient");
const { getRedisClient } = require("@config/redisClient");
const logger = require("@config/logger");

// Analyze project technology stack
const analyzeRepository = async (
  projectId,
  repositoryUrl,
  branch = "main",
  user
) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_stack_analysis:${projectId}`;

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      logger.info(`AI stack analysis cache hit for project ${projectId}`);
      return JSON.parse(cachedResult);
    }

    // Generate token for AI service
    const token = generateAiServiceToken(user);

    // Call AI service for stack analysis
    const response = await aiServiceClient.post(
      "/service/v1/ai/analyze-stack",
      {
        repository_url: repositoryUrl,
        branch,
        project_id: projectId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data.data;

    // Cache for 1 hour
    await redisClient.setex(cacheKey, 3600, JSON.stringify(result));

    logger.info(`AI stack analysis completed for project ${projectId}`);
    return result;
  } catch (error) {
    logger.error(
      `AI stack analysis failed for project ${projectId}:`,
      error.message
    );

    // Return fallback analysis
    return generateFallbackStackAnalysis(repositoryUrl);
  }
};

// Analyze code quality
const analyzeCodeQuality = async (projectId, repositoryUrl, options = {}) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_code_quality:${projectId}`;

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      logger.info(`AI code quality cache hit for project ${projectId}`);
      return JSON.parse(cachedResult);
    }

    // Generate token for AI service
    const token = generateAiServiceToken(options.user);

    // Call AI service for code quality analysis
    const response = await aiServiceClient.post(
      "/service/v1/ai/analyze-code-quality",
      {
        repository_url: repositoryUrl,
        branch: options.branch || "main",
        project_id: projectId,
        include_security: options.includeSecurity || true,
        include_performance: options.includePerformance || true,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data.data;

    // Cache for 2 hours
    await redisClient.setex(cacheKey, 7200, JSON.stringify(result));

    logger.info(`AI code quality analysis completed for project ${projectId}`);
    return result;
  } catch (error) {
    logger.error(
      `AI code quality analysis failed for project ${projectId}:`,
      error.message
    );

    // Return fallback analysis
    return generateFallbackCodeQualityAnalysis();
  }
};

// Analyze security vulnerabilities
const analyzeSecurity = async (projectId, repositoryUrl, options = {}) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_security_analysis:${projectId}`;

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      logger.info(`AI security analysis cache hit for project ${projectId}`);
      return JSON.parse(cachedResult);
    }

    // Generate token for AI service
    const token = generateAiServiceToken(options.user);

    // Call AI service for security analysis
    const response = await aiServiceClient.post(
      "/service/v1/ai/analyze-security",
      {
        repository_url: repositoryUrl,
        branch: options.branch || "main",
        project_id: projectId,
        scan_dependencies: options.scanDependencies || true,
        scan_secrets: options.scanSecrets || true,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data.data;

    // Cache for 4 hours
    await redisClient.setex(cacheKey, 14400, JSON.stringify(result));

    logger.info(`AI security analysis completed for project ${projectId}`);
    return result;
  } catch (error) {
    logger.error(
      `AI security analysis failed for project ${projectId}:`,
      error.message
    );

    // Return fallback analysis
    return generateFallbackSecurityAnalysis();
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

    // Call AI service
    const response = await aiServiceClient.get(
      "/service/v1/ai/supported-technologies"
    );
    const result = response.data.data;

    // Cache for 24 hours
    await redisClient.setex(cacheKey, 86400, JSON.stringify(result));

    return result;
  } catch (error) {
    logger.error("Failed to get supported technologies:", error.message);

    // Return fallback technologies
    return {
      languages: ["JavaScript", "TypeScript", "Python", "Java", "Go", "PHP"],
      frameworks: [
        "React",
        "Vue",
        "Angular",
        "Express",
        "FastAPI",
        "Django",
        "Spring Boot",
      ],
      databases: ["MongoDB", "PostgreSQL", "MySQL", "Redis"],
      cloud_providers: ["AWS", "Google Cloud", "Azure"],
    };
  }
};

// Fallback functions
const generateFallbackStackAnalysis = (repositoryUrl) => {
  return {
    technology: {
      language: "JavaScript",
      framework: "Node.js",
      database: null,
      deployment_type: "container",
    },
    files_analyzed: 0,
    confidence_score: 0.1,
    recommendations: [
      "Unable to analyze repository automatically",
      "Please verify repository accessibility",
      "Consider manual configuration",
    ],
    fallback: true,
  };
};

const generateFallbackCodeQualityAnalysis = () => {
  return {
    overall_score: 60,
    maintainability: 60,
    reliability: 70,
    security: 50,
    issues: [
      {
        type: "warning",
        message: "Analysis service unavailable",
        severity: "medium",
      },
    ],
    recommendations: [
      "Run local code quality tools",
      "Implement linting",
      "Add unit tests",
    ],
    fallback: true,
  };
};

const generateFallbackSecurityAnalysis = () => {
  return {
    security_score: 70,
    vulnerabilities: [],
    dependencies: {
      total: 0,
      vulnerable: 0,
      outdated: 0,
    },
    secrets_found: 0,
    recommendations: [
      "Security analysis service unavailable",
      "Run manual security audit",
      "Update dependencies regularly",
    ],
    fallback: true,
  };
};

module.exports = {
  analyzeRepository,
  analyzeCodeQuality,
  analyzeSecurity,
  getSupportedTechnologies,
};
