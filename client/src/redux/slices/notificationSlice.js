import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@utils/api";

// Fetch notifications
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (params = {}, thunkAPI) => {
    try {
      const { page = 1, limit = 20, status, type } = params;
      const queryParams = new URLSearchParams({ page, limit });

      if (status) queryParams.append("status", status);
      if (type) queryParams.append("type", type);

      const response = await api.get(`/external/notifications?${queryParams}`);
      return response.data.data; // Return the data object which contains notifications and pagination
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Mark notification as read
export const markNotificationRead = createAsyncThunk(
  "notifications/markNotificationRead",
  async (notificationId, thunkAPI) => {
    try {
      const response = await api.post(
        `/external/notifications/${notificationId}/read`
      );
      return { notificationId, notification: response.data.notification };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Mark all notifications as read
export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllNotificationsRead",
  async (_, thunkAPI) => {
    try {
      const response = await api.post("/external/notifications/mark-all-read");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Get unread count
export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/external/notifications/unread-count");
      return response.data.count;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Delete notification
export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async (notificationId, thunkAPI) => {
    try {
      await api.delete(`/external/notifications/${notificationId}`);
      return notificationId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Initial state following the established pattern
const initialState = {
  // Loading states - specific and granular
  loading: {
    fetch: false,
    markRead: false,
    markAllRead: false,
    unreadCount: false,
    delete: false,
  },

  // Error states - matching loading states
  error: {
    fetch: null,
    markRead: null,
    markAllRead: null,
    unreadCount: null,
    delete: null,
  },

  // Success states - for UI feedback
  success: {
    markRead: false,
    markAllRead: false,
    delete: false,
  },

  // Data
  notifications: [],
  unreadCount: 0,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 20,
  },

  // Filters and UI state
  filters: {
    status: "all", // 'all', 'unread', 'read'
    type: "all", // 'all' or specific type
  },

  // Real-time state
  isConnected: false,
  lastFetch: null,
};

const notificationSlice = createSlice({
  name: "notifications",
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

    // Update filters
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Real-time notification received
    notificationReceived: (state, action) => {
      const newNotification = action.payload;
      state.notifications.unshift(newNotification);
      state.unreadCount += 1;
      state.pagination.total += 1;
    },

    // Update connection status
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
    },

    // Mark notification as read locally (optimistic update)
    markAsReadLocal: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(
        (n) => n._id === notificationId || n.id === notificationId
      );
      if (notification && notification.status === "unread") {
        notification.status = "read";
        notification.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    }, // Increment unread count (for real-time updates)
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },

    // Add new notification (WebSocket real-time)
    addNotification: (state, action) => {
      const newNotification = action.payload;

      // Ensure test notifications have proper defaults
      if (newNotification.isTest || newNotification.isWelcome) {
        newNotification.status = newNotification.status || "read"; // Test notifications default to read
      } else {
        newNotification.status = newNotification.status || "unread"; // Regular notifications default to unread
      }

      // Add to beginning of notifications array
      state.notifications.unshift(newNotification);

      // Update unread count only for non-test, non-welcome notifications that are unread
      if (
        newNotification.status === "unread" &&
        !newNotification.isTest &&
        !newNotification.isWelcome
      ) {
        state.unreadCount += 1;
      }

      // Update pagination
      state.pagination.total += 1;
    },

    // Update notification count (WebSocket real-time)
    updateNotificationCount: (state, action) => {
      state.unreadCount = action.payload;
    },

    // Set unread count (for real-time updates)
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },

    // Set last fetch timestamp
    setLastFetch: (state) => {
      state.lastFetch = Date.now();
    },
  },

  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading.fetch = true;
        state.error.fetch = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading.fetch = false;
        const { notifications, pagination, unreadCount } = action.payload;

        // Handle pagination - append or replace based on page
        if (action.meta.arg?.page === 1) {
          // Preserve WebSocket-only notifications (test, welcome, etc.)
          const webSocketOnlyNotifications = state.notifications.filter(
            (notification) =>
              notification.isTest ||
              notification.isWelcome ||
              notification.source === "connection_confirmation"
          );

          // Merge API notifications with WebSocket-only notifications
          const apiNotifications = notifications.filter(
            (apiNotification) =>
              !webSocketOnlyNotifications.some(
                (wsNotification) => wsNotification.id === apiNotification.id
              )
          );

          state.notifications = [
            ...webSocketOnlyNotifications,
            ...apiNotifications,
          ];
        } else {
          // Append for pagination
          state.notifications.push(...notifications);
        }

        state.pagination = {
          currentPage: pagination.current,
          totalPages: pagination.pages,
          total: pagination.total,
          limit: action.meta.arg?.limit || 20,
        };

        // Update unread count if provided
        if (typeof unreadCount === "number") {
          state.unreadCount = unreadCount;
        }

        state.lastFetch = Date.now();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error.fetch = action.payload;
      });

    // Mark notification as read
    builder
      .addCase(markNotificationRead.pending, (state) => {
        state.loading.markRead = true;
        state.error.markRead = null;
        state.success.markRead = false;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.loading.markRead = false;
        state.success.markRead = true;

        const { notificationId } = action.payload;
        const notification = state.notifications.find(
          (n) => n._id === notificationId || n.id === notificationId
        );
        if (notification && notification.status === "unread") {
          notification.status = "read";
          notification.readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        state.loading.markRead = false;
        state.error.markRead = action.payload;
      });

    // Mark all notifications as read
    builder
      .addCase(markAllNotificationsRead.pending, (state) => {
        state.loading.markAllRead = true;
        state.error.markAllRead = null;
        state.success.markAllRead = false;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state, _action) => {
        state.loading.markAllRead = false;
        state.success.markAllRead = true;

        // Mark all notifications as read
        state.notifications.forEach((notification) => {
          if (notification.status === "unread") {
            notification.status = "read";
            notification.readAt = new Date().toISOString();
          }
        });
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsRead.rejected, (state, action) => {
        state.loading.markAllRead = false;
        state.error.markAllRead = action.payload;
      });

    // Fetch unread count
    builder
      .addCase(fetchUnreadCount.pending, (state) => {
        state.loading.unreadCount = true;
        state.error.unreadCount = null;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.loading.unreadCount = false;
        state.unreadCount = action.payload;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.loading.unreadCount = false;
        state.error.unreadCount = action.payload;
      });
  },
});

export const {
  reset,
  clearError,
  clearSuccess,
  updateFilters,
  notificationReceived,
  setConnectionStatus,
  markAsReadLocal,
  incrementUnreadCount,
  setUnreadCount,
  setLastFetch,
  addNotification,
  updateNotificationCount,
} = notificationSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications.notifications;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationLoading = (state) => state.notifications.loading;
export const selectNotificationError = (state) => state.notifications.error;
export const selectNotificationSuccess = (state) => state.notifications.success;
export const selectNotificationPagination = (state) =>
  state.notifications.pagination;
export const selectNotificationFilters = (state) => state.notifications.filters;
export const selectIsConnected = (state) => state.notifications.isConnected;
export const selectLastFetch = (state) => state.notifications.lastFetch;

// Complex selectors
export const selectUnreadNotifications = (state) =>
  state.notifications.notifications.filter((n) => n.status === "unread");

export const selectNotificationsByType = (state, type) =>
  state.notifications.notifications.filter((n) => n.type === type);

export const selectRecentNotifications = (state, limit = 5) =>
  state.notifications.notifications.slice(0, limit);

export default notificationSlice.reducer;
