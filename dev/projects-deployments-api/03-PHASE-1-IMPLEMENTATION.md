# Phase 1: Core Project & Deployment API Implementation

## 🎯 **Objective**

Implement the missing core project CRUD operations AND comprehensive deployment API to bridge the gap between frontend expectations and backend capabilities.

## 📋 **Implementation Checklist**

### Step 1: Core Project API (45 min)

- [ ] Create `server/services/project/projectService.js`
- [ ] Create `server/controllers/project/projectController.js`
- [ ] Create `server/routes/api/v1/project/projects.js`
- [ ] Implement CRUD operations with proper error handling

### Step 2: Comprehensive Deployment API (60 min)

- [ ] Create `server/services/deployment/deploymentService.js`
- [ ] Create `server/controllers/deployment/deploymentController.js`
- [ ] Create `server/routes/api/v1/deployment/deployments.js`
- [ ] Implement full deployment lifecycle management

### Step 3: Analytics API (30 min)

- [ ] Create `server/services/analytics/analyticsService.js`
- [ ] Create `server/controllers/analytics/analyticsController.js`
- [ ] Create `server/routes/api/v1/analytics/analytics.js`
- [ ] Implement dashboard and project analytics

### Step 4: Integration & Testing (45 min)

- [ ] Update existing index files and main routes
- [ ] Test all endpoints with comprehensive test cases
- [ ] Verify database operations and data consistency
- [ ] Check error handling and edge cases

---

## 🔧 **Implementation Details**

### File 1: Project Service

**Location**: `server/services/project/projectService.js`

```javascript
const Project = require("@models/Project");
const Deployment = require("@models/Deployment");
const { deployment } = require("@services");
const logger = require("@config/logger");

class ProjectService {
  /**
   * Get user projects with pagination and filtering
   */
  async getUserProjects(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        technology,
        search,
        sortBy = "updatedAt",
        sortOrder = "desc",
      } = options;

      // Build query
      const query = { owner: userId };

      // Add filters
      if (status) {
        query["deployment.status"] = status;
      }

      if (technology) {
        query["technology.detected.primary"] = new RegExp(technology, "i");
      }

      if (search) {
        query.$or = [
          { name: new RegExp(search, "i") },
          { description: new RegExp(search, "i") },
        ];
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [projects, totalCount] = await Promise.all([
        Project.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .select("-__v")
          .lean(),
        Project.countDocuments(query),
      ]);

      // Enrich projects with deployment counts
      const enrichedProjects = await Promise.all(
        projects.map(async (project) => {
          const deploymentCount = await Deployment.countDocuments({
            project: project._id,
          });

          const lastDeployment = await Deployment.findOne({
            project: project._id,
          })
            .sort({ createdAt: -1 })
            .select("status createdAt")
            .lean();

          return {
            ...project,
            deploymentsCount: deploymentCount,
            lastDeployment: lastDeployment || null,
          };
        })
      );

      return {
        projects: enrichedProjects,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      logger.error("Error getting user projects:", error);
      throw new Error("Failed to fetch projects");
    }
  }

  /**
   * Get project by ID with full details
   */
  async getProjectById(projectId, userId) {
    try {
      const project = await Project.findOne({
        _id: projectId,
        owner: userId,
      })
        .select("-__v")
        .lean();

      if (!project) {
        throw new Error("Project not found");
      }

      // Get recent deployments
      const recentDeployments = await Deployment.find({
        project: projectId,
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("deploymentId status environment createdAt config.subdomain")
        .lean();

      return {
        project,
        recentDeployments,
      };
    } catch (error) {
      logger.error("Error getting project by ID:", error);
      throw error;
    }
  }

  /**
   * Update project
   */
  async updateProject(projectId, userId, updateData) {
    try {
      const allowedUpdates = [
        "name",
        "description",
        "settings",
        "deployment.environment",
        "repository.branch",
      ];

      // Filter update data to only allowed fields
      const filteredData = {};
      Object.keys(updateData).forEach((key) => {
        if (
          allowedUpdates.some((allowed) =>
            key.startsWith(allowed.split(".")[0])
          )
        ) {
          filteredData[key] = updateData[key];
        }
      });

      const project = await Project.findOneAndUpdate(
        { _id: projectId, owner: userId },
        { $set: filteredData },
        { new: true, select: "-__v" }
      ).lean();

      if (!project) {
        throw new Error("Project not found");
      }

      return project;
    } catch (error) {
      logger.error("Error updating project:", error);
      throw error;
    }
  }

  /**
   * Delete project and its deployments
   */
  async deleteProject(projectId, userId) {
    try {
      const project = await Project.findOne({
        _id: projectId,
        owner: userId,
      });

      if (!project) {
        throw new Error("Project not found");
      }

      // Stop all active deployments first
      const activeDeployments = await Deployment.find({
        project: projectId,
        "status.current": { $in: ["running", "deploying"] },
      });

      for (const deployment of activeDeployments) {
        try {
          await deployment.stopDeployment(deployment.deploymentId);
        } catch (err) {
          logger.warn(
            `Failed to stop deployment ${deployment.deploymentId}:`,
            err
          );
        }
      }

      // Delete all deployments
      await Deployment.deleteMany({ project: projectId });

      // Delete project
      await Project.findByIdAndDelete(projectId);

      return {
        message: "Project and all associated deployments deleted successfully",
      };
    } catch (error) {
      logger.error("Error deleting project:", error);
      throw error;
    }
  }

  /**
   * Get project deployments
   */
  async getProjectDeployments(projectId, userId, options = {}) {
    try {
      // Verify project ownership
      const project = await Project.findOne({
        _id: projectId,
        owner: userId,
      });

      if (!project) {
        throw new Error("Project not found");
      }

      const { page = 1, limit = 10, status, environment } = options;

      // Build query
      const query = { project: projectId };

      if (status) {
        query["status.current"] = status;
      }

      if (environment) {
        query["config.environment"] = environment;
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;

      const [deployments, totalCount] = await Promise.all([
        Deployment.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select("-__v")
          .lean(),
        Deployment.countDocuments(query),
      ]);

      return {
        deployments,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      logger.error("Error getting project deployments:", error);
      throw error;
    }
  }

  /**
   * Deploy project (trigger new deployment)
   */
  async deployProject(projectId, userId, deploymentConfig = {}) {
    try {
      // Verify project ownership
      const project = await Project.findOne({
        _id: projectId,
        owner: userId,
      });

      if (!project) {
        throw new Error("Project not found");
      }

      // Use deployment service to create deployment
      const deploymentData = {
        projectId,
        userId,
        environment: deploymentConfig.environment || "development",
        branch: deploymentConfig.branch || project.repository.branch || "main",
        ...deploymentConfig,
      };

      const deployment = await deployment.deployProject(
        projectId,
        deploymentData
      );

      return deployment;
    } catch (error) {
      logger.error("Error deploying project:", error);
      throw error;
    }
  }
}

module.exports = new ProjectService();
```

