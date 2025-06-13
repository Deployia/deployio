import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@utils/api";
import { verify2FALogin, enable2FA, disable2FA } from "./twoFactorSlice"; // Added fetch2FAStatus for completeness if needed later

// Initial State - Focus only on authentication
const initialState = {
  // Core authentication state
  user: null,
  isAuthenticated: false,
  requires2FA: false,
  pending2FAUserId: null,
  needsVerification: false,
  pendingVerificationEmail: null,
  currentSessionId: null,

  // Loading states
  loading: {
    me: true,
    signup: false,
    login: false,
    verifyOtp: false,
    logout: false,
    forgotPassword: false,
    resetPassword: false,
    updatePassword: false,
    updateProfile: false,
    refreshToken: false,
    providers: false,
    sessions: false,
    unlinkProvider: false,
    deleteSession: false,
  },

  // Error states
  error: {
    me: null,
    signup: null,
    login: null,
    verifyOtp: null,
    logout: null,
    forgotPassword: null,
    resetPassword: null,
    updatePassword: null,
    updateProfile: null,
    refreshToken: null,
    providers: null,
    sessions: null,
    unlinkProvider: null,
    deleteSession: null,
  },

  // Success states
  success: {
    forgotPassword: false,
    resetPassword: false,
    updatePassword: false,
    updateProfile: false,
    unlinkProvider: false,
    deleteSession: false,
  },

  // OAuth providers and session management state
  providers: {},
  sessions: [],
};

// Register user
export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Login user
export const loginUser = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      const response = await api.post("/auth/login", userData);

      // Check if 2FA is required from the response
      if (response.data.requires2FA) {
        return {
          requires2FA: true,
          userId: response.data.userId,
        };
      }

      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Logout user
export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    const response = await api.get("/auth/logout");
    return response.data;
  } catch (error) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();

    return thunkAPI.rejectWithValue(message);
  }
});

