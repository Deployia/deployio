const {
  aiServiceClient,
  generateAiServiceToken,
} = require("./aiServiceClient");
const { getRedisClient } = require("@config/redisClient");
const logger = require("@config/logger");

// Optimize project performance
const optimizePerformance = async (projectId, currentConfig, metrics, user) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_performance_optimization:${projectId}`;

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      logger.info(
        `AI performance optimization cache hit for project ${projectId}`
      );
      return JSON.parse(cachedResult);
    }

    // Generate token for AI service
    const token = generateAiServiceToken(user);

    // Call AI service for performance optimization
    const response = await aiServiceClient.post(
      "/service/v1/ai/optimize-performance",
      {
        project_id: projectId,
        current_config: currentConfig,
        performance_metrics: metrics,
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

    logger.info(
      `AI performance optimization completed for project ${projectId}`
    );
    return result;
  } catch (error) {
    logger.error(
      `AI performance optimization failed for project ${projectId}:`,
      error.message
    );

    // Return fallback optimization
    return generateFallbackPerformanceOptimization();
  }
};

// Optimize project security
const optimizeSecurity = async (projectId, securityConfig, options, user) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_security_optimization:${projectId}`;

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      logger.info(
        `AI security optimization cache hit for project ${projectId}`
      );
      return JSON.parse(cachedResult);
    }

    // Generate token for AI service
    const token = generateAiServiceToken(user);

    // Call AI service for security optimization
    const response = await aiServiceClient.post(
      "/service/v1/ai/optimize-security",
      {
        project_id: projectId,
        security_config: securityConfig,
        options,
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

    logger.info(`AI security optimization completed for project ${projectId}`);
    return result;
  } catch (error) {
    logger.error(
      `AI security optimization failed for project ${projectId}:`,
      error.message
    );

    // Return fallback optimization
    return generateFallbackSecurityOptimization();
  }
};

// Optimize costs
const optimizeCosts = async (projectId, costConfig, options, user) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_cost_optimization:${projectId}`;

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      logger.info(`AI cost optimization cache hit for project ${projectId}`);
      return JSON.parse(cachedResult);
    }

    // Generate token for AI service
    const token = generateAiServiceToken(user);

    // Call AI service for cost optimization
    const response = await aiServiceClient.post(
      "/service/v1/ai/optimize-costs",
      {
        project_id: projectId,
        cost_config: costConfig,
        options,
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

    logger.info(`AI cost optimization completed for project ${projectId}`);
    return result;
  } catch (error) {
    logger.error(
      `AI cost optimization failed for project ${projectId}:`,
      error.message
    );

    // Return fallback optimization
    return generateFallbackCostOptimization();
  }
};

// Generate comprehensive recommendations
const generateRecommendations = async (projectId, analysisResults, user) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_recommendations:${projectId}`;

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      logger.info(`AI recommendations cache hit for project ${projectId}`);
      return JSON.parse(cachedResult);
    }

    // Generate token for AI service
    const token = generateAiServiceToken(user);

    // Call AI service for recommendations
    const response = await aiServiceClient.post(
      "/service/v1/ai/generate-recommendations",
      {
        project_id: projectId,
        analysis_results: analysisResults,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data.data;

    // Cache for 30 minutes
    await redisClient.setex(cacheKey, 1800, JSON.stringify(result));

    logger.info(`AI recommendations generated for project ${projectId}`);
    return result;
  } catch (error) {
    logger.error(
      `AI recommendations failed for project ${projectId}:`,
      error.message
    );

    // Return fallback recommendations
    return generateFallbackRecommendations();
  }
};

// Analyze general optimization opportunities
const analyzeOptimization = async (
  projectId,
  currentConfig,
  performanceMetrics,
  user
) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_optimization:${projectId}`;

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      logger.info(
        `AI optimization analysis cache hit for project ${projectId}`
      );
      return JSON.parse(cachedResult);
    }

    // Generate token for AI service
    const token = generateAiServiceToken(user);

    // Call AI service for optimization analysis
    const response = await aiServiceClient.post(
      "/service/v1/ai/analyze-optimization",
      {
        project_id: projectId,
        current_config: currentConfig,
        performance_metrics: performanceMetrics,
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

    logger.info(`AI optimization analysis completed for project ${projectId}`);
    return result;
  } catch (error) {
    logger.error(
      `AI optimization analysis failed for project ${projectId}:`,
      error.message
    );

    // Return fallback optimization analysis
    return {
      suggestions: [
        {
          type: "performance",
          title: "Basic Optimization",
          description: "Enable basic performance optimizations",
          priority: "medium",
          implementation: {
            caching: "Enable response caching",
            compression: "Enable gzip compression",
          },
          impact: "Improved response times",
        },
      ],
      overall_score: 50,
      priority_actions: ["Review deployment configuration"],
      fallback: true,
    };
  }
};

// Fallback optimization functions
const generateFallbackPerformanceOptimization = () => {
  return {
    optimizations: [
      {
        type: "caching",
        title: "Enable Response Caching",
        description: "Implement caching to reduce response times",
        impact: "High",
        effort: "Medium",
      },
      {
        type: "compression",
        title: "Enable Gzip Compression",
        description: "Compress responses to reduce bandwidth",
        impact: "Medium",
        effort: "Low",
      },
    ],
    performance_score: 60,
    estimated_improvement: "20-30%",
    fallback: true,
  };
};

const generateFallbackSecurityOptimization = () => {
  return {
    optimizations: [
      {
        type: "dependencies",
        title: "Update Dependencies",
        description: "Update outdated packages with security vulnerabilities",
        impact: "High",
        effort: "Medium",
      },
      {
        type: "headers",
        title: "Security Headers",
        description: "Add security headers to prevent common attacks",
        impact: "Medium",
        effort: "Low",
      },
    ],
    security_score: 70,
    vulnerabilities_addressed: 0,
    fallback: true,
  };
};

const generateFallbackCostOptimization = () => {
  return {
    optimizations: [
      {
        type: "resources",
        title: "Optimize Resource Usage",
        description: "Right-size containers and reduce resource consumption",
        potential_savings: "15-25%",
        effort: "Medium",
      },
      {
        type: "scaling",
        title: "Auto-scaling Configuration",
        description: "Implement auto-scaling to reduce costs during low usage",
        potential_savings: "10-20%",
        effort: "High",
      },
    ],
    cost_score: 65,
    estimated_monthly_savings: "$0-50",
    fallback: true,
  };
};

const generateFallbackRecommendations = () => {
  return {
    recommendations: [
      {
        category: "performance",
        priority: "high",
        title: "Enable Caching",
        description: "Implement caching to improve response times",
      },
      {
        category: "security",
        priority: "high",
        title: "Update Dependencies",
        description: "Keep dependencies up to date for security",
      },
      {
        category: "cost",
        priority: "medium",
        title: "Optimize Resources",
        description: "Right-size your infrastructure resources",
      },
    ],
    overall_health_score: 70,
    next_steps: [
      "Implement basic performance optimizations",
      "Set up monitoring and alerting",
      "Review security configuration",
    ],
    fallback: true,
  };
};

module.exports = {
  optimizePerformance,
  optimizeSecurity,
  optimizeCosts,
  generateRecommendations,
  analyzeOptimization,
};