### File 2: Project Controller

**Location**: `server/controllers/project/projectController.js`

```javascript
const { project: projectService } = require("@services");
const { validationResult } = require("express-validator");
const logger = require("@config/logger");

class ProjectController {
  /**
   * @desc Get user projects
   * @route GET /api/v1/projects
   * @access Private
   */
  async getProjects(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const userId = req.user._id;
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        technology: req.query.technology,
        search: req.query.search,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await projectService.getUserProjects(userId, options);

      res.status(200).json({
        success: true,
        message: "Projects retrieved successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Error getting projects:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve projects",
        error: error.message,
      });
    }
  }

  /**
   * @desc Get project by ID
   * @route GET /api/v1/projects/:id
   * @access Private
   */
  async getProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id: projectId } = req.params;
      const userId = req.user._id;

      const result = await projectService.getProjectById(projectId, userId);

      res.status(200).json({
        success: true,
        message: "Project retrieved successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Error getting project:", error);

      if (error.message === "Project not found") {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to retrieve project",
        error: error.message,
      });
    }
  }

  /**
   * @desc Update project
   * @route PUT /api/v1/projects/:id
   * @access Private
   */
  async updateProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id: projectId } = req.params;
      const userId = req.user._id;
      const updateData = req.body;

      const project = await projectService.updateProject(
        projectId,
        userId,
        updateData
      );

      res.status(200).json({
        success: true,
        message: "Project updated successfully",
        data: { project },
      });
    } catch (error) {
      logger.error("Error updating project:", error);

      if (error.message === "Project not found") {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update project",
        error: error.message,
      });
    }
  }

  /**
   * @desc Delete project
   * @route DELETE /api/v1/projects/:id
   * @access Private
   */
  async deleteProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id: projectId } = req.params;
      const userId = req.user._id;

      const result = await projectService.deleteProject(projectId, userId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: null,
      });
    } catch (error) {
      logger.error("Error deleting project:", error);

      if (error.message === "Project not found") {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to delete project",
        error: error.message,
      });
    }
  }

  /**
   * @desc Get project deployments
   * @route GET /api/v1/projects/:id/deployments
   * @access Private
   */
  async getProjectDeployments(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id: projectId } = req.params;
      const userId = req.user._id;
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        environment: req.query.environment,
      };

      const result = await projectService.getProjectDeployments(
        projectId,
        userId,
        options
      );

      res.status(200).json({
        success: true,
        message: "Project deployments retrieved successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Error getting project deployments:", error);

      if (error.message === "Project not found") {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to retrieve project deployments",
        error: error.message,
      });
    }
  }

  /**
   * @desc Deploy project
   * @route POST /api/v1/projects/:id/deploy
   * @access Private
   */
  async deployProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id: projectId } = req.params;
      const userId = req.user._id;
      const deploymentConfig = req.body;

      const deployment = await projectService.deployProject(
        projectId,
        userId,
        deploymentConfig
      );

      res.status(201).json({
        success: true,
        message: "Deployment started successfully",
        data: { deployment },
      });
    } catch (error) {
      logger.error("Error deploying project:", error);

      if (error.message === "Project not found") {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to start deployment",
        error: error.message,
      });
    }
  }
}

module.exports = new ProjectController();
```

### File 3: Project Routes

**Location**: `server/routes/api/v1/project/projects.js`

```javascript
const express = require("express");
const { param, query, body } = require("express-validator");
const { project } = require("@controllers");
const { protect } = require("@middleware/authMiddleware");

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation middleware
const projectIdValidation = [
  param("id").isMongoId().withMessage("Invalid project ID"),
];

const getProjectsValidation = [
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
    .isIn(["active", "inactive", "failed", "deploying"])
    .withMessage("Invalid status"),
  query("technology")
    .optional()
    .isString()
    .withMessage("Technology must be a string"),
  query("search").optional().isString().withMessage("Search must be a string"),
  query("sortBy")
    .optional()
    .isIn(["name", "createdAt", "updatedAt"])
    .withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc"),
];

const updateProjectValidation = [
  ...projectIdValidation,
  body("name")
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be 1-100 characters"),
  body("description")
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage("Description max 500 characters"),
  body("settings")
    .optional()
    .isObject()
    .withMessage("Settings must be an object"),
  body("deployment.environment")
    .optional()
    .isIn(["development", "staging", "production"])
    .withMessage("Invalid environment"),
  body("repository.branch")
    .optional()
    .isString()
    .withMessage("Branch must be a string"),
];

const deployProjectValidation = [
  ...projectIdValidation,
  body("environment")
    .optional()
    .isIn(["development", "staging", "production"])
    .withMessage("Invalid environment"),
  body("branch").optional().isString().withMessage("Branch must be a string"),
];

// Routes
router.get("/", getProjectsValidation, project.projectController.getProjects);
router.get("/:id", projectIdValidation, project.projectController.getProject);
router.put(
  "/:id",
  updateProjectValidation,
  project.projectController.updateProject
);
router.delete(
  "/:id",
  projectIdValidation,
  project.projectController.deleteProject
);
router.get(
  "/:id/deployments",
  projectIdValidation,
  project.projectController.getProjectDeployments
);
router.post(
  "/:id/deploy",
  deployProjectValidation,
  project.projectController.deployProject
);

module.exports = router;
```

