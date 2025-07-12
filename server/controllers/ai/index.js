// AI Controllers Module Export
// Implements the modular controller layer from BACKEND_ARCHITECTURE_PLAN.md

const analysisController = require("./analysisController");
const aiChatController = require("./aiChatController");

module.exports = {
  analysis: analysisController,
  aiChat: aiChatController,

  // Flat exports for backward compatibility
  ...analysisController,
};
