// Project Controllers Module Export
// Implements the modular controller layer from BACKEND_ARCHITECTURE_PLAN.md

const projectCreationController = require('./projectCreationController');

module.exports = {
  // Project creation controller (new intelligent flow)
  creation: projectCreationController,

  // Export creation controller methods for direct access
  ...projectCreationController,
};
