// Project Controllers Module Export
// Implements the modular controller layer from BACKEND_ARCHITECTURE_PLAN.md

const projectController = require("./projectController");
const repositoryController = require("./repositoryController");
const settingsController = require("./settingsController");

module.exports = {
  project: projectController,
  repository: repositoryController,
  settings: settingsController,

  // Flat exports for backward compatibility
  ...projectController,
  ...repositoryController,
  ...settingsController,
};
