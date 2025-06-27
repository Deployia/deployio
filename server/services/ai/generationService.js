const {
  aiServiceClient,
  generateAiServiceToken,
} = require("./aiServiceClient");
const { getRedisClient } = require("@config/redisClient");
const logger = require("@config/logger");

// Generate Dockerfile configuration
const generateDockerfile = async (
  projectId,
  technologyStack,
  buildConfig,
  user
) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_dockerfile:${projectId}`;

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      logger.info(
        `AI dockerfile generation cache hit for project ${projectId}`
      );
      return JSON.parse(cachedResult);
    }

    // Generate token for AI service
    const token = generateAiServiceToken(user);

    // Call AI service for dockerfile generation
    const response = await aiServiceClient.post(
      "/service/v1/ai/generate-dockerfile",
      {
        technology_stack: technologyStack,
        build_config: buildConfig,
        project_id: projectId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data.data;

    // Cache for 2 hours
    await redisClient.setEx(cacheKey, 7200, JSON.stringify(result));

    logger.info(`AI dockerfile generation completed for project ${projectId}`);
    return result;
  } catch (error) {
    logger.error(
      `AI dockerfile generation failed for project ${projectId}:`,
      error.message
    );

    // Return fallback dockerfile
    return {
      dockerfile: generateFallbackDockerfile(technologyStack),
      docker_compose: generateFallbackDockerCompose(projectId),
      build_args: [],
      optimizations: [],
      fallback: true,
    };
  }
};

// Generate CI/CD Pipeline configurations
const generatePipeline = async (projectId, pipelineConfig, user) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_pipeline:${projectId}`;

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      logger.info(`AI pipeline generation cache hit for project ${projectId}`);
      return JSON.parse(cachedResult);
    }

    // Generate token for AI service
    const token = generateAiServiceToken(user);

    // Call AI service for pipeline generation
    const response = await aiServiceClient.post(
      "/service/v1/ai/generate-pipeline",
      {
        project_id: projectId,
        ...pipelineConfig,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data.data;

    // Cache for 1 hour
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));

    logger.info(`AI pipeline generation completed for project ${projectId}`);
    return result;
  } catch (error) {
    logger.error(
      `AI pipeline generation failed for project ${projectId}:`,
      error.message
    );

    // Return fallback pipeline
    return {
      github_actions: generateFallbackGitHubActions(),
      gitlab_ci: null,
      azure_pipelines: null,
      jenkins: null,
      fallback: true,
    };
  }
};

// Generate Docker Compose configuration
const generateCompose = async (projectId, composeConfig, user) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_compose:${projectId}`;

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      logger.info(`AI compose generation cache hit for project ${projectId}`);
      return JSON.parse(cachedResult);
    }

    // Generate token for AI service
    const token = generateAiServiceToken(user);

    // Call AI service for compose generation
    const response = await aiServiceClient.post(
      "/service/v1/ai/generate-compose",
      {
        project_id: projectId,
        ...composeConfig,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data.data;

    // Cache for 2 hours
    await redisClient.setEx(cacheKey, 7200, JSON.stringify(result));

    logger.info(`AI compose generation completed for project ${projectId}`);
    return result;
  } catch (error) {
    logger.error(
      `AI compose generation failed for project ${projectId}:`,
      error.message
    );

    // Return fallback compose
    return {
      docker_compose: generateFallbackDockerCompose(projectId),
      services: [],
      networks: {},
      volumes: {},
      fallback: true,
    };
  }
};

// Generate Kubernetes configuration
const generateKubernetes = async (projectId, k8sConfig, user) => {
  const redisClient = getRedisClient();
  const cacheKey = `ai_kubernetes:${projectId}`;

  try {
    // Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      logger.info(
        `AI kubernetes generation cache hit for project ${projectId}`
      );
      return JSON.parse(cachedResult);
    }

    // Generate token for AI service
    const token = generateAiServiceToken(user);

    // Call AI service for kubernetes generation
    const response = await aiServiceClient.post(
      "/service/v1/ai/generate-kubernetes",
      {
        project_id: projectId,
        ...k8sConfig,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data.data;

    // Cache for 2 hours
    await redisClient.setEx(cacheKey, 7200, JSON.stringify(result));

    logger.info(`AI kubernetes generation completed for project ${projectId}`);
    return result;
  } catch (error) {
    logger.error(
      `AI kubernetes generation failed for project ${projectId}:`,
      error.message
    );

    // Return fallback kubernetes config
    return {
      deployment: generateFallbackK8sDeployment(projectId),
      service: generateFallbackK8sService(projectId),
      ingress: null,
      configmap: null,
      fallback: true,
    };
  }
};

// Fallback generation functions
const generateFallbackDockerfile = (technologyStack) => {
  if (technologyStack.language === "JavaScript") {
    return `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`;
  } else if (technologyStack.language === "Python") {
    return `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
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

const generateFallbackGitHubActions = () => {
  return `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy
      if: github.ref == 'refs/heads/main'
      run: echo "Deploy to production"
`;
};

const generateFallbackK8sDeployment = (projectId) => {
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${projectId}-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${projectId}-app
  template:
    metadata:
      labels:
        app: ${projectId}-app
    spec:
      containers:
      - name: app
        image: ${projectId}:latest
        ports:
        - containerPort: 3000`;
};

const generateFallbackK8sService = (projectId) => {
  return `apiVersion: v1
kind: Service
metadata:
  name: ${projectId}-service
spec:
  selector:
    app: ${projectId}-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer`;
};

module.exports = {
  generateDockerfile,
  generatePipeline,
  generateCompose,
  generateKubernetes,
};
