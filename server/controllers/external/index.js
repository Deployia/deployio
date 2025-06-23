// External Controllers Module - New Modular Architecture
// Organizes external service controllers according to BACKEND_ARCHITECTURE_PLAN.md

const blogController = require("./blogController");
const documentationController = require("./documentationController");
const notificationController = require("./notificationController");

module.exports = {
  blog: blogController,
  documentation: documentationController,
  notification: notificationController,
};
