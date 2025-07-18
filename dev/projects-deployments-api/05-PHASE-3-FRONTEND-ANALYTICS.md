# Phase 3: Frontend Integration & Analytics

## 🎯 **Objective**

Update frontend Redux slices and implement analytics system to work seamlessly with the new backend APIs.

## 📋 **Implementation Checklist**

### Step 1: Update Redux Slices (30 min)

- [ ] Fix API endpoint URLs in projectSlice.js
- [ ] Update response handling for new format
- [ ] Add error handling improvements
- [ ] Test Redux integration

### Step 2: Implement Analytics Backend (45 min)

- [ ] Create analytics controller and service
- [ ] Add analytics routes
- [ ] Implement dashboard statistics
- [ ] Add project-specific analytics

### Step 3: Create Analytics Frontend (30 min)

- [ ] Create analytics Redux slice
- [ ] Update dashboard components
- [ ] Add analytics display components
- [ ] Integrate real-time data

### Step 4: Testing & Validation (15 min)

- [ ] Test all frontend-backend integration
- [ ] Verify data consistency
- [ ] Check error handling
- [ ] Validate user experience

---

## 🔧 **Implementation Details**

### Part A: Frontend Redux Updates

#### File 1: Update Project Slice

**Location**: `client/src/redux/slices/projectSlice.js` (UPDATE)

```javascript
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// Initial state remains the same
const initialState = {
  projects: [],
  currentProject: null,
  loading: {
    projects: false,
    currentProject: false,
    create: false,
    update: false,
    delete: false,
    connect: false,
    analyze: false,
    dockerfile: false,
  },
  error: {
    projects: null,
    currentProject: null,
    create: null,
    update: null,
    delete: null,
    connect: null,
    analyze: null,
    dockerfile: null,
  },
  success: {
    create: false,
    update: false,
    delete: false,
    connect: false,
    analyze: false,
    dockerfile: false,
  },
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
};

// UPDATED: Change API endpoints to use v1
export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (params = {}, { rejectWithValue }) => {
    try {
      // CHANGE: Use new API endpoint
      const response = await api.get("/api/v1/projects", { params });

      // Handle standardized response format
      if (response.data.success && response.data.data) {
        return {
          projects: response.data.data.projects || [],
          pagination: response.data.data.pagination || {},
        };
      }

      // Fallback for legacy format
      return { projects: response.data.projects || [], pagination: {} };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch projects"
      );
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  "projects/fetchProjectById",
  async (projectId, { rejectWithValue }) => {
    try {
      // CHANGE: Use new API endpoint
      const response = await api.get(`/api/v1/projects/${projectId}`);

      // Handle standardized response format
      if (response.data.success && response.data.data) {
        return {
          project: response.data.data.project,
          recentDeployments: response.data.data.recentDeployments || [],
        };
      }

      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch project"
      );
    }
  }
);

export const updateProject = createAsyncThunk(
  "projects/updateProject",
  async ({ projectId, projectData }, { rejectWithValue }) => {
    try {
      // CHANGE: Use new API endpoint
      const response = await api.put(
        `/api/v1/projects/${projectId}`,
        projectData
      );

      if (response.data.success && response.data.data) {
        return response.data.data.project;
      }

      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update project"
      );
    }
  }
);

export const deleteProject = createAsyncThunk(
  "projects/deleteProject",
  async (projectId, { rejectWithValue }) => {
    try {
      // CHANGE: Use new API endpoint
      const response = await api.delete(`/api/v1/projects/${projectId}`);

      if (response.data.success) {
        return { projectId };
      }

      return { projectId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete project"
      );
    }
  }
);

export const fetchProjectDeployments = createAsyncThunk(
  "projects/fetchProjectDeployments",
  async ({ projectId, ...params }, { rejectWithValue }) => {
    try {
      // CHANGE: Use new API endpoint
      const response = await api.get(
        `/api/v1/projects/${projectId}/deployments`,
        { params }
      );

      if (response.data.success && response.data.data) {
        return {
          projectId,
          deployments: response.data.data.deployments || [],
          pagination: response.data.data.pagination || {},
        };
      }

      return {
        projectId,
        deployments: response.data.deployments || response.data.data || [],
        pagination: {},
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch project deployments"
      );
    }
  }
);

// NEW: Deploy project action
export const deployProject = createAsyncThunk(
  "projects/deployProject",
  async ({ projectId, deploymentConfig }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/v1/projects/${projectId}/deploy`,
        deploymentConfig
      );

      if (response.data.success && response.data.data) {
        return response.data.data.deployment;
      }

      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to deploy project"
      );
    }
  }
);

