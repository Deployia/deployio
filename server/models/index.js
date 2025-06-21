/**
 * Central export for all Mongoose models
 * Provides clean imports throughout the application
 */

// Core Models
const User = require("./User");
const Project = require("./Project");
const Deployment = require("./Deployment");
const BuildLog = require("./BuildLog");

// Authentication & Security
const ApiKey = require("./ApiKey");
const AuditLog = require("./AuditLog");

// Communication
const Notification = require("./Notification");

// Content Models (if needed)
const Blog = require("./Blog");
const Documentation = require("./Documentation");

module.exports = {
  // Core Models
  User,
  Project,
  Deployment,
  BuildLog,

  // Authentication & Security
  ApiKey,
  AuditLog,

  // Communication
  Notification,

  // Content (Optional)
  Blog,
  Documentation,
};
