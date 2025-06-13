import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { invalidateCacheEntry } from "@utils/api";

// Initial state
const initialState = {
  isLoading: false,
  error: null,
  twoFactorEnabled: false,
  qrCode: null,
  secret: null,
  backupCodes: [],
  backupCodesCount: 0,
  isGenerating: false,
  isEnabling: false,
  isDisabling: false,
  isVerifying: false,
};

// Async thunks
export const generate2FASecret = createAsyncThunk(
  "twoFactor/generate2FASecret",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/2fa/generate");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate 2FA secret"
      );
    }
  }
);

export const enable2FA = createAsyncThunk(
  "twoFactor/enable2FA",
  async ({ token, secret }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/2fa/enable", {
        token,
        secret,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to enable 2FA"
      );
    }
  }
);

export const verify2FALogin = createAsyncThunk(
  "twoFactor/verify2FALogin",
  async ({ token, userId, rememberDevice }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/2fa/verify", {
        token,
        userId,
        rememberDevice,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Invalid verification code"
      );
    }
  }
);

export const disable2FA = createAsyncThunk(
  "twoFactor/disable2FA",
  async (password, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/2fa/disable", { password });
      return response.data.message;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to disable 2FA"
      );
    }
  }
);

export const get2FAStatus = createAsyncThunk(
  "twoFactor/get2FAStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/2fa/status");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get 2FA status"
      );
    }
  }
);

export const generateNewBackupCodes = createAsyncThunk(
  "twoFactor/generateNewBackupCodes",
  async (password, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/2fa/backup-codes", {
        password,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate backup codes"
      );
    }
  }
);

// Slice
const twoFactorSlice = createSlice({
  name: "twoFactor",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearQRCode: (state) => {
      state.qrCode = null;
      state.secret = null;
    },
    clearBackupCodes: (state) => {
      state.backupCodes = [];
    },
    reset2FAState: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate 2FA Secret
      .addCase(generate2FASecret.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generate2FASecret.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.qrCode = action.payload.qrCode;
        state.secret = action.payload.secret;
      })
      .addCase(generate2FASecret.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload;
      })

      // Enable 2FA
      .addCase(enable2FA.pending, (state) => {
        state.isEnabling = true;
        state.error = null;
      })      .addCase(enable2FA.fulfilled, (state, action) => {
        state.isEnabling = false;
        state.twoFactorEnabled = true;
        state.backupCodes = action.payload.backupCodes;
        state.backupCodesCount = action.payload.backupCodes.length;
        state.qrCode = null;
        state.secret = null;
        // Invalidate 2FA status cache to ensure fresh data
        invalidateCacheEntry("/auth/2fa/status", undefined);
        // Also invalidate user data cache since user object contains 2FA status
        invalidateCacheEntry("/auth/me", undefined);
      })
      .addCase(enable2FA.rejected, (state, action) => {
        state.isEnabling = false;
        state.error = action.payload;
      })

      // Verify 2FA Login
      .addCase(verify2FALogin.pending, (state) => {
        state.isVerifying = true;
        state.error = null;
      })
      .addCase(verify2FALogin.fulfilled, (state) => {
        state.isVerifying = false;
      })
      .addCase(verify2FALogin.rejected, (state, action) => {
        state.isVerifying = false;
        state.error = action.payload;
      })

      // Disable 2FA
      .addCase(disable2FA.pending, (state) => {
        state.isDisabling = true;
        state.error = null;
      })      .addCase(disable2FA.fulfilled, (state) => {
        state.isDisabling = false;
        state.twoFactorEnabled = false;
        state.backupCodes = [];
        state.backupCodesCount = 0;
        // Invalidate 2FA status cache to ensure fresh data
        invalidateCacheEntry("/auth/2fa/status", undefined);
        // Also invalidate user data cache since user object contains 2FA status
        invalidateCacheEntry("/auth/me", undefined);
      })
      .addCase(disable2FA.rejected, (state, action) => {
        state.isDisabling = false;
        state.error = action.payload;
      })

      // Get 2FA Status
      .addCase(get2FAStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(get2FAStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.twoFactorEnabled = action.payload.twoFactorEnabled;
        state.backupCodesCount = action.payload.backupCodesCount;
      })
      .addCase(get2FAStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Generate New Backup Codes
      .addCase(generateNewBackupCodes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })      .addCase(generateNewBackupCodes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.backupCodes = action.payload.backupCodes;
        state.backupCodesCount = action.payload.backupCodes.length;
        // Invalidate 2FA status cache to ensure fresh backup codes count
        invalidateCacheEntry("/auth/2fa/status", undefined);
      })
      .addCase(generateNewBackupCodes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearQRCode, clearBackupCodes, reset2FAState } =
  twoFactorSlice.actions;
export default twoFactorSlice.reducer;
