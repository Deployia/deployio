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

module.exports = {
  updateProfile,
  updatePassword,
  getProfile,
  deleteAccount,
  handleImageUpload,
};
