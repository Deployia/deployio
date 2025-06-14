import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// Async thunks for deployment operations
export const fetchDeployments = createAsyncThunk(
  "deployments/fetchDeployments",
  async (_params = {}, { rejectWithValue }) => {
    try {
      // Fetch all deployments across projects - we'll need to aggregate from project deployments
      // Since there's no global deployments endpoint, we'll need to implement this differently
      const response = await api.get("/projects"); // Get all projects first
      let allDeployments = [];

      // For each project, get its deployments
      if (response.data.projects) {
        for (const project of response.data.projects) {
          try {
            const deploymentResponse = await api.get(
              `/projects/${project._id}/deployments`
            );
            if (deploymentResponse.data.deployments) {
              // Add project info to each deployment
              const deploymentsWithProject =
                deploymentResponse.data.deployments.map((deployment) => ({
                  ...deployment,
                  project: project,
                }));
              allDeployments = [...allDeployments, ...deploymentsWithProject];
            }
          } catch (err) {
            // Skip if project deployments can't be fetched
            console.warn(
              `Failed to fetch deployments for project ${project._id}:`,
              err
            );
          }
        }
      }

      return { deployments: allDeployments };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch deployments"
      );
    }
  }
);

export const fetchDeployment = createAsyncThunk(
  "deployments/fetchDeployment",
  async (deploymentId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/projects/deployments/${deploymentId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch deployment"
      );
    }
  }
);

export const fetchProjectDeployments = createAsyncThunk(
  "deployments/fetchProjectDeployments",
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/projects/${projectId}/deployments`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch project deployments"
      );
    }
  }
);

export const createDeployment = createAsyncThunk(
  "deployments/createDeployment",
  async ({ projectId, deploymentData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/projects/${projectId}/deployments`,
        deploymentData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create deployment"
      );
    }
  }
);

export const updateDeploymentStatusAPI = createAsyncThunk(
  "deployments/updateDeploymentStatusAPI",
  async ({ deploymentId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/projects/deployments/${deploymentId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update deployment status"
      );
    }
  }
);

export const cancelDeployment = createAsyncThunk(
  "deployments/cancelDeployment",
  async (deploymentId, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/projects/deployments/${deploymentId}/cancel`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel deployment"
      );
    }
  }
);

// These deployment management functions use status updates since
// there are no direct deployment control endpoints in the backend
export const stopDeployment = createAsyncThunk(
  "deployments/stopDeployment",
  async (deploymentId, { rejectWithValue }) => {
    try {
      // Use cancel deployment endpoint instead of stop
      const response = await api.patch(
        `/projects/deployments/${deploymentId}/cancel`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to stop deployment"
      );
    }
  }
);

export const restartDeployment = createAsyncThunk(
  "deployments/restartDeployment",
  async (deploymentId, { rejectWithValue }) => {
    try {
      // Restart by updating status to 'pending' to trigger redeploy
      const response = await api.patch(
        `/projects/deployments/${deploymentId}/status`,
        {
          status: "pending",
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to restart deployment"
      );
    }
  }
);

export const fetchDeploymentLogs = createAsyncThunk(
  "deployments/fetchDeploymentLogs",
  async ({ deploymentId, params = {} }, { rejectWithValue }) => {
    try {
      const { lines = 100, since } = params;
      const queryParams = new URLSearchParams({
        lines: lines.toString(),
        ...(since && { since }),
      });
      const response = await api.get(
        `/projects/deployments/${deploymentId}/logs?${queryParams}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch deployment logs"
      );
    }
  }
);

// Note: Deployment metrics endpoint doesn't exist in backend yet
// export const fetchDeploymentMetrics = createAsyncThunk(
//   "deployments/fetchDeploymentMetrics",
//   async ({ deploymentId, timeRange = "1h" }, { rejectWithValue }) => {
//     try {
//       const response = await api.get(
//         `/projects/deployments/${deploymentId}/metrics?range=${timeRange}`
//       );
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(
//         error.response?.data?.message || "Failed to fetch deployment metrics"
//       );
//     }
//   }
// );

// Initial state with modular loading/error states
const initialState = {
  // Data
  deployments: [],
  currentDeployment: null,
  projectDeployments: [],
  logs: [],
  metrics: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  },

  // Loading states
  loading: {
    fetch: false,
    fetchOne: false,
    fetchProject: false,
    create: false,
    update: false,
    delete: false,
    deploy: false,
    stop: false,
    restart: false,
    logs: false,
    metrics: false,
  },

  // Error states
  error: {
    fetch: null,
    fetchOne: null,
    fetchProject: null,
    create: null,
    update: null,
    delete: null,
    deploy: null,
    stop: null,
    restart: null,
    logs: null,
    metrics: null,
  },

  // Success states
  success: {
    create: false,
    update: false,
    delete: false,
    deploy: false,
    stop: false,
    restart: false,
  },

  // UI state
  filters: {
    status: "",
    sort: "createdAt",
    order: "desc",
  },
};

