import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@utils/api";

// Update profile
export const updateProfile = createAsyncThunk(
  "user/updateProfile",
  async (formData, thunkAPI) => {
    try {
      const response = await api.put("/user/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Update password
export const updatePassword = createAsyncThunk(
  "user/updatePassword",
  async (data, thunkAPI) => {
    try {
      const response = await api.put("/user/update-password", data);
      return response.data.message;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Fetch notification preferences
export const fetchNotificationPreferences = createAsyncThunk(
  "user/fetchNotificationPreferences",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/user/notification-preferences");
      return response.data.preferences;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Update notification preferences
export const updateNotificationPreferences = createAsyncThunk(
  "user/updateNotificationPreferences",
  async (preferences, thunkAPI) => {
    try {
      const response = await api.put(
        "/user/notification-preferences",
        preferences
      );
      return response.data.preferences;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Fetch user activity
export const fetchUserActivity = createAsyncThunk(
  "user/fetchUserActivity",
  async (params, thunkAPI) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`/user/activity?${queryParams}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Log user activity
export const logUserActivity = createAsyncThunk(
  "user/logUserActivity",
  async (activityData, thunkAPI) => {
    try {
      const response = await api.post("/user/activity", activityData);
      return response.data.activity;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Fetch API keys
export const fetchApiKeys = createAsyncThunk(
  "user/fetchApiKeys",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/user/api-keys");
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
  "user/createApiKey",
  async (keyData, thunkAPI) => {
    try {
      const response = await api.post("/user/api-keys", keyData);
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
  "user/deleteApiKey",
  async (keyId, thunkAPI) => {
    try {
      await api.delete(`/user/api-keys/${keyId}`);
      return keyId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Fetch dashboard stats
export const fetchDashboardStats = createAsyncThunk(
  "user/fetchDashboardStats",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/user/dashboard-stats");
      return response.data.stats;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    loading: false,
    error: null,
    success: null,
    user: null,
    passwordSuccess: null,
    notificationPreferences: null,
    notificationsLoading: false,
    notificationsError: null,
    activities: [],
    activitiesLoading: false,
    activitiesError: null,
    activityPagination: null,
    apiKeys: [],
    apiKeysLoading: false,
    apiKeysError: null,
    dashboardStats: null,
    dashboardStatsLoading: false,
    dashboardStatsError: null,
  },
  reducers: {
    resetUserState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = null;
      state.passwordSuccess = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUserError: (state) => {
      state.error = null;
    },
    clearUserSuccess: (state) => {
      state.success = null;
      state.passwordSuccess = null;
    },
    clearNotificationsError: (state) => {
      state.notificationsError = null;
    },
    clearActivitiesError: (state) => {
      state.activitiesError = null;
    },
    clearApiKeysError: (state) => {
      state.apiKeysError = null;
    },
    clearDashboardStatsError: (state) => {
      state.dashboardStatsError = null;
    },
    resetActivities: (state) => {
      state.activities = [];
      state.activityPagination = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Profile updates
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.success = "Profile updated successfully";
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Password updates
      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.passwordSuccess = null;
      })
      .addCase(updatePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.passwordSuccess = action.payload;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Notification preferences
      .addCase(fetchNotificationPreferences.pending, (state) => {
        state.notificationsLoading = true;
        state.notificationsError = null;
      })
      .addCase(fetchNotificationPreferences.fulfilled, (state, action) => {
        state.notificationsLoading = false;
        state.notificationPreferences = action.payload;
      })
      .addCase(fetchNotificationPreferences.rejected, (state, action) => {
        state.notificationsLoading = false;
        state.notificationsError = action.payload;
      })
      .addCase(updateNotificationPreferences.pending, (state) => {
        state.notificationsLoading = true;
        state.notificationsError = null;
      })
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.notificationsLoading = false;
        state.notificationPreferences = action.payload;
        state.success = "Notification preferences updated successfully";
      })
      .addCase(updateNotificationPreferences.rejected, (state, action) => {
        state.notificationsLoading = false;
        state.notificationsError = action.payload;
      })
      // User activity
      .addCase(fetchUserActivity.pending, (state) => {
        state.activitiesLoading = true;
        state.activitiesError = null;
      })
      .addCase(fetchUserActivity.fulfilled, (state, action) => {
        state.activitiesLoading = false;
        state.activities = action.payload.activities;
        state.activityPagination = action.payload.pagination;
      })
      .addCase(fetchUserActivity.rejected, (state, action) => {
        state.activitiesLoading = false;
        state.activitiesError = action.payload;
      })
      .addCase(logUserActivity.pending, () => {
        // Optional: show loading for activity logging
      })
      .addCase(logUserActivity.fulfilled, (state, action) => {
        // Add new activity to the beginning of the list
        state.activities.unshift(action.payload);
      })
      .addCase(logUserActivity.rejected, (state, action) => {
        // Optional: handle activity logging errors
        console.error("Failed to log activity:", action.payload);
      })
      // API Keys
      .addCase(fetchApiKeys.pending, (state) => {
        state.apiKeysLoading = true;
        state.apiKeysError = null;
      })
      .addCase(fetchApiKeys.fulfilled, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeys = action.payload;
      })
      .addCase(fetchApiKeys.rejected, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeysError = action.payload;
      })
      .addCase(createApiKey.pending, (state) => {
        state.apiKeysLoading = true;
        state.apiKeysError = null;
      })
      .addCase(createApiKey.fulfilled, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeys.push(action.payload);
        state.success = "API key created successfully";
      })
      .addCase(createApiKey.rejected, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeysError = action.payload;
      })
      .addCase(deleteApiKey.pending, (state) => {
        state.apiKeysLoading = true;
        state.apiKeysError = null;
      })
      .addCase(deleteApiKey.fulfilled, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeys = state.apiKeys.filter(
          (key) => key.id !== action.payload
        );
        state.success = "API key deleted successfully";
      })
      .addCase(deleteApiKey.rejected, (state, action) => {
        state.apiKeysLoading = false;
        state.apiKeysError = action.payload;
      })
      // Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.dashboardStatsLoading = true;
        state.dashboardStatsError = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardStatsLoading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.dashboardStatsLoading = false;
        state.dashboardStatsError = action.payload;
      });
  },
});

export const {
  resetUserState,
  setUser,
  clearUserError,
  clearUserSuccess,
  clearNotificationsError,
  clearActivitiesError,
  clearApiKeysError,
  clearDashboardStatsError,
} = userSlice.actions;
export default userSlice.reducer;
