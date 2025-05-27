const userService = require("../services/userService");

// Update user profile (including image upload)
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    let profileImageUrl = undefined;

    if (req.file) {
      // Upload image to Cloudinary
      const cloudinary = require("../config/cloudinary");
      const result = await cloudinary.uploader.upload_stream(
        { folder: "profile_images", width: 300, crop: "scale" },
        (error, result) => {
          if (error) throw new Error("Image upload failed");
          profileImageUrl = result.secure_url;
        }
      );
      // Note: If using memoryStorage, you may need to use a stream buffer here
    }

    const updatedUser = await userService.updateProfile(
      userId,
      updateData,
      profileImageUrl
    );
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }
    const result = await userService.updatePassword(
      req.user.id,
      currentPassword,
      newPassword
    );
    res.status(200).json({ success: true, message: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  updateProfile,
  updatePassword,
};