// Existing async thunks for project creation (keep as-is, they use creation endpoints)
export const createProject = createAsyncThunk(
  "projects/createProject",
  async (projectData, { rejectWithValue }) => {
    try {
      // This still uses the creation flow
      const response = await api.post("/projects", projectData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create project"
      );
    }
  }
);

// Keep other existing thunks (analyzeRepository, generateDockerfile, etc.)
// ... (rest of the existing thunks remain unchanged)

// Update the slice to handle new actions
const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    // Existing reducers remain the same
    clearProjectError: (state, action) => {
      const { field } = action.payload;
      if (field && state.error[field] !== undefined) {
        state.error[field] = null;
      }
    },
    clearProjectSuccess: (state, action) => {
      const { field } = action.payload;
      if (field && state.success[field] !== undefined) {
        state.success[field] = false;
      }
    },
    clearAllProjectErrors: (state) => {
      Object.keys(state.error).forEach((key) => {
        state.error[key] = null;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading.projects = true;
        state.error.projects = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading.projects = false;
        state.projects = action.payload.projects;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading.projects = false;
        state.error.projects = action.payload;
      })

      // Fetch Project By ID
      .addCase(fetchProjectById.pending, (state) => {
        state.loading.currentProject = true;
        state.error.currentProject = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading.currentProject = false;
        state.currentProject = action.payload.project;
        // Store recent deployments if provided
        if (action.payload.recentDeployments) {
          state.currentProject.recentDeployments =
            action.payload.recentDeployments;
        }
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading.currentProject = false;
        state.error.currentProject = action.payload;
      })

      // Update Project
      .addCase(updateProject.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading.update = false;
        state.success.update = true;

        // Update current project if it's the one being updated
        if (
          state.currentProject &&
          state.currentProject._id === action.payload._id
        ) {
          state.currentProject = { ...state.currentProject, ...action.payload };
        }

        // Update in projects list
        const index = state.projects.findIndex(
          (p) => p._id === action.payload._id
        );
        if (index !== -1) {
          state.projects[index] = {
            ...state.projects[index],
            ...action.payload,
          };
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload;
      })

      // Delete Project
      .addCase(deleteProject.pending, (state) => {
        state.loading.delete = true;
        state.error.delete = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.success.delete = true;

        // Remove from projects list
        state.projects = state.projects.filter(
          (p) => p._id !== action.payload.projectId
        );

        // Clear current project if it's the deleted one
        if (
          state.currentProject &&
          state.currentProject._id === action.payload.projectId
        ) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading.delete = false;
        state.error.delete = action.payload;
      })

      // Deploy Project
      .addCase(deployProject.pending, (state) => {
        state.loading.deploy = true;
        state.error.deploy = null;
      })
      .addCase(deployProject.fulfilled, (state, action) => {
        state.loading.deploy = false;
        state.success.deploy = true;
      })
      .addCase(deployProject.rejected, (state, action) => {
        state.loading.deploy = false;
        state.error.deploy = action.payload;
      });
  },
});

export const { clearProjectError, clearProjectSuccess, clearAllProjectErrors } =
  projectSlice.actions;

export default projectSlice.reducer;
```

#### File 2: Update Deployment Slice

**Location**: `client/src/redux/slices/deploymentSlice.js` (UPDATE)

```javascript
// Update the fetchProjectDeployments thunk
export const fetchProjectDeployments = createAsyncThunk(
  "deployments/fetchProjectDeployments",
  async ({ projectId, ...params }, { rejectWithValue }) => {
    try {
      // CHANGE: Use new API endpoint
      const response = await api.get(
        `/api/v1/projects/${projectId}/deployments`,
        { params }
      );

      if (response.data.success && response.data.data) {
        return {
          projectId,
          deployments: response.data.data.deployments || [],
          pagination: response.data.data.pagination || {},
        };
      }

      return {
        projectId,
        deployments: response.data.deployments || response.data.data || [],
        pagination: {},
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch project deployments"
      );
    }
  }
);

