const { deploymentClient } = require("./deploymentClient");
const logger = require("@config/logger");

// Create subdomain for project
const createSubdomain = async (projectId, subdomainConfig) => {
  try {
    logger.info(
      `Creating subdomain for project ${projectId}:`,
      subdomainConfig.subdomain
    );

    const response = await deploymentClient.post("/subdomains", {
      project_id: projectId,
      subdomain: subdomainConfig.subdomain,
      domain: subdomainConfig.domain || "deployio.dev",
      target_port: subdomainConfig.targetPort || 3000,
      ssl_enabled: subdomainConfig.sslEnabled !== false,
      custom_headers: subdomainConfig.customHeaders || {},
      rate_limiting: subdomainConfig.rateLimiting || {},
    });

    const result = response.data;
    logger.info(`Subdomain created successfully: ${result.full_domain}`);

    return result;
  } catch (error) {
    logger.error(
      `Failed to create subdomain for project ${projectId}:`,
      error.message
    );
    throw new Error(`Failed to create subdomain: ${error.message}`);
  }
};

// Update subdomain configuration
const updateSubdomain = async (subdomainId, config) => {
  try {
    logger.info(`Updating subdomain ${subdomainId}`);

    const response = await deploymentClient.put(`/subdomains/${subdomainId}`, {
      configuration: config,
    });

    const result = response.data;
    logger.info(`Subdomain ${subdomainId} updated successfully`);

    return result;
  } catch (error) {
    logger.error(`Failed to update subdomain ${subdomainId}:`, error.message);
    throw new Error(`Failed to update subdomain: ${error.message}`);
  }
};

// Delete subdomain
const deleteSubdomain = async (subdomainId) => {
  try {
    logger.info(`Deleting subdomain ${subdomainId}`);

    const response = await deploymentClient.delete(
      `/subdomains/${subdomainId}`
    );

    logger.info(`Subdomain ${subdomainId} deleted successfully`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to delete subdomain ${subdomainId}:`, error.message);
    throw new Error(`Failed to delete subdomain: ${error.message}`);
  }
};

// Get subdomain status
const getSubdomainStatus = async (subdomainId) => {
  try {
    const response = await deploymentClient.get(
      `/subdomains/${subdomainId}/status`
    );
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to get subdomain status for ${subdomainId}:`,
      error.message
    );
    throw new Error(`Failed to get subdomain status: ${error.message}`);
  }
};

// List all subdomains for a project
const listProjectSubdomains = async (projectId) => {
  try {
    const response = await deploymentClient.get(
      `/projects/${projectId}/subdomains`
    );
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to list subdomains for project ${projectId}:`,
      error.message
    );
    return [];
  }
};

// Get subdomain metrics (traffic, requests, etc.)
const getSubdomainMetrics = async (subdomainId, timeframe = "24h") => {
  try {
    const response = await deploymentClient.get(
      `/subdomains/${subdomainId}/metrics?timeframe=${timeframe}`
    );
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to get subdomain metrics for ${subdomainId}:`,
      error.message
    );
    return {
      requests: 0,
      unique_visitors: 0,
      response_times: {
        avg: 0,
        p95: 0,
        p99: 0,
      },
      status_codes: {},
      bandwidth: {
        incoming: 0,
        outgoing: 0,
      },
      error: error.message,
    };
  }
};

// Check subdomain availability
const checkSubdomainAvailability = async (
  subdomain,
  domain = "deployio.dev"
) => {
  try {
    const response = await deploymentClient.get(
      `/subdomains/check-availability?subdomain=${subdomain}&domain=${domain}`
    );
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to check subdomain availability for ${subdomain}:`,
      error.message
    );
    return {
      available: false,
      error: error.message,
    };
  }
};

// Generate SSL certificate for subdomain
const generateSSLCertificate = async (subdomainId) => {
  try {
    logger.info(`Generating SSL certificate for subdomain ${subdomainId}`);

    const response = await deploymentClient.post(
      `/subdomains/${subdomainId}/ssl/generate`
    );

    logger.info(`SSL certificate generated for subdomain ${subdomainId}`);
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to generate SSL certificate for subdomain ${subdomainId}:`,
      error.message
    );
    throw new Error(`Failed to generate SSL certificate: ${error.message}`);
  }
};

// Renew SSL certificate for subdomain
const renewSSLCertificate = async (subdomainId) => {
  try {
    logger.info(`Renewing SSL certificate for subdomain ${subdomainId}`);

    const response = await deploymentClient.post(
      `/subdomains/${subdomainId}/ssl/renew`
    );

    logger.info(`SSL certificate renewed for subdomain ${subdomainId}`);
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to renew SSL certificate for subdomain ${subdomainId}:`,
      error.message
    );
    throw new Error(`Failed to renew SSL certificate: ${error.message}`);
  }
};

module.exports = {
  createSubdomain,
  updateSubdomain,
  deleteSubdomain,
  getSubdomainStatus,
  listProjectSubdomains,
  getSubdomainMetrics,
  checkSubdomainAvailability,
  generateSSLCertificate,
  renewSSLCertificate,
};
