import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// Async thunks for analytics operations using actual available routes
export const fetchUserAnalytics = createAsyncThunk(
  "analytics/fetchUserAnalytics",
  async (_timeRange = "7d", { rejectWithValue }) => {
    try {
      // Use user dashboard stats endpoint instead
      const response = await api.get("/user/dashboard-stats");
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
  async ({ projectId, _timeRange = "7d" }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/projects/${projectId}/analytics`);
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
  async (
    { projectId, deploymentId, _timeRange = "7d" },
    { rejectWithValue }
  ) => {
    try {
      // Use project deployments endpoint to get deployment info
      const response = await api.get(
        `/projects/${projectId}/deployments/${deploymentId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch deployment analytics"
      );
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  "analytics/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/user/dashboard-stats");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch dashboard stats"
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
  dashboardStats: null,

  // Loading states
  loading: {
    user: false,
    project: false,
    deployment: false,
    dashboard: false,
  },

  // Error states
  error: {
    user: null,
    project: null,
    deployment: null,
    dashboard: null,
  },

  // Success states
  success: {
    user: false,
    project: false,
    deployment: false,
    dashboard: false,
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
    dashboard: {},
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
      }); // Fetch dashboard stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading.dashboard = true;
        state.error.dashboard = null;
        state.success.dashboard = false;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading.dashboard = false;
        state.success.dashboard = true;
        state.dashboardStats = action.payload.stats || action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading.dashboard = false;
        state.error.dashboard = action.payload;
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