const deploymentSlice = createSlice({
  name: "deployments",
  initialState,
  reducers: {
    // Reset states
    resetDeploymentState: (state) => {
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
    },

    // Clear current deployment
    clearCurrentDeployment: (state) => {
      state.currentDeployment = null;
    },

    // Clear logs
    clearLogs: (state) => {
      state.logs = [];
    },

    // Clear metrics
    clearMetrics: (state) => {
      state.metrics = null;
    },

    // Update deployment status (for real-time updates)
    updateDeploymentStatus: (state, action) => {
      const { deploymentId, status, buildLogs } = action.payload;

      // Update in deployments list
      const deploymentIndex = state.deployments.findIndex(
        (d) => d._id === deploymentId
      );
      if (deploymentIndex !== -1) {
        state.deployments[deploymentIndex].status = status;
        if (buildLogs) {
          state.deployments[deploymentIndex].buildLogs = buildLogs;
        }
      }

      // Update in project deployments
      const projectDeploymentIndex = state.projectDeployments.findIndex(
        (d) => d._id === deploymentId
      );
      if (projectDeploymentIndex !== -1) {
        state.projectDeployments[projectDeploymentIndex].status = status;
        if (buildLogs) {
          state.projectDeployments[projectDeploymentIndex].buildLogs =
            buildLogs;
        }
      }

      // Update current deployment
      if (
        state.currentDeployment &&
        state.currentDeployment._id === deploymentId
      ) {
        state.currentDeployment.status = status;
        if (buildLogs) {
          state.currentDeployment.buildLogs = buildLogs;
        }
      }
    },
  },

  extraReducers: (builder) => {
    // Fetch deployments
    builder
      .addCase(fetchDeployments.pending, (state) => {
        state.loading.fetch = true;
        state.error.fetch = null;
      })
      .addCase(fetchDeployments.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.deployments =
          action.payload.deployments || action.payload.data || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchDeployments.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error.fetch = action.payload;
      });

    // Fetch single deployment
    builder
      .addCase(fetchDeployment.pending, (state) => {
        state.loading.fetchOne = true;
        state.error.fetchOne = null;
      })
      .addCase(fetchDeployment.fulfilled, (state, action) => {
        state.loading.fetchOne = false;
        state.currentDeployment = action.payload.deployment || action.payload;
      })
      .addCase(fetchDeployment.rejected, (state, action) => {
        state.loading.fetchOne = false;
        state.error.fetchOne = action.payload;
      });

    // Fetch project deployments
    builder
      .addCase(fetchProjectDeployments.pending, (state) => {
        state.loading.fetchProject = true;
        state.error.fetchProject = null;
      })
      .addCase(fetchProjectDeployments.fulfilled, (state, action) => {
        state.loading.fetchProject = false;
        state.projectDeployments =
          action.payload.deployments || action.payload.data || [];
      })
      .addCase(fetchProjectDeployments.rejected, (state, action) => {
        state.loading.fetchProject = false;
        state.error.fetchProject = action.payload;
      });

    // Create deployment
    builder
      .addCase(createDeployment.pending, (state) => {
        state.loading.create = true;
        state.error.create = null;
        state.success.create = false;
      })
      .addCase(createDeployment.fulfilled, (state, action) => {
        state.loading.create = false;
        state.success.create = true;
        const newDeployment = action.payload.deployment || action.payload;
        state.deployments.unshift(newDeployment);
        state.projectDeployments.unshift(newDeployment);
        state.currentDeployment = newDeployment;
      })
      .addCase(createDeployment.rejected, (state, action) => {
        state.loading.create = false;
        state.error.create = action.payload;
      }); // Update deployment status via API
    builder
      .addCase(updateDeploymentStatusAPI.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
        state.success.update = false;
      })
      .addCase(updateDeploymentStatusAPI.fulfilled, (state, action) => {
        state.loading.update = false;
        state.success.update = true;
        const updatedDeployment = action.payload.deployment || action.payload;

        // Update in deployments list
        const index = state.deployments.findIndex(
          (d) => d._id === updatedDeployment._id
        );
        if (index !== -1) {
          state.deployments[index] = updatedDeployment;
        }

        // Update in project deployments
        const projectIndex = state.projectDeployments.findIndex(
          (d) => d._id === updatedDeployment._id
        );
        if (projectIndex !== -1) {
          state.projectDeployments[projectIndex] = updatedDeployment;
        }

        // Update current deployment if it's the same
        if (
          state.currentDeployment &&
          state.currentDeployment._id === updatedDeployment._id
        ) {
          state.currentDeployment = updatedDeployment;
        }
      })
      .addCase(updateDeploymentStatusAPI.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload;
      });

    // Cancel deployment
    builder
      .addCase(cancelDeployment.pending, (state) => {
        state.loading.delete = true;
        state.error.delete = null;
        state.success.delete = false;
      })
      .addCase(cancelDeployment.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.success.delete = true;
        const deployment = action.payload;

        // Update deployment status in all arrays (cancelled deployment)
        const index = state.deployments.findIndex(
          (d) => d._id === deployment._id
        );
        if (index !== -1) {
          state.deployments[index] = deployment;
        }

        const projectIndex = state.projectDeployments.findIndex(
          (d) => d._id === deployment._id
        );
        if (projectIndex !== -1) {
          state.projectDeployments[projectIndex] = deployment;
        }

        if (
          state.currentDeployment &&
          state.currentDeployment._id === deployment._id
        ) {
          state.currentDeployment = deployment;
        }
      })
      .addCase(cancelDeployment.rejected, (state, action) => {
        state.loading.delete = false;
        state.error.delete = action.payload;
      }); // Stop deployment
    builder
      .addCase(stopDeployment.pending, (state) => {
        state.loading.stop = true;
        state.error.stop = null;
        state.success.stop = false;
      })
      .addCase(stopDeployment.fulfilled, (state, action) => {
        state.loading.stop = false;
        state.success.stop = true;
        const updatedDeployment = action.payload.deployment || action.payload;

        // Update deployment status in all relevant arrays
        [state.deployments, state.projectDeployments].forEach(
          (deploymentArray) => {
            const index = deploymentArray.findIndex(
              (d) => d._id === updatedDeployment._id
            );
            if (index !== -1) {
              deploymentArray[index] = updatedDeployment;
            }
          }
        );

        // Update current deployment
        if (
          state.currentDeployment &&
          state.currentDeployment._id === updatedDeployment._id
        ) {
          state.currentDeployment = updatedDeployment;
        }
      })
      .addCase(stopDeployment.rejected, (state, action) => {
        state.loading.stop = false;
        state.error.stop = action.payload;
      });

    // Restart deployment
    builder
      .addCase(restartDeployment.pending, (state) => {
        state.loading.restart = true;
        state.error.restart = null;
        state.success.restart = false;
      })
      .addCase(restartDeployment.fulfilled, (state, action) => {
        state.loading.restart = false;
        state.success.restart = true;
        const updatedDeployment = action.payload.deployment || action.payload;

        // Update deployment status in all relevant arrays
        [state.deployments, state.projectDeployments].forEach(
          (deploymentArray) => {
            const index = deploymentArray.findIndex(
              (d) => d._id === updatedDeployment._id
            );
            if (index !== -1) {
              deploymentArray[index] = updatedDeployment;
            }
          }
        );

        // Update current deployment
        if (
          state.currentDeployment &&
          state.currentDeployment._id === updatedDeployment._id
        ) {
          state.currentDeployment = updatedDeployment;
        }
      })
      .addCase(restartDeployment.rejected, (state, action) => {
        state.loading.restart = false;
        state.error.restart = action.payload;
      });

    // Fetch deployment logs
    builder
      .addCase(fetchDeploymentLogs.pending, (state) => {
        state.loading.logs = true;
        state.error.logs = null;
      })
      .addCase(fetchDeploymentLogs.fulfilled, (state, action) => {
        state.loading.logs = false;
        state.logs = action.payload.logs || action.payload;
      })
      .addCase(fetchDeploymentLogs.rejected, (state, action) => {
        state.loading.logs = false;
        state.error.logs = action.payload;
      });
  },
});

export const {
  resetDeploymentState,
  clearError,
  clearSuccess,
  updateFilters,
  clearCurrentDeployment,
  clearLogs,
  clearMetrics,
  updateDeploymentStatus,
} = deploymentSlice.actions;

export default deploymentSlice.reducer;
