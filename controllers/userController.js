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
        message: "Invalid verification code",
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
