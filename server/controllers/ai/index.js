// AI Controllers Module Export
// Implements the modular controller layer from BACKEND_ARCHITECTURE_PLAN.md

const analysisController = require("./analysisController");

module.exports = {
  analysis: analysisController,
 
  // Flat exports for backward compatibility
  ...analysisController
};
