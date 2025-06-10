import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../redux/slices/userSlice";
import { useEffect, useRef, useState } from "react";
import Spinner from "../components/Spinner";
import { useSearchParams } from "react-router-dom";
import {
  FaRocket,
  FaShieldAlt,
  FaChartLine,
  FaServer,
  FaCheckCircle,
  FaUser,
  FaKey,
  FaDesktop,
  FaBell,
  FaHistory,
  FaEdit,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCamera,
  FaSave,
} from "react-icons/fa";
import toast from "react-hot-toast";
import SEO from "../components/SEO.jsx";
import { motion, AnimatePresence } from "framer-motion";

// Mock data - moved outside component to prevent re-creation
const mockSessions = [
  {
    id: 1,
    device: "Chrome on Windows",
    location: "New York, US",
    lastActive: "Active now",
    current: true,
  },
  {
    id: 2,
    device: "Safari on MacBook Pro",
    location: "San Francisco, US",
    lastActive: "2 hours ago",
    current: false,
  },
  {
    id: 3,
    device: "Mobile App",
    location: "Los Angeles, US",
    lastActive: "1 day ago",
    current: false,
  },
];

const mockActivity = [
  {
    id: 1,
    action: "Profile updated",
    time: "2 hours ago",
    type: "profile",
  },
  {
    id: 2,
    action: "Password changed",
    time: "1 week ago",
    type: "security",
  },
  {
    id: 3,
    action: "Two-factor authentication enabled",
    time: "2 weeks ago",
    type: "security",
  },
  {
    id: 4,
    action: "New device login detected",
    time: "1 month ago",
    type: "security",
  },
];

const dashboardStats = {
  deployments: {
    total: 247,
    successful: 239,
    failed: 8,
    pending: 3,
  },
  projects: 12,
  apiCalls: 15420,
  uptime: "99.9%",
};

