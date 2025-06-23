// AI Service Module - Centralized exports for all AI functionality
const {
  aiServiceClient,
  checkAiServiceHealth,
  getDetailedAiServiceHealth,
} = require("./aiServiceClient");
const {
  analyzeRepository,
  detectTechnologyStack,
  analyzeCodeQuality,
  analyzeDependencies,
  getAnalysisProgress,
  getSupportedTechnologies,
  analyzeProjectStack, // Legacy compatibility
} = require("./analysisService");
const {
  generateDockerfile,
  generatePipeline,
  generateCompose,
  generateKubernetes,
} = require("./generationService");
const {
  optimizePerformance,
  optimizeSecurity,
  optimizeCosts,
  generateRecommendations,
  analyzeOptimization,
} = require("./optimizationService");
const { getRedisClient } = require("@config/redisClient");
const logger = require("@config/logger");

// Cache management utility
const invalidateAiCache = async (projectId) => {
  try {
    const redisClient = getRedisClient();
    const patterns = [
      `ai_stack_analysis:${projectId}`,
      `ai_dockerfile:${projectId}`,
      `ai_optimization:${projectId}`,
      `ai_pipeline:${projectId}`,
      `ai_environment:${projectId}`,
      `ai_build_optimization:${projectId}`,
      `ai_code_quality:${projectId}`,
      `ai_security_analysis:${projectId}`,
      `ai_performance_optimization:${projectId}`,
      `ai_security_optimization:${projectId}`,
      `ai_cost_optimization:${projectId}`,
      `ai_recommendations:${projectId}`,
      `ai_compose:${projectId}`,
      `ai_kubernetes:${projectId}`,
    ];

    for (const pattern of patterns) {
      await redisClient.del(pattern);
    }

    logger.info(`AI cache invalidated for project ${projectId}`);
  } catch (error) {
    logger.error("Error invalidating AI cache:", error.message);
  }
};

const generateEnvironmentConfig = async (
  projectId,
  environmentConfig,
  user
) => {
  // This could be expanded to call a specific environment config generation service
  // For now, we'll use the compose generation as a base
  return generateCompose(
    projectId,
    {
      environment: environmentConfig.environment || "production",
      services: environmentConfig.services || [],
      networks: environmentConfig.networks || {},
      volumes: environmentConfig.volumes || {},
    },
    user
  );
};

const generateBuildOptimization = async (
  projectId,
  technologyStack,
  optimizationConfig,
  user
) => {
  // This could be expanded to call a specific build optimization service
  // For now, we'll use the performance optimization as a base
  return optimizePerformance(
    projectId,
    {
      technology: technologyStack,
      build_config: optimizationConfig,
    },
    {
      build_time: optimizationConfig.currentBuildTime || 300,
      bundle_size: optimizationConfig.currentBundleSize || 1000000,
    },
    user
  );
};

module.exports = {
  // Client and health
  aiServiceClient,
  checkAiServiceHealth,
  getDetailedAiServiceHealth,

  // Analysis services
  analyzeRepository,
  detectTechnologyStack,
  analyzeCodeQuality,
  analyzeDependencies,
  getAnalysisProgress,
  getSupportedTechnologies,
  analyzeProjectStack, // Legacy compatibility

  // Generation services
  generateDockerfile,
  generatePipeline,
  generateCompose,
  generateKubernetes,
  generateEnvironmentConfig, // Legacy compatibility
  generateBuildOptimization, // Legacy compatibility

  // Optimization services
  optimizePerformance,
  optimizeSecurity,
  optimizeCosts,
  generateRecommendations,
  analyzeOptimization,

  // Utilities
  invalidateAiCache,
};
