import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@utils/api";
import projectCreationService from "@services/projectCreationService";

export const analyzeRepository = createAsyncThunk(
  "projectCreation/analyzeRepository",
  async (payload, { rejectWithValue }) => {
    try {
      const repositoryData = payload?.repositoryData || payload;
      const response =
        await projectCreationService.analyzeRepository(repositoryData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to analyze repository",
      );
    }
  },
);

export const createProjectFromState = createAsyncThunk(
  "projectCreation/createProject",
  async (_arg, { getState, rejectWithValue }) => {
    try {
      // Build complete payload from current Redux state
      const state = getState().projectCreation;

      // Ensure repository object includes a URL the backend expects
      const rawRepo =
        state.stepData.selectedRepository || state.stepData.repository || null;

      const deriveRepoUrl = (repo) => {
        if (!repo) return null;

        // Prefer explicit canonical fields (handle both snake_case and camelCase)
        const candidates = [
          repo.htmlUrl,
          repo.html_url,
          repo.cloneUrl,
          repo.clone_url,
          repo.clone,
          repo.sshUrl,
          repo.ssh_url,
          repo.web_url,
          repo.url,
        ];

        for (const c of candidates) {
          if (c && typeof c === "string" && !c.includes("[object Object]")) {
            return c;
          }
        }

        // Owner can be an object ({ login }) or a string
        const ownerLogin =
          typeof repo.owner === "string"
            ? repo.owner
            : repo.owner?.login ||
              repo.owner?.name ||
              repo.owner?.loginName ||
              null;

        // Provider-specific fallbacks
        if (
          state.stepData.selectedProvider === "github" &&
          ownerLogin &&
          repo.name
        ) {
          return `https://github.com/${ownerLogin}/${repo.name}`;
        }
        if (
          state.stepData.selectedProvider === "gitlab" &&
          ownerLogin &&
          repo.name
        ) {
          return `https://gitlab.com/${ownerLogin}/${repo.name}`;
        }
        if (
          state.stepData.selectedProvider === "azure-devops" &&
          (repo.owner || repo.organization) &&
          repo.project &&
          repo.name
        ) {
          const org =
            typeof repo.owner === "string"
              ? repo.owner
              : repo.owner?.login || repo.organization;
          return `https://dev.azure.com/${org}/${repo.project}/_git/${repo.name}`;
        }

        return null;
      };

      const repository = rawRepo
        ? { ...rawRepo, url: deriveRepoUrl(rawRepo) }
        : null;

      const payload = {
        provider: state.stepData.selectedProvider || null,
        repository,
        branch: state.stepData.selectedBranch || null,
        analysis: {
          results:
            state.stepData.analysisResults || state.stepData.analysis || null,
          status: state.stepData.analysisStatus || null,
          progress: state.stepData.analysisProgress || 0,
        },
        projectConfig: {
          projectName: state.stepData.projectName,
          projectDescription: state.stepData.projectDescription,
          build: state.stepData.build || {},
          runtime: state.stepData.runtime || {},
          environmentVariables: state.stepData.environmentVariables || {
            staging: [],
            production: [],
          },
        },
        review: state.stepData.finalConfiguration || {},
        dockerfile: state.stepData.dockerfile || null,
        dockerfilePath: state.stepData.dockerfilePath || "Dockerfile",
        dockerfileSource: state.stepData.dockerfileSource || "repository",
      };

      const response =
        await projectCreationService.completeWithPayload(payload);
      const project = response?.project || response?.data?.project;

      return {
        projectId: project?._id || project?.id || response?.projectId,
        project,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create project",
      );
    }
  },
);

export const fetchGitProviders = createAsyncThunk(
  "projectCreation/fetchGitProviders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await projectCreationService.getGitProviders();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch git providers",
      );
    }
  },
);

export const fetchRepositories = createAsyncThunk(
  "projectCreation/fetchRepositories",
  async ({ provider, options = {} }, { rejectWithValue }) => {
    try {
      const response = await projectCreationService.getRepositories(
        provider,
        options,
      );
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch repositories",
      );
    }
  },
);

