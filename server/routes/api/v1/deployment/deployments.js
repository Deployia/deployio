const express = require("express");
const { body, param, query } = require("express-validator");
const deploymentController = require("@controllers/deployment/deploymentController");

const router = express.Router();

// Validation middleware
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

const validateStatusUpdate = [
  body("status")
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
    ])
    .withMessage("Invalid status value"),
];

const validateObjectId = [
  param("id").isMongoId().withMessage("Invalid deployment ID"),
];

// Routes

/**
 * @desc Get all user deployments
 * @route GET /api/v1/deployments
 */
router.get("/", deploymentController.getAllDeployments);

/**
 * @desc Get deployment by ID
 * @route GET /api/v1/deployments/:id
 */
router.get("/:id", validateObjectId, deploymentController.getDeploymentById);

/**
 * @desc Update deployment status
 * @route PATCH /api/v1/deployments/:id/status
 */
router.patch(
  "/:id/status",
  validateObjectId,
  validateStatusUpdate,
  deploymentController.updateDeploymentStatus
);

/**
 * @desc Restart deployment
 * @route POST /api/v1/deployments/:id/restart
 */
router.post(
  "/:id/restart",
  validateObjectId,
  deploymentController.restartDeployment
);

/**
 * @desc Cancel deployment
 * @route POST /api/v1/deployments/:id/cancel
 */
router.post(
  "/:id/cancel",
  validateObjectId,
  deploymentController.cancelDeployment
);

/**
 * @desc Delete deployment
 * @route DELETE /api/v1/deployments/:id
 */
router.delete("/:id", validateObjectId, deploymentController.deleteDeployment);

/**
 * @desc Get deployment logs
 * @route GET /api/v1/deployments/:id/logs
 */
router.get(
  "/:id/logs",
  validateObjectId,
  [
    query("level").optional().isIn(["info", "warn", "error", "debug"]),
    query("source").optional().isIn(["build", "deploy", "runtime"]),
    query("limit").optional().isInt({ min: 1, max: 1000 }),
    query("offset").optional().isInt({ min: 0 }),
  ],
  deploymentController.getDeploymentLogs
);

module.exports = router;
