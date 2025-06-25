# DeployIO Project Creation - Quick Start Implementation Guide

## Immediate Next Steps (Week 1)

This guide provides the exact steps to begin implementing the intelligent project creation flow, starting with the foundation phase.

## Step 1: Database Schema Implementation

### 1.1 Enhanced Project Model

Create the enhanced project model with AI analysis support:

```bash
# Create the enhanced Project model
touch server/models/Project.js
```

**File: `server/models/Project.js`**

```javascript
const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    // Basic Information
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
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
    },

    // AI Analysis Results
    analysis: {
      analysisId: { type: String },
      confidence: { type: Number, min: 0, max: 1 },
      approach: { type: String, enum: ["ai-enhanced", "basic", "manual"] },
      technologyStack: {
        primaryLanguage: String,
        framework: String,
        buildTool: String,
        packageManager: String,
        runtime: String,
      },
      detectedConfig: {
        buildCommand: String,
        startCommand: String,
        installCommand: String,
        port: Number,
        environmentVariables: [
          {
            key: String,
            value: String,
            isSecret: { type: Boolean, default: false },
          },
        ],
      },
      rawAnalysis: mongoose.Schema.Types.Mixed,
    },

    // Deployment Configuration
    deployment: {
      buildConfig: {
        buildCommand: String,
        startCommand: String,
        installCommand: String,
      },
      runtime: {
        port: { type: Number, default: 3000 },
        environmentVariables: [
          {
            key: { type: String, required: true },
            value: String,
            isSecret: { type: Boolean, default: false },
          },
        ],
      },
    },

    status: {
      type: String,
      enum: [
        "draft",
        "analyzing",
        "configured",
        "deploying",
        "deployed",
        "failed",
      ],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ProjectSchema.index({ owner: 1, status: 1 });
ProjectSchema.index({
  "repository.provider": 1,
  "repository.owner": 1,
  "repository.name": 1,
});

module.exports = mongoose.model("Project", ProjectSchema);
```

### 1.2 Project Creation Session Model

Create the session tracking model:

```bash
touch server/models/ProjectCreationSession.js
```

**File: `server/models/ProjectCreationSession.js`**

```javascript
const mongoose = require("mongoose");

const ProjectCreationSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    currentStep: { type: Number, default: 0 },
    completedSteps: [{ type: Number }],

    stepData: {
      selectedProvider: String,
      selectedRepository: {
        provider: String,
        owner: String,
        name: String,
        url: String,
        private: Boolean,
      },
      selectedBranch: String,
      analysisResults: mongoose.Schema.Types.Mixed,
      projectConfig: mongoose.Schema.Types.Mixed,
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for automatic cleanup
ProjectCreationSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model(
  "ProjectCreationSession",
  ProjectCreationSessionSchema
);
```

## Step 2: Backend API Foundation

### 2.1 Session Management APIs

Create the session management routes:

```bash
mkdir -p server/routes/api/v1/projects
touch server/routes/api/v1/projects/creation.js
```

**File: `server/routes/api/v1/projects/creation.js`**

```javascript
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const authMiddleware = require("../../../middleware/authMiddleware");
const ProjectCreationSession = require("../../../models/ProjectCreationSession");

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

    const updateData = {
      currentStep,
      updatedAt: new Date(),
    };

    // Update specific step data
    if (stepData) {
      Object.keys(stepData).forEach((key) => {
        updateData[`stepData.${key}`] = stepData[key];
      });
    }

    // Add to completed steps if specified
    const additionalUpdate = markCompleted
      ? {
          $addToSet: { completedSteps: currentStep },
        }
      : {};

    const session = await ProjectCreationSession.findOneAndUpdate(
      {
        sessionId: req.params.sessionId,
        userId: req.user.id,
      },
      {
        $set: updateData,
        ...additionalUpdate,
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

module.exports = router;
```

### 2.2 Enhanced AI Service Client

Create enhanced AI service integration:

```bash
mkdir -p server/services
touch server/services/aiService.js
```

**File: `server/services/aiService.js`**

