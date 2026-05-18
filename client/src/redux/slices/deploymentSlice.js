import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { invalidateAllCacheEntriesForUrl } from "../../utils/api";

const invalidateDeploymentCaches = (projectId) => {
  invalidateAllCacheEntriesForUrl("/deployments");
  invalidateAllCacheEntriesForUrl("/projects");
  if (projectId) {
    invalidateAllCacheEntriesForUrl(`/projects/${projectId}`);
    invalidateAllCacheEntriesForUrl(`/projects/${projectId}/deployments`);
  }
};

const normalizeDeploymentId = (value) => {
  if (value == null) return null;
  if (typeof value === "object" && value.$oid) return String(value.$oid);
  return String(value);
};

const getDeploymentIdentity = (deployment) =>
  normalizeDeploymentId(
    deployment?._id ?? deployment?.id ?? deployment?.deploymentId,
  );

/** @returns {{ projectId: string, _noCache: boolean, silent: boolean }} */
export const parseFetchProjectDeploymentsArg = (arg) => {
  if (typeof arg === "object" && arg !== null) {
    return {
      projectId: arg.projectId,
      _noCache: Boolean(arg._noCache),
      silent: Boolean(arg.silent),
    };
  }
  return {
    projectId: arg,
    _noCache: false,
    silent: false,
  };
};

const shouldShowFetchProjectLoading = (state, arg) => {
  const { silent } = parseFetchProjectDeploymentsArg(arg);
  if (silent) return false;
  return !Array.isArray(state.projectDeployments) || state.projectDeployments.length === 0;
};

const mergeDeploymentsByIdentity = (existing, incoming) => {
  const list = Array.isArray(incoming) ? incoming : [];
  if (!list.length) {
    return Array.isArray(existing) ? existing : [];
  }
  if (!Array.isArray(existing) || !existing.length) {
    return list;
  }

  const byId = new Map();
  const upsert = (deployment) => {
    const identity = getDeploymentIdentity(deployment);
    if (identity) {
      byId.set(identity, deployment);
    }
  };

  existing.forEach(upsert);
  list.forEach(upsert);

  return Array.from(byId.values()).sort((a, b) => {
    const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return bTime - aTime;
  });
};

const extractDeployment = (payload) =>
  payload?.data?.deployment ||
  payload?.deployment ||
  payload?.data ||
  payload ||
  null;

const extractLogs = (payload) =>
  payload?.data?.logs || payload?.logs || payload?.data || payload || [];

// Async thunks for deployment operations
export const fetchDeployments = createAsyncThunk(
  "deployments/fetchDeployments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { _noCache, ...queryParams } = params;
      const response = await api.get("/deployments", {
        params: queryParams,
        _noCache: Boolean(_noCache),
      });

      // Backend returns { success: true, data: { deployments: [...], pagination: {...} } }
      if (response.data.success && response.data.data) {
        return {
          deployments: response.data.data.deployments || [],
          pagination: response.data.data.pagination || {},
        };
      }
      return { deployments: response.data.deployments || [], pagination: {} };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch deployments",
      );
    }
  },
);

export const fetchDeployment = createAsyncThunk(
  "deployments/fetchDeployment",
  async (deploymentId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/deployments/${deploymentId}`);
      return response.data?.data?.deployment || response.data?.deployment || null;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch deployment",
      );
    }
  },
);

export const fetchProjectDeployments = createAsyncThunk(
  "deployments/fetchProjectDeployments",
  async (arg, { rejectWithValue }) => {
    try {
      const { projectId, _noCache } = parseFetchProjectDeploymentsArg(arg);
      const response = await api.get(`/projects/${projectId}/deployments`, {
        _noCache,
      });
      // Backend returns { success: true, data: { deployments: [...], pagination: {...} } }
      if (response.data.success && response.data.data) {
        return {
          deployments: response.data.data.deployments || [],
          pagination: response.data.data.pagination || {},
        };
      }
      return {
        deployments: response.data.deployments || response.data.data || [],
        pagination: {},
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch project deployments",
      );
    }
  },
);

export const fetchDeploymentSubdomains = createAsyncThunk(
  "deployments/fetchDeploymentSubdomains",
  async ({ projectId, environment = "staging" }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/projects/${projectId}/deployments/subdomains`,
        {
          params: { environment },
        },
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch deployment subdomains",
      );
    }
  },
);

export const checkDeploymentSubdomain = createAsyncThunk(
  "deployments/checkDeploymentSubdomain",
  async (
    {
      projectId,
      subdomain,
      environment = "staging",
      redeployFromDeploymentId,
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get(
        `/projects/${projectId}/deployments/subdomains/check`,
        {
          params: {
            subdomain,
            environment,
            ...(redeployFromDeploymentId
              ? { redeployFromDeploymentId }
              : {}),
          },
        },
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to check subdomain availability",
      );
    }
  },
);

