# DeployIO Project Creation - Backend Integration Specification

## Overview

This document outlines the backend requirements and API specifications for supporting the intelligent project creation flow, including new endpoints, data models, and integration points with existing systems.

## Database Schema Updates

### 1. Project Creation Models

```javascript
// models/Project.js - Enhanced Project Model
const ProjectSchema = new mongoose.Schema(
  {
    // Basic Information
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // Owner Information
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Repository Information
    repository: {
      provider: {
        type: String,
        enum: ["github", "gitlab", "azure-devops"],
        required: true,
      },
      url: { type: String, required: true },
      owner: { type: String, required: true },
      name: { type: String, required: true },
      branch: { type: String, default: "main" },
      private: { type: Boolean, default: false },
      lastCommitHash: { type: String },
      lastCommitDate: { type: Date },
    },

    // AI Analysis Results
    analysis: {
      analysisId: { type: String }, // AI service operation ID
      analysisDate: { type: Date },
      confidence: { type: Number, min: 0, max: 1 },
      approach: { type: String }, // 'ai-enhanced', 'basic', 'manual'

      // Detected Technology Stack
      technologyStack: {
        primaryLanguage: { type: String },
        framework: { type: String },
        buildTool: { type: String },
        packageManager: { type: String },
        runtime: { type: String },
        version: { type: String },
      },

      // Detected Configuration
      detectedConfig: {
        buildCommand: { type: String },
        startCommand: { type: String },
        installCommand: { type: String },
        testCommand: { type: String },
        port: { type: Number },
        healthCheckPath: { type: String },
        environmentVariables: [
          {
            key: { type: String },
            value: { type: String },
            isSecret: { type: Boolean, default: false },
            source: { type: String }, // 'detected', 'user-input', 'ai-suggested'
          },
        ],
      },

      // AI Insights and Recommendations
      insights: [
        {
          category: { type: String },
          title: { type: String },
          description: { type: String },
          reasoning: { type: String },
          confidence: { type: Number },
          severity: { type: String },
          recommendations: [{ type: String }],
        },
      ],

      // Raw AI Response (for debugging and improvement)
      rawAnalysis: { type: mongoose.Schema.Types.Mixed },
    },

    // Deployment Configuration
    deployment: {
      // Build Configuration
      buildConfig: {
        buildCommand: { type: String },
        startCommand: { type: String },
        installCommand: { type: String },
        testCommand: { type: String },
        dockerfile: { type: String }, // Custom Dockerfile content
        dockerfileGenerated: { type: Boolean, default: false },
      },

      // Runtime Configuration
      runtime: {
        port: { type: Number, default: 3000 },
        healthCheckPath: { type: String, default: "/health" },
        environmentVariables: [
          {
            key: { type: String, required: true },
            value: { type: String },
            isSecret: { type: Boolean, default: false },
            category: { type: String }, // 'database', 'api', 'feature-flag', etc.
          },
        ],
        secrets: [
          {
            key: { type: String, required: true },
            valueSet: { type: Boolean, default: false },
            category: { type: String },
            description: { type: String },
          },
        ],
      },

      // Infrastructure Configuration
      infrastructure: {
        deploymentStrategy: {
          type: String,
          enum: ["standard", "blue-green", "canary"],
          default: "standard",
        },
        scalingPolicy: {
          type: String,
          enum: ["fixed", "auto", "manual"],
          default: "auto",
        },
        instanceType: {
          type: String,
          enum: ["nano", "micro", "small", "medium", "large"],
          default: "small",
        },
        minInstances: { type: Number, default: 1 },
        maxInstances: { type: Number, default: 3 },
        resourceLimits: {
          cpu: { type: String }, // '0.5', '1', '2'
          memory: { type: String }, // '512Mi', '1Gi', '2Gi'
          storage: { type: String }, // '10Gi', '20Gi'
        },
      },
    },

    // Status and Metadata
    status: {
      type: String,
      enum: [
        "draft",
        "analyzing",
        "configured",
        "deploying",
        "deployed",
        "failed",
        "archived",
      ],
      default: "draft",
    },

    // Deployment History
    deployments: [
      {
        deploymentId: { type: String },
        status: { type: String },
        startedAt: { type: Date },
        completedAt: { type: Date },
        logs: [{ type: String }],
        version: { type: String },
        commitHash: { type: String },
      },
    ],

    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    archivedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ProjectSchema.index({ owner: 1, status: 1 });
ProjectSchema.index({
  "repository.provider": 1,
  "repository.owner": 1,
  "repository.name": 1,
});
ProjectSchema.index({ status: 1, updatedAt: -1 });
```

