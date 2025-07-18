const express = require("express");
const { body, param, query } = require("express-validator");
const projectController = require("@controllers/project/projectController");
const deploymentController = require("@controllers/deployment/deploymentController");

const router = express.Router();

// Validation middleware
const validateProjectUpdate = [
  body("name")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Project name must be between 1 and 100 characters")
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage(
      "Project name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("visibility")
    .optional()
    .isIn(["private", "public"])
    .withMessage("Visibility must be either private or public"),
  body("settings.autoDeployment.enabled")
    .optional()
    .isBoolean()
    .withMessage("Auto deployment enabled must be a boolean"),
  body("settings.notifications.email")
    .optional()
    .isBoolean()
    .withMessage("Email notifications must be a boolean"),
];

const validateObjectId = [
  param("id").isMongoId().withMessage("Invalid project ID"),
];

const validateQueryParams = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("status")
    .optional()
    .isIn([
      "draft",
      "analyzing",
      "configured",
      "building",
      "deploying",
      "active",
      "archived",
      "deleted",
      "failed",
    ])
    .withMessage("Invalid status value"),
  query("technology")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Technology filter must be between 1 and 50 characters"),
  query("search")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1 and 100 characters"),
  query("sortBy")
    .optional()
    .isIn(["name", "createdAt", "updatedAt", "lastAccessed"])
    .withMessage("Sort by must be name, createdAt, updatedAt, or lastAccessed"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc"),
];

// Routes

/**
 * @desc Get user projects
 * @route GET /api/v1/projects
 */
router.get("/", validateQueryParams, projectController.getProjects);

/**
 * @desc Get project by ID
 * @route GET /api/v1/projects/:id
 */
router.get("/:id", validateObjectId, projectController.getProjectById);

/**
 * @desc Update project
 * @route PUT /api/v1/projects/:id
 */
router.put(
  "/:id",
  validateObjectId,
  validateProjectUpdate,
  projectController.updateProject
);

/**
 * @desc Delete project
 * @route DELETE /api/v1/projects/:id
 */
router.delete("/:id", validateObjectId, projectController.deleteProject);

/**
 * @desc Get project deployments
 * @route GET /api/v1/projects/:id/deployments
 */
router.get(
  "/:id/deployments",
  validateObjectId,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status")
      .optional()
      .isIn([
        "pending",
        "queued",
        "building",
        "deploying",
        "running",
        "failed",
        "stopped",
        "cancelled",
        "error",
      ]),
    query("environment")
      .optional()
      .isIn(["development", "staging", "production"]),
    query("sortBy").optional().isIn(["createdAt", "updatedAt", "status"]),
    query("sortOrder").optional().isIn(["asc", "desc"]),
  ],
  projectController.getProjectDeployments
);

// Validation for deployment creation
const validateDeploymentCreation = [
  body("environment")
    .optional()
    .isIn(["development", "staging", "production"])
    .withMessage("Environment must be development, staging, or production"),
  body("branch")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Branch name must be between 1 and 100 characters"),
  body("commit.hash")
    .notEmpty()
    .withMessage("Commit hash is required")
    .isLength({ min: 7, max: 40 })
    .withMessage("Commit hash must be between 7 and 40 characters"),
  body("commit.message")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Commit message cannot exceed 500 characters"),
  body("customDomain")
    .optional()
    .isFQDN()
    .withMessage("Custom domain must be a valid FQDN"),
];

/**
 * @desc Create new deployment for project
 * @route POST /api/v1/projects/:id/deployments
 */
router.post(
  "/:id/deployments",
  validateObjectId,
  validateDeploymentCreation,
  deploymentController.createDeployment
);

module.exports = router;