// Keep the rest of the deployment slice unchanged
```

### Part B: Analytics Backend Implementation

#### File 3: Analytics Service

**Location**: `server/services/analytics/analyticsService.js`

```javascript
const Project = require("@models/Project");
const Deployment = require("@models/Deployment");
const User = require("@models/User");
const logger = require("@config/logger");

class AnalyticsService {
  /**
   * Get dashboard statistics for a user
   */
  async getDashboardStats(userId) {
    try {
      const [
        totalProjects,
        activeProjects,
        totalDeployments,
        recentDeployments,
        failedDeployments,
        recentActivity,
      ] = await Promise.all([
        // Total projects
        Project.countDocuments({ owner: userId }),

        // Active projects (with running deployments)
        Project.countDocuments({
          owner: userId,
          "deployment.status": { $in: ["running", "active"] },
        }),

        // Total deployments
        this._getTotalDeploymentsForUser(userId),

        // Recent deployments (last 7 days)
        this._getRecentDeploymentsCount(userId, 7),

        // Failed deployments (last 30 days)
        this._getFailedDeploymentsCount(userId, 30),

        // Recent activity
        this._getRecentActivity(userId, 10),
      ]);

      // Calculate deployment success rate
      const successfulDeployments = await this._getSuccessfulDeploymentsCount(
        userId,
        30
      );
      const totalRecentDeployments = await this._getRecentDeploymentsCount(
        userId,
        30
      );
      const successRate =
        totalRecentDeployments > 0
          ? Math.round((successfulDeployments / totalRecentDeployments) * 100)
          : 0;

      return {
        projects: {
          total: totalProjects,
          active: activeProjects,
          inactive: totalProjects - activeProjects,
        },
        deployments: {
          total: totalDeployments,
          recent: recentDeployments,
          failed: failedDeployments,
          successRate,
        },
        activity: recentActivity,
      };
    } catch (error) {
      logger.error("Error getting dashboard stats:", error);
      throw new Error("Failed to retrieve dashboard statistics");
    }
  }

  /**
   * Get analytics for a specific project
   */
  async getProjectAnalytics(projectId, userId, timeframe = "30d") {
    try {
      // Verify project ownership
      const project = await Project.findOne({
        _id: projectId,
        owner: userId,
      });

      if (!project) {
        throw new Error("Project not found");
      }

      const days = this._parseTimeframe(timeframe);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [
        deploymentHistory,
        deploymentStats,
        performanceMetrics,
        errorLogs,
      ] = await Promise.all([
        // Deployment history
        this._getDeploymentHistory(projectId, startDate),

        // Deployment statistics
        this._getDeploymentStats(projectId, startDate),

        // Performance metrics
        this._getPerformanceMetrics(projectId, startDate),

        // Error logs
        this._getErrorLogs(projectId, startDate, 10),
      ]);

      return {
        project: {
          id: projectId,
          name: project.name,
          technology: project.technology?.detected?.primary || "unknown",
        },
        timeframe: {
          days,
          startDate,
          endDate: new Date(),
        },
        deployments: {
          history: deploymentHistory,
          stats: deploymentStats,
        },
        performance: performanceMetrics,
        errors: errorLogs,
      };
    } catch (error) {
      logger.error("Error getting project analytics:", error);
      throw error;
    }
  }

  /**
   * Get deployment analytics across all user projects
   */
  async getDeploymentAnalytics(userId, timeframe = "30d") {
    try {
      const days = this._parseTimeframe(timeframe);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get user projects
      const projects = await Project.find({ owner: userId }).select("_id name");
      const projectIds = projects.map((p) => p._id);

      const [
        deploymentTrends,
        statusDistribution,
        environmentBreakdown,
        performanceTrends,
      ] = await Promise.all([
        // Daily deployment trends
        this._getDeploymentTrends(projectIds, startDate),

        // Status distribution
        this._getStatusDistribution(projectIds, startDate),

        // Environment breakdown
        this._getEnvironmentBreakdown(projectIds, startDate),

        // Performance trends
        this._getPerformanceTrends(projectIds, startDate),
      ]);

      return {
        timeframe: {
          days,
          startDate,
          endDate: new Date(),
        },
        trends: deploymentTrends,
        distribution: {
          status: statusDistribution,
          environment: environmentBreakdown,
        },
        performance: performanceTrends,
      };
    } catch (error) {
      logger.error("Error getting deployment analytics:", error);
      throw new Error("Failed to retrieve deployment analytics");
    }
  }