// Forgot password
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, thunkAPI) => {
    try {
      const response = await api.post("/auth/forgot-password", {
        email,
      });
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Reset password
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, thunkAPI) => {
    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        password,
      });
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update password
export const updatePassword = createAsyncThunk(
  "auth/updatePassword",
  async (passwordData, thunkAPI) => {
    try {
      const response = await api.put("/user/update-password", passwordData);
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update profile - Keep in auth since it affects the user object in auth state
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
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

// Get current user
export const getMe = createAsyncThunk("auth/getMe", async (_, thunkAPI) => {
  try {
    const response = await api.get(`/auth/me?_cb=${Date.now()}`); // Added cache-busting parameter
    return response.data;
  } catch (error) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Refresh token logic
export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, thunkAPI) => {
    try {
      const response = await api.post("/auth/refresh-token", {});
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Verify OTP (2FA after signup)
export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ email, otp }, thunkAPI) => {
    try {
      const response = await api.post("/auth/verify-otp", {
        email,
        otp,
      });
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Fetch linked OAuth providers
export const fetchProviders = createAsyncThunk(
  "auth/fetchProviders",
  async (_, thunkAPI) => {
    try {
      const response = await api.get(`/auth/providers?_cb=${Date.now()}`); // Added cache-busting parameter
      return response.data.providers;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Fetch user sessions
export const fetchSessions = createAsyncThunk(
  "auth/fetchSessions",
  async (_, thunkAPI) => {
    try {
      const response = await api.get(`/auth/sessions?_cb=${Date.now()}`); // Added cache-busting parameter
      return response.data.sessions;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Unlink provider
export const unlinkProvider = createAsyncThunk(
  "auth/unlinkProvider",
  async (provider, thunkAPI) => {
    try {
      await api.delete(`/auth/unlink/${provider}`);
      return provider;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Delete session
export const deleteSession = createAsyncThunk(
  "auth/deleteSession",
  async (sessionId, thunkAPI) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      return sessionId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      // Reset all loading, error and success states
      Object.keys(state.loading).forEach((key) => {
        if (key !== "me") {
          state.loading[key] = false;
        }
      });

      Object.keys(state.error).forEach((key) => {
        state.error[key] = null;
      });

      Object.keys(state.success).forEach((key) => {
        state.success[key] = false;
      });
    },

    // Add a separate action to reset 2FA state
    reset2FA: (state) => {
      state.requires2FA = false;
      state.pending2FAUserId = null;
    },

    // Add action to reset verification state
    resetVerification: (state) => {
      state.needsVerification = false;
      state.pendingVerificationEmail = null;
    },

    // Add a comprehensive logout reset
    logoutReset: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.requires2FA = false;
      state.pending2FAUserId = null;
      state.needsVerification = false;
      state.pendingVerificationEmail = null;
      state.currentSessionId = null;
      state.providers = {};
      state.sessions = [];

      Object.keys(state.loading).forEach((key) => {
        if (key !== "me") {
          state.loading[key] = false;
        }
      });

      Object.keys(state.error).forEach((key) => {
        state.error[key] = null;
      });

      Object.keys(state.success).forEach((key) => {
        state.success[key] = false;
      });
    },

    // Action to update user data in place (for real-time updates)
    updateUserData: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading.signup = true;
        state.error.signup = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading.signup = false;
        state.user = action.payload.user;
        state.isAuthenticated = false; // Not authenticated until OTP is verified
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading.signup = false;
        state.error.signup = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })

      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading.login = true;
        state.error.login = null;
        state.requires2FA = false;
        state.pending2FAUserId = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading.login = false;

        // Check if account needs verification
        if (action.payload.needsVerification) {
          state.needsVerification = true;
          state.pendingVerificationEmail = action.payload.email;
          state.user = null;
          state.isAuthenticated = false;
          state.requires2FA = false;
          state.pending2FAUserId = null;
        }
        // If 2FA is required, set the appropriate flags but don't authenticate yet
        else if (action.payload.requires2FA) {
          state.requires2FA = true;
          state.pending2FAUserId = action.payload.userId;
          state.user = null;
          state.isAuthenticated = false;
          state.needsVerification = false;
          state.pendingVerificationEmail = null;
        } else {
          // Normal login without 2FA
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.requires2FA = false;
          state.pending2FAUserId = null;
          state.needsVerification = false;
          state.pendingVerificationEmail = null;
          // Store current session ID
          state.currentSessionId = action.payload.sessionId;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading.login = false;
        state.error.login = action.payload;
        state.user = null;
        state.isAuthenticated = false;
        state.requires2FA = false;
        state.pending2FAUserId = null;
        state.needsVerification = false;
        state.pendingVerificationEmail = null;
      })

      // Logout cases
      .addCase(logout.pending, (state) => {
        state.loading.logout = true;
        state.error.logout = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading.logout = false;
        // Use the complete reset for logout
        state.user = null;
        state.isAuthenticated = false;
        state.requires2FA = false;
        state.pending2FAUserId = null;
        state.currentSessionId = null;
        state.providers = {};
        state.sessions = [];
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading.logout = false;
        state.error.logout = action.payload;
      })

      // Forgot password cases
      .addCase(forgotPassword.pending, (state) => {
        state.loading.forgotPassword = true;
        state.error.forgotPassword = null;
        state.success.forgotPassword = false;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading.forgotPassword = false;
        state.success.forgotPassword = true;
        state.error.forgotPassword = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading.forgotPassword = false;
        state.error.forgotPassword = action.payload;
        state.success.forgotPassword = false;
      })

      // Reset password cases
      .addCase(resetPassword.pending, (state) => {
        state.loading.resetPassword = true;
        state.error.resetPassword = null;
        state.success.resetPassword = false;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading.resetPassword = false;
        state.success.resetPassword = true;
        state.error.resetPassword = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading.resetPassword = false;
        state.error.resetPassword = action.payload;
        state.success.resetPassword = false;
      })

      // Update password cases
      .addCase(updatePassword.pending, (state) => {
        state.loading.updatePassword = true;
        state.error.updatePassword = null;
        state.success.updatePassword = false;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading.updatePassword = false;
        state.success.updatePassword = true;
        state.error.updatePassword = null;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading.updatePassword = false;
        state.error.updatePassword = action.payload;
        state.success.updatePassword = false;
      })

      // Update profile cases
      .addCase(updateProfile.pending, (state) => {
        state.loading.updateProfile = true;
        state.error.updateProfile = null;
        state.success.updateProfile = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading.updateProfile = false;
        state.success.updateProfile = true;
        state.error.updateProfile = null;
        // Update user data in auth state for real-time UI updates
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading.updateProfile = false;
        state.error.updateProfile = action.payload;
        state.success.updateProfile = false;
      })

      // GetMe cases
      .addCase(getMe.pending, (state) => {
        state.loading.me = true;
        state.error.me = null;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.loading.me = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.currentSessionId = action.payload.sessionId;
      })
      .addCase(getMe.rejected, (state, action) => {
        state.loading.me = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error.me = action.payload;
      })

      // Refresh token cases
      .addCase(refreshToken.pending, (state) => {
        state.loading.refreshToken = true;
        state.error.refreshToken = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loading.refreshToken = false;
        if (action.payload.user) {
          state.user = action.payload.user;
        }
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.loading.refreshToken = false;
        state.error.refreshToken = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })

      // Verify OTP cases
      .addCase(verifyOtp.pending, (state) => {
        state.loading.verifyOtp = true;
        state.error.verifyOtp = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading.verifyOtp = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading.verifyOtp = false;
        state.error.verifyOtp = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })

      // Handle 2FA login completion
      .addCase(verify2FALogin.fulfilled, (state, action) => {
        // Populate auth state after successful 2FA verification
        state.loading.login = false;
        state.error.login = null;
        state.requires2FA = false;
        state.pending2FAUserId = null;
        if (action.payload.user) {
          state.user = action.payload.user;
        }
        if (action.payload.sessionId) {
          state.currentSessionId = action.payload.sessionId;
        }
        state.isAuthenticated = true;
      })
      // Handle pending states for verify2FALogin
      .addCase(verify2FALogin.pending, (state) => {
        state.loading.login = true;
        state.error.login = null;
      })
      // Handle rejected states for verify2FALogin
      .addCase(verify2FALogin.rejected, (state, action) => {
        state.loading.login = false;
        state.error.login = action.payload;
        // Don't reset requires2FA here so the user can try again
      })

      // Listen to 2FA status changes from twoFactorSlice
      .addCase(enable2FA.fulfilled, (state) => {
        if (state.user) {
          state.user.twoFactorEnabled = true;
        }
        // Also reset requires2FA flag if user was in pending2FA state during login
        state.requires2FA = false;
        state.pending2FAUserId = null;
      })
      .addCase(disable2FA.fulfilled, (state) => {
        if (state.user) {
          state.user.twoFactorEnabled = false;
        }
      })
      // Potentially handle get2FAStatus.fulfilled if needed to sync on initial load or refresh
      // .addCase(fetch2FAStatus.fulfilled, (state, action) => {
      //   if (state.user && action.payload.twoFactorEnabled !== undefined) {
      //    state.user.twoFactorEnabled = action.payload.twoFactorEnabled;
      //   }
      // })

      // OAuth providers cases
      .addCase(fetchProviders.pending, (state) => {
        state.loading.providers = true;
        state.error.providers = null;
      })
      .addCase(fetchProviders.fulfilled, (state, action) => {
        state.loading.providers = false;
        state.providers = action.payload;
      })
      .addCase(fetchProviders.rejected, (state, action) => {
        state.loading.providers = false;
        state.error.providers = action.payload;
      })

      // Sessions cases
      .addCase(fetchSessions.pending, (state) => {
        state.loading.sessions = true;
        state.error.sessions = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading.sessions = false;
        state.sessions = action.payload;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading.sessions = false;
        state.error.sessions = action.payload;
      })

      // Unlink provider cases
      .addCase(unlinkProvider.pending, (state) => {
        state.loading.unlinkProvider = true;
        state.error.unlinkProvider = null;
        state.success.unlinkProvider = false;
      })
      .addCase(unlinkProvider.fulfilled, (state, action) => {
        state.loading.unlinkProvider = false;
        state.success.unlinkProvider = true;
        state.error.unlinkProvider = null;
        const prov = action.payload;
        state.providers[prov] = false;
      })
      .addCase(unlinkProvider.rejected, (state, action) => {
        state.loading.unlinkProvider = false;
        state.error.unlinkProvider = action.payload;
        state.success.unlinkProvider = false;
      })

      // Delete session cases
      .addCase(deleteSession.pending, (state) => {
        state.loading.deleteSession = true;
        state.error.deleteSession = null;
        state.success.deleteSession = false;
      })
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.loading.deleteSession = false;
        state.success.deleteSession = true;
        state.error.deleteSession = null;
        state.sessions = state.sessions.filter((s) => s._id !== action.payload);
      })
      .addCase(deleteSession.rejected, (state, action) => {
        state.loading.deleteSession = false;
        state.error.deleteSession = action.payload;
        state.success.deleteSession = false;
      }); // Ensures the builder chain is correctly terminated if the duplicates were the absolute last items.
  },
});

export const {
  reset,
  reset2FA,
  resetVerification,
  logoutReset,
  updateUserData,
} = authSlice.actions;
export default authSlice.reducer;
