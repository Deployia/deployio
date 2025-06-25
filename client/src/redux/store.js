import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userProfileReducer from "./slices/userSlice";
import twoFactorReducer from "./slices/twoFactorSlice";
import projectReducer from "./slices/projectSlice";
import deploymentReducer from "./slices/deploymentSlice";
import analyticsReducer from "./slices/analyticsSlice";
import documentationReducer from "./slices/documentationSlice";
import blogReducer from "./slices/blogSlice";
import apiKeyReducer from "./slices/apiKeySlice";
import notificationReducer from "./slices/notificationSlice";
import gitProviderReducer from "./slices/gitProviderSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  userProfile: userProfileReducer,
  twoFactor: twoFactorReducer,
  projects: projectReducer,
  deployments: deploymentReducer,
  analytics: analyticsReducer,
  documentation: documentationReducer,
  blog: blogReducer,
  apiKeys: apiKeyReducer,
  notifications: notificationReducer,
  gitProvider: gitProviderReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Performance optimizations - reduce checks that cause violations
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        ignoredActionsPaths: ["meta.arg", "payload.timestamp"],
        ignoredPaths: ["items.dates"],
        // Reduce serialization check frequency to improve performance
        warnAfter: 128,
      },
      // Disable immutable checks entirely in development to reduce violations
      immutableCheck: false,
      // Reduce action creator check frequency
      actionCreatorCheck:
        import.meta.env.MODE === "production"
          ? false
          : {
              warnAfter: 128,
            },
    }),
  devTools: import.meta.env.MODE !== "production" && {
    // Limit Redux DevTools features to reduce performance impact
    maxAge: 50,
    trace: false,
    traceLimit: 25,
  },
});

export default store;
