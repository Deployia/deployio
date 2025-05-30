const User = require("../models/User");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const crypto = require("crypto");

// Update user profile
const updateProfile = async (userId, updateData, profileImageUrl) => {
  const updateFields = { ...updateData };
  if (profileImageUrl) {
    updateFields.profileImage = profileImageUrl;
  }
  const user = await User.findByIdAndUpdate(userId, updateFields, {
    new: true,
    runValidators: true,
  }).select("-password");
  if (!user) throw new Error("User not found");
  return user;
};

// Update user password
const updatePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password googleId");
  if (!user) throw new Error("User not found");
  if (user.googleId)
    throw new Error("Password update not allowed for OAuth users");
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new Error("Current password is incorrect");
  user.password = newPassword;
  await user.save();
  return "Password updated successfully";
};

// 2FA Service Functions

// Generate 2FA secret and QR code
const generate2FASecret = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `Fauxigent (${user?.email})`,
    issuer: "Fauxigent",
    length: 32,
  });

  return {
    secret: secret.base32,
    qrCode: secret.otpauth_url, // Return the TOTP URL instead of data URL
    manualEntryKey: secret.base32,
  };
};

// Verify 2FA token and enable 2FA
const enable2FA = async (userId, token, secret) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Verify the token
  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token,
    window: 1, // Allow minimal time drift during setup only (±1 period)
  });

  if (!verified) {
    throw new Error("Invalid verification code");
  }

  // Generate backup codes
  const backupCodes = [];
  for (let i = 0; i < 10; i++) {
    backupCodes.push({
      code: crypto.randomBytes(4).toString("hex").toUpperCase(),
      used: false,
    });
  }

  // Save 2FA settings to user
  user.twoFactorSecret = secret;
  user.twoFactorEnabled = true;
  user.backupCodes = backupCodes;
  await user.save();

  return {
    message: "2FA enabled successfully",
    backupCodes: backupCodes.map((bc) => bc.code),
  };
};

// Verify 2FA token during login
const verify2FALogin = async (userId, token) => {
  const user = await User.findById(userId).select(
    "+twoFactorSecret +backupCodes +lastTOTPToken +lastTOTPTimestamp"
  );
  if (!user) throw new Error("User not found");

  if (!user.twoFactorEnabled) {
    throw new Error("2FA is not enabled for this account");
  }
  // First, try to verify with TOTP
  // Use window: 0 for better security - only current time period is accepted
  // This prevents attacks using old/expired TOTP codes
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token: token,
    window: 0, // Restricted to current time period only (typically 30 seconds)
  });
  // Check for token reuse (if the token was already used in the past)
  if (user.lastTOTPToken === token) {
    // Token has been used before - reject it to prevent replay attacks
    return { verified: false, error: "Verification code already used" };
  }

  // Store the last used token and timestamp for additional security
  // This can help prevent token reuse attacks
  if (verified) {
    // Save the used token to prevent replay attacks
    user.lastTOTPToken = token;
    user.lastTOTPTimestamp = new Date();
    await user.save();
  }

  if (verified) {
    return { verified: true, method: "totp" };
  }

  // If TOTP fails, check backup codes
  const backupCode = user.backupCodes.find(
    (bc) => bc.code === token.toUpperCase() && !bc.used
  );

  if (backupCode) {
    // Mark backup code as used
    backupCode.used = true;
    backupCode.usedAt = new Date();
    await user.save();
    return { verified: true, method: "backup" };
  }

  // Neither TOTP nor backup code worked
  return { verified: false, error: "Invalid verification code" };
};

// Disable 2FA
const disable2FA = async (userId, password) => {
  const user = await User.findById(userId).select("+password +twoFactorSecret");
  if (!user) throw new Error("User not found");

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error("Incorrect password");
  // Disable 2FA and clear all related data
  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.backupCodes = [];
  user.lastTOTPToken = undefined;
  user.lastTOTPTimestamp = undefined;
  await user.save();

  return "2FA disabled successfully";
};

// Get 2FA status
const get2FAStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  return {
    twoFactorEnabled: user.twoFactorEnabled,
    backupCodesCount: user.backupCodes
      ? user.backupCodes.filter((bc) => !bc.used).length
      : 0,
  };
};

// Generate new backup codes
const generateNewBackupCodes = async (userId, password) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new Error("User not found");

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error("Incorrect password");

  if (!user.twoFactorEnabled) {
    throw new Error("2FA is not enabled");
  }

  // Generate new backup codes
  const backupCodes = [];
  for (let i = 0; i < 10; i++) {
    backupCodes.push({
      code: crypto.randomBytes(4).toString("hex").toUpperCase(),
      used: false,
    });
  }

  user.backupCodes = backupCodes;
  await user.save();
  return {
    message: "New backup codes generated successfully",
    backupCodes: backupCodes.map((bc) => bc.code),
  };
};

// Complete 2FA login after verification
const complete2FALogin = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const jwt = require("jsonwebtoken");

  // Generate JWT token for authentication
  const generateToken = (user) => {
    return jwt.sign({ id: user?._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  };

  const generateRefreshToken = (user) => {
    return jwt.sign({ id: user?._id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });
  };

  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: {
      id: user?._id,
      username: user?.username,
      email: user?.email,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      profileImage: user.profileImage,
    },
    token,
    refreshToken,
  };
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
  complete2FALogin,
};
