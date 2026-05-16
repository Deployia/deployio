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
    .optional()
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
      "stopping",
      "failed",
      "stopped",
      "cancelled",
      "deleted",
      "error",
    ])
    .withMessage("Invalid status value"),
];

const { isDeploymentIdentifier } = require("../../../../utils/deploymentLookup");

const validateDeploymentId = [
  param("id")
    .custom((value) => {
      if (isDeploymentIdentifier(value)) return true;
      throw new Error("Invalid deployment ID");
    })
    .withMessage("Invalid deployment ID"),
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
router.get("/:id", validateDeploymentId, deploymentController.getDeploymentById);

/**
 * @desc Update deployment status
 * @route PATCH /api/v1/deployments/:id/status
 */
router.patch(
  "/:id/status",
  validateDeploymentId,
  validateStatusUpdate,
  deploymentController.updateDeploymentStatus,
);

/**
 * @desc Restart deployment
 * @route POST /api/v1/deployments/:id/restart
 */
router.post(
  "/:id/restart",
  validateDeploymentId,
  deploymentController.restartDeployment,
);

/**
 * @desc Cancel deployment
 * @route POST /api/v1/deployments/:id/cancel
 */
router.post(
  "/:id/cancel",
  validateDeploymentId,
  deploymentController.cancelDeployment,
);

/**
 * @desc Stop deployment
 * @route POST /api/v1/deployments/:id/stop
 */
router.post("/:id/stop", validateDeploymentId, deploymentController.stopDeployment);

/**
 * @desc Delete deployment
 * @route DELETE /api/v1/deployments/:id
 */
router.delete("/:id", validateDeploymentId, deploymentController.deleteDeployment);

/**
 * @desc Get deployment logs
 * @route GET /api/v1/deployments/:id/logs
 */
router.get(
  "/:id/logs",
  validateDeploymentId,
  [
    query("level").optional().isIn(["info", "warn", "error", "debug"]),
    query("source").optional().isIn(["build", "deploy", "runtime"]),
    query("limit").optional().isInt({ min: 1, max: 1000 }),
    query("offset").optional().isInt({ min: 0 }),
  ],
  deploymentController.getDeploymentLogs,
);

router.get("/:id/probe", validateDeploymentId, deploymentController.probeDeployment);

module.exports = router;
