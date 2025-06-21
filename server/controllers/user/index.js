// User Module Controllers - New Modular Architecture
// Organizes user-related controllers according to BACKEND_ARCHITECTURE_PLAN.md

const authController = require("./authController");
const userController = require("./userController");
const profileController = require("./profileController");

module.exports = {
  auth: authController,
  user: userController,
  profile: profileController,
};