export const fetchDeploymentHistory = createAsyncThunk(
  "deployments/fetchDeploymentHistory",
  async ({ projectId, environment }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/projects/${projectId}/deployments/history`,
        { params: { environment } },
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch deployment history",
      );
    }
  },
);

export const createDeployment = createAsyncThunk(
  "deployments/createDeployment",
  async ({ projectId, deploymentData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/projects/${projectId}/deployments`,
        deploymentData,
      );
      invalidateDeploymentCaches(projectId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create deployment",
      );
    }
  },
);

export const updateDeploymentStatusAPI = createAsyncThunk(
  "deployments/updateDeploymentStatusAPI",
  async ({ deploymentId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/deployments/${deploymentId}/status`, {
        status,
      });
      invalidateAllCacheEntriesForUrl("/deployments");
      invalidateAllCacheEntriesForUrl(`/deployments/${deploymentId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update deployment status",
      );
    }
  },
);

export const cancelDeployment = createAsyncThunk(
  "deployments/cancelDeployment",
  async (deploymentId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/deployments/${deploymentId}/cancel`);
      invalidateAllCacheEntriesForUrl("/deployments");
      invalidateAllCacheEntriesForUrl(`/deployments/${deploymentId}`);
      invalidateAllCacheEntriesForUrl("/projects");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel deployment",
      );
    }
  },
);

// These deployment management functions use status updates since
// there are no direct deployment control endpoints in the backend
export const stopDeployment = createAsyncThunk(
  "deployments/stopDeployment",
  async (deploymentId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/deployments/${deploymentId}/stop`);
      invalidateAllCacheEntriesForUrl("/deployments");
      invalidateAllCacheEntriesForUrl(`/deployments/${deploymentId}`);
      invalidateAllCacheEntriesForUrl("/projects");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to stop deployment",
      );
    }
  },
);

export const restartDeployment = createAsyncThunk(
  "deployments/restartDeployment",
  async (deploymentId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/deployments/${deploymentId}/restart`);
      invalidateAllCacheEntriesForUrl("/deployments");
      invalidateAllCacheEntriesForUrl(`/deployments/${deploymentId}`);
      invalidateAllCacheEntriesForUrl("/projects");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to restart deployment",
      );
    }
  },
);

export const deleteDeployment = createAsyncThunk(
  "deployments/deleteDeployment",
  async (deploymentId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/deployments/${deploymentId}`);
      invalidateAllCacheEntriesForUrl("/deployments");
      invalidateAllCacheEntriesForUrl(`/deployments/${deploymentId}`);
      invalidateAllCacheEntriesForUrl("/projects");
      return { ...response.data, deploymentId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete deployment",
      );
    }
  },
);

