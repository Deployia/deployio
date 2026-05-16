const dashboardController = require("./dashboardController");
const usersController = require("./usersController");
const projectsController = require("./projectsController");
const deploymentsController = require("./deploymentsController");
const subdomainsController = require("./subdomainsController");
const activityController = require("./activityController");
const notificationsController = require("./notificationsController");

module.exports = {
  admin: {
    ...dashboardController,
    ...usersController,
    ...projectsController,
    ...deploymentsController,
    ...subdomainsController,
    ...activityController,
    ...notificationsController,
  },
};
