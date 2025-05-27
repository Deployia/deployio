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

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const otpEmailTemplate = (username, otp) => `
  <div style="background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 50%, #c7d2fe 100%); padding: 32px; border-radius: 16px; max-width: 400px; margin: 0 auto; font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif; border: 1px solid #a78bfa; box-shadow: 0 8px 32px 0 rgba(80, 0, 120, 0.08);">
    <div style="background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%); padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background: rgba(255,255,255,0.15); border-radius: 50%; width: 48px; height: 48px; line-height: 48px; color: #fff; font-size: 1.5rem; font-weight: bold;">F!</span>
      <h2 style="color: #fff; font-size: 1.25rem; font-weight: bold; margin: 8px 0 0 0;">Verify your Fauxigent account</h2>
    </div>
    <p style="color: #6d28d9; font-size: 1rem; margin-bottom: 16px;">Hi <b>${username}</b>,</p>
    <p style="color: #4b5563; font-size: 1rem; margin-bottom: 16px;">Your One-Time Password (OTP) for account verification is:</p>
    <div style="background: #ede9fe; color: #7c3aed; font-size: 2rem; font-weight: bold; text-align: center; padding: 16px; border-radius: 8px; letter-spacing: 4px; margin-bottom: 16px;">${otp}</div>
    <p style="color: #6b7280; font-size: 0.95rem;">This OTP is valid for 10 minutes. If you did not sign up, please ignore this email.</p>
    <p style="color: #a78bfa; font-size: 0.85rem; margin-top: 24px; text-align: center;">&copy; ${new Date().getFullYear()} Fauxigent</p>
  </div>
`;

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

  // Generate OTP for 2FA
  const otp = generateOtp();
  user.otp = otp;
  user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // Send OTP email
  await sendEmail({
    to: user.email,
    subject: "Verify your Fauxigent account (OTP)",
    html: otpEmailTemplate(username, otp),
  });

  // Do not authenticate yet, require OTP verification
  return {
    user: { id: user._id, username: user.username, email: user.email },
    otpSent: true,
  };
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
 * Verify OTP for 2FA after signup
 * @param {String} email - User email
 * @param {String} otp - OTP code
 * @returns {Object} Success message
 */
const verifyOtp = async (email, otp) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");
  if (!user.otp || !user.otpExpire) throw new Error("No OTP requested");
  if (user.otp !== otp) throw new Error("Invalid OTP");
  if (user.otpExpire < Date.now()) throw new Error("OTP expired");

  // OTP valid, clear OTP fields and mark as verified
  user.otp = undefined;
  user.otpExpire = undefined;
  user.isVerified = true;
  await user.save();

  // Now generate tokens for login
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  return {
    user: { id: user._id, username: user.username, email: user.email },
    token,
    refreshToken,
  };
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

/**
 * Resend OTP for 2FA after signup
 * @param {String} email - User email
 * @returns {String} Success message
 */
const resendOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");
  // Generate new OTP
  const otp = generateOtp();
  user.otp = otp;
  user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();
  // Send OTP email
  await sendEmail({
    to: user.email,
    subject: "Your Fauxigent OTP (Resend)",
    html: otpEmailTemplate(user.username, otp),
  });
  return "OTP resent to your email";
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
  generateRefreshToken,
  verifyOtp,
  resendOtp,
};