### File 4: Update Project Index

**Location**: `server/controllers/project/index.js` (UPDATE)

```javascript
// Project Controllers Module Export
// Implements the modular controller layer from BACKEND_ARCHITECTURE_PLAN.md

const projectCreationController = require("./projectCreationController");
const projectController = require("./projectController"); // ADD THIS

module.exports = {
  // Project creation controller (new intelligent flow)
  creation: projectCreationController,

  // Project CRUD controller (main operations) - ADD THIS
  projectController: projectController,

  // Export creation controller methods for direct access
  ...projectCreationController,
};
```

### File 5: Update Project Routes Index

**Location**: `server/routes/api/v1/project/index.js` (UPDATE)

```javascript
// Project Routes - /api/v1/projects/*
// New intelligent project creation endpoints

const express = require("express");
const router = express.Router();
const { protect } = require("@middleware/authMiddleware");

// Import routes
const creationRoutes = require("./creation");
const projectRoutes = require("./projects"); // ADD THIS

// All project routes require authentication
router.use(protect);

// Mount routes
router.use("/creation", creationRoutes);
router.use("/", projectRoutes); // ADD THIS - Main project CRUD operations

module.exports = router;
```

### File 6: Update Services Index

**Location**: `server/services/project/index.js` (UPDATE)

```javascript
// Project Services Module - New Modular Architecture
// Organizes project-related services according to BACKEND_ARCHITECTURE_PLAN.md

const projectCreationService = require("./projectCreationService");
const projectService = require("./projectService"); // ADD THIS

module.exports = {
  // Project creation service (intelligent flow)
  creation: projectCreationService,

  // Project CRUD service (main operations) - ADD THIS
  projectService: projectService,

  // Direct exports for convenience
  ...projectCreationService,
  ...projectService,
};
```

---

## 🚀 **DEPLOYMENT API IMPLEMENTATION**

### File 7: Deployment Service

**Location**: `server/services/deployment/deploymentService.js`