  // Helper methods
  async _getTotalDeploymentsForUser(userId) {
    const projects = await Project.find({ owner: userId }).select("_id");
    const projectIds = projects.map((p) => p._id);
    return Deployment.countDocuments({ project: { $in: projectIds } });
  }

  async _getRecentDeploymentsCount(userId, days) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const projects = await Project.find({ owner: userId }).select("_id");
    const projectIds = projects.map((p) => p._id);

    return Deployment.countDocuments({
      project: { $in: projectIds },
      createdAt: { $gte: startDate },
    });
  }

  async _getFailedDeploymentsCount(userId, days) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const projects = await Project.find({ owner: userId }).select("_id");
    const projectIds = projects.map((p) => p._id);

    return Deployment.countDocuments({
      project: { $in: projectIds },
      "status.current": "failed",
      createdAt: { $gte: startDate },
    });
  }

  async _getSuccessfulDeploymentsCount(userId, days) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const projects = await Project.find({ owner: userId }).select("_id");
    const projectIds = projects.map((p) => p._id);

    return Deployment.countDocuments({
      project: { $in: projectIds },
      "status.current": { $in: ["running", "completed"] },
      createdAt: { $gte: startDate },
    });
  }

  async _getRecentActivity(userId, limit) {
    const projects = await Project.find({ owner: userId }).select("_id name");
    const projectIds = projects.map((p) => p._id);

    const deployments = await Deployment.find({
      project: { $in: projectIds },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("project", "name")
      .select(
        "deploymentId status.current config.environment createdAt project"
      )
      .lean();

    return deployments.map((deployment) => ({
      id: deployment.deploymentId,
      type: "deployment",
      project: deployment.project.name,
      status: deployment.status.current,
      environment: deployment.config.environment,
      timestamp: deployment.createdAt,
    }));
  }

  async _getDeploymentHistory(projectId, startDate) {
    return Deployment.find({
      project: projectId,
      createdAt: { $gte: startDate },
    })
      .sort({ createdAt: -1 })
      .select("deploymentId status config.environment createdAt")
      .lean();
  }

  async _getDeploymentStats(projectId, startDate) {
    const stats = await Deployment.aggregate([
      {
        $match: {
          project: projectId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$status.current",
          count: { $sum: 1 },
        },
      },
    ]);

    return stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});
  }

  async _getPerformanceMetrics(projectId, startDate) {
    const deployments = await Deployment.find({
      project: projectId,
      createdAt: { $gte: startDate },
      "metrics.cpu": { $exists: true },
    })
      .select("metrics createdAt")
      .lean();

    if (deployments.length === 0) {
      return {
        averageCpuUsage: 0,
        averageMemoryUsage: 0,
        averageResponseTime: 0,
      };
    }

    const totals = deployments.reduce(
      (acc, dep) => {
        acc.cpu += dep.metrics?.cpu?.usage || 0;
        acc.memory += dep.metrics?.memory?.usage || 0;
        acc.requests += dep.metrics?.requests?.total || 0;
        return acc;
      },
      { cpu: 0, memory: 0, requests: 0 }
    );

    return {
      averageCpuUsage: Math.round(totals.cpu / deployments.length),
      averageMemoryUsage: Math.round(totals.memory / deployments.length),
      totalRequests: totals.requests,
    };
  }

  async _getErrorLogs(projectId, startDate, limit) {
    return Deployment.find({
      project: projectId,
      "status.current": "failed",
      createdAt: { $gte: startDate },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("deploymentId status.history logs createdAt")
      .lean();
  }

  _parseTimeframe(timeframe) {
    const match = timeframe.match(/^(\d+)([dhmw])$/);
    if (!match) return 30;

    const [, value, unit] = match;
    const multipliers = { d: 1, h: 1 / 24, m: 1 / (24 * 60), w: 7 };

    return parseInt(value) * (multipliers[unit] || 1);
  }

  async _getDeploymentTrends(projectIds, startDate) {
    return Deployment.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
  }

  async _getStatusDistribution(projectIds, startDate) {
    return Deployment.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$status.current",
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async _getEnvironmentBreakdown(projectIds, startDate) {
    return Deployment.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$config.environment",
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async _getPerformanceTrends(projectIds, startDate) {
    return Deployment.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          createdAt: { $gte: startDate },
          "metrics.cpu": { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          avgCpu: { $avg: "$metrics.cpu.usage" },
          avgMemory: { $avg: "$metrics.memory.usage" },
          avgRequests: { $avg: "$metrics.requests.total" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
  }
}

module.exports = new AnalyticsService();
```

#### File 4: Analytics Controller

**Location**: `server/controllers/analytics/analyticsController.js`

```javascript
const { analytics: analyticsService } = require("@services");
const { validationResult } = require("express-validator");
const logger = require("@config/logger");

class AnalyticsController {
  /**
   * @desc Get dashboard statistics
   * @route GET /api/v1/analytics/dashboard
   * @access Private
   */
  async getDashboardStats(req, res) {
    try {
      const userId = req.user._id;
      const stats = await analyticsService.getDashboardStats(userId);

      res.status(200).json({
        success: true,
        message: "Dashboard statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      logger.error("Error getting dashboard stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve dashboard statistics",
        error: error.message,
      });
    }
  }

  /**
   * @desc Get project analytics
   * @route GET /api/v1/analytics/projects/:id
   * @access Private
   */
  async getProjectAnalytics(req, res) {
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
      const { timeframe = "30d" } = req.query;
      const userId = req.user._id;

      const analytics = await analyticsService.getProjectAnalytics(
        projectId,
        userId,
        timeframe
      );

      res.status(200).json({
        success: true,
        message: "Project analytics retrieved successfully",
        data: analytics,
      });
    } catch (error) {
      logger.error("Error getting project analytics:", error);

      if (error.message === "Project not found") {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to retrieve project analytics",
        error: error.message,
      });
    }
  }

  /**
   * @desc Get deployment analytics
   * @route GET /api/v1/analytics/deployments
   * @access Private
   */
  async getDeploymentAnalytics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { timeframe = "30d" } = req.query;
      const userId = req.user._id;

      const analytics = await analyticsService.getDeploymentAnalytics(
        userId,
        timeframe
      );

      res.status(200).json({
        success: true,
        message: "Deployment analytics retrieved successfully",
        data: analytics,
      });
    } catch (error) {
      logger.error("Error getting deployment analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve deployment analytics",
        error: error.message,
      });
    }
  }
}

