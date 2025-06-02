import { useDispatch, useSelector } from "react-redux";
import {
  updateProfile,
  updatePassword,
  resetUserState,
} from "../redux/slices/userSlice";
import { useEffect, useRef, useState } from "react";
import Spinner from "../components/Spinner";
import TwoFactorDashboard from "../components/TwoFactorDashboard";
import { useSearchParams } from "react-router-dom";
import { FaPen, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";

function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "details";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    profileImage: null,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const fileInputRef = useRef();
  const dispatch = useDispatch();
  const { user, loading, error, success, passwordSuccess } = useSelector(
    (state) => state.user
  );
  const authUser = useSelector((state) => state.auth.user);
  const isOAuthUser = !!authUser?.googleId;

  useEffect(() => {
    if (authUser) {
      setProfileForm((prev) => ({
        ...prev,
        firstName: authUser.firstName || "",
        lastName: authUser.lastName || "",
        bio: authUser.bio || "",
      }));
    }
  }, [authUser]);

  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
      }));
    }
  }, [user]);
  const handleProfileChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profileImage" && files?.[0]) {
      // Validate file size (max 5MB)
      if (files[0].size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      // Show loading toast
      const loadingToastId = toast.loading("Uploading image...");

      // Create a FormData object for immediate upload
      const formData = new FormData();
      formData.append("profileImage", files[0]);

      // Add other existing profile data
      Object.entries(profileForm).forEach(([key, val]) => {
        if (key !== "profileImage" && val) formData.append(key, val);
      });

      // Dispatch the update action
      dispatch(updateProfile(formData))
        .unwrap()
        .then(() => {
          toast.success("Profile image updated successfully", {
            id: loadingToastId,
          });
        })
        .catch((error) => {
          toast.error(`Failed to update image: ${error}`, {
            id: loadingToastId,
          });
        });
    } else {
      setProfileForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRemoveProfileImage = () => {
    // Show confirmation
    if (!confirm("Are you sure you want to remove your profile image?")) {
      return;
    }

    // Show loading toast
    const loadingToastId = toast.loading("Removing profile image...");

    // Create FormData with a special flag to remove profile image
    const formData = new FormData();
    formData.append("removeProfileImage", "true");

    // Add other existing profile data
    Object.entries(profileForm).forEach(([key, val]) => {
      if (key !== "profileImage" && val) formData.append(key, val);
    });

    dispatch(updateProfile(formData))
      .unwrap()
      .then(() => {
        toast.success("Profile image removed successfully", {
          id: loadingToastId,
        });
      })
      .catch((error) => {
        toast.error(`Failed to remove image: ${error}`, { id: loadingToastId });
      });
  };
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(profileForm).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    const loadingToastId = toast.loading("Updating profile...");

    dispatch(updateProfile(formData))
      .unwrap()
      .then(() => {
        toast.success("Profile updated successfully", { id: loadingToastId });
      })
      .catch((error) => {
        toast.error(`Failed to update profile: ${error}`, {
          id: loadingToastId,
        });
      });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (isOAuthUser) {
      alert("Password update is not allowed for OAuth users.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    dispatch(
      updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
    );
  };

  // Handle tab change and update search params
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    return () => {
      dispatch(resetUserState());
    };
  }, [dispatch]);
  return (
    <div className="h-full bg-color-background text-color-text-primary py-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-color-card-background rounded-2xl shadow-2xl border border-color-border overflow-hidden">
          {/* Header */}
          <div className="bg-color-accent-primary px-8 py-6">
            <h1 className="text-2xl font-bold text-color-text-on-accent text-center">
              Profile Settings
            </h1>
          </div>

          {/* Profile image and user details */}
          <div className="px-8 py-8">
            <div className="flex flex-col items-center mb-8">
              {" "}
              <div className="relative">
                <img
                  src={
                    user?.profileImage ||
                    authUser?.profileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      authUser?.username || "User"
                    )}&background=random` // Added random background for better visibility
                  }
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-color-accent-secondary shadow-lg mb-2"
                />
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <button
                    type="button"
                    className="bg-color-background rounded-full p-2 shadow-lg hover:bg-color-accent-hover border border-color-border transition-all duration-200"
                    onClick={() =>
                      fileInputRef.current && fileInputRef.current.click()
                    }
                    aria-label="Change profile image"
                  >
                    <FaPen className="text-color-accent-primary w-3 h-3" />
                  </button>
                  {(user?.profileImage || authUser?.profileImage) && (
                    <button
                      type="button"
                      className="bg-color-background rounded-full p-2 shadow-lg hover:bg-red-500/[.1] border border-color-border transition-all duration-200"
                      onClick={handleRemoveProfileImage}
                      aria-label="Remove profile image"
                    >
                      {" "}
                      <FaTrash className="text-red-500 w-3 h-3" />
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  name="profileImage"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleProfileChange}
                  className="hidden"
                />
              </div>
              <div className="text-center">
                <div className="font-bold text-xl text-color-text-primary">
                  {authUser?.username || "User Name"}
                </div>
                <div className="text-color-text-secondary text-sm">
                  {authUser?.email || "user@email.com"}
                </div>
              </div>
            </div>{" "}
            {/* Tabs */}
            <div className="flex border-b border-color-border mb-8">
              <button
                className={`px-6 py-3 font-semibold focus:outline-none border-b-2 transition-all duration-200 rounded-t-lg ${
                  activeTab === "details"
                    ? "border-color-accent-primary text-color-accent-primary bg-color-accent-primary/[.1]"
                    : "border-transparent text-color-text-secondary hover:text-color-accent-primary hover:bg-color-accent-primary/[.05]"
                }`}
                onClick={() => handleTabChange("details")}
              >
                Profile Details
              </button>
              {!isOAuthUser && (
                <button
                  className={`ml-4 px-6 py-3 font-semibold focus:outline-none border-b-2 transition-all duration-200 rounded-t-lg ${
                    activeTab === "password"
                      ? "border-color-accent-primary text-color-accent-primary bg-color-accent-primary/[.1]"
                      : "border-transparent text-color-text-secondary hover:text-color-accent-primary hover:bg-color-accent-primary/[.05]"
                  }`}
                  onClick={() => handleTabChange("password")}
                >
                  Update Password
                </button>
              )}
              <button
                className={`ml-4 px-6 py-3 font-semibold focus:outline-none border-b-2 transition-all duration-200 rounded-t-lg ${
                  activeTab === "security"
                    ? "border-color-accent-primary text-color-accent-primary bg-color-accent-primary/[.1]"
                    : "border-transparent text-color-text-secondary hover:text-color-accent-primary hover:bg-color-accent-primary/[.05]"
                }`}
                onClick={() => handleTabChange("security")}
              >
                Security
              </button>
            </div>
            <div>
              {activeTab === "details" && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <h2 className="text-xl font-bold mb-6 text-color-text-primary">
                    Update Profile Details
                  </h2>
                  <div>
                    {" "}
                    <label className="block text-sm font-semibold text-color-text-secondary mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={profileForm.firstName}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-color-border bg-color-input-background text-color-input-text rounded-xl focus:outline-none focus:ring-2 focus:ring-color-accent-primary focus:border-transparent transition-all duration-200 placeholder-color-input-placeholder"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-color-text-secondary mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={profileForm.lastName}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-color-border bg-color-input-background text-color-input-text rounded-xl focus:outline-none focus:ring-2 focus:ring-color-accent-primary focus:border-transparent transition-all duration-200 placeholder-color-input-placeholder"
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-color-text-secondary mb-2">
                      Bio
                    </label>{" "}
                    <textarea
                      name="bio"
                      value={profileForm.bio}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-color-border bg-color-input-background text-color-input-text rounded-xl focus:outline-none focus:ring-2 focus:ring-color-accent-primary focus:border-transparent transition-all duration-200 resize-none placeholder-color-input-placeholder"
                      rows={3}
                      placeholder="Tell us a bit about yourself"
                    />
                  </div>
                  {error && (
                    <div className="bg-red-500/[.1] border border-red-500/30 text-red-500 px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-500/[.1] border border-green-500/30 text-green-500 px-4 py-3 rounded-xl">
                      {success}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-color-button-primary-text bg-color-button-primary-bg hover:bg-color-button-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-color-accent-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={loading}
                  >
                    {loading ? <Spinner size={20} /> : "Update Profile"}
                  </button>
                </form>
              )}
              {activeTab === "password" && !isOAuthUser && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <h2 className="text-xl font-bold mb-6 text-color-text-primary">
                    Update Password
                  </h2>
                  {isOAuthUser && (
                    <div className="bg-yellow-500/[.1] border border-yellow-500/30 text-yellow-600 px-4 py-3 rounded-xl font-semibold">
                      Password update is not allowed for OAuth users.
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-color-text-secondary mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-color-border bg-color-input-background text-color-input-text rounded-xl focus:outline-none focus:ring-2 focus:ring-color-accent-primary focus:border-transparent transition-all duration-200 placeholder-color-input-placeholder"
                      required
                      placeholder="Enter your current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-color-text-secondary mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-color-border bg-color-input-background text-color-input-text rounded-xl focus:outline-none focus:ring-2 focus:ring-color-accent-primary focus:border-transparent transition-all duration-200 placeholder-color-input-placeholder"
                      required
                      placeholder="Enter your new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-color-text-secondary mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-color-border bg-color-input-background text-color-input-text rounded-xl focus:outline-none focus:ring-2 focus:ring-color-accent-primary focus:border-transparent transition-all duration-200 placeholder-color-input-placeholder"
                      required
                      placeholder="Confirm your new password"
                    />
                  </div>
                  {error && (
                    <div className="bg-red-500/[.1] border border-red-500/30 text-red-500 px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="bg-green-500/[.1] border border-green-500/30 text-green-500 px-4 py-3 rounded-xl">
                      {passwordSuccess}
                    </div>
                  )}{" "}
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-color-button-primary-text bg-color-button-primary-bg hover:bg-color-button-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-color-accent-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={loading || isOAuthUser}
                  >
                    {loading ? <Spinner size={20} /> : "Update Password"}
                  </button>
                </form>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold mb-6 text-color-text-primary">
                    Security Settings
                  </h2>
                  <TwoFactorDashboard />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
