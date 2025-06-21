// Deployment Service Module - Centralized exports for all deployment functionality
const {
  deploymentClient,
  deployProject,
  getDeploymentStatus,
  getDeploymentLogs,
  stopDeployment,
  getDeploymentMetrics,
  checkAgentHealth,
} = require("./deploymentClient");

const {
  getContainerStatus,
  getContainerLogs,
  restartContainer,
  updateContainer,
  getContainerMetrics,
  stopContainer,
  startContainer,
  listProjectContainers,
  execInContainer,
} = require("./containerService");

const {
  createSubdomain,
  updateSubdomain,
  deleteSubdomain,
  getSubdomainStatus,
  listProjectSubdomains,
  getSubdomainMetrics,
  checkSubdomainAvailability,
  generateSSLCertificate,
  renewSSLCertificate,
} = require("./subdomainService");

module.exports = {
  // Deployment client and core operations
  deploymentClient,
  deployProject,
  getDeploymentStatus,
  getDeploymentLogs,
  stopDeployment,
  getDeploymentMetrics,
  checkAgentHealth,

  // Container management
  getContainerStatus,
  getContainerLogs,
  restartContainer,
  updateContainer,
  getContainerMetrics,
  stopContainer,
  startContainer,
  listProjectContainers,
  execInContainer,

  // Subdomain management
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
