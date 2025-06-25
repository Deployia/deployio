# DeployIO Intelligent Project Creation Flow - Technical Specification

## Overview

This document outlines the technical specification for DeployIO's new intelligent project creation flow, featuring AI-powered auto-fill capabilities, comprehensive Git provider integration, and a seamless 6-step wizard interface.

## Architecture Goals

- **AI-First Approach**: Leverage ai-service for intelligent field detection and auto-population
- **Stateless Backend**: Pure JWT authentication with no session state
- **Provider Agnostic**: Support for GitHub, GitLab, Azure DevOps with unified interface
- **Progressive Enhancement**: Manual form option with AI enhancement overlay
- **Production Ready**: Full error handling, validation, and user feedback

## 6-Step Project Creation Flow

### Step 1: Provider Selection

**Purpose**: Choose Git provider for repository access
**UI Component**: `ProviderSelection.jsx`
**State**: `providerSelectionSlice.js`

```javascript
// Provider Selection State
{
  availableProviders: ['github', 'gitlab', 'azure-devops'],
  connectedProviders: {
    github: { connected: true, hasRepoAccess: true },
    gitlab: { connected: false, hasRepoAccess: false },
    'azure-devops': { connected: false, hasRepoAccess: false }
  },
  selectedProvider: null,
  connectionInProgress: false
}
```

**Features**:

- Display connection status for each provider
- Initiate OAuth flow for unconnected providers
- Show repository access permissions
- Connection testing and validation

### Step 2: Repository Browser

**Purpose**: Browse and select repository from connected provider
**UI Component**: `RepositoryBrowser.jsx`
**State**: `repositoryBrowserSlice.js`

```javascript
// Repository Browser State
{
  repositories: [],
  loading: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasNext: false
  },
  filters: {
    search: '',
    sort: 'updated', // updated, created, name, stars
    type: 'all' // all, public, private
  },
  selectedRepository: null
}
```

**Features**:

- Paginated repository listing with search and filters
- Repository metadata display (stars, language, last updated)
- Repository selection with validation
- Support for private repositories

### Step 3: Branch & Settings

**Purpose**: Select branch and configure analysis parameters
**UI Component**: `BranchSelection.jsx`
**State**: Extend `repositoryBrowserSlice.js`

```javascript
// Branch Selection State Extension
{
  // ...existing state
  branches: [],
  selectedBranch: 'main',
  branchesLoading: false,
  analysisSettings: {
    analysisTypes: ['stack', 'dependencies', 'quality'],
    forceLlm: true,
    includeRecommendations: true,
    trackProgress: true
  }
}
```

**Features**:

- Fetch and display available branches
- Default branch detection (main/master)
- Analysis configuration options
- Preview repository structure

### Step 4: AI Analysis & Progress

**Purpose**: Execute AI analysis with real-time progress tracking
**UI Component**: `AnalysisProgress.jsx`
**State**: `analysisSlice.js`

```javascript
// Analysis State
{
  isAnalyzing: false,
  progress: {
    operationId: null,
    currentStep: 0,
    stepName: '',
    percentage: 0,
    status: 'idle', // idle, running, completed, failed
    message: ''
  },
  analysisResults: null,
  error: null
}
```

**Features**:

- Real-time progress tracking via polling
- Visual progress steps with descriptions
- Error handling and recovery options
- Analysis result caching

### Step 5: Smart Project Form

**Purpose**: AI-powered form with intelligent field population
**UI Component**: `SmartProjectForm.jsx`
**State**: `projectFormSlice.js`

```javascript
// Project Form State
{
  projectDetails: {
    // Basic Info (AI Auto-filled)
    name: '',
    description: '',

    // Technical Stack (AI Detected)
    language: '',
    framework: '',
    buildTool: '',
    packageManager: '',
    runtime: '',

    // Build Configuration (AI Suggested)
    buildCommand: '',
    startCommand: '',
    installCommand: '',
    testCommand: '',

    // Environment (AI Detected)
    environmentVariables: [],
    secrets: [],

    // Deployment (Advanced - User Input)
    dockerfile: '', // AI placeholder provided
    healthCheckPath: '/health',
    port: 3000,

    // Infrastructure (User Selection)
    deploymentStrategy: 'standard', // standard, blue-green, canary
    scalingPolicy: 'auto',
    instanceType: 'small'
  },
  aiSuggestions: {
    confidence: 0.85,
    reasoning: '',
    alternativeOptions: {},
    nullFieldExplanations: {}
  },
  validation: {
    isValid: false,
    errors: {},
    warnings: {}
  },
  isSubmitting: false
}
```

**Features**:

- AI-powered field auto-population
- Confidence indicators for AI suggestions
- Manual override capabilities
- Real-time validation
- Smart defaults based on detected stack

### Step 6: Review & Deploy

**Purpose**: Final review and project creation
**UI Component**: `ProjectReview.jsx`
**State**: `deploymentSlice.js`

```javascript
// Deployment State
{
  reviewMode: true,
  deploymentConfig: {
    // Computed deployment configuration
    finalConfiguration: {},
    estimatedResources: {},
    deploymentPlan: []
  },
  deployment: {
    isDeploying: false,
    progress: 0,
    status: 'ready', // ready, deploying, success, failed
    deploymentId: null,
    logs: []
  }
}
```

**Features**:

- Comprehensive configuration review
- Resource estimation and cost preview
- Deployment progress tracking
- Success confirmation with project links

