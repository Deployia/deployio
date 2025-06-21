const axios = require("axios");
const logger = require("../../config/logger");

// Deployment Agent configuration
const AGENT_SERVICE_URL =
  process.env.AGENT_SERVICE_URL || "http://localhost:8001";
const AGENT_SERVICE_TIMEOUT = 60000; // 60 seconds for deployments

// Create axios instance for deployment agent
const deploymentClient = axios.create({
  baseURL: AGENT_SERVICE_URL,
  timeout: AGENT_SERVICE_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    "X-Internal-Service": "deployio-backend",
    "X-Service-Token": process.env.AGENT_SERVICE_TOKEN,
  },
});

// Add response interceptor for error handling
deploymentClient.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error("Deployment Agent Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    throw error;
  }
);

// Deploy project to agent
const deployProject = async (projectId, deploymentConfig) => {
  try {
    logger.info(`Initiating deployment for project ${projectId}`);

    const response = await deploymentClient.post("/deploy", {
      project_id: projectId,
      deployment_config: deploymentConfig,
    });

    const result = response.data;
    logger.info(
      `Deployment initiated for project ${projectId}:`,
      result.deployment_id
    );

    return result;
  } catch (error) {
    logger.error(`Deployment failed for project ${projectId}:`, error.message);
    throw new Error(`Deployment initiation failed: ${error.message}`);
  }
};

// Get deployment status from agent
const getDeploymentStatus = async (deploymentId) => {
  try {
    const response = await deploymentClient.get(
      `/deployments/${deploymentId}/status`
    );
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to get deployment status for ${deploymentId}:`,
      error.message
    );
    throw new Error(`Failed to get deployment status: ${error.message}`);
  }
};

// Get deployment logs from agent
const getDeploymentLogs = async (deploymentId, options = {}) => {
  try {
    const params = new URLSearchParams();
    if (options.lines) params.append("lines", options.lines);
    if (options.since) params.append("since", options.since);
    if (options.follow) params.append("follow", options.follow);

    const response = await deploymentClient.get(
      `/deployments/${deploymentId}/logs?${params.toString()}`
    );

    return response.data;
  } catch (error) {
    logger.error(
      `Failed to get deployment logs for ${deploymentId}:`,
      error.message
    );
    throw new Error(`Failed to get deployment logs: ${error.message}`);
  }
};

// Stop deployment on agent
const stopDeployment = async (deploymentId) => {
  try {
    logger.info(`Stopping deployment ${deploymentId}`);

    const response = await deploymentClient.post(
      `/deployments/${deploymentId}/stop`
    );

    logger.info(`Deployment ${deploymentId} stopped successfully`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to stop deployment ${deploymentId}:`, error.message);
    throw new Error(`Failed to stop deployment: ${error.message}`);
  }
};

// Get deployment metrics
const getDeploymentMetrics = async (deploymentId) => {
  try {
    const response = await deploymentClient.get(
      `/deployments/${deploymentId}/metrics`
    );
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to get deployment metrics for ${deploymentId}:`,
      error.message
    );
    return {
      cpu_usage: 0,
      memory_usage: 0,
      network_io: 0,
      disk_io: 0,
      uptime: 0,
      error: error.message,
    };
  }
};

// Health check for deployment agent
const checkAgentHealth = async () => {
  try {
    const response = await deploymentClient.get("/health");
    return {
      status: "healthy",
      agent_version: response.data.version,
      uptime: response.data.uptime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Deployment agent health check failed:", error.message);
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

module.exports = {
  deploymentClient,
  deployProject,
  getDeploymentStatus,
  getDeploymentLogs,
  stopDeployment,
  getDeploymentMetrics,
  checkAgentHealth,
};