export const probeDeployment = createAsyncThunk(
  "deployments/probeDeployment",
  async (deploymentId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/deployments/${deploymentId}/probe`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to probe deployment",
      );
    }
  },
);

export const fetchDeploymentLogs = createAsyncThunk(
  "deployments/fetchDeploymentLogs",
  async ({ deploymentId, params = {} }, { rejectWithValue }) => {
    try {
      const { lines = 100, since } = params;
      const queryParams = new URLSearchParams({
        limit: lines.toString(),
        ...(since && { since }),
      });
      const response = await api.get(
        `/deployments/${deploymentId}/logs?${queryParams}`,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch deployment logs",
      );
    }
  },
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
  probe: null,
  subdomains: {
    environment: "staging",
    suggestions: [],
    capacity: null,
    project: null,
  },
  subdomainCheck: {
    subdomain: "",
    available: null,
    status: null,
    reason: null,
    label: null,
    url: null,
    alternatives: [],
  },
  deploymentHistory: {
    environment: null,
    deployments: [],
  },
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
    cancel: false,
    logs: false,
    metrics: false,
    subdomains: false,
    subdomainCheck: false,
    history: false,
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
    cancel: null,
    logs: null,
    metrics: null,
    subdomains: null,
    subdomainCheck: null,
    history: null,
  },

  // Success states
  success: {
    create: false,
    update: false,
    delete: false,
    deploy: false,
    stop: false,
    restart: false,
    cancel: false,
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

    clearProjectDeployments: (state) => {
      state.projectDeployments = [];
      state.currentDeployment = null;
      state.logs = [];
      state.probe = null;
    },

    // Clear metrics
    clearMetrics: (state) => {
      state.metrics = null;
    },

    // Update deployment status (for real-time updates)
    updateDeploymentStatus: (state, action) => {
      const { deploymentId, status, buildLogs } = action.payload;
      const matchesId = (d) => {
        if (!d || deploymentId == null) return false;
        const key = String(deploymentId);
        return (
          String(d._id) === key ||
          String(d.id) === key ||
          String(d.deploymentId) === key
        );
      };

      // Update in deployments list
      const deploymentIndex = state.deployments.findIndex(matchesId);
      if (deploymentIndex !== -1) {
        state.deployments[deploymentIndex].status = status;
        if (buildLogs) {
          state.deployments[deploymentIndex].buildLogs = buildLogs;
        }
      }

      // Update in project deployments
      const projectDeploymentIndex = state.projectDeployments.findIndex(matchesId);
      if (projectDeploymentIndex !== -1) {
        state.projectDeployments[projectDeploymentIndex].status = status;
        if (buildLogs) {
          state.projectDeployments[projectDeploymentIndex].buildLogs =
            buildLogs;
        }
      }

      // Update current deployment
      if (state.currentDeployment && matchesId(state.currentDeployment)) {
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
        state.deployments = action.payload.deployments || [];
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
        state.currentDeployment = action.payload;
      })
      .addCase(fetchDeployment.rejected, (state, action) => {
        state.loading.fetchOne = false;
        state.error.fetchOne = action.payload;
      });

    // Fetch project deployments
    builder
      .addCase(fetchProjectDeployments.pending, (state, action) => {
        if (shouldShowFetchProjectLoading(state, action.meta.arg)) {
          state.loading.fetchProject = true;
        }
        state.error.fetchProject = null;
      })
      .addCase(fetchProjectDeployments.fulfilled, (state, action) => {
        state.loading.fetchProject = false;
        state.projectDeployments = mergeDeploymentsByIdentity(
          state.projectDeployments,
          action.payload.deployments || [],
        );
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchProjectDeployments.rejected, (state, action) => {
        state.loading.fetchProject = false;
        state.error.fetchProject = action.payload;
      });

    // Fetch deployment subdomain suggestions
    builder
      .addCase(fetchDeploymentSubdomains.pending, (state) => {
        state.loading.subdomains = true;
        state.error.subdomains = null;
      })
      .addCase(fetchDeploymentSubdomains.fulfilled, (state, action) => {
        state.loading.subdomains = false;
        state.subdomains = {
          environment:
            action.payload.environment || state.subdomains.environment,
          suggestions: action.payload.suggestions || [],
          capacity: action.payload.capacity || null,
          project: action.payload.project || null,
        };
      })
      .addCase(fetchDeploymentSubdomains.rejected, (state, action) => {
        state.loading.subdomains = false;
        state.error.subdomains = action.payload;
      });

    builder
      .addCase(checkDeploymentSubdomain.pending, (state) => {
        state.loading.subdomainCheck = true;
        state.error.subdomainCheck = null;
      })
      .addCase(checkDeploymentSubdomain.fulfilled, (state, action) => {
        state.loading.subdomainCheck = false;
        state.subdomainCheck = {
          subdomain: action.payload.subdomain || "",
          available: action.payload.available ?? null,
          status: action.payload.status || null,
          reason: action.payload.reason || null,
          label: action.payload.label || null,
          url: action.payload.url || null,
          alternatives: action.payload.alternatives || [],
        };
      })
      .addCase(checkDeploymentSubdomain.rejected, (state, action) => {
        state.loading.subdomainCheck = false;
        state.error.subdomainCheck = action.payload;
      });

    builder
      .addCase(fetchDeploymentHistory.pending, (state) => {
        state.loading.history = true;
        state.error.history = null;
      })
      .addCase(fetchDeploymentHistory.fulfilled, (state, action) => {
        state.loading.history = false;
        state.deploymentHistory = {
          environment: action.payload.environment || null,
          deployments: action.payload.deployments || [],
        };
      })
      .addCase(fetchDeploymentHistory.rejected, (state, action) => {
        state.loading.history = false;
        state.error.history = action.payload;
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
        const newDeployment = extractDeployment(action.payload);
        if (newDeployment?._id || newDeployment?.id || newDeployment?.deploymentId) {
          state.deployments.unshift(newDeployment);
          state.projectDeployments.unshift(newDeployment);
          state.currentDeployment = newDeployment;
        }
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
        const updatedDeployment = extractDeployment(action.payload);
        const updatedId = getDeploymentIdentity(updatedDeployment);
        if (!updatedId) return;

        const matchesDeployment = (d) =>
          getDeploymentIdentity(d) === updatedId;

        const index = state.deployments.findIndex(matchesDeployment);
        if (index !== -1) {
          state.deployments[index] = updatedDeployment;
        }

        const projectIndex = state.projectDeployments.findIndex(matchesDeployment);
        if (projectIndex !== -1) {
          state.projectDeployments[projectIndex] = updatedDeployment;
        }

        if (
          state.currentDeployment &&
          matchesDeployment(state.currentDeployment)
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
        state.loading.cancel = true;
        state.error.cancel = null;
        state.success.cancel = false;
      })
      .addCase(cancelDeployment.fulfilled, (state, action) => {
        state.loading.cancel = false;
        state.success.cancel = true;
        const deployment = extractDeployment(action.payload);
        if (!deployment) return;
        const matchDeployment = (d) =>
          (deployment._id && String(d._id) === String(deployment._id)) ||
          (deployment.deploymentId &&
            String(d.deploymentId) === String(deployment.deploymentId));

        [state.deployments, state.projectDeployments].forEach((arr) => {
          const idx = arr.findIndex(matchDeployment);
          if (idx !== -1) arr[idx] = deployment;
        });
        if (state.currentDeployment && matchDeployment(state.currentDeployment)) {
          state.currentDeployment = deployment;
        }
      })
      .addCase(cancelDeployment.rejected, (state, action) => {
        state.loading.cancel = false;
        state.error.cancel = action.payload;
        state.success.cancel = false;
      });

    // Stop deployment
    builder
      .addCase(stopDeployment.pending, (state) => {
        state.loading.stop = true;
        state.error.stop = null;
        state.success.stop = false;
      })
      .addCase(stopDeployment.fulfilled, (state, action) => {
        state.loading.stop = false;
        state.success.stop = true;
        const updatedDeployment = extractDeployment(action.payload);
        if (!updatedDeployment) return;
        const matchDeployment = (d) =>
          (updatedDeployment._id && String(d._id) === String(updatedDeployment._id)) ||
          (updatedDeployment.deploymentId &&
            String(d.deploymentId) === String(updatedDeployment.deploymentId));

        [state.deployments, state.projectDeployments].forEach((arr) => {
          const idx = arr.findIndex(matchDeployment);
          if (idx !== -1) arr[idx] = updatedDeployment;
        });
        if (state.currentDeployment && matchDeployment(state.currentDeployment)) {
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
        // HTTP 200 means restart was queued, not that the deployment is healthy again.
        state.success.restart = false;
        const updatedDeployment = extractDeployment(action.payload);
        if (!updatedDeployment) return;
        const matchDeployment = (d) =>
          (updatedDeployment._id && String(d._id) === String(updatedDeployment._id)) ||
          (updatedDeployment.deploymentId &&
            String(d.deploymentId) === String(updatedDeployment.deploymentId));

        [state.deployments, state.projectDeployments].forEach((arr) => {
          const idx = arr.findIndex(matchDeployment);
          if (idx !== -1) arr[idx] = updatedDeployment;
        });
        if (state.currentDeployment && matchDeployment(state.currentDeployment)) {
          state.currentDeployment = updatedDeployment;
        }
      })
      .addCase(restartDeployment.rejected, (state, action) => {
        state.loading.restart = false;
        state.error.restart = action.payload;
      });

    builder
      .addCase(deleteDeployment.pending, (state) => {
        state.loading.delete = true;
        state.error.delete = null;
      })
      .addCase(deleteDeployment.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.success.delete = true;
        const deploymentId = action.payload.deploymentId;
        const matches = (d) =>
          [d._id, d.id, d.deploymentId].map(String).includes(String(deploymentId));
        state.deployments = state.deployments.filter((d) => !matches(d));
        state.projectDeployments = state.projectDeployments.filter((d) => !matches(d));
      })
      .addCase(deleteDeployment.rejected, (state, action) => {
        state.loading.delete = false;
        state.error.delete = action.payload;
      });

    // Fetch deployment logs
    builder
      .addCase(fetchDeploymentLogs.pending, (state) => {
        state.loading.logs = true;
        state.error.logs = null;
      })
      .addCase(fetchDeploymentLogs.fulfilled, (state, action) => {
        state.loading.logs = false;
        state.logs = extractLogs(action.payload);
      })
      .addCase(fetchDeploymentLogs.rejected, (state, action) => {
        state.loading.logs = false;
        state.error.logs = action.payload;
      });

    builder
      .addCase(probeDeployment.pending, (state) => {
        state.loading.metrics = true;
      })
      .addCase(probeDeployment.fulfilled, (state, action) => {
        state.loading.metrics = false;
        state.probe = action.payload;
      })
      .addCase(probeDeployment.rejected, (state, action) => {
        state.loading.metrics = false;
        state.error.metrics = action.payload;
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
  clearProjectDeployments,
  updateDeploymentStatus,
} = deploymentSlice.actions;

export default deploymentSlice.reducer;
