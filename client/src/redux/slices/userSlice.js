import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { invalidateCacheEntry } from "@utils/api";
import { updateProfile } from "./authSlice";

// Fetch notification preferences
export const fetchNotificationPreferences = createAsyncThunk(
  "userProfile/fetchNotificationPreferences",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/external/notification/preferences");
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
  "userProfile/updateNotificationPreferences",
  async (preferences, thunkAPI) => {
    try {
      const response = await api.put(
        "/external/notification/preferences",
        preferences
      );
      invalidateCacheEntry("/external/notification/preferences", undefined);
      thunkAPI.dispatch(fetchNotificationPreferences());
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
  "userProfile/fetchUserActivity",
  async (params, thunkAPI) => {
    try {
      const searchParams = new URLSearchParams(params || {});
      const queryParamsString = searchParams.toString();
      const response = await api.get(`/users/activity?${queryParamsString}`);
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
  "userProfile/logUserActivity",
  async (activityData, thunkAPI) => {
    try {
      const response = await api.post("/users/activity", activityData);
      return response.data.activity;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Fetch dashboard stats
export const fetchDashboardStats = createAsyncThunk(
  "userProfile/fetchDashboardStats",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/users/dashboard-stats");
      return response.data.stats;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState: {
    // Loading states following auth slice pattern
    loading: {
      notificationPreferences: false,
      updateNotificationPreferences: false,
      userActivity: false,
      logActivity: false,
      dashboardStats: false,
    },

    // Error states
    error: {
      notificationPreferences: null,
      updateNotificationPreferences: null,
      userActivity: null,
      logActivity: null,
      dashboardStats: null,
    },

    // Success states
    success: {
      updateNotificationPreferences: false,
    }, // Data
    notificationPreferences: null,
    activities: [],
    activityPagination: null,
    dashboardStats: null,
  },
  reducers: {
    reset: (state) => {
      // Reset all loading, error and success states
      Object.keys(state.loading).forEach((key) => {
        state.loading[key] = false;
      });

      Object.keys(state.error).forEach((key) => {
        state.error[key] = null;
      });

      Object.keys(state.success).forEach((key) => {
        state.success[key] = false;
      });
    },

    clearError: (state, action) => {
      if (action.payload) {
        state.error[action.payload] = null;
      } else {
        Object.keys(state.error).forEach((key) => {
          state.error[key] = null;
        });
      }
    },

    clearSuccess: (state, action) => {
      if (action.payload) {
        state.success[action.payload] = false;
      } else {
        Object.keys(state.success).forEach((key) => {
          state.success[key] = false;
        });
      }
    },

    resetActivities: (state) => {
      state.activities = [];
      state.activityPagination = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Notification preferences
      .addCase(fetchNotificationPreferences.pending, (state) => {
        state.loading.notificationPreferences = true;
        state.error.notificationPreferences = null;
      })
      .addCase(fetchNotificationPreferences.fulfilled, (state, action) => {
        state.loading.notificationPreferences = false;
        state.notificationPreferences = action.payload;
      })
      .addCase(fetchNotificationPreferences.rejected, (state, action) => {
        state.loading.notificationPreferences = false;
        state.error.notificationPreferences = action.payload;
      })

      .addCase(updateNotificationPreferences.pending, (state) => {
        state.loading.updateNotificationPreferences = true;
        state.error.updateNotificationPreferences = null;
        state.success.updateNotificationPreferences = false;
      })
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.loading.updateNotificationPreferences = false;
        state.success.updateNotificationPreferences = true;
        // Ensure a new object reference for notificationPreferences
        state.notificationPreferences = { ...action.payload };
      })
      .addCase(updateNotificationPreferences.rejected, (state, action) => {
        state.loading.updateNotificationPreferences = false;
        state.error.updateNotificationPreferences = action.payload;
      })

      // User activity
      .addCase(fetchUserActivity.pending, (state) => {
        state.loading.userActivity = true;
        state.error.userActivity = null;
      })
      .addCase(fetchUserActivity.fulfilled, (state, action) => {
        state.loading.userActivity = false;
        state.activities = action.payload.activities;
        state.activityPagination = action.payload.pagination;
      })
      .addCase(fetchUserActivity.rejected, (state, action) => {
        state.loading.userActivity = false;
        state.error.userActivity = action.payload;
      })

      .addCase(logUserActivity.pending, (state) => {
        state.loading.logActivity = true;
        state.error.logActivity = null;
      })
      .addCase(logUserActivity.fulfilled, (state, action) => {
        state.loading.logActivity = false;
        // Add new activity to the beginning of the list, ensuring a new array reference
        state.activities = [action.payload, ...state.activities];
        // Optionally, update pagination if the new item affects it
        if (state.activityPagination) {
          state.activityPagination = {
            ...state.activityPagination,
            total: state.activityPagination.total + 1,
            // Note: current page and total pages might need more complex logic
            // if adding an item should shift items across pages.
            // For simplicity, we're just incrementing total here.
            // A full refetch might be more robust if pagination accuracy is critical on new log.
          };
        }
      })
      .addCase(logUserActivity.rejected, (state, action) => {
        state.loading.logActivity = false;
        state.error.logActivity = action.payload;
      }) // Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading.dashboardStats = true;
        state.error.dashboardStats = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading.dashboardStats = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading.dashboardStats = false;
        state.error.dashboardStats = action.payload;
      })

      // Listen to profile updates from authSlice to keep data in sync
      .addCase(updateProfile.fulfilled, (state) => {
        // When profile is updated (e.g., authUser changes), reset user-specific data,
        // errors, and success flags in this slice to ensure a clean state and
        // encourage components to re-fetch fresh data.

        // Reset data fields to their initial states from initialState
        state.notificationPreferences = null;
        state.activities = [];
        state.activityPagination = null;
        state.apiKeys = [];
        state.dashboardStats = null;

        // Reset all error states for this slice
        Object.keys(state.error).forEach((key) => {
          state.error[key] = null;
        });

        // Reset all success states for this slice
        Object.keys(state.success).forEach((key) => {
          state.success[key] = false;
        });

        // Optionally, reset loading states. If components correctly trigger
        // loading states on re-fetch, this might not be strictly necessary.
        // Object.keys(state.loading).forEach((key) => {
        //   state.loading[key] = false;
        // });
      });
  },
});

export const { reset, clearError, clearSuccess, resetActivities } =
  userProfileSlice.actions;
export default userProfileSlice.reducer;
