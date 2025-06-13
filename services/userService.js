const User = require("../models/User");
const crypto = require("crypto");
const { getRedisClient } = require("../config/redisClient");

// Cache management utilities
const invalidateUserCache = async (userId) => {
  try {
    const redisClient = getRedisClient();
    const patterns = [
      `user:${userId}`,
      `user_session:${userId}`,
      `active_sessions:${userId}`,
      `refresh_token:${userId}:*`,
    ];

    // Delete all user-related cache keys
    for (const pattern of patterns) {
      if (pattern.includes("*")) {
        // For patterns with wildcards, we need to scan first
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        await redisClient.del(pattern);
      }
    }
  } catch (error) {
    console.error("Error invalidating user cache:", error);
    // Don't throw error as this is not critical
  }
};

// Update user profile
const updateProfile = async (
  userId,
  updateData,
  profileImageUrl,
  removeProfileImage
) => {
  const updateFields = { ...updateData };
  const redisClient = getRedisClient(); // Get redisClient from singleton
  const cacheKey = `user:${userId}`;

  // Handle profile image changes
  if (profileImageUrl) {
    updateFields.profileImage = profileImageUrl;
  } else if (removeProfileImage) {
    // If removeProfileImage flag is true, set profileImage to null or default
    updateFields.profileImage = null;
  }
  const user = await User.findByIdAndUpdate(userId, updateFields, {
    new: true,
    runValidators: true,
  }).select("-password");
  if (!user) throw new Error("User not found");

  // Invalidate cache comprehensively
  await invalidateUserCache(userId);
  return user;
};

// Update user password
const updatePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password googleId");
  const redisClient = getRedisClient(); // Get redisClient from singleton
  const cacheKey = `user:${userId}`;

  if (!user) throw new Error("User not found");
  if (user.googleId)
    throw new Error("Password update not allowed for OAuth users");
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new Error("Current password is incorrect");
  user.password = newPassword;
  await user.save();

  // Invalidate cache comprehensively
  await invalidateUserCache(userId);

  return "Password updated successfully";
};

// Get user by ID
const getUserById = async (userId) => {
  const redisClient = getRedisClient(); // Use the singleton Redis client
  const cacheKey = `user:${userId}`;

  try {
    // Try to get data from cache
    const cachedUser = await redisClient.get(cacheKey);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    // If not in cache, get from DB and cache it
    const user = await User.findById(userId).select("-password");
    if (!user) throw new Error("User not found");

    // Cache for 1 hour
    await redisClient.setex(cacheKey, 3600, JSON.stringify(user));
    return user;
  } catch (error) {
    // If Redis fails, still return data from DB
    console.error("Redis error in getUserById:", error);
    const user = await User.findById(userId).select("-password");
    if (!user) throw new Error("User not found");
    return user;
  }
};

// Delete user account
const deleteUser = async (userId, password) => {
  const user = await User.findById(userId).select("+password");
  const redisClient = getRedisClient(); // Use the singleton Redis client
  const cacheKey = `user:${userId}`;

  if (!user) throw new Error("User not found");

  // Verify password before deletion
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error("Incorrect password");
  await User.findByIdAndDelete(userId);

  // Invalidate all user-related cache
  await invalidateUserCache(userId);

  return "Account deleted successfully";
};

// Get user notification preferences
const getNotificationPreferences = async (userId) => {
  const user = await User.findById(userId).select("notificationPreferences");
  if (!user) throw new Error("User not found");
  return user.notificationPreferences;
};

