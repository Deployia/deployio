const userService = require("../../services/user/userService");
const cloudinary = require("../../config/cloudinary");
const stream = require("stream");
const logger = require("../../config/logger");
const { getRedisClient } = require("../../config/redisClient");
const { getSafeUserData } = require("../../utils/userDataFilter");

/**
 * Handle image upload to Cloudinary
 */
const handleImageUpload = async (fileBuffer) => {
  try {
    if (!fileBuffer) {
      throw new Error("No file buffer provided");
    }

    logger.info("Starting image upload to Cloudinary", {
      bufferSize: fileBuffer.length,
      timestamp: new Date().toISOString(),
    });

    return new Promise((resolve, reject) => {
      const cloudStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: "profile_images",
          transformation: [
            { width: 300, height: 300, crop: "fill" },
            { quality: "auto" },
            { format: "webp" },
          ],
        },
        (error, result) => {
          if (error) {
            logger.error("Cloudinary upload error", {
              error: error.message,
              timestamp: new Date().toISOString(),
            });
            reject(error);
          } else {
            logger.info("Image uploaded successfully to Cloudinary", {
              public_id: result.public_id,
              secure_url: result.secure_url,
              timestamp: new Date().toISOString(),
            });
            resolve(result.secure_url);
          }
        }
      );

      const bufferStream = new stream.PassThrough();
      bufferStream.end(fileBuffer);
      bufferStream.pipe(cloudStream);
    });
  } catch (error) {
    logger.error("Image upload error", {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    // This error is re-thrown, so the higher-level catch in updateProfile will log it if it bubbles up.
    // However, we want to make sure the error is descriptive.
    throw new Error("Failed to upload profile image: " + error.message);
  }
};

/**
 * Update user profile (including image upload)
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    let profileImageUrl = undefined;
    const removeProfileImage = req.body.removeProfileImage === "true";
    const redisClient = getRedisClient();
    const cacheKey = `user:${userId}`;

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

    // Clear cache
    if (redisClient && redisClient.isReady) {
      try {
        await redisClient.del(cacheKey);
      } catch (cacheError) {
        logger.warn("Failed to clear user cache", {
          userId,
          error: cacheError.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: getSafeUserData(updatedUser),
      message: "Profile updated successfully",
    });
  } catch (error) {
    logger.error("Update profile error", {
      userId: req.user?.id,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
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
      data: getSafeUserData(user),
    });
  } catch (error) {
    logger.error("Get profile error", {
      userId: req.user?.id,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
    });
  }
};

module.exports = {
  updateProfile,
  getProfile,
  handleImageUpload,
};
