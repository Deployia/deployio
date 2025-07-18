import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// Async thunks for analytics operations using actual available routes
export const fetchUserAnalytics = createAsyncThunk(
  "analytics/fetchUserAnalytics",
  async (timeRange = "7d", { rejectWithValue }) => {
    try {
      // Use our analytics overview endpoint
      const response = await api.get(
        `/analytics/overview?timeRange=${timeRange}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user analytics"
      );
    }
  }
);

export const fetchProjectAnalytics = createAsyncThunk(
  "analytics/fetchProjectAnalytics",
  async ({ projectId, timeRange = "30d" }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/analytics/projects/${projectId}?timeRange=${timeRange}`
      );
      // Extract analytics data from the nested response structure
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch project analytics"
      );
    }
  }
);

export const fetchDeploymentAnalytics = createAsyncThunk(
  "analytics/fetchDeploymentAnalytics",
  async ({ projectId, timeRange = "30d" }, { rejectWithValue }) => {
    try {
      // Use our new deployment analytics endpoint
      const response = await api.get(
        `/analytics/deployments?projectId=${projectId}&timeRange=${timeRange}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch deployment analytics"
      );
    }
  }
);

export const fetchResourceAnalytics = createAsyncThunk(
  "analytics/fetchResourceAnalytics",
  async ({ projectId, timeRange = "7d" }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/analytics/resources?${
          projectId ? `projectId=${projectId}&` : ""
        }timeRange=${timeRange}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch resource analytics"
      );
    }
  }
);

export const fetchPerformanceMetrics = createAsyncThunk(
  "analytics/fetchPerformanceMetrics",
  async ({ projectId, timeRange = "30d" }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/analytics/performance?${
          projectId ? `projectId=${projectId}&` : ""
        }timeRange=${timeRange}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch performance metrics"
      );
    }
  }
);

export const fetchAllProjectsAnalytics = createAsyncThunk(
  "analytics/fetchAllProjectsAnalytics",
  async (timeRange = "30d", { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/analytics/projects?timeRange=${timeRange}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch projects analytics"
      );
    }
  }
);

// Initial state with modular loading/error states
const initialState = {
  // Data
  userAnalytics: null,
  projectAnalytics: null,
  deploymentAnalytics: null,
  resourceAnalytics: null,
  performanceMetrics: null,
  allProjectsAnalytics: null,

  // Loading states
  loading: {
    user: false,
    project: false,
    deployment: false,
    resource: false,
    performance: false,
    allProjects: false,
  },

  // Error states
  error: {
    user: null,
    project: null,
    deployment: null,
    resource: null,
    performance: null,
    allProjects: null,
  },

  // Success states
  success: {
    user: false,
    project: false,
    deployment: false,
  },

  // UI state
  filters: {
    timeRange: "7d",
    metric: "all",
  },

  // Cache for different time ranges
  cache: {
    user: {},
    project: {},
    deployment: {},
  },
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    // Reset states
    resetAnalyticsState: (state) => {
      return { ...initialState, filters: state.filters };
    },

    // Clear errors
    clearError: (state, action) => {
      const { field } = action.payload || {};
      if (field) {
        state.error[field] = null;
      } else {
        Object.keys(state.error).forEach((key) => {
          state.error[key] = null;
        });
      }
    },

    // Clear success states
    clearSuccess: (state, action) => {
      const { field } = action.payload || {};
      if (field) {
        state.success[field] = false;
      } else {
        Object.keys(state.success).forEach((key) => {
          state.success[key] = false;
        });
      }
    },

    // Update filters
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    }, // Clear specific analytics data
    clearAnalyticsData: (state, action) => {
      const { field } = action.payload || {};
      if (field) {
        state[field] = null;
        if (state.cache[field]) {
          state.cache[field] = {};
        }
      } else {
        // Clear all analytics data
        state.userAnalytics = null;
        state.projectAnalytics = null;
        state.deploymentAnalytics = null;
        state.dashboardStats = null;
        state.cache = {
          user: {},
          project: {},
          deployment: {},
          dashboard: {},
        };
      }
    },

    // Clear cache for specific type
    clearCache: (state, action) => {
      const { type } = action.payload || {};
      if (type) {
        state.cache[type] = {};
      } else {
        Object.keys(state.cache).forEach((key) => {
          state.cache[key] = {};
        });
      }
    },
  },

  extraReducers: (builder) => {
    // Fetch user analytics
    builder
      .addCase(fetchUserAnalytics.pending, (state) => {
        state.loading.user = true;
        state.error.user = null;
        state.success.user = false;
      })
      .addCase(fetchUserAnalytics.fulfilled, (state, action) => {
        state.loading.user = false;
        state.success.user = true;
        state.userAnalytics = action.payload.analytics || action.payload;
      })
      .addCase(fetchUserAnalytics.rejected, (state, action) => {
        state.loading.user = false;
        state.error.user = action.payload;
      });

    // Fetch project analytics
    builder
      .addCase(fetchProjectAnalytics.pending, (state) => {
        state.loading.project = true;
        state.error.project = null;
        state.success.project = false;
      })
      .addCase(fetchProjectAnalytics.fulfilled, (state, action) => {
        state.loading.project = false;
        state.success.project = true;
        state.projectAnalytics = action.payload;
      })
      .addCase(fetchProjectAnalytics.rejected, (state, action) => {
        state.loading.project = false;
        state.error.project = action.payload;
      });

    // Fetch deployment analytics
    builder
      .addCase(fetchDeploymentAnalytics.pending, (state) => {
        state.loading.deployment = true;
        state.error.deployment = null;
        state.success.deployment = false;
      })
      .addCase(fetchDeploymentAnalytics.fulfilled, (state, action) => {
        state.loading.deployment = false;
        state.success.deployment = true;
        state.deploymentAnalytics = action.payload.analytics || action.payload;
      })
      .addCase(fetchDeploymentAnalytics.rejected, (state, action) => {
        state.loading.deployment = false;
        state.error.deployment = action.payload;
      });

    // Fetch resource analytics
    builder
      .addCase(fetchResourceAnalytics.pending, (state) => {
        state.loading.resource = true;
        state.error.resource = null;
      })
      .addCase(fetchResourceAnalytics.fulfilled, (state, action) => {
        state.loading.resource = false;
        state.resourceAnalytics = action.payload.data || action.payload;
      })
      .addCase(fetchResourceAnalytics.rejected, (state, action) => {
        state.loading.resource = false;
        state.error.resource = action.payload;
      });

    // Fetch performance metrics
    builder
      .addCase(fetchPerformanceMetrics.pending, (state) => {
        state.loading.performance = true;
        state.error.performance = null;
      })
      .addCase(fetchPerformanceMetrics.fulfilled, (state, action) => {
        state.loading.performance = false;
        state.performanceMetrics = action.payload.data || action.payload;
      })
      .addCase(fetchPerformanceMetrics.rejected, (state, action) => {
        state.loading.performance = false;
        state.error.performance = action.payload;
      });

    // Fetch all projects analytics
    builder
      .addCase(fetchAllProjectsAnalytics.pending, (state) => {
        state.loading.allProjects = true;
        state.error.allProjects = null;
      })
      .addCase(fetchAllProjectsAnalytics.fulfilled, (state, action) => {
        state.loading.allProjects = false;
        state.allProjectsAnalytics = action.payload.data || action.payload;
      })
      .addCase(fetchAllProjectsAnalytics.rejected, (state, action) => {
        state.loading.allProjects = false;
        state.error.allProjects = action.payload;
      });
  },
});

export const {
  resetAnalyticsState,
  clearError,
  clearSuccess,
  updateFilters,
  clearAnalyticsData,
  clearCache,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
