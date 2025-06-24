import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@utils/api";

// Fetch API keys
export const fetchApiKeys = createAsyncThunk(
  "apiKeys/fetchApiKeys",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/users/api-keys");
      return response.data.apiKeys;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Create API key
export const createApiKey = createAsyncThunk(
  "apiKeys/createApiKey",
  async (keyData, thunkAPI) => {
    try {
      const response = await api.post("/users/api-keys", keyData);
      return response.data.apiKey;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Update API key
export const updateApiKey = createAsyncThunk(
  "apiKeys/updateApiKey",
  async ({ keyId, updateData }, thunkAPI) => {
    try {
      const response = await api.put(`/users/api-keys/${keyId}`, updateData);
      return response.data.apiKey;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Delete API key
export const deleteApiKey = createAsyncThunk(
  "apiKeys/deleteApiKey",
  async (keyId, thunkAPI) => {
    try {
      await api.delete(`/users/api-keys/${keyId}`);
      return keyId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Regenerate API key
export const regenerateApiKey = createAsyncThunk(
  "apiKeys/regenerateApiKey",
  async (keyId, thunkAPI) => {
    try {
      const response = await api.post(`/users/api-keys/${keyId}/regenerate`);
      return response.data.apiKey;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Get API key usage stats
export const fetchApiKeyUsage = createAsyncThunk(
  "apiKeys/fetchApiKeyUsage",
  async (keyId, thunkAPI) => {
    try {
      const response = await api.get(`/users/api-keys/${keyId}/usage`);
      return { keyId, usage: response.data.usage };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

const initialState = {
  // Loading states - specific and granular
  loading: {
    fetch: false,
    create: false,
    update: false,
    delete: false,
    regenerate: false,
    usage: false,
  },

  // Error states - matching loading states
  error: {
    fetch: null,
    create: null,
    update: null,
    delete: null,
    regenerate: null,
    usage: null,
  },

  // Success states - for UI feedback
  success: {
    create: false,
    update: false,
    delete: false,
    regenerate: false,
  },

  // Data
  apiKeys: [],
  currentApiKey: null,
  usageStats: {}, // keyId -> usage data mapping
  newlyCreatedKey: null, // Store full key details for one-time display
};

const apiKeySlice = createSlice({
  name: "apiKeys",
  initialState,
  reducers: {
    // Standard reset action
    reset: () => {
      return { ...initialState };
    },

    // Clear specific errors
    clearError: (state, action) => {
      if (action.payload) {
        state.error[action.payload] = null;
      } else {
        Object.keys(state.error).forEach((key) => {
          state.error[key] = null;
        });
      }
    },

    // Clear specific success states
    clearSuccess: (state, action) => {
      if (action.payload) {
        state.success[action.payload] = false;
      } else {
        Object.keys(state.success).forEach((key) => {
          state.success[key] = false;
        });
      }
    },

    // Set current API key for editing
    setCurrentApiKey: (state, action) => {
      state.currentApiKey = action.payload;
    },

    // Clear current API key
    clearCurrentApiKey: (state) => {
      state.currentApiKey = null;
    },

    // Clear newly created key (after user has seen it)
    clearNewlyCreatedKey: (state) => {
      state.newlyCreatedKey = null;
    },

    // Update API key locally (for optimistic updates)
    updateApiKeyLocal: (state, action) => {
      const { keyId, updates } = action.payload;
      const index = state.apiKeys.findIndex((key) => key._id === keyId);
      if (index !== -1) {
        state.apiKeys[index] = { ...state.apiKeys[index], ...updates };
      }
      if (state.currentApiKey?._id === keyId) {
        state.currentApiKey = { ...state.currentApiKey, ...updates };
      }
    },
  },

  extraReducers: (builder) => {
    // Fetch API keys
    builder
      .addCase(fetchApiKeys.pending, (state) => {
        state.loading.fetch = true;
        state.error.fetch = null;
      })
      .addCase(fetchApiKeys.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.apiKeys = action.payload;
      })
      .addCase(fetchApiKeys.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error.fetch = action.payload;
      });

    // Create API key
    builder
      .addCase(createApiKey.pending, (state) => {
        state.loading.create = true;
        state.error.create = null;
        state.success.create = false;
      })
      .addCase(createApiKey.fulfilled, (state, action) => {
        state.loading.create = false;
        state.success.create = true;
        state.apiKeys.unshift(action.payload);
        state.newlyCreatedKey = action.payload; // Store for one-time display
      })
      .addCase(createApiKey.rejected, (state, action) => {
        state.loading.create = false;
        state.error.create = action.payload;
      });

    // Update API key
    builder
      .addCase(updateApiKey.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
        state.success.update = false;
      })
      .addCase(updateApiKey.fulfilled, (state, action) => {
        state.loading.update = false;
        state.success.update = true;
        const updatedKey = action.payload;
        const index = state.apiKeys.findIndex(
          (key) => key._id === updatedKey._id
        );
        if (index !== -1) {
          state.apiKeys[index] = updatedKey;
        }
        if (state.currentApiKey?._id === updatedKey._id) {
          state.currentApiKey = updatedKey;
        }
      })
      .addCase(updateApiKey.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload;
      });

    // Delete API key
    builder
      .addCase(deleteApiKey.pending, (state) => {
        state.loading.delete = true;
        state.error.delete = null;
        state.success.delete = false;
      })
      .addCase(deleteApiKey.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.success.delete = true;
        const keyId = action.payload;
        state.apiKeys = state.apiKeys.filter((key) => key._id !== keyId);
        if (state.currentApiKey?._id === keyId) {
          state.currentApiKey = null;
        }
        // Clear usage stats for deleted key
        delete state.usageStats[keyId];
      })
      .addCase(deleteApiKey.rejected, (state, action) => {
        state.loading.delete = false;
        state.error.delete = action.payload;
      });

    // Regenerate API key
    builder
      .addCase(regenerateApiKey.pending, (state) => {
        state.loading.regenerate = true;
        state.error.regenerate = null;
        state.success.regenerate = false;
      })
      .addCase(regenerateApiKey.fulfilled, (state, action) => {
        state.loading.regenerate = false;
        state.success.regenerate = true;
        const regeneratedKey = action.payload;
        const index = state.apiKeys.findIndex(
          (key) => key._id === regeneratedKey._id
        );
        if (index !== -1) {
          state.apiKeys[index] = regeneratedKey;
        }
        if (state.currentApiKey?._id === regeneratedKey._id) {
          state.currentApiKey = regeneratedKey;
        }
        state.newlyCreatedKey = regeneratedKey; // Store for one-time display
      })
      .addCase(regenerateApiKey.rejected, (state, action) => {
        state.loading.regenerate = false;
        state.error.regenerate = action.payload;
      });

    // Fetch API key usage
    builder
      .addCase(fetchApiKeyUsage.pending, (state) => {
        state.loading.usage = true;
        state.error.usage = null;
      })
      .addCase(fetchApiKeyUsage.fulfilled, (state, action) => {
        state.loading.usage = false;
        const { keyId, usage } = action.payload;
        state.usageStats[keyId] = usage;
      })
      .addCase(fetchApiKeyUsage.rejected, (state, action) => {
        state.loading.usage = false;
        state.error.usage = action.payload;
      });
  },
});

export const {
  reset,
  clearError,
  clearSuccess,
  setCurrentApiKey,
  clearCurrentApiKey,
  clearNewlyCreatedKey,
  updateApiKeyLocal,
} = apiKeySlice.actions;

// Selectors
export const selectApiKeys = (state) => state.apiKeys.apiKeys;
export const selectCurrentApiKey = (state) => state.apiKeys.currentApiKey;
export const selectNewlyCreatedKey = (state) => state.apiKeys.newlyCreatedKey;
export const selectApiKeyLoading = (state) => state.apiKeys.loading;
export const selectApiKeyError = (state) => state.apiKeys.error;
export const selectApiKeySuccess = (state) => state.apiKeys.success;
export const selectApiKeyUsage = (state, keyId) =>
  state.apiKeys.usageStats[keyId];

export default apiKeySlice.reducer;
