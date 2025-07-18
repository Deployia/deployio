// Project Services Module - New Modular Architecture
// Organizes project-related services according to BACKEND_ARCHITECTURE_PLAN.md

const projectCreationService = require("./projectCreationService");
const projectService = require("./projectService"); // ADD THIS

module.exports = {
  // Project creation service (intelligent flow)
  creation: projectCreationService,

  // Project CRUD service (main operations) - ADD THIS
  projectService: projectService,

  // Direct exports for convenience
  ...projectCreationService,
  ...projectService,
};
