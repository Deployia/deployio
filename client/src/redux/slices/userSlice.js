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

const userSlice = createSlice({
  name: "user",
  initialState: {
    loading: false,
    error: null,
    success: null,
    user: null,
    passwordSuccess: null,
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
  },
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export const { resetUserState, setUser } = userSlice.actions;
export default userSlice.reducer;