### 2. Project Creation Session Model

```javascript
// models/ProjectCreationSession.js - Track wizard progress
const ProjectCreationSessionSchema = new mongoose.Schema(
  {
    // Session Information
    sessionId: { type: String, required: true, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Wizard State
    currentStep: { type: Number, default: 0 },
    completedSteps: [{ type: Number }],

    // Step Data
    stepData: {
      // Step 1: Provider Selection
      selectedProvider: { type: String },

      // Step 2: Repository Selection
      selectedRepository: {
        provider: { type: String },
        owner: { type: String },
        name: { type: String },
        url: { type: String },
        private: { type: Boolean },
      },

      // Step 3: Branch Selection
      selectedBranch: { type: String },
      analysisSettings: {
        analysisTypes: [{ type: String }],
        forceLlm: { type: Boolean, default: true },
        includeRecommendations: { type: Boolean, default: true },
      },

      // Step 4: Analysis Results
      analysisResults: { type: mongoose.Schema.Types.Mixed },
      analysisId: { type: String },

      // Step 5: Project Configuration
      projectConfig: { type: mongoose.Schema.Types.Mixed },

      // Step 6: Review and Deployment
      finalConfig: { type: mongoose.Schema.Types.Mixed },
    },

    // Session Metadata
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    }, // 24 hours
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// TTL index for automatic cleanup
ProjectCreationSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

## API Endpoints

### 1. Project Creation Wizard APIs

```javascript
// routes/api/v1/projects/creation.js

/**
 * POST /api/v1/projects/creation/session
 * Start a new project creation session
 */