```javascript
const axios = require("axios");

class AIService {
  constructor() {
    this.baseURL = process.env.AI_SERVICE_URL || "http://localhost:8000";
    this.timeout = 60000; // 60 seconds
    this.token = process.env.AI_SERVICE_TOKEN;
  }

  async analyzeRepository(options) {
    try {
      const response = await axios.post(
        `${this.baseURL}/ai/analysis/demo`,
        options,
        {
          timeout: this.timeout,
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "AI analysis failed:",
        error.response?.data || error.message
      );
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
            Authorization: `Bearer ${this.token}`,
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
}

module.exports = new AIService();
```

## Step 3: Frontend Architecture Setup

### 3.1 Redux Store Structure

Create the Redux slices for project creation:

```bash
mkdir -p client/src/redux/slices
touch client/src/redux/slices/projectCreationSlice.js
```

**File: `client/src/redux/slices/projectCreationSlice.js`**

```javascript
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";

// Async thunks
export const createSession = createAsyncThunk(
  "projectCreation/createSession",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post("/projects/creation/session");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create session"
      );
    }
  }
);

export const updateSession = createAsyncThunk(
  "projectCreation/updateSession",
  async (
    { sessionId, currentStep, stepData, markCompleted },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(
        `/projects/creation/session/${sessionId}/step`,
        {
          currentStep,
          stepData,
          markCompleted,
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update session"
      );
    }
  }
);

const projectCreationSlice = createSlice({
  name: "projectCreation",
  initialState: {
    // Session state
    sessionId: null,
    currentStep: 0,
    completedSteps: [],
    expiresAt: null,

    // Wizard state
    isLoading: false,
    error: null,

    // Step data
    selectedProvider: null,
    selectedRepository: null,
    selectedBranch: "main",
    analysisResults: null,
    projectConfig: {},

    // Analysis state
    isAnalyzing: false,
    analysisProgress: {
      operationId: null,
      currentStep: 0,
      percentage: 0,
      stepName: "",
      status: "idle",
    },
  },
  reducers: {
    // Step navigation
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },

    // Provider selection
    setSelectedProvider: (state, action) => {
      state.selectedProvider = action.payload;
    },

    // Repository selection
    setSelectedRepository: (state, action) => {
      state.selectedRepository = action.payload;
    },

    // Branch selection
    setSelectedBranch: (state, action) => {
      state.selectedBranch = action.payload;
    },

    // Analysis progress
    updateAnalysisProgress: (state, action) => {
      state.analysisProgress = { ...state.analysisProgress, ...action.payload };
    },

    // Project configuration
    updateProjectConfig: (state, action) => {
      state.projectConfig = { ...state.projectConfig, ...action.payload };
    },

    // Reset state
    resetWizard: (state) => {
      Object.assign(state, projectCreationSlice.getInitialState());
    },
  },
  extraReducers: (builder) => {
    builder
      // Create session
      .addCase(createSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessionId = action.payload.sessionId;
        state.currentStep = action.payload.currentStep;
        state.expiresAt = action.payload.expiresAt;
      })
      .addCase(createSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update session
      .addCase(updateSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentStep = action.payload.currentStep;
        state.completedSteps = action.payload.completedSteps;
        // Update step data from response
        if (action.payload.stepData) {
          Object.assign(state, action.payload.stepData);
        }
      })
      .addCase(updateSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setCurrentStep,
  setSelectedProvider,
  setSelectedRepository,
  setSelectedBranch,
  updateAnalysisProgress,
  updateProjectConfig,
  resetWizard,
} = projectCreationSlice.actions;

export default projectCreationSlice.reducer;
```

### 3.2 Main Wizard Component

Create the main wizard container:

```bash
mkdir -p client/src/pages/projects
touch client/src/pages/projects/CreateProject.jsx
```

**File: `client/src/pages/projects/CreateProject.jsx`**

```jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  createSession,
  resetWizard,
} from "@/redux/slices/projectCreationSlice";

// Step components (to be created)
const WizardSteps = {
  0: () => <div>Provider Selection (Coming Soon)</div>,
  1: () => <div>Repository Browser (Coming Soon)</div>,
  2: () => <div>Branch Selection (Coming Soon)</div>,
  3: () => <div>AI Analysis (Coming Soon)</div>,
  4: () => <div>Smart Project Form (Coming Soon)</div>,
  5: () => <div>Review & Deploy (Coming Soon)</div>,
};

const CreateProject = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { sessionId, currentStep, completedSteps, isLoading, error } =
    useSelector((state) => state.projectCreation);

  // Initialize session on mount
  useEffect(() => {
    if (!sessionId) {
      dispatch(createSession());
    }

    // Cleanup on unmount
    return () => {
      dispatch(resetWizard());
    };
  }, [dispatch, sessionId]);

  // Step configuration
  const steps = [
    { title: "Provider", subtitle: "Select Git Provider" },
    { title: "Repository", subtitle: "Choose Repository" },
    { title: "Branch", subtitle: "Select Branch" },
    { title: "Analysis", subtitle: "AI Analysis" },
    { title: "Configure", subtitle: "Project Settings" },
    { title: "Deploy", subtitle: "Review & Launch" },
  ];

  const StepComponent = WizardSteps[currentStep];

  if (isLoading && !sessionId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing project creation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => dispatch(createSession())}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Project
          </h1>
          <p className="text-gray-600">
            AI-powered project creation with intelligent configuration
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${
                  index < currentStep
                    ? "bg-green-500 text-white"
                    : index === currentStep
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }
              `}
              >
                {index + 1}
              </div>
              <div className="ml-2 text-sm">
                <div
                  className={`font-medium ${
                    index <= currentStep ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-gray-400 text-xs">{step.subtitle}</div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-4 ${
                    index < currentStep ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {StepComponent && <StepComponent />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => navigate("/projects")}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>

          <div className="space-x-3">
            <button
              disabled={currentStep === 0}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={currentStep === steps.length - 1}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
```

### 3.3 Update Redux Store

Add the new slice to your store:

**File: `client/src/redux/store.js`**

```javascript
import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import gitProviderSlice from "./slices/gitProviderSlice";
import projectCreationSlice from "./slices/projectCreationSlice"; // Add this

export const store = configureStore({
  reducer: {
    auth: authSlice,
    gitProvider: gitProviderSlice,
    projectCreation: projectCreationSlice, // Add this
  },
});
```

## Step 4: Route Integration

Add the new route to your routing configuration:

**File: `client/src/App.jsx`** (or wherever routes are defined)

```jsx
// Add to your existing routes
import CreateProject from "@/pages/projects/CreateProject";

// In your Routes component:
<Route path="/projects/create" element={<CreateProject />} />;
```

## Step 5: Backend Route Integration

Add the new routes to your main API routes:

**File: `server/routes/api/v1/index.js`**

```javascript
// Add to existing routes
const projectCreationRoutes = require("./projects/creation");

// Register routes
router.use("/projects/creation", projectCreationRoutes);
```

## Testing the Foundation

1. **Start the development servers**:

```bash
# Backend
cd server && npm run dev

# Frontend
cd client && npm run dev
```

2. **Test the basic flow**:

- Navigate to `/projects/create`
- Verify session creation works
- Check Redux DevTools for state updates
- Confirm step navigation framework

3. **Verify API endpoints**:

```bash
# Test session creation
curl -X POST http://localhost:5000/api/v1/projects/creation/session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test session retrieval
curl -X GET http://localhost:5000/api/v1/projects/creation/session/SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Next Steps

With this foundation in place, you can now proceed to implement individual step components:

1. **Provider Selection Component** - Connect to existing git provider integration
2. **Repository Browser** - Use existing repository browsing APIs
3. **AI Analysis Integration** - Connect to the ai-service for analysis
4. **Smart Project Form** - Build AI-enhanced form fields
5. **Review & Deploy** - Final configuration review and project creation

The foundation provides the structure, state management, and API integration needed for the complete wizard implementation.

**Foundation is ready - time to build the intelligent project creation experience!** 🚀