```javascript
const Deployment = require("@models/Deployment");
const Project = require("@models/Project");
const logger = require("@config/logger");

class DeploymentService {
  /**
   * Get all deployments with filtering and pagination
   */
  async getAllDeployments(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        environment,
        projectId,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // First get user's projects
      const userProjects = await Project.find({ owner: userId }).select("_id");
      const projectIds = userProjects.map((p) => p._id);

      // Build query
      const query = { project: { $in: projectIds } };

      // Add filters
      if (status) query.status = status;
      if (environment) query["config.environment"] = environment;
      if (projectId) query.project = projectId;

      if (search) {
        query.$or = [
          { "config.subdomain": new RegExp(search, "i") },
          { "config.commit.message": new RegExp(search, "i") },
        ];
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [deployments, totalCount] = await Promise.all([
        Deployment.find(query)
          .populate("project", "name repository.url stack.detected.primary")
          .populate("deployedBy", "name email")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .select("-__v")
          .lean(),
        Deployment.countDocuments(query),
      ]);

      return {
        deployments: deployments.map(this.transformDeployment),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / limit),
          total: totalCount,
        },
      };
    } catch (error) {
      logger.error("Error in getAllDeployments:", error);
      throw error;
    }
  }

  /**
   * Get project deployments
   */
  async getProjectDeployments(projectId, userId, options = {}) {
    try {
      // Verify project ownership
      const project = await Project.findOne({ _id: projectId, owner: userId });
      if (!project) {
        throw new Error("Project not found or access denied");
      }

      const {
        page = 1,
        limit = 10,
        status,
        environment,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Build query
      const query = { project: projectId };
      if (status) query.status = status;
      if (environment) query["config.environment"] = environment;

      // Execute query
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const [deployments, totalCount] = await Promise.all([
        Deployment.find(query)
          .populate("deployedBy", "name email")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .select("-__v")
          .lean(),
        Deployment.countDocuments(query),
      ]);

      return {
        deployments: deployments.map(this.transformDeployment),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / limit),
          total: totalCount,
        },
      };
    } catch (error) {
      logger.error("Error in getProjectDeployments:", error);
      throw error;
    }
  }

  /**
   * Get deployment by ID
   */
  async getDeploymentById(deploymentId, userId) {
    try {
      const deployment = await Deployment.findById(deploymentId)
        .populate("project", "name repository.url owner")
        .populate("deployedBy", "name email")
        .lean();

      if (!deployment) {
        throw new Error("Deployment not found");
      }

      // Check access permissions
      if (deployment.project.owner.toString() !== userId.toString()) {
        throw new Error("Access denied");
      }

      return this.transformDeployment(deployment);
    } catch (error) {
      logger.error("Error in getDeploymentById:", error);
      throw error;
    }
  }

  /**
   * Create new deployment
   */
  async createDeployment(projectId, deploymentData, userId) {
    try {
      // Verify project ownership
      const project = await Project.findOne({ _id: projectId, owner: userId });
      if (!project) {
        throw new Error("Project not found or access denied");
      }

      // Generate unique subdomain
      const subdomain = await Deployment.generateSubdomain(
        project.name,
        deploymentData.environment || "dev"
      );

      // Create deployment
      const deployment = new Deployment({
        project: projectId,
        deployedBy: userId,
        config: {
          environment: deploymentData.environment || "development",
          branch: deploymentData.branch || project.repository.branch || "main",
          commit: deploymentData.commit,
          subdomain,
          customDomain: deploymentData.customDomain,
        },
        networking: {
          subdomain,
          fullUrl: `https://${subdomain}.deployio.tech`,
        },
        status: "pending",
      });

      await deployment.save();

      // Update project statistics
      await project.incrementDeploymentCount(false); // Will be true when successful

      // Populate for response
      await deployment.populate("project", "name repository.url");
      await deployment.populate("deployedBy", "name email");

      return this.transformDeployment(deployment.toObject());
    } catch (error) {
      logger.error("Error in createDeployment:", error);
      throw error;
    }
  }

  /**
   * Update deployment status
   */
  async updateDeploymentStatus(
    deploymentId,
    status,
    userId,
    additionalData = {}
  ) {
    try {
      const deployment = await Deployment.findById(deploymentId).populate(
        "project",
        "owner"
      );

      if (!deployment) {
        throw new Error("Deployment not found");
      }

      // Check access permissions
      if (deployment.project.owner.toString() !== userId.toString()) {
        throw new Error("Access denied");
      }

      // Update status with additional data
      await deployment.updateStatus(status, additionalData);

      return this.transformDeployment(deployment.toObject());
    } catch (error) {
      logger.error("Error in updateDeploymentStatus:", error);
      throw error;
    }
  }

  /**
   * Restart deployment
   */
  async restartDeployment(deploymentId, userId) {
    try {
      return await this.updateDeploymentStatus(
        deploymentId,
        "pending",
        userId,
        {
          restarted: true,
          restartedAt: new Date(),
        }
      );
    } catch (error) {
      logger.error("Error in restartDeployment:", error);
      throw error;
    }
  }

  /**
   * Cancel deployment
   */
  async cancelDeployment(deploymentId, userId) {
    try {
      return await this.updateDeploymentStatus(
        deploymentId,
        "cancelled",
        userId,
        {
          cancelled: true,
          cancelledAt: new Date(),
        }
      );
    } catch (error) {
      logger.error("Error in cancelDeployment:", error);
      throw error;
    }
  }

  /**
   * Delete deployment
   */
  async deleteDeployment(deploymentId, userId) {
    try {
      const deployment = await Deployment.findById(deploymentId).populate(
        "project",
        "owner"
      );

      if (!deployment) {
        throw new Error("Deployment not found");
      }

      // Check access permissions
      if (deployment.project.owner.toString() !== userId.toString()) {
        throw new Error("Access denied");
      }

      // Can only delete stopped, failed, or cancelled deployments
      if (
        !["stopped", "failed", "cancelled", "error"].includes(deployment.status)
      ) {
        throw new Error("Cannot delete active deployment. Stop it first.");
      }

      await Deployment.findByIdAndDelete(deploymentId);

      return { success: true, message: "Deployment deleted successfully" };
    } catch (error) {
      logger.error("Error in deleteDeployment:", error);
      throw error;
    }
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(deploymentId, userId, options = {}) {
    try {
      const deployment = await Deployment.findById(deploymentId)
        .populate("project", "owner")
        .select("build.logs project");

      if (!deployment) {
        throw new Error("Deployment not found");
      }

      // Check access permissions
      if (deployment.project.owner.toString() !== userId.toString()) {
        throw new Error("Access denied");
      }

      const { level, source, limit = 100, offset = 0 } = options;
      let logs = deployment.build.logs || [];

      // Apply filters
      if (level) {
        logs = logs.filter((log) => log.level === level);
      }
      if (source) {
        logs = logs.filter((log) => log.source === source);
      }

      // Apply pagination
      const totalLogs = logs.length;
      logs = logs.slice(offset, offset + limit);

      return {
        logs,
        pagination: {
          total: totalLogs,
          offset: parseInt(offset),
          limit: parseInt(limit),
          hasMore: offset + limit < totalLogs,
        },
      };
    } catch (error) {
      logger.error("Error in getDeploymentLogs:", error);
      throw error;
    }
  }

  /**
   * Transform deployment for API response
   */
  transformDeployment(deployment) {
    return {
      id: deployment._id,
      deploymentId: deployment.deploymentId,
      project: deployment.project,
      deployedBy: deployment.deployedBy,
      status: deployment.status,
      environment: deployment.config?.environment,
      branch: deployment.config?.branch,
      commit: deployment.config?.commit,
      url: deployment.networking?.fullUrl,
      subdomain: deployment.config?.subdomain,
      customDomain: deployment.config?.customDomain,
      buildDuration: deployment.build?.duration,
      buildStatus: deployment.build?.status,
      healthStatus: deployment.runtime?.health?.status,
      metrics: {
        requests: deployment.metrics?.requests?.total || 0,
        errors: deployment.metrics?.errors?.total || 0,
        uptime: deployment.metrics?.uptime?.percentage || 100,
      },
      resources: deployment.runtime?.resources,
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt,
      buildStartedAt: deployment.build?.startedAt,
      buildCompletedAt: deployment.build?.completedAt,
      deployStartedAt: deployment.deployStartedAt,
      deployCompletedAt: deployment.deployCompletedAt,
    };
  }
}

module.exports = new DeploymentService();
```

### File 8: Deployment Controller

**Location**: `server/controllers/deployment/deploymentController.js`

```javascript
const { deployment: deploymentService } = require("@services");
const { validationResult } = require("express-validator");
const logger = require("@config/logger");

class DeploymentController {
  /**
   * @desc Get all user deployments
   * @route GET /api/v1/deployments
   * @access Private
   */
  async getAllDeployments(req, res) {
    try {
      const userId = req.user._id;
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        environment: req.query.environment,
        projectId: req.query.projectId,
        search: req.query.search,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await deploymentService.getAllDeployments(userId, options);

      res.status(200).json({
        success: true,
        message: "Deployments retrieved successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Error in getAllDeployments:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch deployments",
      });
    }
  }

