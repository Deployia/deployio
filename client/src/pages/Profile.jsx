import { useDispatch, useSelector } from "react-redux";
import { updateProfile, resetUserState } from "../redux/slices/userSlice";
import { useEffect, useRef, useState } from "react";
import Spinner from "../components/Spinner";
import { useSearchParams } from "react-router-dom";
import {
  FaPen,
  FaTrash,
  FaRocket,
  FaCloud,
  FaCode,
  FaShieldAlt,
  FaCog,
  FaChartLine,
  FaServer,
  FaClock,
  FaCheckCircle,
  FaEye,
  FaDownload,
  FaGithub,
  FaDocker,
} from "react-icons/fa";
import toast from "react-hot-toast";
import SEO from "../components/SEO.jsx";
import { motion } from "framer-motion";

function Profile() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    profileImage: null,
  });
  const fileInputRef = useRef();
  const dispatch = useDispatch();
  const { user, loading, error, success } = useSelector((state) => state.user);
  const authUser = useSelector((state) => state.auth.user);

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

  useEffect(() => {
    return () => {
      dispatch(resetUserState());
    };
  }, [dispatch]);
  // Static dashboard data
  const dashboardData = {
    deployments: {
      total: 247,
      successful: 239,
      failed: 8,
      pending: 3,
    },
    projects: [
      {
        name: "E-commerce API",
        status: "deployed",
        lastDeploy: "2 hours ago",
        framework: "Node.js",
      },
      {
        name: "React Dashboard",
        status: "building",
        lastDeploy: "1 day ago",
        framework: "React",
      },
      {
        name: "Python ML Service",
        status: "deployed",
        lastDeploy: "3 days ago",
        framework: "Python",
      },
      {
        name: "Mobile Backend",
        status: "failed",
        lastDeploy: "1 week ago",
        framework: "Node.js",
      },
    ],
    activity: [
      {
        action: "Deployed E-commerce API",
        time: "2 hours ago",
        status: "success",
      },
      {
        action: "Started build for React Dashboard",
        time: "4 hours ago",
        status: "pending",
      },
      {
        action: "Updated deployment config",
        time: "1 day ago",
        status: "info",
      },
      {
        action: "Fixed security vulnerability",
        time: "2 days ago",
        status: "success",
      },
      {
        action: "Rolled back Mobile Backend",
        time: "1 week ago",
        status: "warning",
      },
    ],
    usage: {
      buildMinutes: 1250,
      storage: "4.2 GB",
      bandwidth: "24.8 GB",
      apiCalls: 15420,
    },
  };

  return (
    <>
      <SEO page="profile" />
      <div className="min-h-screen bg-neutral-900 body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white heading">
                  Dashboard
                </h1>
                <p className="text-gray-400 mt-2">
                  Welcome back,{" "}
                  {authUser?.firstName || authUser?.username || "Developer"}!
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-400">
                  Last login: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Deployments</p>
                  <p className="text-2xl font-bold text-white">
                    {dashboardData.deployments.total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FaRocket className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Success Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.round(
                      (dashboardData.deployments.successful /
                        dashboardData.deployments.total) *
                        100
                    )}
                    %
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Projects</p>
                  <p className="text-2xl font-bold text-white">
                    {dashboardData.projects.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <FaCode className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">API Calls</p>
                  <p className="text-2xl font-bold text-white">
                    {dashboardData.usage.apiCalls.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FaChartLine className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile & Projects */}
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white heading">
                    Profile Overview
                  </h2>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                  >
                    <FaCog className="w-4 h-4" />
                    Settings
                  </button>
                </div>

                <div className="flex items-start gap-6">
                  <div className="relative">
                    <img
                      src={
                        user?.profileImage ||
                        authUser?.profileImage ||
                        "https://ui-avatars.com/api/?name=" +
                          (authUser?.username || "User") +
                          "&background=4F46E5&color=ffffff&size=120"
                      }
                      alt="Profile"
                      className="w-20 h-20 rounded-xl border-2 border-neutral-600"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-neutral-800"></div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">
                      {authUser?.firstName && authUser?.lastName
                        ? `${authUser.firstName} ${authUser.lastName}`
                        : authUser?.username || "Developer"}
                    </h3>
                    <p className="text-gray-400 mb-2">
                      {authUser?.email || "user@example.com"}
                    </p>
                    <p className="text-gray-300 text-sm">
                      {user?.bio ||
                        authUser?.bio ||
                        "Full-stack developer passionate about DevOps and automation. Building scalable applications with modern technologies."}
                    </p>

                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <FaClock className="w-4 h-4" />
                        Joined{" "}
                        {new Date(
                          authUser?.createdAt || Date.now()
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <FaServer className="w-4 h-4" />
                        {dashboardData.projects.length} Projects
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Projects Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white heading">
                    Recent Projects
                  </h2>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">
                    View All
                  </button>
                </div>

                <div className="space-y-4">
                  {dashboardData.projects.map((project, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-neutral-700/30 rounded-lg hover:bg-neutral-700/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          {project.framework === "React" ? (
                            <FaCode className="w-5 h-5 text-white" />
                          ) : project.framework === "Python" ? (
                            <FaServer className="w-5 h-5 text-white" />
                          ) : (
                            <FaCloud className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-white font-medium">
                            {project.name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {project.framework} • {project.lastDeploy}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === "deployed"
                              ? "bg-green-500/20 text-green-400"
                              : project.status === "building"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {project.status}
                        </span>
                        <FaEye className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Activity & Usage */}
            <div className="space-y-8">
              {/* Activity Feed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-6"
              >
                <h2 className="text-xl font-bold text-white heading mb-6">
                  Recent Activity
                </h2>

                <div className="space-y-4">
                  {dashboardData.activity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          activity.status === "success"
                            ? "bg-green-400"
                            : activity.status === "pending"
                            ? "bg-yellow-400"
                            : activity.status === "warning"
                            ? "bg-orange-400"
                            : "bg-blue-400"
                        }`}
                      ></div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{activity.action}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Usage Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-6"
              >
                <h2 className="text-xl font-bold text-white heading mb-6">
                  Usage This Month
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Build Minutes</span>
                    <span className="text-white font-medium">
                      {dashboardData.usage.buildMinutes}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Storage Used</span>
                    <span className="text-white font-medium">
                      {dashboardData.usage.storage}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Bandwidth</span>
                    <span className="text-white font-medium">
                      {dashboardData.usage.bandwidth}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">API Calls</span>
                    <span className="text-white font-medium">
                      {dashboardData.usage.apiCalls.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <FaShieldAlt className="w-4 h-4" />
                    <span className="font-medium">Pro Plan</span>
                  </div>{" "}
                  <p className="text-sm text-gray-300">
                    You&apos;re on the Pro plan with unlimited deployments and
                    priority support.
                  </p>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-xl p-6"
              >
                <h2 className="text-xl font-bold text-white heading mb-6">
                  Quick Actions
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center gap-2 p-3 bg-neutral-700/50 hover:bg-neutral-700 rounded-lg transition-colors text-left">
                    <FaRocket className="w-4 h-4 text-blue-400" />
                    <span className="text-white text-sm">New Deploy</span>
                  </button>
                  <button className="flex items-center gap-2 p-3 bg-neutral-700/50 hover:bg-neutral-700 rounded-lg transition-colors text-left">
                    <FaGithub className="w-4 h-4 text-blue-400" />
                    <span className="text-white text-sm">Import Repo</span>
                  </button>
                  <button className="flex items-center gap-2 p-3 bg-neutral-700/50 hover:bg-neutral-700 rounded-lg transition-colors text-left">
                    <FaDownload className="w-4 h-4 text-blue-400" />
                    <span className="text-white text-sm">Download CLI</span>
                  </button>
                  <button className="flex items-center gap-2 p-3 bg-neutral-700/50 hover:bg-neutral-700 rounded-lg transition-colors text-left">
                    <FaDocker className="w-4 h-4 text-blue-400" />
                    <span className="text-white text-sm">View Logs</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Settings Modal/Panel */}
          {activeTab === "settings" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setActiveTab("dashboard")}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-neutral-800 border border-neutral-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-neutral-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">
                      Profile Settings
                    </h2>
                    <button
                      onClick={() => setActiveTab("dashboard")}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Profile Form */}
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="flex items-center gap-6 mb-6">
                      <div className="relative">
                        <img
                          src={
                            user?.profileImage ||
                            authUser?.profileImage ||
                            "https://ui-avatars.com/api/?name=" +
                              (authUser?.username || "User") +
                              "&background=4F46E5&color=ffffff&size=120"
                          }
                          alt="Profile"
                          className="w-20 h-20 rounded-xl border-2 border-neutral-600"
                        />
                        <div className="absolute bottom-0 right-0 flex gap-1">
                          <button
                            type="button"
                            className="bg-blue-600 hover:bg-blue-700 rounded-full p-2 transition-colors"
                            onClick={() =>
                              fileInputRef.current &&
                              fileInputRef.current.click()
                            }
                          >
                            <FaPen className="text-white w-3 h-3" />
                          </button>
                          {(user?.profileImage || authUser?.profileImage) && (
                            <button
                              type="button"
                              className="bg-red-600 hover:bg-red-700 rounded-full p-2 transition-colors"
                              onClick={handleRemoveProfileImage}
                            >
                              <FaTrash className="text-white w-3 h-3" />
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
                      <div>
                        <h3 className="text-white font-semibold">
                          Profile Picture
                        </h3>
                        <p className="text-gray-400 text-sm">
                          JPG, GIF or PNG. Max size 5MB.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={profileForm.firstName}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-neutral-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={profileForm.lastName}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-neutral-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={profileForm.bio}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 border border-neutral-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                        rows={3}
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg">
                        {success}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={loading}
                    >
                      {loading ? <Spinner size={20} /> : "Update Profile"}
                    </button>
                  </form>

                  {/* Additional Settings Tabs */}
                  <div className="mt-8 pt-6 border-t border-neutral-700">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">
                        Security & Privacy
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        <button className="flex items-center justify-between p-3 bg-neutral-700/50 hover:bg-neutral-700 rounded-lg transition-colors">
                          <span className="text-white">Change Password</span>
                          <span className="text-gray-400">→</span>
                        </button>
                        <button className="flex items-center justify-between p-3 bg-neutral-700/50 hover:bg-neutral-700 rounded-lg transition-colors">
                          <span className="text-white">
                            Two-Factor Authentication
                          </span>
                          <span className="text-gray-400">→</span>
                        </button>
                        <button className="flex items-center justify-between p-3 bg-neutral-700/50 hover:bg-neutral-700 rounded-lg transition-colors">
                          <span className="text-white">Active Sessions</span>
                          <span className="text-gray-400">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

export default Profile;
