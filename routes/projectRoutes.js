const express = require("express");
const { body } = require("express-validator");
const projectController = require("../controllers/projectController");
const deploymentController = require("../controllers/deploymentController");
const aiController = require("../controllers/aiController");
const { protect: authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Public AI service routes (no auth required)
router.get("/ai/technologies", aiController.getSupportedTechnologies);
router.get("/ai/health", aiController.checkAiServiceHealth);

// Apply auth middleware to all other routes
router.use(authMiddleware);

// Project validation rules
const projectValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Project name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("repository.url")
    .isURL()
    .matches(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/)
    .withMessage("Please provide a valid GitHub repository URL"),
  body("repository.branch")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Branch name must be between 1 and 50 characters"),
];

const deploymentValidation = [
  body("projectId").isMongoId().withMessage("Invalid project ID"),
  body("deployment.environment")
    .isIn(["development", "staging", "production"])
    .withMessage("Environment must be development, staging, or production"),
  body("deployment.branch")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Branch name is required"),
];

// Project Routes
router.get("/", projectController.getProjects);
router.post("/", projectValidation, projectController.createProject);
router.get("/:id", projectController.getProject);
router.put("/:id", projectValidation, projectController.updateProject);
router.delete("/:id", projectController.deleteProject);

// Project archive/unarchive
router.patch("/:id/archive", projectController.toggleArchiveProject);

// Project collaborators
router.post(
  "/:id/collaborators",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("role")
      .optional()
      .isIn(["developer", "admin"])
      .withMessage("Role must be developer or admin"),
  ],
  projectController.addCollaborator
);
router.delete(
  "/:id/collaborators/:collaboratorId",
  projectController.removeCollaborator
);

// Project deployments
router.get("/:id/deployments", projectController.getProjectDeployments);
router.patch(
  "/:id/deployment",
  projectController.updateProjectDeploymentStatus
);

// Project analytics
router.get("/:id/analytics", projectController.getProjectAnalytics);

// Deployment statistics
router.get(
  "/:projectId/deployments/stats",
  deploymentController.getDeploymentStats
);

// Deployment Routes
router.post(
  "/deployments",
  deploymentValidation,
  deploymentController.createDeployment
);
router.get("/deployments/:id", deploymentController.getDeployment);
router.patch(
  "/deployments/:id/status",
  deploymentController.updateDeploymentStatus
);
router.get("/deployments/:id/logs", deploymentController.getDeploymentLogs);
router.patch("/deployments/:id/cancel", deploymentController.cancelDeployment);

// AI-powered project analysis routes
router.post("/:id/analyze", aiController.analyzeProjectStack);
router.post("/:id/dockerfile", aiController.generateDockerfile);
router.get("/:id/optimize", aiController.getOptimizations);
router.patch(
  "/:id/optimize/:suggestionIndex/implement",
  aiController.markOptimizationImplemented
);
router.post("/:id/ai-analysis", aiController.runFullAiAnalysis);

// DevOps Automation routes
router.post("/:id/pipeline", aiController.generatePipeline);
router.post("/:id/environment", aiController.generateEnvironmentConfig);
router.post("/:id/build-optimization", aiController.generateBuildOptimization);

module.exports = router;