module.exports = new AnalyticsController();
```

#### File 5: Analytics Routes

**Location**: `server/routes/api/v1/analytics/index.js`

```javascript
const express = require("express");
const { param, query } = require("express-validator");
const { analytics } = require("@controllers");
const { protect } = require("@middleware/authMiddleware");

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation middleware
const projectIdValidation = [
  param("id").isMongoId().withMessage("Invalid project ID"),
];

const timeframeValidation = [
  query("timeframe")
    .optional()
    .matches(/^\d+[dhmw]$/)
    .withMessage("Invalid timeframe format (e.g., 30d, 24h, 7d)"),
];

// Routes
router.get("/dashboard", analytics.analyticsController.getDashboardStats);
router.get(
  "/projects/:id",
  [...projectIdValidation, ...timeframeValidation],
  analytics.analyticsController.getProjectAnalytics
);
router.get(
  "/deployments",
  timeframeValidation,
  analytics.analyticsController.getDeploymentAnalytics
);

module.exports = router;
```

#### File 6: Update Controllers Index

**Location**: `server/controllers/analytics/index.js`

```javascript
// Analytics Controllers Module Export
const analyticsController = require("./analyticsController");

module.exports = {
  analyticsController: analyticsController,
};
```

#### File 7: Update Services Index

**Location**: `server/services/analytics/index.js`

```javascript
// Analytics Services Module Export
const analyticsService = require("./analyticsService");