  /**
   * @desc Get project deployments
   * @route GET /api/v1/projects/:projectId/deployments
   * @access Private
   */
  async getProjectDeployments(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user._id;
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        environment: req.query.environment,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await deploymentService.getProjectDeployments(
        projectId,
        userId,
        options
      );

      res.status(200).json({
        success: true,
        message: "Project deployments retrieved successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Error in getProjectDeployments:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to fetch project deployments",
      });
    }
  }

  /**
   * @desc Get deployment by ID
   * @route GET /api/v1/deployments/:id
   * @access Private
   */
  async getDeploymentById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const deployment = await deploymentService.getDeploymentById(id, userId);

      res.status(200).json({
        success: true,
        message: "Deployment retrieved successfully",
        data: { deployment },
      });
    } catch (error) {
      logger.error("Error in getDeploymentById:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to fetch deployment",
      });
    }
  }

  /**
   * @desc Create new deployment
   * @route POST /api/v1/projects/:projectId/deployments
   * @access Private
   */
  async createDeployment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { projectId } = req.params;
      const userId = req.user._id;
      const deploymentData = req.body;

      const deployment = await deploymentService.createDeployment(
        projectId,
        deploymentData,
        userId
      );

      res.status(201).json({
        success: true,
        message: "Deployment created successfully",
        data: { deployment },
      });
    } catch (error) {
      logger.error("Error in createDeployment:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to create deployment",
      });
    }
  }

  /**
   * @desc Update deployment status
   * @route PATCH /api/v1/deployments/:id/status
   * @access Private
   */
  async updateDeploymentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, ...additionalData } = req.body;
      const userId = req.user._id;

      const deployment = await deploymentService.updateDeploymentStatus(
        id,
        status,
        userId,
        additionalData
      );

      res.status(200).json({
        success: true,
        message: "Deployment status updated successfully",
        data: { deployment },
      });
    } catch (error) {
      logger.error("Error in updateDeploymentStatus:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to update deployment status",
      });
    }
  }

  /**
   * @desc Restart deployment
   * @route POST /api/v1/deployments/:id/restart
   * @access Private
   */
  async restartDeployment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const deployment = await deploymentService.restartDeployment(id, userId);

      res.status(200).json({
        success: true,
        message: "Deployment restart initiated",
        data: { deployment },
      });
    } catch (error) {
      logger.error("Error in restartDeployment:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to restart deployment",
      });
    }
  }

  /**
   * @desc Cancel deployment
   * @route POST /api/v1/deployments/:id/cancel
   * @access Private
   */
  async cancelDeployment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const deployment = await deploymentService.cancelDeployment(id, userId);

      res.status(200).json({
        success: true,
        message: "Deployment cancelled successfully",
        data: { deployment },
      });
    } catch (error) {
      logger.error("Error in cancelDeployment:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to cancel deployment",
      });
    }
  }

  /**
   * @desc Delete deployment
   * @route DELETE /api/v1/deployments/:id
   * @access Private
   */
  async deleteDeployment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const result = await deploymentService.deleteDeployment(id, userId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: null,
      });
    } catch (error) {
      logger.error("Error in deleteDeployment:", error);
      res.status(error.message.includes("not found") ? 404 : 400).json({
        success: false,
        message: error.message || "Failed to delete deployment",
      });
    }
  }

  /**
   * @desc Get deployment logs
   * @route GET /api/v1/deployments/:id/logs
   * @access Private
   */
  async getDeploymentLogs(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      const options = {
        level: req.query.level,
        source: req.query.source,
        limit: req.query.limit,
        offset: req.query.offset,
      };

      const result = await deploymentService.getDeploymentLogs(
        id,
        userId,
        options
      );

      res.status(200).json({
        success: true,
        message: "Deployment logs retrieved successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Error in getDeploymentLogs:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to fetch deployment logs",
      });
    }
  }
}

module.exports = new DeploymentController();
```

### File 9: Deployment Routes

**Location**: `server/routes/api/v1/deployment/deployments.js`

```javascript
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

