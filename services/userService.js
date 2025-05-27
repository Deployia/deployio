const User = require("../models/User");

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

module.exports = {
  updateProfile,
  updatePassword,
};
