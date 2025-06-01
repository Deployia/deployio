const userService = require("../services/userService");

// Update user profile (including image upload)
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    let profileImageUrl = undefined;
    const removeProfileImage = req.body.removeProfileImage === "true";
    if (req.file) {
      // Check if file size is too large (limit to 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        throw new Error("Image file size must be less than 5MB");
      }

      // Check valid image MIME types
      const validMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validMimeTypes.includes(req.file.mimetype)) {
        throw new Error(
          "Only JPEG, PNG, GIF and WebP image formats are supported"
        );
      }

      // Upload image to Cloudinary
      const cloudinary = require("../config/cloudinary");

      try {
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

        // Create a promise to handle the upload stream
        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "profile_images",
              width: 300,
              height: 300,
              crop: "fill",
              quality: "auto",
              fetch_format: "auto",
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                reject(new Error(error.message || "Image upload failed"));
              } else resolve(result);
            }
          );

          // Create buffer from file and pipe to upload stream
          const buffer = req.file.buffer;
          const stream = require("stream");
          const bufferStream = new stream.PassThrough();
          bufferStream.end(buffer);
          bufferStream.pipe(uploadStream);
        });

        // Wait for upload to complete and get result
        const uploadResult = await uploadPromise;
        profileImageUrl = uploadResult.secure_url;
      } catch (error) {
        console.error("Image upload error:", error);
        throw new Error("Failed to upload profile image");
      }
    }

    const updatedUser = await userService.updateProfile(
      userId,
      updateData,
      profileImageUrl,
      removeProfileImage
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

// 2FA Controller Functions

// Generate 2FA secret
const generate2FASecret = async (req, res) => {
  try {
    const result = await userService.generate2FASecret(req.user.id);
    res.status(200).json({
      success: true,
      data: result,
      message: "2FA secret generated successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Enable 2FA
const enable2FA = async (req, res) => {
  try {
    const { token, secret } = req.body;
    if (!token || !secret) {
      return res.status(400).json({
        success: false,
        message: "Please provide verification token and secret",
      });
    }
    const result = await userService.enable2FA(req.user.id, token, secret);
    res.status(200).json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Verify 2FA during login
const verify2FALogin = async (req, res) => {
  try {
    const { token, userId } = req.body;
    if (!token || !userId) {
      return res.status(400).json({
        success: false,
        message: "Please provide verification token and user ID",
      });
    }

    const verificationResult = await userService.verify2FALogin(userId, token);
    if (!verificationResult.verified) {
      return res.status(400).json({
        success: false,
        message: verificationResult.error || "Invalid verification code",
      });
    }

    // Complete login by generating tokens
    const loginResult = await userService.complete2FALogin(userId); // Set cookies (using same names as regular login)
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };
    res.cookie("token", loginResult.token, cookieOptions);
    res.cookie("refreshToken", loginResult.refreshToken, {
      ...cookieOptions,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(200).json({
      success: true,
      data: {
        user: loginResult.user,
        method: verificationResult.method,
      },
      message: "2FA verification successful",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Disable 2FA
const disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please provide your password",
      });
    }
    const result = await userService.disable2FA(req.user.id, password);
    res.status(200).json({
      success: true,
      message: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get 2FA status
const get2FAStatus = async (req, res) => {
  try {
    const result = await userService.get2FAStatus(req.user.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Generate new backup codes
const generateNewBackupCodes = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please provide your password",
      });
    }
    const result = await userService.generateNewBackupCodes(
      req.user.id,
      password
    );
    res.status(200).json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  updateProfile,
  updatePassword,
  generate2FASecret,
  enable2FA,
  verify2FALogin,
  disable2FA,
  get2FAStatus,
  generateNewBackupCodes,
};
