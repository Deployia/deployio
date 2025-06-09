import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import twoFactorReducer from "./slices/twoFactorSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  twoFactor: twoFactorReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Performance optimizations
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        ignoredActionsPaths: ["meta.arg", "payload.timestamp"],
        ignoredPaths: ["items.dates"],
      },
      // Improve performance by reducing immutable checks in production
      immutableCheck: import.meta.env.MODE !== "production",
    }),
  devTools: import.meta.env.MODE !== "production",
});

export default store;
