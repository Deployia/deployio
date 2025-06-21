// External Services Module - New Modular Architecture
// Organizes external integration services according to BACKEND_ARCHITECTURE_PLAN.md

const emailService = require("./emailService");
const blogService = require("./blogService");
const documentationService = require("./documentationService");

module.exports = {
  email: emailService,
  blog: blogService,
  documentation: documentationService,
};
