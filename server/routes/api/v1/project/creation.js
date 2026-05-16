const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const projectCreationController = require("@controllers/project/projectCreationController");
const { protect } = require("@middleware/authMiddleware");
const { normalizeProviderApi } = require("@utils/repositoryUrlParser");

// Apply authentication to all routes
router.use(protect);

const SUPPORTED_CREATION_PROVIDERS = ["github", "gitlab", "azuredevops"];

const analyzeRepositoryValidation = [
  body("repositoryUrl")
    .notEmpty()
    .withMessage("Repository URL is required")
    .custom((value) => {
      const url = String(value || "").trim();
      if (/^https?:\/\//i.test(url)) {
        try {
          // eslint-disable-next-line no-new
          new URL(url);
          return true;
        } catch {
          throw new Error("Valid repository URL is required");
        }
      }
      if (/^git@[^:]+:.+/.test(url)) {
        return true;
      }
      throw new Error("Valid repository URL is required");
    }),
  body("branch").optional().isString().withMessage("Branch must be a string"),
  body("provider")
    .optional()
    .custom((value) => {
      const apiProvider = normalizeProviderApi(value || "github");
      if (!SUPPORTED_CREATION_PROVIDERS.includes(apiProvider)) {
        throw new Error("Invalid provider");
      }
      return true;
    }),
  body("dockerfilePath")
    .optional()
    .isString()
    .withMessage("Dockerfile path must be a string"),
];

// Validation for client-driven full payload completion
const completePayloadValidation = [
  body().isObject().withMessage("Payload must be an object"),
  body("repository")
    .exists()
    .isObject()
    .withMessage("Repository object is required"),
  body("repository.url")
    .exists()
    .isURL()
    .withMessage("Repository URL is required"),
  body("repository.name").optional().isString(),
  body("analysis")
    .exists()
    .isObject()
    .withMessage("Analysis object is required"),
  body("analysis.results")
    .exists()
    .isObject()
    .withMessage("Analysis results required"),
  body("dockerfilePath")
    .optional()
    .isString()
    .withMessage("Dockerfile path must be a string"),
  body("dockerfile").optional().isString(),
  body("projectConfig.environmentVariables")
    .optional()
    .isObject(),
  body("projectConfig.environmentVariables.staging")
    .optional()
    .isArray(),
  body("projectConfig.environmentVariables.production")
    .optional()
    .isArray(),
];

/**
 * @route   POST /api/v1/projects/creation/analyze
 * @desc    Analyze repository for client-side project creation flow
 * @access  Private
 */
router.post(
  "/analyze",
  analyzeRepositoryValidation,
  projectCreationController.analyzeRepositoryStandalone,
);

/**
 * @route   POST /api/v1/projects/creation/discover-dockerfiles
 * @desc    List Dockerfiles in a repository with metadata (no full analysis)
 * @access  Private
 */
router.post(
  "/discover-dockerfiles",
  analyzeRepositoryValidation,
  projectCreationController.discoverDockerfiles,
);

/**
 * @route   POST /api/v1/projects/creation/complete
 * @desc    Complete project creation using full client payload
 * @access  Private
 */
router.post(
  "/complete",
  completePayloadValidation,
  projectCreationController.completeWithPayload,
);

module.exports = router;
