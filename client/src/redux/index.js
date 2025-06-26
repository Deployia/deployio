// Redux slice exports for easy importing
export { default as projectReducer } from "./slices/projectSlice";
export { default as projectCreationReducer } from "./slices/projectCreationSlice";
export { default as deploymentReducer } from "./slices/deploymentSlice";
export { default as analyticsReducer } from "./slices/analyticsSlice";
export { default as authReducer } from "./slices/authSlice";
export { default as userReducer } from "./slices/userSlice";
export { default as twoFactorReducer } from "./slices/twoFactorSlice";
export { default as apiKeyReducer } from "./slices/apiKeySlice";
export { default as notificationReducer } from "./slices/notificationSlice";

// Project slice exports
export {
  fetchProjects,
  fetchProjectById,
  createProject,
  updateProject,
  deleteProject,
  toggleArchiveProject,
  analyzeRepository,
  generateDockerfile,
  resetProjectState,
  clearProjectError,
  clearProjectSuccess,
  setCurrentProject,
  clearCurrentProject,
} from "./slices/projectSlice";

// Project creation slice exports
export {
  createSession,
  updateStepData,
  analyzeRepository as analyzeRepositoryCreation,
  createProjectFromSession,
  fetchGitProviders,
  fetchRepositories,
  fetchBranches,
  updateStep,
  completeStep,
  setStepData,
  setSelectedProvider,
  setSelectedRepository,
  setRepositoryFilters,
  setSelectedBranch,
  setAnalysisSettings,
  updateAnalysisProgress,
  setProjectConfiguration,
  resetWizard,
  completeWizard,
  clearError as clearProjectCreationError,
  clearSuccess as clearProjectCreationSuccess,
  startAnalysisPolling,
  stopAnalysisPolling,
} from "./slices/projectCreationSlice";

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
  reset,
  reset2FA,
  resetVerification,
  logoutReset,
  updateUserData,
} from "./slices/authSlice";

// User slice exports
export {
  fetchNotificationPreferences,
  fetchUserActivity,
  logUserActivity,
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

// API Key slice actions and selectors
export {
  fetchApiKeys,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  regenerateApiKey,
  fetchApiKeyUsage,
  reset as resetApiKeys,
  clearError as clearApiKeyError,
  clearSuccess as clearApiKeySuccess,
  setCurrentApiKey,
  clearCurrentApiKey,
  clearNewlyCreatedKey,
  updateApiKeyLocal,
  selectApiKeys,
  selectCurrentApiKey,
  selectNewlyCreatedKey,
  selectApiKeyLoading,
  selectApiKeyError,
  selectApiKeySuccess,
  selectApiKeyUsage,
} from "./slices/apiKeySlice";

// Notification slice actions and selectors
export {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchUnreadCount,
  reset as resetNotifications,
  clearError as clearNotificationError,
  clearSuccess as clearNotificationSuccess,
  updateFilters as updateNotificationFilters,
  notificationReceived,
  setConnectionStatus,
  markAsReadLocal,
  incrementUnreadCount,
  setUnreadCount,
  setLastFetch,
  selectNotifications,
  selectUnreadCount,
  selectNotificationLoading,
  selectNotificationError,
  selectNotificationSuccess,
  selectNotificationPagination,
  selectNotificationFilters,
  selectIsConnected,
  selectLastFetch,
  selectUnreadNotifications,
  selectNotificationsByType,
  selectRecentNotifications,
  addNotification,
  updateNotificationCount,
} from "./slices/notificationSlice";
