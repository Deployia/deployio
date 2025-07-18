// Master Controllers Index - Import Aliases & Clean Module Access
// Enables clean imports like: const { user, project, ai } = require('@controllers');

const ai = require("./ai");
const deployment = require("./deployment/deploymentController");
const user = require("./user");
const project = require("./project");
const git = require("./git");
const admin = require("./admin");
const external = require("./external");
const api = require("./api");

module.exports = {
  // New modular structure
  ai,
  deployment,
  user,
  project,
  git,
  admin,
  external,
  api,
};