export const fetchBranches = createAsyncThunk(
  "projectCreation/fetchBranches",
  async ({ provider, owner, repo }, { rejectWithValue }) => {
    try {
      const response = await projectCreationService.getBranches(
        provider,
        owner,
        repo,
      );
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch branches",
      );
    }
  },
);

const initialState = {
  currentStep: 1,
  completedSteps: [],
  isCompleted: false,
  creationResult: null,

  // Step data
  stepData: {
    // Step 1: Provider Selection
    selectedProvider: null,
    connectedProviders: {},

    // Step 2: Repository Selection
    repositories: [],
    selectedRepository: null,
    repositoryFilters: {
      search: "",
      sort: "updated",
      type: "all",
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      hasNext: false,
    },

    // Step 3: Branch Selection & Settings
    branches: [],
    selectedBranch: null,
    analysisSettings: {
      analysisTypes: ["stack", "dependencies", "quality"],
      forceLlm: true,
      includeRecommendations: true,
      trackProgress: true,
    },

    // Step 4: AI Analysis
    analysisId: null,
    analysisStatus: "pending", // pending, running, completed, failed
    analysisProgress: 0,
    analysisResults: null,
    aiConfidence: null,

    // Step 5: Project Configuration
    projectName: "",
    projectDescription: "",
    deploymentSettings: {},
    environmentVariables: {
      staging: [],
      production: [],
    },
    dockerfilePath: "Dockerfile",
    dockerfiles: [],
    dockerfilePreview: "",
    buildCommands: [],
    startCommand: "",

    // Step 6: Review
    finalConfiguration: null,
  },

  // UI state
  loading: false,
  error: null,
  success: null,

  // Provider data
  availableProviders: ["github", "gitlab", "azure-devops"],
  connectedProviders: {},

  // Analysis polling
  analysisPolling: false,
};

