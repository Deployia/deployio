import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// Initial state with modular loading/error pattern
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

// Async thunks for project operations
export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/projects", { params });
      // Backend returns { success: true, data: { projects: [...], pagination: {...} } }
      if (response.data.success && response.data.data) {
        return {
          projects: response.data.data.projects || [],
          pagination: response.data.data.pagination || {},
        };
      }
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
      const response = await api.get(`/projects/${projectId}`);
      // Backend returns { success: true, data: { project: {...}, recentDeployments: [...] } }
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

export const createProject = createAsyncThunk(
  "projects/createProject",
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await api.post("/projects", projectData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create project"
      );
    }
  }
);

export const updateProject = createAsyncThunk(
  "projects/updateProject",
  async ({ projectId, updateData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/projects/${projectId}`, updateData);
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
      await api.delete(`/projects/${projectId}`);
      return projectId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete project"
      );
    }
  }
);

export const toggleArchiveProject = createAsyncThunk(
  "projects/toggleArchiveProject",
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/projects/${projectId}/archive`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to toggle project archive status"
      );
    }
  }
);

export const analyzeRepository = createAsyncThunk(
  "projects/analyzeRepository",
  async ({ projectId }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/projects/${projectId}/analyze`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to analyze repository"
      );
    }
  }
);

export const generateDockerfile = createAsyncThunk(
  "projects/generateDockerfile",
  async (
    { projectId, buildCommand, startCommand, port },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(`/projects/${projectId}/dockerfile`, {
        buildCommand,
        startCommand,
        port,
      });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate Dockerfile"
      );
    }
  }
);

export const fetchProjectDeployments = createAsyncThunk(
  "projects/fetchProjectDeployments",
  async ({ projectId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/projects/${projectId}/deployments`, {
        params,
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
        error.response?.data?.message || "Failed to fetch project deployments"
      );
    }
  }
);

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    // Standard reducers for consistency
    resetProjectState: (state) => {
      Object.assign(state, initialState);
    },
    clearProjectError: (state, action) => {
      const { field } = action.payload || {};
      if (field && state.error[field] !== undefined) {
        state.error[field] = null;
      } else {
        // Clear all errors
        Object.keys(state.error).forEach((key) => {
          state.error[key] = null;
        });
      }
    },
    clearProjectSuccess: (state, action) => {
      const { field } = action.payload || {};
      if (field && state.success[field] !== undefined) {
        state.success[field] = false;
      } else {
        // Clear all success states
        Object.keys(state.success).forEach((key) => {
          state.success[key] = false;
        });
      }
    },
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    builder // Fetch Projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading.projects = true;
        state.error.projects = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading.projects = false;
        state.projects = action.payload.projects || action.payload;

        // Handle pagination if provided
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading.projects = false;
        state.error.projects = action.payload;
        state.projects = [];
      })

      // Fetch Project By ID
      .addCase(fetchProjectById.pending, (state) => {
        state.loading.currentProject = true;
        state.error.currentProject = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading.currentProject = false;
        if (action.payload.project) {
          state.currentProject = {
            ...action.payload.project,
            recentDeployments: action.payload.recentDeployments || [],
          };
        } else {
          state.currentProject = action.payload;
        }
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading.currentProject = false;
        state.error.currentProject = action.payload;
        state.currentProject = null;
      })

      // Create Project
      .addCase(createProject.pending, (state) => {
        state.loading.create = true;
        state.error.create = null;
        state.success.create = false;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading.create = false;
        state.success.create = true;
        state.projects.unshift(action.payload);
        state.currentProject = action.payload;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading.create = false;
        state.error.create = action.payload;
        state.success.create = false;
      })

      // Update Project
      .addCase(updateProject.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
        state.success.update = false;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading.update = false;
        state.success.update = true;

        // Update in projects array
        const index = state.projects.findIndex(
          (p) => p._id === action.payload._id
        );
        if (index !== -1) {
          state.projects[index] = action.payload;
        }

        // Update current project if it's the same
        if (state.currentProject?._id === action.payload._id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload;
        state.success.update = false;
      })

      // Delete Project
      .addCase(deleteProject.pending, (state) => {
        state.loading.delete = true;
        state.error.delete = null;
        state.success.delete = false;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.success.delete = true;

        // Remove from projects array
        state.projects = state.projects.filter((p) => p._id !== action.payload);

        // Clear current project if it was deleted
        if (state.currentProject?._id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading.delete = false;
        state.error.delete = action.payload;
        state.success.delete = false;
      }) // Toggle Archive Project
      .addCase(toggleArchiveProject.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
        state.success.update = false;
      })
      .addCase(toggleArchiveProject.fulfilled, (state, action) => {
        state.loading.update = false;
        state.success.update = true;

        // Update the project with archive status
        const index = state.projects.findIndex(
          (p) => p._id === action.payload._id
        );
        if (index !== -1) {
          state.projects[index] = action.payload;
        }

        if (state.currentProject?._id === action.payload._id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(toggleArchiveProject.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload;
        state.success.update = false;
      })

      // Analyze Repository
      .addCase(analyzeRepository.pending, (state) => {
        state.loading.analyze = true;
        state.error.analyze = null;
        state.success.analyze = false;
      })
      .addCase(analyzeRepository.fulfilled, (state, action) => {
        state.loading.analyze = false;
        state.success.analyze = true;

        // Update the current project with analysis data
        if (action.payload.project) {
          const projectId = action.payload.project._id;

          // Update in projects array
          const index = state.projects.findIndex((p) => p._id === projectId);
          if (index !== -1) {
            state.projects[index] = action.payload.project;
          }

          // Update current project if it's the same
          if (state.currentProject?._id === projectId) {
            state.currentProject = action.payload.project;
          }
        }
      })
      .addCase(analyzeRepository.rejected, (state, action) => {
        state.loading.analyze = false;
        state.error.analyze = action.payload;
        state.success.analyze = false;
      })

      // Generate Dockerfile
      .addCase(generateDockerfile.pending, (state) => {
        state.loading.dockerfile = true;
        state.error.dockerfile = null;
        state.success.dockerfile = false;
      })
      .addCase(generateDockerfile.fulfilled, (state, action) => {
        state.loading.dockerfile = false;
        state.success.dockerfile = true;

        // Update the current project with dockerfile data
        if (action.payload.project) {
          const projectId = action.payload.project._id;

          // Update in projects array
          const index = state.projects.findIndex((p) => p._id === projectId);
          if (index !== -1) {
            state.projects[index] = action.payload.project;
          }

          // Update current project if it's the same
          if (state.currentProject?._id === projectId) {
            state.currentProject = action.payload.project;
          }
        }
      })
      .addCase(generateDockerfile.rejected, (state, action) => {
        state.loading.dockerfile = false;
        state.error.dockerfile = action.payload;
        state.success.dockerfile = false;
      });
  },
});

export const {
  resetProjectState,
  clearProjectError,
  clearProjectSuccess,
  setCurrentProject,
  clearCurrentProject,
} = projectSlice.actions;

export default projectSlice.reducer;