function Profile() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
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
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [notifications, setNotifications] = useState({
    deployments: true,
    security: true,
    marketing: false,
    updates: true,
  });
  const fileInputRef = useRef();
  const dispatch = useDispatch();
  const { user, loading, error, success } = useSelector((state) => state.user);
  const authUser = useSelector((state) => state.auth.user);

  const tabs = [
    { id: "overview", label: "Overview", icon: FaUser },
    { id: "profile", label: "Profile", icon: FaEdit },
    { id: "security", label: "Security", icon: FaShieldAlt },
    { id: "sessions", label: "Sessions", icon: FaDesktop },
    { id: "notifications", label: "Notifications", icon: FaBell },
    { id: "activity", label: "Activity", icon: FaHistory },
  ];
  useEffect(() => {
    if (authUser) {
      setProfileForm((prev) => ({
        ...prev,
        firstName: authUser.firstName || "",
        lastName: authUser.lastName || "",
        bio: authUser.bio || "",
      }));
    }
    setSessions(mockSessions);
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
      if (files[0].size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      const loadingToastId = toast.loading("Uploading image...");
      const formData = new FormData();
      formData.append("profileImage", files[0]);

      Object.entries(profileForm).forEach(([key, val]) => {
        if (key !== "profileImage" && val) formData.append(key, val);
      });

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
    // Use a toast confirmation instead of blocking confirm dialog
    const confirmRemove = () => {
      const loadingToastId = toast.loading("Removing profile image...");
      const formData = new FormData();
      formData.append("removeProfileImage", "true");

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
          toast.error(`Failed to remove image: ${error}`, {
            id: loadingToastId,
          });
        });
    };

    // Show a toast with action buttons instead of blocking confirm
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <span>Are you sure you want to remove your profile image?</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                confirmRemove();
                toast.dismiss(t.id);
              }}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Remove
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
      }
    );
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

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    // Mock password change
    toast.success("Password changed successfully");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleNotificationChange = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success("Notification settings updated");
  };

  const terminateSession = (sessionId) => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId));
    toast.success("Session terminated");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img
                    src={
                      user?.profileImage ||
                      authUser?.profileImage ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        authUser?.username || "User"
                      )}&background=4F46E5&color=ffffff&size=120`
                    }
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-gray-200 dark:border-gray-600"
                  />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800"></div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {authUser?.firstName && authUser?.lastName
                      ? `${authUser.firstName} ${authUser.lastName}`
                      : authUser?.username || "Developer"}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {authUser?.email || "user@example.com"}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {user?.bio ||
                      authUser?.bio ||
                      "Full-stack developer passionate about DevOps and automation."}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt />
                      Joined{" "}
                      {new Date(
                        authUser?.createdAt || Date.now()
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <FaRocket />
                      {dashboardStats.projects} Projects
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Deployments
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardStats.deployments.total}
                    </p>
                  </div>
                  <FaRocket className="text-2xl text-blue-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Success Rate
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round(
                        (dashboardStats.deployments.successful /
                          dashboardStats.deployments.total) *
                          100
                      )}
                      %
                    </p>
                  </div>
                  <FaCheckCircle className="text-2xl text-green-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      API Calls
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardStats.apiCalls.toLocaleString()}
                    </p>
                  </div>
                  <FaChartLine className="text-2xl text-purple-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Uptime
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardStats.uptime}
                    </p>
                  </div>
                  <FaServer className="text-2xl text-orange-600" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {mockActivity.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div
                      className={`p-2 rounded-full ${
                        activity.type === "security"
                          ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                      }`}
                    >
                      {activity.type === "security" ? (
                        <FaShieldAlt />
                      ) : (
                        <FaUser />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Profile Information
            </h3>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Profile Image */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img
                    src={
                      user?.profileImage ||
                      authUser?.profileImage ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        authUser?.username || "User"
                      )}&background=4F46E5&color=ffffff&size=120`
                    }
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-gray-200 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <FaCamera />
                  </button>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="profileImage"
                    accept="image/*"
                    onChange={handleProfileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Change Photo
                  </button>
                  {(user?.profileImage || authUser?.profileImage) && (
                    <button
                      type="button"
                      onClick={handleRemoveProfileImage}
                      className="ml-3 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileForm.firstName}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={profileForm.bio}
                  onChange={handleProfileChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Spinner size={20} /> : <FaSave />}
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        );

      case "security":
        return (
          <div className="space-y-8">
            {/* Change Password */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Change Password
              </h3>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaKey />
                  Update Password
                </button>
              </form>
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <button
                  onClick={() => setTwoFAEnabled(!twoFAEnabled)}
                  className={`p-2 rounded-full transition-colors ${
                    twoFAEnabled
                      ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                      : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                  }`}
                >
                  {" "}
                  {twoFAEnabled ? (
                    <div className="w-12 h-6 bg-green-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-all"></div>
                    </div>
                  ) : (
                    <div className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-all"></div>
                    </div>
                  )}
                </button>
              </div>

              {twoFAEnabled ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                    <FaCheckCircle />
                    <span className="font-medium">
                      Two-factor authentication is enabled
                    </span>
                  </div>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Your account is protected with an additional security layer.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                    <FaExclamationTriangle />
                    <span className="font-medium">
                      Two-factor authentication is disabled
                    </span>
                  </div>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    Enable 2FA to add an extra layer of security to your
                    account.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case "sessions":
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Active Sessions
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Manage your active sessions across different devices and
              locations.
            </p>

            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <FaDesktop className="text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {session.device}
                        </h4>
                        {session.current && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {session.location}
                      </p>
                      <p className="text-sm text-gray-500">
                        {session.lastActive}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <button
                      onClick={() => terminateSession(session.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      Terminate
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Notification Preferences
            </h3>{" "}
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Configure how you&apos;d like to receive notifications about your
              deployments and account.
            </p>
            <div className="space-y-6">
              {Object.entries(notifications).map(([key, enabled]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                      {key === "deployments"
                        ? "Deployment Notifications"
                        : key === "security"
                        ? "Security Alerts"
                        : key === "marketing"
                        ? "Marketing Communications"
                        : "Product Updates"}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {key === "deployments"
                        ? "Get notified about deployment status changes"
                        : key === "security"
                        ? "Receive alerts about security-related activities"
                        : key === "marketing"
                        ? "Receive promotional emails and newsletters"
                        : "Stay updated with new features and improvements"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleNotificationChange(key)}
                    className={`p-2 rounded-full transition-colors ${
                      enabled
                        ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                    }`}
                  >
                    {" "}
                    {enabled ? (
                      <div className="w-12 h-6 bg-green-500 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-all"></div>
                      </div>
                    ) : (
                      <div className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-all"></div>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case "activity":
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Account Activity
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              View your recent account activity and security events.
            </p>

            <div className="space-y-4">
              {mockActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div
                    className={`p-3 rounded-full ${
                      activity.type === "security"
                        ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                    }`}
                  >
                    {activity.type === "security" ? (
                      <FaShieldAlt />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      activity.type === "security"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    }`}
                  >
                    {activity.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <SEO
        title="Profile - Deployio"
        description="Manage your Deployio profile, security settings, and account preferences."
        keywords="profile, settings, account, security, notifications"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
          <p className="mt-2 text-gray-400">
            Manage your profile, security, and notification preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <tab.icon className="flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

export default Profile;
