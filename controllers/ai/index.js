// AI Controllers Module Export
// Implements the modular controller layer from BACKEND_ARCHITECTURE_PLAN.md

const analysisController = require("./analysisController");
const generationController = require("./generationController");
const optimizationController = require("./optimizationController");

module.exports = {
  analysis: analysisController,
  generation: generationController,
  optimization: optimizationController,

  // Flat exports for backward compatibility
  ...analysisController,
  ...generationController,
  ...optimizationController,
};
