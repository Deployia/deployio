// User Services Module - New Modular Architecture
// Organizes user-related services according to BACKEND_ARCHITECTURE_PLAN.md

const authService = require("./authService");
const userService = require("./userService");

module.exports = {
  auth: authService,
  user: userService,
};
