import { useDispatch, useSelector } from "react-redux";
import {
  updateProfile,
  fetchUserActivity,
  fetchDashboardStats,
  fetchApiKeys,
  fetchNotificationPreferences,
  clearUserSuccess,
  clearApiKeysError,
} from "@redux/slices/userSlice";
import { fetchProviders, fetchSessions } from "@redux/slices/authSlice";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FaUser,
  FaDesktop,
  FaBell,
  FaHistory,
  FaEdit,
  FaShieldAlt,
  FaChartLine,
} from "react-icons/fa";
import toast from "react-hot-toast";
import SEO from "@components/SEO.jsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  ProfileTab,
  SessionsTab,
  ActivityTab,
  ProfileErrorBoundary,
  OverviewTab,
  SecurityTab,
  NotificationsTab,
} from "@components/profile";
import ActivityAnalytics from "@components/profile/ActivityAnalytics";

function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [securityScore, setSecurityScore] = useState(0);

  const dispatch = useDispatch(); // Get user data from auth state (this is where the actual user data is)
  const authUser = useSelector((state) => state.auth.user);
  const { providers: linkedProviders, sessions } = useSelector(
    (state) => state.auth
  ); // Get profile-specific data from user state
  const {
    activities,
    loading,
    dashboardStats,
    dashboardStatsLoading,
    apiKeys,
    apiKeysLoading,
    apiKeysError,
    notificationPreferences,
    notificationsLoading,
    success,
  } = useSelector((state) => state.user);
  const tabs = [
    { id: "overview", label: "Overview", icon: FaUser },
    { id: "profile", label: "Profile", icon: FaEdit },
    { id: "security", label: "Security", icon: FaShieldAlt },
    { id: "sessions", label: "Sessions", icon: FaDesktop },
    { id: "notifications", label: "Notifications", icon: FaBell },
    { id: "activity", label: "Activity", icon: FaHistory },
    { id: "analytics", label: "Analytics", icon: FaChartLine },
  ];

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const newSearchParams = new URLSearchParams(searchParams);
    if (tabId === "overview") {
      newSearchParams.delete("tab");
    } else {
      newSearchParams.set("tab", tabId);
    }
    setSearchParams(newSearchParams);
  }; // Fetch user activity and dashboard stats on component mount and refresh periodically
  useEffect(() => {
    const fetchData = async () => {
      await dispatch(fetchUserActivity({ page: 1, limit: 10 }));
      await dispatch(fetchDashboardStats());
      await dispatch(fetchProviders());
      await dispatch(fetchApiKeys());
      await dispatch(fetchNotificationPreferences());
      await dispatch(fetchSessions());
    };

    fetchData();

    // Refresh data every 30 seconds when tab is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Handle success messages centrally
  useEffect(() => {
    if (success) {
      toast.success(success);
      dispatch(clearUserSuccess());
    }
  }, [success, dispatch]);
  // Handle API key errors centrally
  useEffect(() => {
    if (apiKeysError) {
      toast.error(apiKeysError);
      dispatch(clearApiKeysError());
    }
  }, [apiKeysError, dispatch]);
  // Centralized refresh function that child components can use
  const refreshData = async () => {
    await dispatch(fetchUserActivity({ page: 1, limit: 10 }));
    await dispatch(fetchDashboardStats());
    await dispatch(fetchProviders());
    await dispatch(fetchApiKeys());
    await dispatch(fetchNotificationPreferences());
    await dispatch(fetchSessions());
  };

  // Update activeTab when URL changes
  useEffect(() => {
    const tab = searchParams.get("tab") || "overview";
    setActiveTab(tab);
  }, [searchParams]);
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
  // Calculate security score centrally
  useEffect(() => {
    let score = 0;

    // Calculate profile completion (same as OverviewTab)
    const profileComplete = (() => {
      if (!authUser) return false;
      const requiredFields = ["firstName", "lastName", "email", "bio"];
      const completedFields = requiredFields.filter(
        (field) => authUser[field] && authUser[field].trim() !== ""
      );
      return completedFields.length >= Math.ceil(requiredFields.length * 0.75);
    })();

    // Core security features
    if (authUser?.twoFactorEnabled) score += 40; // Two-factor authentication (40 points)
    if (authUser?.email && authUser.emailVerified) score += 20; // Email verification (20 points)

    // Password security
    if (
      authUser?.lastPasswordChange &&
      new Date() - new Date(authUser.lastPasswordChange) <
        90 * 24 * 60 * 60 * 1000
    ) {
      score += 20; // Recent password change (20 points)
    }

    // Additional security measures
    if (apiKeys && apiKeys.length > 0) score += 10; // API key management (10 points)
    if (profileComplete) score += 10; // Complete profile (10 points)

    // OAuth provider security bonus
    const oauthConnections = linkedProviders
      ? Object.values(linkedProviders).filter(Boolean).length
      : 0;
    if (oauthConnections > 0) score += 10; // OAuth providers connected (10 points)
    if (oauthConnections >= 2) score += 5; // Multiple OAuth providers (5 bonus points)

    setSecurityScore(Math.min(score, 100)); // Cap at 100%
  }, [authUser, apiKeys, linkedProviders]);

  // Handle profile image removal
  const handleRemoveProfileImage = () => {
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
    const content = (() => {
      switch (activeTab) {
        case "overview":
          return (
            <OverviewTab
              authUser={authUser}
              dashboardStats={dashboardStats || {}}
              activities={activities || []}
              apiKeys={apiKeys || []}
              linkedProviders={linkedProviders || {}}
              securityScore={securityScore}
              loading={dashboardStatsLoading}
            />
          );
        case "profile":
          return (
            <ProfileTab
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              authUser={authUser}
              handleRemoveProfileImage={handleRemoveProfileImage}
            />
          );
        case "security":
          return (
            <SecurityTab
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              twoFAEnabled={twoFAEnabled}
              setTwoFAEnabled={setTwoFAEnabled}
              apiKeys={apiKeys || []}
              linkedProviders={linkedProviders || {}}
              loading={apiKeysLoading}
              securityScore={securityScore}
              onRefresh={refreshData}
            />
          );
        case "sessions":
          return (
            <SessionsTab
              sessions={sessions || []}
              loading={loading}
              onRefresh={refreshData}
            />
          );
        case "notifications":
          return (
            <NotificationsTab
              notificationPreferences={notificationPreferences || {}}
              loading={notificationsLoading}
              onRefresh={refreshData}
            />
          );
        case "activity":
          return (
            <ActivityTab activities={activities || []} loading={loading} />
          );
        case "analytics":
          return <ActivityAnalytics />;
        default:
          return null;
      }
    })();

    return (
      <ProfileErrorBoundary
        fallbackMessage={`Failed to load the ${activeTab} tab. Please try refreshing the page.`}
      >
        {content}
      </ProfileErrorBoundary>
    );
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
          {" "}
          {/* Sidebar Navigation */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6 sticky top-8">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "text-gray-300 hover:bg-neutral-700/50"
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