module.exports = {
  analyticsService: analyticsService,
};
```

#### File 8: Update Main Controllers Index

**Location**: `server/controllers/index.js` (ADD ANALYTICS)

```javascript
// Master Controllers Index - Import Aliases & Clean Module Access
// Enables clean imports like: const { user, project, ai } = require('@controllers');

const ai = require("./ai");
const deployment = require("./deployment");
const user = require("./user");
const project = require("./project");
const git = require("./git");
const admin = require("./admin");
const external = require("./external");
const api = require("./api");
const analytics = require("./analytics"); // ADD THIS

module.exports = {
  // New modular structure
  ai,
  deployment,
  user,
  project,
  git,
  admin,
  external,
  api,
  analytics, // ADD THIS
};
```

#### File 9: Update Main Services Index

**Location**: `server/services/index.js` (ADD ANALYTICS)

```javascript
// Master Services Index - Import Aliases & Clean Module Access
// Enables clean imports like: const { user, project, ai } = require('@services');

const ai = require("./ai");
const deployment = require("./deployment");
const user = require("./user");
const project = require("./project");
const external = require("./external");
const notification = require("./notification");
const analytics = require("./analytics"); // ADD THIS

module.exports = {
  // New modular structure
  ai,
  deployment,
  user,
  project,
  external,
  notification,
  analytics, // ADD THIS
};
```

#### File 10: Update Main API Routes

**Location**: `server/routes/api/v1/index.js` (ADD ANALYTICS)

```javascript
// API v1 Main Router
// Implements the versioned API routing from BACKEND_ARCHITECTURE_PLAN.md

const express = require("express");
const router = express.Router();

// Import route modules
const aiRoutes = require("./ai");
const deploymentRoutes = require("./deployment");
const projectRoutes = require("./project");
const userRoutes = require("./user");
const gitRoutes = require("./git");
const adminRoutes = require("./admin");
const externalRoutes = require("./external");
const logsRoutes = require("./logs");
const metricsRoutes = require("./metrics");
const analyticsRoutes = require("./analytics"); // ADD THIS
const debugRoutes = require("../debug/tokens");

// Mount route modules
router.use("/ai", aiRoutes);
router.use("/deployments", deploymentRoutes);
router.use("/projects", projectRoutes);
router.use("/users", userRoutes);
router.use("/git", gitRoutes);
router.use("/admin", adminRoutes);
router.use("/external", externalRoutes);
router.use("/logs", logsRoutes);
router.use("/metrics", metricsRoutes);
router.use("/analytics", analyticsRoutes); // ADD THIS

// Debug routes (only in development)
if (process.env.NODE_ENV === "development") {
  router.use("/debug", debugRoutes);
}

module.exports = router;
```

### Part C: Frontend Analytics Integration

#### File 11: Analytics Redux Slice

**Location**: `client/src/redux/slices/analyticsSlice.js`

```javascript
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// Initial state
const initialState = {
  dashboardStats: null,
  projectAnalytics: null,
  deploymentAnalytics: null,
  loading: {
    dashboard: false,
    project: false,
    deployment: false,
  },
  error: {
    dashboard: null,
    project: null,
    deployment: null,
  },
  cache: {
    dashboard: null,
    project: {},
    deployment: {},
  },
};

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  "analytics/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/v1/analytics/dashboard");

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch dashboard statistics"
      );
    }
  }
);