router.post("/session", authMiddleware, async (req, res) => {
  try {
    const sessionId = uuidv4();
    const session = new ProjectCreationSession({
      sessionId,
      userId: req.user.id,
      currentStep: 0,
      completedSteps: [],
    });

    await session.save();

    res.status(201).json({
      success: true,
      data: {
        sessionId,
        currentStep: 0,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create project creation session",
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/projects/creation/session/:sessionId
 * Get current session state
 */
router.get("/session/:sessionId", authMiddleware, async (req, res) => {
  try {
    const session = await ProjectCreationSession.findOne({
      sessionId: req.params.sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found or expired",
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve session",
      error: error.message,
    });
  }
});

/**
 * PUT /api/v1/projects/creation/session/:sessionId/step
 * Update current step and save step data
 */
router.put("/session/:sessionId/step", authMiddleware, async (req, res) => {
  try {
    const { currentStep, stepData, markCompleted } = req.body;

    const session = await ProjectCreationSession.findOneAndUpdate(
      {
        sessionId: req.params.sessionId,
        userId: req.user.id,
      },
      {
        $set: {
          currentStep,
          [`stepData.${getStepKey(currentStep)}`]: stepData,
          updatedAt: new Date(),
        },
        ...(markCompleted && {
          $addToSet: { completedSteps: currentStep },
        }),
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found or expired",
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update session",
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/projects/creation/session/:sessionId/analyze
 * Trigger AI analysis for selected repository
 */
router.post("/session/:sessionId/analyze", authMiddleware, async (req, res) => {
  try {
    const session = await ProjectCreationSession.findOne({
      sessionId: req.params.sessionId,
      userId: req.user.id,
    });

    if (!session || !session.stepData.selectedRepository) {
      return res.status(400).json({
        success: false,
        message: "Session not found or repository not selected",
      });
    }

    const { selectedRepository, selectedBranch, analysisSettings } =
      session.stepData;

    // Call AI service for analysis
    const analysisResult = await aiService.analyzeRepository({
      repositoryUrl: selectedRepository.url,
      branch: selectedBranch || "main",
      analysisTypes: analysisSettings.analysisTypes || [
        "stack",
        "dependencies",
        "quality",
      ],
      forceLlm: analysisSettings.forceLlm || true,
      includeRecommendations: analysisSettings.includeRecommendations || true,
      includeInsights: true,
      explainNullFields: true,
      trackProgress: true,
    });

    // Update session with analysis results
    await ProjectCreationSession.findOneAndUpdate(
      { sessionId: req.params.sessionId, userId: req.user.id },
      {
        $set: {
          "stepData.analysisResults": analysisResult,
          "stepData.analysisId": analysisResult.analysis_id,
          currentStep: 4, // Move to form step
          updatedAt: new Date(),
        },
        $addToSet: { completedSteps: 3 }, // Mark analysis step as completed
      }
    );

    res.json({
      success: true,
      data: analysisResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Analysis failed",
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/projects/creation/session/:sessionId/complete
 * Complete project creation and create actual project
 */
router.post(
  "/session/:sessionId/complete",
  authMiddleware,
  async (req, res) => {
    try {
      const session = await ProjectCreationSession.findOne({
        sessionId: req.params.sessionId,
        userId: req.user.id,
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Session not found or expired",
        });
      }

      // Create project from session data
      const projectData = mapSessionToProject(session, req.user.id);
      const project = new Project(projectData);
      await project.save();

      // Clean up session
      await ProjectCreationSession.deleteOne({
        sessionId: req.params.sessionId,
      });

      res.json({
        success: true,
        data: project,
        message: "Project created successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create project",
        error: error.message,
      });
    }
  }
);
```

### 2. Repository Integration APIs

```javascript
// routes/api/v1/projects/repositories.js

/**
 * GET /api/v1/projects/repositories/:provider/branches
 * Get branches for a specific repository
 */
router.GET(
  "/repositories/:provider/branches",
  authMiddleware,
  async (req, res) => {
    try {
      const { provider } = req.params;
      const { owner, repo } = req.query;

      if (!owner || !repo) {
        return res.status(400).json({
          success: false,
          message: "Owner and repo parameters are required",
        });
      }

      // Get user's provider connection
      const user = await User.findById(req.user.id);
      const providerConfig = user.gitProviders.find(
        (p) => p.provider === provider
      );

      if (!providerConfig || !providerConfig.connected) {
        return res.status(401).json({
          success: false,
          message: "Provider not connected",
        });
      }

      // Fetch branches using provider API
      const branches = await gitProviderService.getBranches(
        provider,
        owner,
        repo,
        providerConfig.accessToken
      );

      res.json({
        success: true,
        data: branches,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch branches",
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/v1/projects/repositories/:provider/:owner/:repo/structure
 * Get repository file structure for preview
 */
router.get(
  "/repositories/:provider/:owner/:repo/structure",
  authMiddleware,
  async (req, res) => {
    try {
      const { provider, owner, repo } = req.params;
      const { branch = "main", path = "" } = req.query;

      // Get user's provider connection
      const user = await User.findById(req.user.id);
      const providerConfig = user.gitProviders.find(
        (p) => p.provider === provider
      );

      if (!providerConfig || !providerConfig.connected) {
        return res.status(401).json({
          success: false,
          message: "Provider not connected",
        });
      }

      // Fetch repository structure
      const structure = await gitProviderService.getRepositoryStructure(
        provider,
        owner,
        repo,
        branch,
        path,
        providerConfig.accessToken
      );

      res.json({
        success: true,
        data: structure,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch repository structure",
        error: error.message,
      });
    }
  }
);
```

### 3. AI Service Integration APIs

```javascript
// routes/api/v1/projects/ai.js

/**
 * POST /api/v1/projects/ai/analyze
 * Analyze repository with AI service
 */
router.post("/ai/analyze", authMiddleware, async (req, res) => {
  try {
    const { repositoryUrl, branch, analysisSettings } = req.body;

    // Validate repository access
    const hasAccess = await validateRepositoryAccess(
      req.user.id,
      repositoryUrl
    );
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "No access to repository",
      });
    }

    // Call AI service
    const analysisResult = await aiService.analyzeRepository({
      repositoryUrl,
      branch: branch || "main",
      ...analysisSettings,
    });

    res.json({
      success: true,
      data: analysisResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "AI analysis failed",
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/projects/ai/progress/:operationId
 * Get AI analysis progress
 */
router.get("/ai/progress/:operationId", authMiddleware, async (req, res) => {
  try {
    const { operationId } = req.params;

    const progress = await aiService.getAnalysisProgress(operationId);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get progress",
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/projects/ai/generate-config
 * Generate deployment configuration based on analysis
 */
router.post("/ai/generate-config", authMiddleware, async (req, res) => {
  try {
    const { analysisResults, preferences } = req.body;

    const config = await aiService.generateDeploymentConfig({
      analysisResults,
      preferences,
      includeDockerfile: true,
      includeEnvironmentVariables: true,
      includeHealthChecks: true,
    });

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Config generation failed",
      error: error.message,
    });
  }
});
```

## Service Layer Updates

### 1. AI Service Client

```javascript
// services/aiService.js - Enhanced AI service client
class AIService {
  constructor() {
    this.baseURL = process.env.AI_SERVICE_URL || "http://localhost:8000";
    this.timeout = 60000; // 60 seconds
  }

  async analyzeRepository(options) {
    try {
      const response = await axios.post(
        `${this.baseURL}/ai/analysis/demo`,
        options,
        {
          timeout: this.timeout,
          headers: {
            Authorization: `Bearer ${process.env.AI_SERVICE_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        `AI analysis failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async getAnalysisProgress(operationId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/ai/analysis/demo/progress/${operationId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.AI_SERVICE_TOKEN}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to get progress: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async generateDeploymentConfig(options) {
    try {
      const response = await axios.post(
        `${this.baseURL}/ai/optimization/generate-config`,
        options,
        {
          headers: {
            Authorization: `Bearer ${process.env.AI_SERVICE_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        `Config generation failed: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }
}

module.exports = new AIService();
```

### 2. Git Provider Service

```javascript
// services/gitProviderService.js - Enhanced git provider operations
class GitProviderService {
  async getBranches(provider, owner, repo, accessToken) {
    const api = this.getProviderAPI(provider, accessToken);

    switch (provider) {
      case "github":
        return await this.getGithubBranches(api, owner, repo);
      case "gitlab":
        return await this.getGitlabBranches(api, owner, repo);
      case "azure-devops":
        return await this.getAzureBranches(api, owner, repo);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async getRepositoryStructure(
    provider,
    owner,
    repo,
    branch,
    path,
    accessToken
  ) {
    const api = this.getProviderAPI(provider, accessToken);

    switch (provider) {
      case "github":
        return await this.getGithubStructure(api, owner, repo, branch, path);
      case "gitlab":
        return await this.getGitlabStructure(api, owner, repo, branch, path);
      case "azure-devops":
        return await this.getAzureStructure(api, owner, repo, branch, path);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async validateRepositoryAccess(userId, repositoryUrl) {
    // Check if user has access to the repository through any connected provider
    const user = await User.findById(userId);
    const repoInfo = this.parseRepositoryUrl(repositoryUrl);

    for (const providerConfig of user.gitProviders) {
      if (
        providerConfig.connected &&
        providerConfig.provider === repoInfo.provider
      ) {
        try {
          const api = this.getProviderAPI(
            providerConfig.provider,
            providerConfig.accessToken
          );
          await this.checkRepositoryAccess(api, repoInfo.owner, repoInfo.repo);
          return true;
        } catch (error) {
          continue; // Try next provider
        }
      }
    }

    return false;
  }
}
```

## Utility Functions

### 1. Session to Project Mapping

```javascript
// utils/projectMapping.js
function mapSessionToProject(session, userId) {
  const { stepData } = session;

  return {
    // Basic Information
    name: stepData.projectConfig.name,
    description: stepData.projectConfig.description,
    owner: userId,

    // Repository Information
    repository: {
      provider: stepData.selectedRepository.provider,
      url: stepData.selectedRepository.url,
      owner: stepData.selectedRepository.owner,
      name: stepData.selectedRepository.name,
      branch: stepData.selectedBranch,
      private: stepData.selectedRepository.private,
    },

    // AI Analysis Results
    analysis: {
      analysisId: stepData.analysisId,
      analysisDate: new Date(),
      confidence: stepData.analysisResults.confidence_score,
      approach: "ai-enhanced",

      technologyStack: mapTechnologyStack(
        stepData.analysisResults.technology_stack
      ),
      detectedConfig: mapDetectedConfig(stepData.analysisResults),
      insights: stepData.analysisResults.insights,
      rawAnalysis: stepData.analysisResults,
    },

    // Deployment Configuration
    deployment: {
      buildConfig: mapBuildConfig(stepData.projectConfig),
      runtime: mapRuntimeConfig(stepData.projectConfig),
      infrastructure: mapInfrastructureConfig(stepData.projectConfig),
    },

    status: "configured",
  };
}
```

This backend specification provides the foundation for supporting the intelligent project creation flow with proper data persistence, API endpoints, and integration with existing systems.
