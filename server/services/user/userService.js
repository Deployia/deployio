const User = require("@models/User");
const AuditLog = require("@models/AuditLog");
const crypto = require("crypto");
const { getRedisClient } = require("@config/redisClient");
const logger = require("@config/logger");

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
    logger.error("Error invalidating user cache:", error);
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
    // Try to get data from cache (only if Redis is available)
    if (redisClient) {
      try {
        const cachedUser = await redisClient.get(cacheKey);
        if (cachedUser) {
          return JSON.parse(cachedUser);
        }
      } catch (cacheError) {
        console.warn("Redis cache read error:", cacheError.message);
      }
    }

    // If not in cache, get from DB and cache it
    const user = await User.findById(userId).select("-password");
    if (!user) throw new Error("User not found");

    // Cache for 1 hour (only if Redis is available)
    if (redisClient) {
      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(user));
      } catch (cacheError) {
        console.warn("Redis cache write error:", cacheError.message);
      }
    }
    return user;
  } catch (error) {
    // If Redis fails, still return data from DB
    logger.error("Redis error in getUserById:", error);
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

  // Return preferences with defaults if not set
  return (
    user.notificationPreferences || {
      email: true,
      inApp: true,
      push: false,
      deploymentSuccess: true,
      deploymentFailure: true,
      deploymentStarted: true,
      deploymentStopped: true,
      projectAnalysisComplete: true,
      projectAnalysisFailed: true,
      projectCollaboratorAdded: true,
      securityAlerts: true,
      accountChanges: true,
      newDeviceLogin: true,
      passwordChanged: true,
      twoFactorEnabled: true,
      twoFactorDisabled: true,
      apiKeyCreated: true,
      systemMaintenance: true,
      systemUpdates: false,
      quotaWarning: true,
      quotaExceeded: true,
      welcomeMessage: true,
      announcements: false,
      productUpdates: false,
      tips: false,
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00",
        timezone: "UTC",
      },
      digestSettings: {
        enabled: false,
        frequency: "daily",
        time: "09:00",
        timezone: "UTC",
      },
    }
  );
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

// Get user activity log (FIXED - using AuditLog model)
const getUserActivity = async (userId, options = {}) => {
  const { page = 1, limit = 20, type } = options;
  const skip = (page - 1) * limit;

  // Build query for AuditLog
  let query = { "actor.id": userId };
  if (type) {
    // Filter by action type (e.g., "user.", "project.", "deployment.")
    query.action = { $regex: `^${type}\\.`, $options: "i" };
  }

  try {
    const activities = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await AuditLog.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return {
      data: activities,
      page,
      pages,
      total,
    };
  } catch (error) {
    logger.error("Error fetching user activity:", error);
    throw new Error("Failed to fetch user activity");
  }
};

// Log user activity (FIXED - using AuditLog model)
const logUserActivity = async (userId, activityData) => {
  const { action, details, ip, userAgent } = activityData;

  try {
    // Get user info for the audit log
    const user = await User.findById(userId).select("email username");
    if (!user) throw new Error("User not found"); // Create audit log entry
    const auditLog = new AuditLog({
      action: action,
      actor: {
        type: "user",
        id: userId,
        email: user.email,
        username: user.username,
      },
      context: {
        ip: ip,
        userAgent: userAgent,
      },
      details: details || {},
      category: AuditLog.getCategory(action),
      severity: AuditLog.getSeverity(action),
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    logger.error("Error logging user activity:", error);
    throw new Error("Failed to log user activity");
  }
};

// Get dashboard stats (FIXED - using AuditLog model)
const getDashboardStats = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Import models here to avoid circular dependency
  const Project = require("@models/Project");
  const Deployment = require("@models/Deployment");

  // Calculate stats based on user data
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get user's projects and deployments
  const projects = await Project.find({ owner: userId }).lean();
  const projectIds = projects.map((p) => p._id);
  const deployments = await Deployment.find({
    $or: [{ deployedBy: userId }, { project: { $in: projectIds } }],
  })
    .populate("project", "name")
    .lean();

  // Recent activities from AuditLog
  const recentActivities = await AuditLog.find({
    "actor.id": userId,
    createdAt: { $gte: last30Days },
  }).lean();

  const thisWeekActivities = await AuditLog.find({
    "actor.id": userId,
    createdAt: { $gte: last7Days },
  }).lean();

  // Activity breakdown by action type
  const activityBreakdown = recentActivities.reduce(
    (acc, activity) => {
      const actionType = activity.action.split(".")[0]; // user, project, deployment, etc.
      acc[actionType] = (acc[actionType] || 0) + 1;
      return acc;
    },
    { user: 0, project: 0, deployment: 0, api: 0, system: 0 }
  );

  // Real deployment stats
  const deploymentStats = {
    total: deployments.length,
    successful: deployments.filter((d) => d.status === "success").length,
    failed: deployments.filter((d) => d.status === "failed").length,
    pending: deployments.filter(
      (d) =>
        d.status === "pending" ||
        d.status === "running" ||
        d.status === "deploying"
    ).length,
    thisMonth: deployments.filter((d) => new Date(d.createdAt) >= last30Days)
      .length,
  };

  // Recent projects and deployments for dashboard
  const recentProjects = projects
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  const recentDeployments = deployments
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);
  return {
    user: {
      joinDate: user.createdAt,
      lastLogin: user.lastLogin,
      profileComplete: !!(user.firstName && user.lastName && user.bio),
      twoFactorEnabled: user.twoFactorAuth?.enabled || false,
      emailVerified: user.isEmailVerified,
    },
    activity: {
      totalThisMonth: recentActivities.length,
      thisWeek: thisWeekActivities.length,
      breakdown: activityBreakdown,
    },
    deployments: deploymentStats,
    projects: {
      total: projects.length,
      active: projects.filter((p) => p.status === "active").length,
      archived: projects.filter((p) => p.status === "archived").length,
    },
    // Include actual data for dashboard
    recentProjects,
    recentDeployments,
    uptime: "99.9%", // This could be calculated from deployment success rates
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
  getDashboardStats,
  invalidateUserCache,
};
