// Deployment Controllers Module Export
// Implements the modular controller layer from BACKEND_ARCHITECTURE_PLAN.md

const deploymentController = require("./deploymentController");
const containerController = require("./containerController");
const logsController = require("./logsController");

module.exports = {
  deployment: deploymentController,
  container: containerController,
  logs: logsController,

  // Flat exports for backward compatibility
  ...deploymentController,
  ...containerController,
  ...logsController,
};