export const fetchProjectAnalytics = createAsyncThunk(
  "analytics/fetchProjectAnalytics",
  async ({ projectId, timeframe = "30d" }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/v1/analytics/projects/${projectId}`,
        {
          params: { timeframe },
        }
      );

      if (response.data.success && response.data.data) {
        return { projectId, timeframe, data: response.data.data };
      }

      return {
        projectId,
        timeframe,
        data: response.data.data || response.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch project analytics"
      );
    }
  }
);

export const fetchDeploymentAnalytics = createAsyncThunk(
  "analytics/fetchDeploymentAnalytics",
  async ({ timeframe = "30d" } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/v1/analytics/deployments", {
        params: { timeframe },
      });

      if (response.data.success && response.data.data) {
        return { timeframe, data: response.data.data };
      }

      return { timeframe, data: response.data.data || response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch deployment analytics"
      );
    }
  }
);

// Slice
const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearAnalyticsError: (state, action) => {
      const { field } = action.payload;
      if (field && state.error[field] !== undefined) {
        state.error[field] = null;
      }
    },
    clearAllAnalyticsErrors: (state) => {
      Object.keys(state.error).forEach((key) => {
        state.error[key] = null;
      });
    },
    // Cache management
    clearAnalyticsCache: (state) => {
      state.cache = {
        dashboard: null,
        project: {},
        deployment: {},
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading.dashboard = true;
        state.error.dashboard = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading.dashboard = false;
        state.dashboardStats = action.payload;
        state.cache.dashboard = Date.now();
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading.dashboard = false;
        state.error.dashboard = action.payload;
      })

      // Project Analytics
      .addCase(fetchProjectAnalytics.pending, (state) => {
        state.loading.project = true;
        state.error.project = null;
      })
      .addCase(fetchProjectAnalytics.fulfilled, (state, action) => {
        state.loading.project = false;
        state.projectAnalytics = action.payload.data;
        state.cache.project[action.payload.projectId] = {
          timeframe: action.payload.timeframe,
          timestamp: Date.now(),
        };
      })
      .addCase(fetchProjectAnalytics.rejected, (state, action) => {
        state.loading.project = false;
        state.error.project = action.payload;
      })

      // Deployment Analytics
      .addCase(fetchDeploymentAnalytics.pending, (state) => {
        state.loading.deployment = true;
        state.error.deployment = null;
      })
      .addCase(fetchDeploymentAnalytics.fulfilled, (state, action) => {
        state.loading.deployment = false;
        state.deploymentAnalytics = action.payload.data;
        state.cache.deployment[action.payload.timeframe] = Date.now();
      })
      .addCase(fetchDeploymentAnalytics.rejected, (state, action) => {
        state.loading.deployment = false;
        state.error.deployment = action.payload;
      });
  },
});

export const {
  clearAnalyticsError,
  clearAllAnalyticsErrors,
  clearAnalyticsCache,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
```

#### File 12: Update Redux Store

**Location**: `client/src/redux/store.js` (ADD ANALYTICS SLICE)

```javascript
import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import projectSlice from "./slices/projectSlice";
import deploymentSlice from "./slices/deploymentSlice";
import projectCreationSlice from "./slices/projectCreationSlice";
import gitProviderSlice from "./slices/gitProviderSlice";
import userSlice from "./slices/userSlice";
import notificationSlice from "./slices/notificationSlice";
import blogSlice from "./slices/blogSlice";
import documentationSlice from "./slices/documentationSlice";
import apiKeySlice from "./slices/apiKeySlice";
import twoFactorSlice from "./slices/twoFactorSlice";
import analyticsSlice from "./slices/analyticsSlice"; // ADD THIS

export const store = configureStore({
  reducer: {
    auth: authSlice,
    projects: projectSlice,
    deployments: deploymentSlice,
    projectCreation: projectCreationSlice,
    gitProvider: gitProviderSlice,
    user: userSlice,
    notifications: notificationSlice,
    blogs: blogSlice,
    documentation: documentationSlice,
    apiKeys: apiKeySlice,
    twoFactor: twoFactorSlice,
    analytics: analyticsSlice, // ADD THIS
  },
});

export default store;
```

---

## ✅ **Testing Checklist**

After implementation, test:

### Backend Tests

1. **Analytics Endpoints**
   - GET `/api/v1/analytics/dashboard`
   - GET `/api/v1/analytics/projects/:id?timeframe=30d`
   - GET `/api/v1/analytics/deployments?timeframe=7d`

### Frontend Tests

2. **Redux Integration**

   - Projects API calls work with new endpoints
   - Analytics data loads correctly
   - Error handling works properly

3. **UI Integration**
   - Dashboard shows real analytics data
   - Project details show analytics
   - Performance metrics display correctly

---

## 🚀 **Next Steps**

1. Implement all files in order (Backend analytics → Frontend Redux → UI updates)
2. Test each component independently
3. Verify end-to-end integration
4. Move to advanced features implementation

This integration provides a complete analytics system that works seamlessly with the existing project and deployment management.
