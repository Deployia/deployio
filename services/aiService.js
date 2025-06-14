const axios = require('axios');
const { getRedisClient } = require('../config/redisClient');
const logger = require('../config/logger');

// AI Service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_TIMEOUT = 30000; // 30 seconds

// Create axios instance for AI service
const aiServiceClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: AI_SERVICE_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Service': 'deployio-backend', // Internal service identification
  },
});

// Add request interceptor to include JWT token
aiServiceClient.interceptors.request.use((config) => {
  // Add any additional headers or auth tokens here
  return config;
});

// Add response interceptor for error handling
aiServiceClient.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('AI Service Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    throw error;
  }
);

// Cache management
const invalidateAiCache = async (projectId) => {
  try {
    const redisClient = getRedisClient();
    const patterns = [
      `ai_stack_analysis:${projectId}`,
      `ai_dockerfile:${projectId}`,
      `ai_optimization:${projectId}`,
    ];

    for (const pattern of patterns) {
      await redisClient.del(pattern);
    }
  } catch (error) {
    logger.error('Error invalidating AI cache:', error);
  }
};

// Generate JWT token for AI service communication
const generateAiServiceToken = (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Analyze project technology stack
const analyzeProjectStack = async (projectId, repositoryUrl, branch = 'main', user) => {
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
    const response = await aiServiceClient.post('/service/v1/ai/analyze-stack', {
      repository_url: repositoryUrl,
      branch,
      project_id: projectId,
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = response.data.data;

    // Cache the result for 1 hour
    await redisClient.setex(cacheKey, 3600, JSON.stringify(result));

    logger.info(`AI stack analysis completed for project ${projectId}`, {
      confidence: result.confidence_score,
      framework: result.technology.framework,
      language: result.technology.language,
    });

    return result;
  } catch (error) {
    logger.error(`AI stack analysis failed for project ${projectId}:`, error.message);
    
    // Return fallback analysis if AI service is unavailable
    return {
      technology: {
        framework: null,
        language: null,
        database: null,
        build_tool: null,
        confidence: 0,
      },
      detected_files: [],
      recommendations: [{
        type: 'fallback',
        title: 'Manual Configuration Required',
        description: 'AI analysis unavailable. Please configure technology stack manually.',
      }],
      confidence_score: 0,
      fallback: true,
    };
  }
};

// Generate Dockerfile configuration
const generateDockerfile = async (projectId, technologyStack, buildConfig, user) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_dockerfile:${projectId}`;

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      logger.info(`AI Dockerfile generation cache hit for project ${projectId}`);
      return JSON.parse(cachedResult);
    }

    // Generate token for AI service
    const token = generateAiServiceToken(user);

    // Call AI service for Dockerfile generation
    const response = await aiServiceClient.post('/service/v1/ai/generate-dockerfile', {
      project_id: projectId,
      technology_stack: technologyStack,
      build_command: buildConfig.buildCommand,
      start_command: buildConfig.startCommand,
      port: buildConfig.port || 3000,
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = response.data.data;

    // Cache the result for 2 hours
    await redisClient.setex(cacheKey, 7200, JSON.stringify(result));

    logger.info(`AI Dockerfile generation completed for project ${projectId}`);

    return result;
  } catch (error) {
    logger.error(`AI Dockerfile generation failed for project ${projectId}:`, error.message);
    
    // Return fallback Dockerfile
    return {
      dockerfile_content: generateFallbackDockerfile(technologyStack),
      docker_compose_content: generateFallbackDockerCompose(projectId),
      build_instructions: ['Generic Docker configuration generated'],
      optimization_notes: ['AI optimization unavailable - using standard configuration'],
      fallback: true,
    };
  }
};

// Analyze optimization opportunities
const analyzeOptimization = async (projectId, currentConfig, performanceMetrics, user) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_optimization:${projectId}`;

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      logger.info(`AI optimization analysis cache hit for project ${projectId}`);
      return JSON.parse(cachedResult);
    }

    // Generate token for AI service
    const token = generateAiServiceToken(user);

    // Call AI service for optimization analysis
    const response = await aiServiceClient.post('/service/v1/ai/optimize-deployment', {
      project_id: projectId,
      current_config: currentConfig,
      performance_metrics: performanceMetrics,
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = response.data.data;

    // Cache the result for 30 minutes
    await redisClient.setex(cacheKey, 1800, JSON.stringify(result));

    logger.info(`AI optimization analysis completed for project ${projectId}`, {
      suggestions_count: result.suggestions.length,
      overall_score: result.overall_score,
    });

    return result;
  } catch (error) {
    logger.error(`AI optimization analysis failed for project ${projectId}:`, error.message);
    
    // Return fallback optimization suggestions
    return {
      suggestions: [
        {
          type: 'performance',
          title: 'Basic Optimization',
          description: 'Enable basic performance optimizations',
          priority: 'medium',
          implementation: {
            caching: 'Enable response caching',
            compression: 'Enable gzip compression',
          },
          impact: 'Improved response times',
        }
      ],
      overall_score: 50,
      priority_actions: ['Review deployment configuration'],
      fallback: true,
    };
  }
};

// Get supported technologies from AI service
const getSupportedTechnologies = async () => {
  const redisClient = getRedisClient();
  const cacheKey = 'ai_supported_technologies';

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    // Call AI service
    const response = await aiServiceClient.get('/service/v1/ai/supported-technologies');
    const result = response.data.data;

    // Cache for 24 hours
    await redisClient.setex(cacheKey, 86400, JSON.stringify(result));

    return result;
  } catch (error) {
    logger.error('Failed to get supported technologies from AI service:', error.message);
    
    // Return fallback list
    return {
      frameworks: ['React', 'Vue.js', 'Angular', 'Node.js', 'Express', 'Next.js'],
      languages: ['JavaScript', 'TypeScript', 'Python', 'Java'],
      databases: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis'],
      build_tools: ['npm', 'yarn', 'pip', 'maven'],
    };
  }
};

// Check AI service health
const checkAiServiceHealth = async () => {
  try {
    const response = await aiServiceClient.get('/service/v1/health', {
      timeout: 5000, // 5 seconds for health check
    });
    
    return {
      status: response.data.status === 'ok' ? 'healthy' : 'unhealthy',
      service_name: response.data.service_name,
      uptime: response.data.uptime,
      redis_status: response.data.redis_status,
      purpose: response.data.purpose,
    };
  } catch (error) {
    logger.error('AI service health check failed:', error.message);
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Fallback functions
const generateFallbackDockerfile = (technologyStack) => {
  if (technologyStack.language === 'JavaScript') {
    return `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`;
  } else if (technologyStack.language === 'Python') {
    return `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]`;
  }
  
  return `FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]`;
};

const generateFallbackDockerCompose = (projectId) => {
  return `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
  # Add database and other services as needed`;
};

module.exports = {
  analyzeProjectStack,
  generateDockerfile,
  analyzeOptimization,
  getSupportedTechnologies,
  checkAiServiceHealth,
  invalidateAiCache,
};
