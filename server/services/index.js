// Master Services Index - Import Aliases & Clean Module Access
// Enables clean imports like: const { user, project, ai } = require('@services');

const ai = require("./ai");
const deployment = require("./deployment");
const user = require("./user");
const project = require("./project");
const external = require("./external");
const notification = require("./notification");

module.exports = {
  // New modular structure
  ai,
  deployment,
  user,
  project,
  external,
  notification,
};
