const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("./emailService");

/**
 * Generate JWT token for authentication
 * @param {Object} user - User document from MongoDB
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

/**
 * Register a new user
 * @param {Object} userData - User data including username, email, password
 * @returns {Object} User object and token
 */
const registerUser = async (userData) => {
  const { username, email, password } = userData;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error("Email already registered");
  }

  // Create new user
  const user = await User.create({
    username,
    email,
    password,
  });

  // Generate token
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  return { user, token, refreshToken };
};

/**
 * Login user and generate token
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Object} User object and token
 */
const loginUser = async (email, password) => {
  // Find user by email and include password in query result
  const user = await User.findOne({ email }).select("+password");

  // Check if user exists
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Check if password is correct
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // Generate token
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  return { user, token, refreshToken };
};

/**
 * Generate password reset token and send email
 * @param {String} email - User email
 * @param {String} resetUrl - Base URL for reset link
 * @returns {String} Success message
 */
const forgotPassword = async (email, resetUrl) => {
  // Find user by email
  const user = await User.findOne({ email });

  // Check if user exists
  if (!user) {
    throw new Error("User with this email does not exist");
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetLink = `${resetUrl}/reset-password/${resetToken}`;

  // Create email message
  const message = `
    You are receiving this email because you (or someone else) has requested the reset of a password.
    Please click on the following link to reset your password:
    ${resetLink}
    This link is valid for 30 minutes only.
    If you did not request this, please ignore this email and your password will remain unchanged.
  `;

  try {
    // Send email
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      text: message,
    });

    return "Password reset email sent";
  } catch (error) {
    // If error sending email, clear reset token and expiry
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new Error("Email could not be sent");
  }
};

/**
 * Reset user password using token
 * @param {String} token - Password reset token
 * @param {String} newPassword - New password
 * @returns {String} Success message
 */
const resetPassword = async (token, newPassword) => {
  // Hash token to compare with stored token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user by token and check token expiry
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  // Check if user exists and token is valid
  if (!user) {
    throw new Error("Invalid or expired token");
  }

  // Update password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return "Password reset successful";
};

/**
 * Update user password
 * @param {String} userId - User ID
 * @param {String} currentPassword - Current password
 * @param {String} newPassword - New password
 * @returns {String} Success message
 */
const updatePassword = async (userId, currentPassword, newPassword) => {
  // Find user by ID and include password in query result
  const user = await User.findById(userId).select("+password");

  // Check if user exists
  if (!user) {
    throw new Error("User not found");
  }

  // Check if current password is correct
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  // Update password
  user.password = newPassword;
  await user.save();
  return "Password updated successfully";
};

/**
 * Logout user
 * @param {String} userId - The ID of the user logging out
 * @returns {String} Success message
 *
 * Note: In a real-world implementation, you might invalidate tokens server-side using
 * Redis or a similar database. This simplified implementation relies on client-side
 * token removal only.
 */
const logoutUser = async (userId) => {
  // In a production implementation, you might:
  // 1. Log the logout action
  // 2. Store session data or user activity
  // 3. Invalidate the token in a Redis store

  // Optional: find the user to confirm they exist
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Here we simply return a success message
  // The actual token invalidation happens client-side by removing the token
  return "Logged out successfully";
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updatePassword,
  generateToken,
  logoutUser,
  // Export generateRefreshToken if needed elsewhere
  generateRefreshToken,
};
