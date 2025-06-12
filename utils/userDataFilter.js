/**
 * Utility to filter user data for safe API responses
 * Prevents sensitive information from being exposed to the client
 */

/**
 * Get safe user data for authentication responses
 * @param {Object} user - User document from database
 * @returns {Object} Safe user data
 */
const getSafeUserData = (user) => {
  if (!user) return null;

  return {
    _id: user._id || user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    bio: user.bio || "",
    profileImage: user.profileImage || "",
    role: user.role || "user",
    isVerified: user.isVerified,
    twoFactorEnabled: user.twoFactorEnabled || false,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    // Include UI-relevant notification preferences with all settings
    notificationPreferences: user.notificationPreferences
      ? {
          deployments: user.notificationPreferences.deployments,
          security: user.notificationPreferences.security,
          marketing: user.notificationPreferences.marketing,
          updates: user.notificationPreferences.updates,
          email: user.notificationPreferences.email,
          inApp: user.notificationPreferences.inApp,
          push: user.notificationPreferences.push,
          // UI-specific settings
          quietHours: user.notificationPreferences.quietHours,
          digestSettings: user.notificationPreferences.digestSettings,
          deliveryMethods: user.notificationPreferences.deliveryMethods,
        }
      : undefined,
  };
};

/**
 * Get safe session data for responses
 * @param {Object} session - Session document
 * @returns {Object} Safe session data
 */
const getSafeSessionData = (session) => {
  if (!session) return null;

  return {
    _id: session._id,
    ip: session.ip,
    userAgent: session.userAgent,
    location: session.location || "Unknown",
    createdAt: session.createdAt,
    // Don't expose rememberedUntil for security
  };
};

/**
 * Get safe API key data for responses
 * @param {Object} apiKey - API key document
 * @returns {Object} Safe API key data
 */
const getSafeApiKeyData = (apiKey) => {
  if (!apiKey) return null;

  return {
    _id: apiKey._id || apiKey.id,
    name: apiKey.name,
    keyType: apiKey.keyType,
    permissions: apiKey.permissions,
    lastUsed: apiKey.lastUsed,
    createdAt: apiKey.createdAt,
    expiresAt: apiKey.expiresAt,
    isActive: apiKey.isActive,
    // Show masked key for UI display - only last 4 characters
    maskedKey: apiKey.key ? `****${apiKey.key.slice(-4)}` : undefined,
    // Only include the full key when creating (one-time display)
    key: apiKey.showFullKey ? apiKey.key : undefined,
  };
};

/**
 * Get safe activity data for responses
 * @param {Object} activity - Activity document
 * @returns {Object} Safe activity data
 */
const getSafeActivityData = (activity) => {
  if (!activity) return null;

  return {
    _id: activity._id || activity.id,
    action: activity.action,
    type: activity.type,
    details: activity.details,
    timestamp: activity.timestamp,
    createdAt: activity.createdAt,
    // Include location data but mask IP for privacy
    location: activity.location,
    // Only include browser info, not full user agent
    browser: activity.userAgent ? activity.userAgent.split(" ")[0] : undefined,
  };
};

/**
 * Get safe provider data for responses
 * @param {Object} providers - Provider data
 * @returns {Object} Safe provider data
 */
const getSafeProviderData = (providers) => {
  if (!providers) return {};

  // Only return boolean values indicating if provider is linked
  return {
    google: Boolean(providers.google),
    github: Boolean(providers.github),
  };
};

module.exports = {
  getSafeUserData,
  getSafeSessionData,
  getSafeApiKeyData,
  getSafeActivityData,
  getSafeProviderData,
};
