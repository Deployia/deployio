import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// Initial State
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: {
    me: true,
    signup: false,
    login: false,
    verifyOtp: false,
    logout: false,
    forgotPassword: false,
    resetPassword: false,
    updatePassword: false,
  },
  error: {
    me: null,
    signup: null,
    login: null,
    verifyOtp: null,
    logout: null,
    forgotPassword: null,
    resetPassword: null,
    updatePassword: null,
  },
  success: {
    forgotPassword: false,
    resetPassword: false,
    updatePassword: false,
  },
};

// Register user
export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      const response = await api.post("/api/v1/auth/register", userData);
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
      const response = await api.post("/api/v1/auth/login", userData);
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
    const response = await api.get("/api/v1/auth/logout");
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
      const response = await api.post("/api/v1/auth/forgot-password", {
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
      const response = await api.post(`/api/v1/auth/reset-password/${token}`, {
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
      const response = await api.put(
        "/api/v1/auth/update-password",
        passwordData
      );
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

// Get current user
export const getMe = createAsyncThunk("auth/getMe", async (_, thunkAPI) => {
  try {
    const response = await api.get("/api/v1/auth/me");
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
      const response = await api.post("/api/v1/auth/refresh-token", {});
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

// Create the auth slice
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
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading.signup = false;
        state.error.signup = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      }) // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading.login = true;
        state.error.login = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading.login = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading.login = false;
        state.error.login = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })

      // Logout cases
      .addCase(logout.pending, (state) => {
        state.loading.logout = true;
        state.error.logout = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading.logout = false;
        state.user = null;
        state.isAuthenticated = false;
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

      // GetMe cases
      .addCase(getMe.pending, (state) => {
        state.loading.me = true;
        state.error.me = null;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.loading.me = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(getMe.rejected, (state, action) => {
        state.loading.me = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error.me = action.payload;
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;