## AI Service Integration

### Analysis Request Structure

```javascript
const analysisRequest = {
  repositoryUrl: "https://github.com/user/repo",
  branch: "main",
  analysisTypes: ["stack", "dependencies", "quality"],
  forceLlm: true,
  includeReasoning: true,
  includeRecommendations: true,
  includeInsights: true,
  explainNullFields: true,
  trackProgress: true,
};
```

### Expected AI Response Mapping

```javascript
// Map AI Analysis to Project Form Fields
const mapAnalysisToProjectForm = (analysisResults) => {
  const { technology_stack, insights, recommendations } = analysisResults;

  return {
    // Basic detection
    language: technology_stack.primary_language,
    framework: technology_stack.framework,
    buildTool: technology_stack.build_tool,
    packageManager: technology_stack.package_manager,
    runtime: technology_stack.runtime,

    // Commands from package.json or detected patterns
    buildCommand: technology_stack.commands?.build || "",
    startCommand: technology_stack.commands?.start || "",
    installCommand: technology_stack.commands?.install || "",
    testCommand: technology_stack.commands?.test || "",

    // Environment variables from .env files or common patterns
    environmentVariables: extractEnvVars(technology_stack.environment),

    // Port detection from common patterns
    port: detectPort(technology_stack.configuration),

    // AI-generated suggestions
    aiSuggestions: {
      confidence: analysisResults.confidence_score,
      reasoning: analysisResults.reasoning,
      alternativeOptions: generateAlternatives(technology_stack),
      nullFieldExplanations: analysisResults.null_field_explanations,
    },
  };
};
```

## State Management Architecture

### Redux Store Structure

```javascript
// store/index.js
const store = configureStore({
  reducer: {
    // Existing slices
    auth: authSlice,
    gitProvider: gitProviderSlice,

    // New project creation slices
    providerSelection: providerSelectionSlice,
    repositoryBrowser: repositoryBrowserSlice,
    analysis: analysisSlice,
    projectForm: projectFormSlice,
    deployment: deploymentSlice,

    // Shared UI state
    wizard: wizardSlice, // Current step, navigation, validation
  },
});
```

### Wizard Navigation State

```javascript
// wizardSlice.js
const wizardSlice = createSlice({
  name: "wizard",
  initialState: {
    currentStep: 0,
    completedSteps: [],
    canNavigateForward: false,
    canNavigateBackward: true,
    stepValidation: {
      0: false, // Provider selection
      1: false, // Repository selection
      2: false, // Branch selection
      3: false, // Analysis completion
      4: false, // Form validation
      5: false, // Final review
    },
  },
});
```

## API Integration Points

### Git Provider Integration

- **Provider Selection**: `/api/v1/git/connect/providers`
- **Connection Status**: `/api/v1/git/connect/connected`
- **Repository Listing**: `/api/v1/users/git-providers/{provider}/repositories`
- **Branch Listing**: `/api/v1/users/git-providers/{provider}/repositories/{owner}/{repo}/branches`

### AI Service Integration

- **Analysis Request**: `/ai/analysis/demo` (POST)
- **Progress Tracking**: `/ai/analysis/demo/progress/{operationId}` (GET)
- **Technology Detection**: `/ai/analysis/technologies` (GET)

### Project Management

- **Project Creation**: `/api/v1/projects` (POST)
- **Deployment Initiation**: `/api/v1/projects/{id}/deploy` (POST)
- **Deployment Status**: `/api/v1/projects/{id}/deployments/{deploymentId}` (GET)

## Error Handling Strategy

### Repository Access Errors

```javascript
const handleRepositoryError = (error) => {
  switch (error.response?.status) {
    case 404:
      return "Repository not found or not accessible";
    case 403:
      return "Insufficient permissions to access repository";
    case 401:
      return "Authentication required. Please reconnect your provider";
    default:
      return "Failed to access repository. Please try again";
  }
};
```

### AI Analysis Errors

```javascript
const handleAnalysisError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message; // AI service provides detailed errors
  }

  switch (error.response?.status) {
    case 429:
      return "Analysis limit reached. Please try again later";
    case 500:
      return "Analysis service temporarily unavailable";
    default:
      return "Analysis failed. You can continue with manual configuration";
  }
};
```

## Progressive Enhancement Strategy

1. **Base Experience**: Manual form with standard project creation
2. **Enhanced Experience**: AI analysis with auto-fill suggestions
3. **Advanced Experience**: Real-time validation and smart recommendations
4. **Expert Experience**: Custom templates and deployment strategies

## Security Considerations

- **Token Management**: Secure JWT token handling with refresh logic
- **Provider Permissions**: Minimal required scopes for repository access
- **Data Privacy**: Analysis results cached temporarily, user data encrypted
- **Rate Limiting**: Respect provider and AI service rate limits

## Performance Optimizations

- **Lazy Loading**: Load components and data as needed
- **Caching**: Cache repository lists and analysis results
- **Debouncing**: Search and filter operations
- **Progress Tracking**: Efficient polling with exponential backoff

## Next Steps

1. Implement base wizard navigation framework
2. Create provider selection and repository browser components
3. Integrate AI analysis with progress tracking
4. Build smart project form with AI auto-fill
5. Add deployment review and execution
6. Comprehensive testing and error handling

This specification serves as the blueprint for implementing the intelligent project creation flow in DeployIO.
