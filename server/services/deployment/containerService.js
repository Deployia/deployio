const { deploymentClient } = require("./deploymentClient");
const logger = require("../../config/logger");

// Get container status
const getContainerStatus = async (containerId) => {
  try {
    const response = await deploymentClient.get(
      `/containers/${containerId}/status`
    );
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to get container status for ${containerId}:`,
      error.message
    );
    throw new Error(`Failed to get container status: ${error.message}`);
  }
};

// Get container logs
const getContainerLogs = async (containerId, options = {}) => {
  try {
    const params = new URLSearchParams();
    if (options.lines) params.append("lines", options.lines);
    if (options.since) params.append("since", options.since);
    if (options.follow) params.append("follow", options.follow);
    if (options.timestamps) params.append("timestamps", options.timestamps);

    const response = await deploymentClient.get(
      `/containers/${containerId}/logs?${params.toString()}`
    );

    return response.data;
  } catch (error) {
    logger.error(
      `Failed to get container logs for ${containerId}:`,
      error.message
    );
    throw new Error(`Failed to get container logs: ${error.message}`);
  }
};

// Restart container
const restartContainer = async (containerId) => {
  try {
    logger.info(`Restarting container ${containerId}`);

    const response = await deploymentClient.post(
      `/containers/${containerId}/restart`
    );

    logger.info(`Container ${containerId} restarted successfully`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to restart container ${containerId}:`, error.message);
    throw new Error(`Failed to restart container: ${error.message}`);
  }
};

// Update container configuration
const updateContainer = async (containerId, config) => {
  try {
    logger.info(`Updating container ${containerId} configuration`);

    const response = await deploymentClient.put(`/containers/${containerId}`, {
      configuration: config,
    });

    logger.info(`Container ${containerId} configuration updated successfully`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to update container ${containerId}:`, error.message);
    throw new Error(`Failed to update container: ${error.message}`);
  }
};

// Get container metrics
const getContainerMetrics = async (containerId) => {
  try {
    const response = await deploymentClient.get(
      `/containers/${containerId}/metrics`
    );
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to get container metrics for ${containerId}:`,
      error.message
    );
    return {
      cpu_usage: 0,
      memory_usage: 0,
      network_io: { rx_bytes: 0, tx_bytes: 0 },
      disk_io: { read_bytes: 0, write_bytes: 0 },
      uptime: 0,
      error: error.message,
    };
  }
};

// Stop container
const stopContainer = async (containerId) => {
  try {
    logger.info(`Stopping container ${containerId}`);

    const response = await deploymentClient.post(
      `/containers/${containerId}/stop`
    );

    logger.info(`Container ${containerId} stopped successfully`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to stop container ${containerId}:`, error.message);
    throw new Error(`Failed to stop container: ${error.message}`);
  }
};

// Start container
const startContainer = async (containerId) => {
  try {
    logger.info(`Starting container ${containerId}`);

    const response = await deploymentClient.post(
      `/containers/${containerId}/start`
    );

    logger.info(`Container ${containerId} started successfully`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to start container ${containerId}:`, error.message);
    throw new Error(`Failed to start container: ${error.message}`);
  }
};

// List all containers for a project
const listProjectContainers = async (projectId) => {
  try {
    const response = await deploymentClient.get(
      `/projects/${projectId}/containers`
    );
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to list containers for project ${projectId}:`,
      error.message
    );
    return [];
  }
};

// Execute command in container
const execInContainer = async (containerId, command, options = {}) => {
  try {
    const response = await deploymentClient.post(
      `/containers/${containerId}/exec`,
      {
        command,
        interactive: options.interactive || false,
        tty: options.tty || false,
        working_dir: options.workingDir || "/app",
      }
    );

    return response.data;
  } catch (error) {
    logger.error(
      `Failed to execute command in container ${containerId}:`,
      error.message
    );
    throw new Error(`Failed to execute command: ${error.message}`);
  }
};

module.exports = {
  getContainerStatus,
  getContainerLogs,
  restartContainer,
  updateContainer,
  getContainerMetrics,
  stopContainer,
  startContainer,
  listProjectContainers,
  execInContainer,
};
