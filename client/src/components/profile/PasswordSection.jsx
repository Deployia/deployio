import { useState } from "react";
import { motion } from "framer-motion";
import { FaKey, FaEye, FaEyeSlash, FaCheck, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "@utils/api";
import { useSelector } from "react-redux";

const PasswordSection = () => {
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Check if user has OAuth-only account (no password set)
  const isOAuthOnlyUser = !user?.hasPassword;

  // Password strength validation
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 15;
    return Math.min(100, strength);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "newPassword") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500";
    if (passwordStrength < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 70) return "Medium";
    return "Strong";
  };

  const validateForm = () => {
    if (!isOAuthOnlyUser && !formData.currentPassword) {
      toast.error("Current password is required");
      return false;
    }
    if (!formData.newPassword) {
      toast.error("New password is required");
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    if (passwordStrength < 40) {
      toast.error("Password is too weak. Please choose a stronger password.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        newPassword: formData.newPassword,
      };

      // Only include current password if user has one set
      if (!isOAuthOnlyUser) {
        payload.currentPassword = formData.currentPassword;
      }

      await api.put("/users/password", payload);

      toast.success(
        isOAuthOnlyUser
          ? "Password set successfully!"
          : "Password updated successfully!"
      );

      // Reset form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordStrength(0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <FaKey className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">
            {isOAuthOnlyUser ? "Set Password" : "Change Password"}
          </h3>
          <p className="text-gray-400 text-sm">
            {isOAuthOnlyUser
              ? "Set a password to enable email/password login"
              : "Update your account password for better security"}
          </p>
        </div>
      </div>

      {isOAuthOnlyUser && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-blue-400">
            <FaCheck className="w-4 h-4" />
            <span className="font-medium">OAuth Account Detected</span>
          </div>
          <p className="text-gray-300 text-sm mt-1">
            You&apos;re currently using OAuth login. Setting a password will
            allow you to login with email and password as well.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password - only show if user has password */}
        {!isOAuthOnlyUser && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                placeholder="Enter your current password"
                required={!isOAuthOnlyUser}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
        )}

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? "text" : "password"}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
              placeholder="Enter your new password"
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("new")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">Password Strength</span>
                <span
                  className={`text-xs font-medium ${
                    passwordStrength < 40
                      ? "text-red-400"
                      : passwordStrength < 70
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  {getPasswordStrengthLabel()}
                </span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                  style={{ width: `${passwordStrength}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-neutral-800 border text-white rounded-lg focus:ring-2 focus:ring-blue-500 pr-12 ${
                formData.confirmPassword &&
                formData.newPassword !== formData.confirmPassword
                  ? "border-red-500"
                  : "border-neutral-700 focus:border-blue-500"
              }`}
              placeholder="Confirm your new password"
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirm")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {formData.confirmPassword &&
            formData.newPassword !== formData.confirmPassword && (
              <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                <FaTimes className="w-3 h-3" />
                <span>Passwords do not match</span>
              </div>
            )}
          {formData.confirmPassword &&
            formData.newPassword === formData.confirmPassword &&
            formData.confirmPassword && (
              <div className="flex items-center gap-2 mt-2 text-green-400 text-sm">
                <FaCheck className="w-3 h-3" />
                <span>Passwords match</span>
              </div>
            )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !formData.newPassword ||
              !formData.confirmPassword ||
              formData.newPassword !== formData.confirmPassword ||
              (!isOAuthOnlyUser && !formData.currentPassword)
            }
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                {isOAuthOnlyUser
                  ? "Setting Password..."
                  : "Updating Password..."}
              </>
            ) : (
              <>
                <FaKey className="w-4 h-4" />
                {isOAuthOnlyUser ? "Set Password" : "Update Password"}
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default PasswordSection;
