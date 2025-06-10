const userService = require("../services/userService");
const cloudinary = require("../config/cloudinary");
const stream = require("stream");

/**
 * Update user profile (including image upload)
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    let profileImageUrl = undefined;
    const removeProfileImage = req.body.removeProfileImage === "true";

    // Handle file upload if present
    if (req.file) {
      profileImageUrl = await handleImageUpload(req.file);
    }

    // Update user profile in database
    const updatedUser = await userService.updateProfile(
      userId,
      updateData,
      profileImageUrl,
      removeProfileImage
    );

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update user password
 */
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    // Update password
    const result = await userService.updatePassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: result,
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Handle image upload to Cloudinary
 * @param {Object} file - The uploaded file object
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
const handleImageUpload = async (file) => {
  try {
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("Image file size must be less than 5MB");
    }

    // Validate file type
    const validMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validMimeTypes.includes(file.mimetype)) {
      throw new Error(
        "Only JPEG, PNG, GIF and WebP image formats are supported"
      );
    }

    // Validate Cloudinary configuration
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new Error(
        "Cloudinary configuration is missing. Please check your environment variables."
      );
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "profile_images",
          width: 300,
          height: 300,
          crop: "fill",
          quality: "auto",
          fetch_format: "auto",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(new Error(error.message || "Image upload failed"));
          } else {
            resolve(result);
          }
        }
      );

      // Create buffer stream and pipe to upload
      const bufferStream = new stream.PassThrough();
      bufferStream.end(file.buffer);
      bufferStream.pipe(uploadStream);
    });

    return uploadResult.secure_url;
  } catch (error) {
    console.error("Image upload error:", error);
    throw new Error("Failed to upload profile image: " + error.message);
  }
};

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
    });
  }
};

/**
 * Delete user account
 */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to delete account",
      });
    }

    await userService.deleteUser(userId, password);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user notification preferences
 */
const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await userService.getNotificationPreferences(userId);

    res.status(200).json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error("Get notification preferences error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get notification preferences",
    });
  }
};

/**
 * Update user notification preferences
 */
const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    const updatedPreferences = await userService.updateNotificationPreferences(
      userId,
      preferences
    );

    res.status(200).json({
      success: true,
      preferences: updatedPreferences,
      message: "Notification preferences updated successfully",
    });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update notification preferences",
    });
  }
};

/**
 * Get user activity log
 */
const getUserActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;

    const activities = await userService.getUserActivity(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
    });

    res.status(200).json({
      success: true,
      activities: activities.data,
      pagination: {
        current: activities.page,
        pages: activities.pages,
        total: activities.total,
      },
    });
  } catch (error) {
    console.error("Get user activity error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get user activity",
    });
  }
};

/**
 * Log user activity
 */
const logUserActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action, type, details, ip } = req.body;

    const activity = await userService.logUserActivity(userId, {
      action,
      type,
      details,
      ip: ip || req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.status(201).json({
      success: true,
      activity,
    });
  } catch (error) {
    console.error("Log user activity error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to log user activity",
    });
  }
};

/**
 * Get dashboard stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await userService.getDashboardStats(userId);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get dashboard stats",
    });
  }
};

/**
 * Get user API keys
 */
const getApiKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    const apiKeys = await userService.getApiKeys(userId);

    res.status(200).json({
      success: true,
      apiKeys,
    });
  } catch (error) {
    console.error("Get API keys error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get API keys",
    });
  }
};

/**
 * Create new API key
 */
const createApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, permissions = ["read"] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "API key name is required",
      });
    }

    const apiKey = await userService.createApiKey(userId, {
      name: name.trim(),
      permissions,
    });

    res.status(201).json({
      success: true,
      apiKey,
      message: "API key created successfully",
    });
  } catch (error) {
    console.error("Create API key error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create API key",
    });
  }
};

/**
 * Delete API key
 */
const deleteApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;

    if (!keyId) {
      return res.status(400).json({
        success: false,
        message: "API key ID is required",
      });
    }

    await userService.deleteApiKey(userId, keyId);

    res.status(200).json({
      success: true,
      message: "API key deleted successfully",
    });
  } catch (error) {
    console.error("Delete API key error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete API key",
    });
  }
};

module.exports = {
  updateProfile,
  updatePassword,
  getProfile,
  deleteAccount,
  handleImageUpload,
  getNotificationPreferences,
  updateNotificationPreferences,
  getUserActivity,
  logUserActivity,
  getDashboardStats,
  getApiKeys,
  createApiKey,
  deleteApiKey,
};
