// Master Controllers Index - Import Aliases & Clean Module Access
// Enables clean imports like: const { user, project, ai } = require('@controllers');

const ai = require("./ai");
const deployment = require("./deployment");
const user = require("./user");
const project = require("./project");
const admin = require("./admin");
const external = require("./external");

module.exports = {
  // New modular structure
  ai,
  deployment,
  user,
  project,
  admin,
  external,
};