// Update user notification preferences
const updateNotificationPreferences = async (userId, preferences) => {
  // Validate preferences object
  const allowedPreferences = [
    // Basic delivery methods
    "email",
    "inApp",
    "push",

    // Legacy preferences (maintain backward compatibility)
    "deployments",
    "security",
    "marketing",
    "updates",

    // Deployment notifications
    "deploymentSuccess",
    "deploymentFailure",
    "deploymentStarted",

    // Security & Account notifications
    "securityAlerts",
    "accountChanges",
    "newDeviceLogin",

    // Communication notifications
    "productUpdates",
    "tips",

    // Complex nested objects
    "quietHours",
    "digestSettings",
  ];

  const updateData = {};

  for (const [key, value] of Object.entries(preferences)) {
    if (allowedPreferences.includes(key)) {
      if (typeof value === "boolean") {
        // Simple boolean preferences
        updateData[`notificationPreferences.${key}`] = value;
      } else if (typeof value === "object" && value !== null) {
        // Handle nested objects like quietHours and digestSettings
        if (key === "quietHours" || key === "digestSettings") {
          for (const [nestedKey, nestedValue] of Object.entries(value)) {
            updateData[`notificationPreferences.${key}.${nestedKey}`] =
              nestedValue;
          }
        }
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("Invalid notification preferences data");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select("notificationPreferences");

  if (!user) throw new Error("User not found");
  return user.notificationPreferences;
};

// Get user activity log
const getUserActivity = async (userId, options = {}) => {
  const { page = 1, limit = 20, type } = options;
  const skip = (page - 1) * limit;

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Build filter
  let filter = { userId };
  if (type) {
    filter.type = type;
  }

  // Get activities from user's activities array (or from a separate Activity collection if preferred)
  let activities = user.activities || [];

  // Filter by type if specified
  if (type) {
    activities = activities.filter((activity) => activity.type === type);
  }

  // Sort by timestamp (newest first)
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Calculate pagination
  const total = activities.length;
  const pages = Math.ceil(total / limit);
  const paginatedActivities = activities.slice(skip, skip + limit);

  return {
    data: paginatedActivities,
    page,
    pages,
    total,
  };
};

// Log user activity
const logUserActivity = async (userId, activityData) => {
  const { action, type, details, ip, userAgent } = activityData;

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const activity = {
    action,
    type: type || "general",
    details,
    ip,
    userAgent,
    timestamp: new Date(),
  };

  // Add to user's activities array (keep only last 100 activities)
  if (!user.activities) {
    user.activities = [];
  }

  user.activities.unshift(activity);

  // Keep only the last 100 activities to prevent unlimited growth
  if (user.activities.length > 100) {
    user.activities = user.activities.slice(0, 100);
  }

  await user.save();
  return activity;
};

// Get user API keys
const getApiKeys = async (userId) => {
  const user = await User.findById(userId).select("apiKeys");
  if (!user) throw new Error("User not found");

  // Return API keys with masked keys for security
  return user.apiKeys.map((key) => ({
    id: key._id,
    name: key.name,
    key: `dp_${key.keyType}_${"*".repeat(20)}${key.key.slice(-3)}`,
    permissions: key.permissions,
    created: key.createdAt,
    lastUsed: key.lastUsed,
  }));
};

// Create new API key
const createApiKey = async (userId, { name, permissions }) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Check if user already has too many API keys
  if (user.apiKeys.length >= 10) {
    throw new Error("Maximum number of API keys (10) reached");
  }

  // Check if name already exists
  const existingKey = user.apiKeys.find((key) => key.name === name);
  if (existingKey) {
    throw new Error("API key with this name already exists");
  }

  // Generate secure API key
  const keyType = permissions.includes("write") ? "live" : "test";
  const keyData = crypto.randomBytes(32).toString("hex");
  const fullKey = `dp_${keyType}_${keyData}`;

  const newApiKey = {
    name,
    key: keyData, // Store only the data part
    keyType,
    permissions,
    createdAt: new Date(),
    lastUsed: null,
  };

  user.apiKeys.push(newApiKey);
  await user.save();

  // Return the new API key with full key visible (only time it's shown)
  const savedKey = user.apiKeys[user.apiKeys.length - 1];
  return {
    id: savedKey._id,
    name: savedKey.name,
    key: fullKey, // Return full key for user to copy
    permissions: savedKey.permissions,
    created: savedKey.createdAt,
    lastUsed: savedKey.lastUsed,
  };
};

// Delete API key
const deleteApiKey = async (userId, keyId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const keyIndex = user.apiKeys.findIndex(
    (key) => key._id.toString() === keyId
  );
  if (keyIndex === -1) {
    throw new Error("API key not found");
  }

  user.apiKeys.splice(keyIndex, 1);
  await user.save();
  return true;
};

// Get dashboard stats
const getDashboardStats = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Calculate stats based on user data
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Recent activities
  const recentActivities = user.activities.filter(
    (activity) => new Date(activity.timestamp) >= last30Days
  );

  // API key stats
  const apiKeyStats = {
    total: user.apiKeys.length,
    active: user.apiKeys.filter((key) => key.lastUsed).length,
    recentlyUsed: user.apiKeys.filter(
      (key) => key.lastUsed && new Date(key.lastUsed) >= last7Days
    ).length,
  };

  // Activity breakdown
  const activityBreakdown = recentActivities.reduce(
    (acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    },
    { auth: 0, security: 0, profile: 0, general: 0, system: 0 }
  );

  // Mock deployment stats (replace with real data when available)
  const deploymentStats = {
    total: 45 + Math.floor(Math.random() * 50),
    successful: Math.floor(Math.random() * 45) + 40,
    failed: Math.floor(Math.random() * 5),
    pending: Math.floor(Math.random() * 3),
  };

  return {
    user: {
      joinDate: user.createdAt,
      lastLogin: user.lastLogin,
      profileComplete: user.profileComplete,
      twoFactorEnabled: user.twoFactorEnabled,
      emailVerified: user.emailVerified,
    },
    activity: {
      totalThisMonth: recentActivities.length,
      thisWeek: user.activities.filter(
        (activity) => new Date(activity.timestamp) >= last7Days
      ).length,
      breakdown: activityBreakdown,
    },
    apiKeys: apiKeyStats,
    deployments: deploymentStats,
    projects: Math.floor(Math.random() * 15) + 5, // Mock data
    uptime: "99.9%", // Mock data
  };
};

module.exports = {
  updateProfile,
  updatePassword,
  getUserById,
  deleteUser,
  getNotificationPreferences,
  updateNotificationPreferences,
  getUserActivity,
  logUserActivity,
  getApiKeys,
  createApiKey,
  deleteApiKey,
  getDashboardStats,
  invalidateUserCache,
};
