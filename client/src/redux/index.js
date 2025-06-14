// Redux slice exports for easy importing
export { default as projectReducer } from "./slices/projectSlice";
export { default as deploymentReducer } from "./slices/deploymentSlice";
export { default as analyticsReducer } from "./slices/analyticsSlice";
export { default as authReducer } from "./slices/authSlice";
export { default as userReducer } from "./slices/userSlice";
export { default as twoFactorReducer } from "./slices/twoFactorSlice";

// Project slice exports
export {
  fetchProjects,
  fetchProjectById,
  createProject,
  updateProject,
  deleteProject,
  toggleArchiveProject,
  resetProjectState,
  clearProjectError,
  clearProjectSuccess,
  setCurrentProject,
  clearCurrentProject,
} from "./slices/projectSlice";

// Deployment slice exports
export {
  fetchDeployments,
  fetchDeployment,
  fetchProjectDeployments,
  createDeployment,
  updateDeploymentStatusAPI,
  cancelDeployment,
  stopDeployment,
  restartDeployment,
  fetchDeploymentLogs,
  resetDeploymentState,
  clearError as clearDeploymentError,
  clearSuccess as clearDeploymentSuccess,
  updateFilters as updateDeploymentFilters,
  clearCurrentDeployment,
  clearLogs,
  clearMetrics,
  updateDeploymentStatus,
} from "./slices/deploymentSlice";

// Analytics slice exports
export {
  fetchUserAnalytics,
  fetchProjectAnalytics,
  fetchDeploymentAnalytics,
  fetchDashboardStats,
  resetAnalyticsState,
  clearError as clearAnalyticsError,
  clearSuccess as clearAnalyticsSuccess,
  updateFilters as updateAnalyticsFilters,
  clearAnalyticsData,
  clearCache,
} from "./slices/analyticsSlice";

// Auth slice exports
export {
  registerUser,
  loginUser,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  updateProfile,
  getMe,
  refreshToken,
  verifyOtp,
  fetchProviders,
  fetchSessions,
  unlinkProvider,
  deleteSession,
  reset,
  reset2FA,
  resetVerification,
  logoutReset,
  updateUserData,
} from "./slices/authSlice";

// User slice exports
export {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  fetchUserActivity,
  logUserActivity,
  fetchApiKeys,
  createApiKey,
  deleteApiKey,
  fetchDashboardStats as fetchUserDashboardStats,
  reset as resetUserState,
  clearError as clearUserError,
  clearSuccess as clearUserSuccess,
  resetActivities,
} from "./slices/userSlice";

// Two Factor slice exports
export {
  generate2FASecret,
  enable2FA,
  verify2FALogin,
  disable2FA,
  get2FAStatus,
  generateNewBackupCodes,
  clearError as clearTwoFactorError,
  clearQRCode,
  clearBackupCodes,
  reset2FAState,
} from "./slices/twoFactorSlice";
