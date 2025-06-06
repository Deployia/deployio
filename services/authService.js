const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendEmail, templates } = require("./emailService");

/**
 * Generate JWT token for authentication
 * @param {Object} user - User document from MongoDB
 * @returns {String} JWT token
 */
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

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

  // Generate OTP for 2FA
  const otp = generateOtp();
  user.otp = otp;
  user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // Send OTP email
  await sendEmail({
    to: user?.email,
    subject: "Verify your Fauxigent account (OTP)",
    template: "otp",
    variables: { username, otp },
  });

  // Do not authenticate yet, require OTP verification
  return {
    user: { id: user?._id, username: user?.username, email: user?.email },
    otpSent: true,
  };
};

/**
 * Login user and generate token
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Object} User object and token or 2FA requirement
 */
const loginUser = async (email, password) => {
  // Find user by email and include password and 2FA fields in query result
  const user = await User.findOne({ email }).select(
    "+password +twoFactorEnabled"
  );
  // Check if user exists
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Check if password is correct
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // Check if user is verified - return verification status instead of throwing error
  if (!user.isVerified) {
    // Generate OTP if user is not verified
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    try {
      // Send OTP email
      await sendEmail({
        to: user?.email,
        subject: "Verify your Fauxigent account (OTP)",
        template: "otp",
        variables: { username: user.username, otp },
      });
      console.log(`OTP email sent to ${user.email}`);
    } catch (error) {
      console.error(`Failed to send OTP email to ${user.email}:`, error);
    }

    return {
      needsVerification: true,
      userId: user._id,
      email: user.email,
      message: "Account verification required",
    };
  }

  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    return {
      requires2FA: true,
      userId: user._id,
      message: "2FA verification required",
    };
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
    user: { id: user?._id, username: user?.username, email: user?.email },
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
  const resetLink = `${resetUrl}/auth/reset-password/${resetToken}`;

  try {
    // Send email
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      template: "passwordReset",
      variables: { resetLink },
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
    to: user?.email,
    subject: "Your Fauxigent OTP (Resend)",
    html: otpEmailTemplate(user?.username, otp),
  });
  return "OTP resent to your email";
};

// OAuth providers and session management functions
/**
 * Get linked OAuth providers for a user
 */
async function getLinkedProviders(userId) {
  const user = await User.findById(userId);
  return {
    google: Boolean(user.googleId),
    facebook: Boolean(user.facebookId),
    github: Boolean(user.githubId),
  };
}

/**
 * Link an OAuth provider to user account
 */
async function linkProvider(userId, provider, providerId, profileImage) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  user[`${provider}Id`] = providerId;
  if (profileImage) user.profileImage = profileImage;
  await user.save();
}

/**
 * Unlink an OAuth provider from user account
 */
async function unlinkProvider(userId, provider) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  let count = 0;
  if (user.password) count++;
  if (user.googleId) count++;
  if (user.facebookId) count++;
  if (user.githubId) count++;
  if (count <= 1)
    throw new Error("Cannot unlink the only authentication method");
  user[`${provider}Id`] = undefined;
  await user.save();
}

/**
 * Add a session record for the user
 */
async function addSession(userId, session) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  user.sessions.push(session);
  await user.save();
  return user.sessions[user.sessions.length - 1];
}

/**
 * Get all sessions for a user
 */
async function getSessions(userId) {
  const user = await User.findById(userId).select("sessions");
  if (!user) throw new Error("User not found");
  return user.sessions;
}

/**
 * Delete a user session
 */
async function deleteSession(userId, sessionId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  user.sessions = user.sessions.filter((s) => s._id.toString() !== sessionId);
  await user.save();
}

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
  generateRefreshToken,
  verifyOtp,
  resendOtp,
  // OAuth providers and session management
  getLinkedProviders,
  linkProvider,
  unlinkProvider,
  getSessions,
  deleteSession,
  addSession,
};