const projectCreationSlice = createSlice({
  name: "projectCreation",
  initialState,
  reducers: {
    // Step navigation
    updateStep: (state, action) => {
      const { step } = action.payload;
      if (step >= 1 && step <= 6) {
        state.currentStep = step;
      }
    },

    // Mark step as completed
    completeStep: (state, action) => {
      const step = action.payload;
      if (!state.completedSteps.includes(step)) {
        state.completedSteps.push(step);
      }
    },

    // Update step data locally (for immediate UI updates)
    setStepData: (state, action) => {
      const { step, data } = action.payload;
      state.stepData = { ...state.stepData, ...data };
    },

    // Provider selection
    setSelectedProvider: (state, action) => {
      state.stepData.selectedProvider = action.payload;
      state.stepData.selectedRepository = null;
      state.stepData.repositories = [];
      state.stepData.pagination = initialState.stepData.pagination;
      state.stepData.branches = [];
      state.stepData.selectedBranch = null;
      state.stepData.analysisId = null;
      state.stepData.analysisStatus = "pending";
      state.stepData.analysisProgress = 0;
      state.stepData.analysisResults = null;
      state.stepData.aiConfidence = null;
      state.stepData.dockerfile = null;
    },

    // Repository selection
    setSelectedRepository: (state, action) => {
      state.stepData.selectedRepository = action.payload;
      state.stepData.branches = [];
      state.stepData.selectedBranch = null;
      state.stepData.analysisId = null;
      state.stepData.analysisStatus = "pending";
      state.stepData.analysisProgress = 0;
      state.stepData.analysisResults = null;
      state.stepData.aiConfidence = null;
      state.stepData.dockerfile = null;
    },

    setRepositoryFilters: (state, action) => {
      state.stepData.repositoryFilters = {
        ...state.stepData.repositoryFilters,
        ...action.payload,
      };
    },

    // Branch selection
    setSelectedBranch: (state, action) => {
      state.stepData.selectedBranch = action.payload;
      state.stepData.analysisId = null;
      state.stepData.analysisStatus = "pending";
      state.stepData.analysisProgress = 0;
      state.stepData.analysisResults = null;
      state.stepData.aiConfidence = null;
    },

    setAnalysisSettings: (state, action) => {
      state.stepData.analysisSettings = {
        ...state.stepData.analysisSettings,
        ...action.payload,
      };
    },

    // Analysis progress
    updateAnalysisProgress: (state, action) => {
      const { progress, status } = action.payload;
      state.stepData.analysisProgress = progress;
      if (status) {
        state.stepData.analysisStatus = status;
      }
    },

    // Project configuration
    setProjectConfiguration: (state, action) => {
      const data = action.payload;
      state.stepData = { ...state.stepData, ...data };
    },

    // Reset wizard
    resetWizard: (state) => {
      return { ...initialState };
    },

    // Complete wizard
    completeWizard: (state) => {
      state.isCompleted = true;
    },

    // Clear error/success
    clearError: (state) => {
      state.error = null;
    },

    clearSuccess: (state) => {
      state.success = null;
    },

    // Start analysis polling
    startAnalysisPolling: (state) => {
      state.analysisPolling = true;
    },

    stopAnalysisPolling: (state) => {
      state.analysisPolling = false;
    },
  },

  extraReducers: (builder) => {
    builder
      // Analyze repository
      .addCase(analyzeRepository.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.stepData.analysisStatus = "running";
        state.stepData.analysisProgress = 0;
      })
      .addCase(analyzeRepository.fulfilled, (state, action) => {
        state.loading = false;
        const analysisData =
          action.payload?.analysis ||
          action.payload?.results ||
          action.payload ||
          {};
        state.stepData.analysisId =
          analysisData.analysisId ||
          action.payload?.analysisId ||
          null;
        state.stepData.analysisStatus =
          analysisData.status || action.payload?.status || "completed";
        state.stepData.analysisProgress =
          analysisData.progress ??
          action.payload?.progress ??
          (state.stepData.analysisStatus === "completed"
            ? 100
            : state.stepData.analysisProgress);
        state.stepData.analysisResults =
          analysisData.results ||
          analysisData ||
          null;
        state.stepData.aiConfidence =
          analysisData.confidence ??
          analysisData.results?.confidence ??
          action.payload?.confidence ??
          null;

        if (action.payload?.dockerfile?.content) {
          state.stepData.dockerfile = action.payload.dockerfile.content;
        }
        state.stepData.dockerfilePath =
          action.payload?.dockerfile?.path ||
          action.payload?.analysis?.results?.dockerfile?.path ||
          "Dockerfile";
        state.stepData.dockerfiles =
          action.payload?.analysis?.results?.dockerfiles ||
          state.stepData.analysisResults?.dockerfiles ||
          [];
        state.stepData.dockerfilePreview =
          action.payload?.dockerfile?.content ||
          state.stepData.analysisResults?.dockerfile?.content ||
          "";
        state.stepData.dockerfileSource =
          action.payload?.dockerfile?.source ||
          state.stepData.analysisResults?.dockerfile?.source ||
          "repository";
        if (action.payload?.analysis?.results?.envTemplate) {
          const template = action.payload.analysis.results.envTemplate;
          state.stepData.environmentVariables = {
            staging: template.staging || [],
            production: template.production || [],
          };
        }
      })
      .addCase(analyzeRepository.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.stepData.analysisStatus = "failed";
      })

      // Create project
      .addCase(createProjectFromState.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProjectFromState.fulfilled, (state, action) => {
        state.loading = false;
        state.success = "Project created successfully!";
        state.isCompleted = true;
        state.creationResult = action.payload;
      })
      .addCase(createProjectFromState.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch git providers
      .addCase(fetchGitProviders.fulfilled, (state, action) => {
        state.connectedProviders = action.payload;
        state.stepData.connectedProviders = action.payload;
      })

      // Fetch repositories
      .addCase(fetchRepositories.fulfilled, (state, action) => {
        state.stepData.repositories = action.payload.repositories;
        state.stepData.pagination = action.payload.pagination;
      })

      // Fetch branches
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.stepData.branches = action.payload;
      });
  },
});

export const {
  updateStep,
  completeStep,
  setStepData,
  setSelectedProvider,
  setSelectedRepository,
  setRepositoryFilters,
  setSelectedBranch,
  setAnalysisSettings,
  updateAnalysisProgress,
  setProjectConfiguration,
  resetWizard,
  completeWizard,
  clearError,
  clearSuccess,
  startAnalysisPolling,
  stopAnalysisPolling,
} = projectCreationSlice.actions;

export default projectCreationSlice.reducer;