const validateProjectId = [
  param("projectId").isMongoId().withMessage("Invalid project ID"),
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
```

### File 10: Project Deployment Routes (Integration)

**Location**: Add to `server/routes/api/v1/project/projects.js`

```javascript
// Add these routes to the existing projects.js file:

/**
 * @desc Get project deployments
 * @route GET /api/v1/projects/:projectId/deployments
 */
router.get(
  "/:projectId/deployments",
  validateObjectId,
  deploymentController.getProjectDeployments
);

/**
 * @desc Create new deployment for project
 * @route POST /api/v1/projects/:projectId/deployments
 */
router.post(
  "/:projectId/deployments",
  validateProjectId,
  validateDeploymentCreation,
  deploymentController.createDeployment
);
```

---

## ✅ **Testing Checklist**

After implementation, test these endpoints:

### **Project Endpoints**

1. **GET /api/v1/projects** - List projects
2. **GET /api/v1/projects/:id** - Get project details
3. **PUT /api/v1/projects/:id** - Update project
4. **DELETE /api/v1/projects/:id** - Delete project

### **Deployment Endpoints**

5. **GET /api/v1/deployments** - List all user deployments
6. **GET /api/v1/deployments/:id** - Get deployment details
7. **GET /api/v1/projects/:id/deployments** - Project deployments
8. **POST /api/v1/projects/:id/deployments** - Create deployment
9. **PATCH /api/v1/deployments/:id/status** - Update status
10. **POST /api/v1/deployments/:id/restart** - Restart deployment
11. **POST /api/v1/deployments/:id/cancel** - Cancel deployment
12. **DELETE /api/v1/deployments/:id** - Delete deployment
13. **GET /api/v1/deployments/:id/logs** - Get logs

---

## 📊 **ANALYTICS API IMPLEMENTATION**

### File 11: Analytics Service

**Location**: `server/services/analytics/analyticsService.js`

```javascript
const Project = require("@models/Project");
const Deployment = require("@models/Deployment");
const logger = require("@config/logger");

class AnalyticsService {
  /**
   * Get dashboard analytics for user
   */
  async getDashboardAnalytics(userId) {
    try {
      const [
        projectStats,
        deploymentStats,
        recentActivity,
        statusDistribution,
        technologyBreakdown,
      ] = await Promise.all([
        this.getProjectStats(userId),
        this.getDeploymentStats(userId),
        this.getRecentActivity(userId),
        this.getDeploymentStatusDistribution(userId),
        this.getTechnologyBreakdown(userId),
      ]);

      return {
        projects: projectStats,
        deployments: deploymentStats,
        recentActivity,
        statusDistribution,
        technologyBreakdown,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error("Error in getDashboardAnalytics:", error);
      throw error;
    }
  }

  /**
   * Get project analytics
   */
  async getProjectAnalytics(projectId, userId) {
    try {
      // Verify project ownership
      const project = await Project.findOne({ _id: projectId, owner: userId });
      if (!project) {
        throw new Error("Project not found or access denied");
      }

      const [
        deploymentHistory,
        performanceMetrics,
        errorAnalysis,
        resourceUsage,
      ] = await Promise.all([
        this.getProjectDeploymentHistory(projectId),
        this.getProjectPerformanceMetrics(projectId),
        this.getProjectErrorAnalysis(projectId),
        this.getProjectResourceUsage(projectId),
      ]);

      return {
        project: {
          id: project._id,
          name: project.name,
          technology: project.stack?.detected?.primary,
          createdAt: project.createdAt,
        },
        deploymentHistory,
        performanceMetrics,
        errorAnalysis,
        resourceUsage,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error("Error in getProjectAnalytics:", error);
      throw error;
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(userId) {
    try {
      const projects = await Project.find({ owner: userId }).select(
        "status statistics stack.detected.primary"
      );

      const total = projects.length;
      const byStatus = projects.reduce((acc, project) => {
        acc[project.status] = (acc[project.status] || 0) + 1;
        return acc;
      }, {});

      const totalDeployments = projects.reduce(
        (sum, project) => sum + (project.statistics?.totalDeployments || 0),
        0
      );

      return {
        total,
        active: byStatus.active || 0,
        archived: byStatus.archived || 0,
        failed: byStatus.failed || 0,
        totalDeployments,
        byStatus,
      };
    } catch (error) {
      logger.error("Error in getProjectStats:", error);
      throw error;
    }
  }

  /**
   * Get deployment statistics
   */
  async getDeploymentStats(userId) {
    try {
      // Get user's projects first
      const userProjects = await Project.find({ owner: userId }).select("_id");
      const projectIds = userProjects.map((p) => p._id);

      const deployments = await Deployment.find({
        project: { $in: projectIds },
      }).select("status createdAt metrics");

      const total = deployments.length;
      const byStatus = deployments.reduce((acc, deployment) => {
        acc[deployment.status] = (acc[deployment.status] || 0) + 1;
        return acc;
      }, {});

      // Calculate averages
      const totalRequests = deployments.reduce(
        (sum, deployment) => sum + (deployment.metrics?.requests?.total || 0),
        0
      );

      const averageUptime =
        deployments.length > 0
          ? deployments.reduce(
              (sum, deployment) =>
                sum + (deployment.metrics?.uptime?.percentage || 0),
              0
            ) / deployments.length
          : 0;

      return {
        total,
        running: byStatus.running || 0,
        failed: byStatus.failed || 0,
        building: byStatus.building || 0,
        totalRequests,
        averageUptime: Math.round(averageUptime * 100) / 100,
        byStatus,
      };
    } catch (error) {
      logger.error("Error in getDeploymentStats:", error);
      throw error;
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(userId, limit = 10) {
    try {
      const userProjects = await Project.find({ owner: userId }).select("_id");
      const projectIds = userProjects.map((p) => p._id);

      const recentDeployments = await Deployment.find({
        project: { $in: projectIds },
      })
        .populate("project", "name")
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("status config.environment createdAt project");

      return recentDeployments.map((deployment) => ({
        type: "deployment",
        action: `Deployment ${deployment.status}`,
        project: deployment.project.name,
        environment: deployment.config.environment,
        timestamp: deployment.createdAt,
        status: deployment.status,
      }));
    } catch (error) {
      logger.error("Error in getRecentActivity:", error);
      throw error;
    }
  }

  /**
   * Get deployment status distribution
   */
  async getDeploymentStatusDistribution(userId) {
    try {
      const userProjects = await Project.find({ owner: userId }).select("_id");
      const projectIds = userProjects.map((p) => p._id);

      const statusCounts = await Deployment.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return statusCounts.map((item) => ({
        status: item._id,
        count: item.count,
      }));
    } catch (error) {
      logger.error("Error in getDeploymentStatusDistribution:", error);
      throw error;
    }
  }

  /**
   * Get technology breakdown
   */
  async getTechnologyBreakdown(userId) {
    try {
      const techCounts = await Project.aggregate([
        { $match: { owner: userId } },
        {
          $group: {
            _id: "$stack.detected.primary",
            count: { $sum: 1 },
            projects: { $push: "$name" },
          },
        },
        { $sort: { count: -1 } },
      ]);

      return techCounts.map((item) => ({
        technology: item._id || "Unknown",
        count: item.count,
        projects: item.projects,
      }));
    } catch (error) {
      logger.error("Error in getTechnologyBreakdown:", error);
      throw error;
    }
  }

  /**
   * Get project deployment history
   */
  async getProjectDeploymentHistory(projectId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const deployments = await Deployment.find({
        project: projectId,
        createdAt: { $gte: startDate },
      })
        .sort({ createdAt: 1 })
        .select("status config.environment createdAt build.duration");

      return deployments.map((deployment) => ({
        date: deployment.createdAt,
        status: deployment.status,
        environment: deployment.config.environment,
        buildDuration: deployment.build?.duration || 0,
      }));
    } catch (error) {
      logger.error("Error in getProjectDeploymentHistory:", error);
      throw error;
    }
  }

  /**
   * Get project performance metrics
   */
  async getProjectPerformanceMetrics(projectId) {
    try {
      const deployments = await Deployment.find({ project: projectId }).select(
        "metrics build.duration status"
      );

      if (deployments.length === 0) {
        return {
          averageBuildTime: 0,
          averageResponseTime: 0,
          totalRequests: 0,
          errorRate: 0,
          uptime: 100,
        };
      }

      const totalBuildTime = deployments.reduce(
        (sum, d) => sum + (d.build?.duration || 0),
        0
      );
      const totalRequests = deployments.reduce(
        (sum, d) => sum + (d.metrics?.requests?.total || 0),
        0
      );
      const totalErrors = deployments.reduce(
        (sum, d) => sum + (d.metrics?.errors?.total || 0),
        0
      );
      const averageUptime =
        deployments.reduce(
          (sum, d) => sum + (d.metrics?.uptime?.percentage || 0),
          0
        ) / deployments.length;

      return {
        averageBuildTime: Math.round(totalBuildTime / deployments.length),
        totalRequests,
        errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
        uptime: Math.round(averageUptime * 100) / 100,
      };
    } catch (error) {
      logger.error("Error in getProjectPerformanceMetrics:", error);
      throw error;
    }
  }

  /**
   * Get project error analysis
   */
  async getProjectErrorAnalysis(projectId) {
    try {
      const deployments = await Deployment.find({
        project: projectId,
        status: { $in: ["failed", "error"] },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("status build.logs createdAt");

      return deployments.map((deployment) => ({
        date: deployment.createdAt,
        status: deployment.status,
        errors:
          deployment.build?.logs?.filter((log) => log.level === "error") || [],
      }));
    } catch (error) {
      logger.error("Error in getProjectErrorAnalysis:", error);
      throw error;
    }
  }

  /**
   * Get project resource usage
   */
  async getProjectResourceUsage(projectId) {
    try {
      const runningDeployments = await Deployment.find({
        project: projectId,
        status: "running",
      }).select("runtime.resources");

      if (runningDeployments.length === 0) {
        return { memory: 0, cpu: 0, storage: 0 };
      }

      const totalMemory = runningDeployments.reduce((sum, d) => {
        const memUsed = d.runtime?.resources?.memory?.used || "0MB";
        return sum + parseFloat(memUsed.replace(/[^\d.]/g, ""));
      }, 0);

      const averageCpu =
        runningDeployments.reduce(
          (sum, d) => sum + (d.runtime?.resources?.cpu?.used || 0),
          0
        ) / runningDeployments.length;

      return {
        memory: Math.round(totalMemory),
        cpu: Math.round(averageCpu * 100) / 100,
        activeDeployments: runningDeployments.length,
      };
    } catch (error) {
      logger.error("Error in getProjectResourceUsage:", error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
```

### File 12: Analytics Controller

**Location**: `server/controllers/analytics/analyticsController.js`

```javascript
const { analytics: analyticsService } = require("@services");
const logger = require("@config/logger");

class AnalyticsController {
  /**
   * @desc Get dashboard analytics
   * @route GET /api/v1/analytics/dashboard
   * @access Private
   */
  async getDashboardAnalytics(req, res) {
    try {
      const userId = req.user._id;
      const analytics = await analyticsService.getDashboardAnalytics(userId);

      res.status(200).json({
        success: true,
        message: "Dashboard analytics retrieved successfully",
        data: analytics,
      });
    } catch (error) {
      logger.error("Error in getDashboardAnalytics:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch dashboard analytics",
      });
    }
  }

  /**
   * @desc Get project analytics
   * @route GET /api/v1/analytics/projects/:projectId
   * @access Private
   */
  async getProjectAnalytics(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user._id;

      const analytics = await analyticsService.getProjectAnalytics(
        projectId,
        userId
      );

      res.status(200).json({
        success: true,
        message: "Project analytics retrieved successfully",
        data: analytics,
      });
    } catch (error) {
      logger.error("Error in getProjectAnalytics:", error);
      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to fetch project analytics",
      });
    }
  }
}

module.exports = new AnalyticsController();
```

### File 13: Analytics Routes

**Location**: `server/routes/api/v1/analytics/analytics.js`

```javascript
const express = require("express");
const { param } = require("express-validator");
const analyticsController = require("@controllers/analytics/analyticsController");

const router = express.Router();

// Validation middleware
const validateProjectId = [
  param("projectId").isMongoId().withMessage("Invalid project ID"),
];

/**
 * @desc Get dashboard analytics
 * @route GET /api/v1/analytics/dashboard
 */
router.get("/dashboard", analyticsController.getDashboardAnalytics);

/**
 * @desc Get project analytics
 * @route GET /api/v1/analytics/projects/:projectId
 */
router.get(
  "/projects/:projectId",
  validateProjectId,
  analyticsController.getProjectAnalytics
);

module.exports = router;
```

---

## 🔧 **INTEGRATION & INDEX UPDATES**

### File 14: Create Deployment Service Index

**Location**: `server/services/deployment/index.js`

```javascript
const deploymentService = require("./deploymentService");

module.exports = {
  deploymentService,
  ...deploymentService,
};
```

### File 15: Create Analytics Service Index

**Location**: `server/services/analytics/index.js`

```javascript
const analyticsService = require("./analyticsService");

module.exports = {
  analyticsService,
  ...analyticsService,
};
```

### File 16: Update Main Services Index

**Location**: `server/services/index.js` (UPDATE)

```javascript
// Main Services Module - Comprehensive API Coverage
// Integrates all service modules for easy importing

const project = require("./project");
const deployment = require("./deployment"); // ADD THIS
const analytics = require("./analytics"); // ADD THIS
const user = require("./user");
const auth = require("./auth");
const notification = require("./notification");

module.exports = {
  // Core business logic services
  project,
  deployment, // ADD THIS
  analytics, // ADD THIS
  user,
  auth,
  notification,

  // Direct service exports for convenience
  ...project,
  ...deployment, // ADD THIS
  ...analytics, // ADD THIS
  ...user,
  ...auth,
  ...notification,
};
```

### File 17: Create Deployment Routes Index

**Location**: `server/routes/api/v1/deployment/index.js`

```javascript
const express = require("express");
const router = express.Router();
const { protect } = require("@middleware/authMiddleware");

// Import deployment routes
const deploymentRoutes = require("./deployments");

// All deployment routes require authentication
router.use(protect);

// Mount routes
router.use("/", deploymentRoutes);

module.exports = router;
```

### File 18: Create Analytics Routes Index

**Location**: `server/routes/api/v1/analytics/index.js`

```javascript
const express = require("express");
const router = express.Router();
const { protect } = require("@middleware/authMiddleware");

// Import analytics routes
const analyticsRoutes = require("./analytics");

// All analytics routes require authentication
router.use(protect);

// Mount routes
router.use("/", analyticsRoutes);

module.exports = router;
```

### File 19: Update Main API Routes

**Location**: `server/routes/api/v1/index.js` (UPDATE)

```javascript
// Main API v1 Routes - Complete Backend API
// Comprehensive routing for all business modules

const express = require("express");
const router = express.Router();

// Import route modules
const projectRoutes = require("./project");
const deploymentRoutes = require("./deployment"); // ADD THIS
const analyticsRoutes = require("./analytics"); // ADD THIS
const userRoutes = require("./user");
const adminRoutes = require("./admin");
const metricsRoutes = require("./metrics");

// Mount routes with proper prefixes
router.use("/projects", projectRoutes);
router.use("/deployments", deploymentRoutes); // ADD THIS
router.use("/analytics", analyticsRoutes); // ADD THIS
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/metrics", metricsRoutes);

// Health check for v1 API
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DeployIO API v1 is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
```

---

## ✅ **COMPREHENSIVE TESTING CHECKLIST**

### **Project API Endpoints**

1. ✅ **GET /api/v1/projects** - List projects with pagination
2. ✅ **GET /api/v1/projects/:id** - Get project details
3. ✅ **PUT /api/v1/projects/:id** - Update project
4. ✅ **DELETE /api/v1/projects/:id** - Delete project

### **Deployment API Endpoints**

5. ✅ **GET /api/v1/deployments** - List all user deployments
6. ✅ **GET /api/v1/deployments/:id** - Get deployment details
7. ✅ **GET /api/v1/projects/:id/deployments** - Project deployments
8. ✅ **POST /api/v1/projects/:id/deployments** - Create deployment
9. ✅ **PATCH /api/v1/deployments/:id/status** - Update status
10. ✅ **POST /api/v1/deployments/:id/restart** - Restart deployment
11. ✅ **POST /api/v1/deployments/:id/cancel** - Cancel deployment
12. ✅ **DELETE /api/v1/deployments/:id** - Delete deployment

13. ✅ **DELETE /api/v1/deployments/:id** - Delete deployment
14. ✅ **GET /api/v1/deployments/:id/logs** - Get deployment logs

### **Analytics API Endpoints**

14. ✅ **GET /api/v1/analytics/dashboard** - Dashboard analytics
15. ✅ **GET /api/v1/analytics/projects/:id** - Project analytics

### **Test Scenarios**

- ✅ Valid authentication for all endpoints
- ✅ Pagination and filtering parameters
- ✅ Error handling (404, 403, 500)
- ✅ Data validation and sanitization
- ✅ Database operations verification
- ✅ Cross-references between projects and deployments

---

## 🚀 **IMPLEMENTATION ORDER**

### **Step 1: Create Directory Structure**

```bash
mkdir -p server/services/deployment
mkdir -p server/services/analytics
mkdir -p server/controllers/deployment
mkdir -p server/controllers/analytics
mkdir -p server/routes/api/v1/deployment
mkdir -p server/routes/api/v1/analytics
```

### **Step 2: Implement Services (Core Logic)**

1. `server/services/project/projectService.js`
2. `server/services/deployment/deploymentService.js`
3. `server/services/analytics/analyticsService.js`

### **Step 3: Implement Controllers (API Handlers)**

4. `server/controllers/project/projectController.js`
5. `server/controllers/deployment/deploymentController.js`
6. `server/controllers/analytics/analyticsController.js`

### **Step 4: Implement Routes (Endpoints)**

7. `server/routes/api/v1/project/projects.js`
8. `server/routes/api/v1/deployment/deployments.js`
9. `server/routes/api/v1/analytics/analytics.js`

### **Step 5: Update Index Files (Integration)**

10. Update all index.js files to connect services and routes
11. Test each module as you complete it

### **Step 6: End-to-End Testing**

12. Test complete user flows
13. Verify database operations
14. Check error handling

---

## 🎯 **SUCCESS CRITERIA**

After completing Phase 1, you should have:

✅ **Complete Project CRUD API** - All frontend expectations met
✅ **Comprehensive Deployment API** - Full lifecycle management
✅ **Analytics Dashboard API** - Real-time metrics and insights
✅ **Proper Error Handling** - Graceful failure scenarios
✅ **Authentication & Authorization** - Secure endpoint access
✅ **Data Validation** - Input sanitization and validation
✅ **Database Integration** - Consistent data operations

This implementation provides a **production-ready, comprehensive backend API** that fully supports your frontend requirements and enables the complete DeployIO user experience.
