// Project Services Module - New Modular Architecture
// Organizes project-related services according to BACKEND_ARCHITECTURE_PLAN.md

const projectCreationService = require('./projectCreationService');

module.exports = {
  // Project creation service (intelligent flow)
  creation: projectCreationService,

  // Direct exports for convenience
  ...projectCreationService,
};
