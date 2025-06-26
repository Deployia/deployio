import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks for API calls
export const createSession = createAsyncThunk(
  'projectCreation/createSession',
  async (sessionData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/v1/projects/creation/session', sessionData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create session');
    }
  }
);

export const updateStepData = createAsyncThunk(
  'projectCreation/updateStepData',
  async ({ sessionId, step, data }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/api/v1/projects/creation/session/${sessionId}/step/${step}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update step data');
    }
  }
);

export const analyzeRepository = createAsyncThunk(
  'projectCreation/analyzeRepository',
  async ({ sessionId, repositoryData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/v1/projects/creation/session/${sessionId}/analyze`, repositoryData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to analyze repository');
    }
  }
);

export const createProjectFromSession = createAsyncThunk(
  'projectCreation/createProject',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/v1/projects/creation/session/${sessionId}/create`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create project');
    }
  }
);

export const fetchGitProviders = createAsyncThunk(
  'projectCreation/fetchGitProviders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/user/git-providers');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch git providers');
    }
  }
);

export const fetchRepositories = createAsyncThunk(
  'projectCreation/fetchRepositories',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/user/repositories', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch repositories');
    }
  }
);

export const fetchBranches = createAsyncThunk(
  'projectCreation/fetchBranches',
  async ({ provider, owner, repo }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/v1/user/repositories/${provider}/${owner}/${repo}/branches`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch branches');
    }
  }
);

const initialState = {
  // Session state
  sessionId: null,
  currentStep: 1,
  completedSteps: [],
  isCompleted: false,

  // Step data
  stepData: {
    // Step 1: Provider Selection
    selectedProvider: null,
    connectedProviders: {},

    // Step 2: Repository Selection
    repositories: [],
    selectedRepository: null,
    repositoryFilters: {
      search: '',
      sort: 'updated',
      type: 'all',
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
      analysisTypes: ['stack', 'dependencies', 'quality'],
      forceLlm: true,
      includeRecommendations: true,
      trackProgress: true,
    },

    // Step 4: AI Analysis
    analysisId: null,
    analysisStatus: 'pending', // pending, running, completed, failed
    analysisProgress: 0,
    analysisResults: null,
    aiConfidence: null,

    // Step 5: Project Configuration
    projectName: '',
    projectDescription: '',
    deploymentSettings: {},
    environmentVariables: [],
    buildCommands: [],
    startCommand: '',

    // Step 6: Review
    finalConfiguration: null,
  },

  // UI state
  loading: false,
  error: null,
  success: null,

  // Provider data
  availableProviders: ['github', 'gitlab', 'azure-devops'],
  connectedProviders: {},

  // Analysis polling
  analysisPolling: false,
};

const projectCreationSlice = createSlice({
  name: 'projectCreation',
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
    },

    // Repository selection
    setSelectedRepository: (state, action) => {
      state.stepData.selectedRepository = action.payload;
    },

    setRepositoryFilters: (state, action) => {
      state.stepData.repositoryFilters = { ...state.stepData.repositoryFilters, ...action.payload };
    },

    // Branch selection
    setSelectedBranch: (state, action) => {
      state.stepData.selectedBranch = action.payload;
    },

    setAnalysisSettings: (state, action) => {
      state.stepData.analysisSettings = { ...state.stepData.analysisSettings, ...action.payload };
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
      // Create session
      .addCase(createSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.loading = false;
        state.sessionId = action.payload.sessionId;
        state.currentStep = action.payload.currentStep || 1;
        state.completedSteps = action.payload.completedSteps || [];
        
        // Restore step data if session exists
        if (action.payload.stepData) {
          state.stepData = { ...state.stepData, ...action.payload.stepData };
        }
      })
      .addCase(createSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update step data
      .addCase(updateStepData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStepData.fulfilled, (state, action) => {
        state.loading = false;
        state.stepData = { ...state.stepData, ...action.payload.stepData };
        
        // Update completed steps
        if (action.payload.completedSteps) {
          state.completedSteps = action.payload.completedSteps;
        }
      })
      .addCase(updateStepData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Analyze repository
      .addCase(analyzeRepository.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.stepData.analysisStatus = 'running';
        state.stepData.analysisProgress = 0;
      })
      .addCase(analyzeRepository.fulfilled, (state, action) => {
        state.loading = false;
        state.stepData.analysisId = action.payload.analysisId;
        state.stepData.analysisStatus = action.payload.status;
        state.stepData.analysisResults = action.payload.results;
        state.stepData.aiConfidence = action.payload.confidence;
      })
      .addCase(analyzeRepository.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.stepData.analysisStatus = 'failed';
      })

      // Create project
      .addCase(createProjectFromSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProjectFromSession.fulfilled, (state, action) => {
        state.loading = false;
        state.success = 'Project created successfully!';
        state.isCompleted = true;
      })
      .addCase(createProjectFromSession.rejected, (state, action) => {
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
