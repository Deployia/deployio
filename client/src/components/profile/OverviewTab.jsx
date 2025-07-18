import { useMemo, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FaRocket,
  FaShieldAlt,
  FaChartLine,
  FaServer,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
  FaKey,
  FaBell,
  FaCog,
} from "react-icons/fa";
import {
  fetchDashboardStats,
  fetchUserActivity,
} from "@redux/slices/userSlice";
import { fetchApiKeys, selectApiKeys } from "@redux/slices/apiKeySlice";
import { ProfileCardSkeleton, StatsGridSkeleton } from "./LoadingState";
import ProfileErrorBoundary from "./ProfileErrorBoundary";
import { calculateSecurityScore } from "@utils/securityScore";

const OverviewTab = () => {
  const dispatch = useDispatch();

  // Get data from Redux state
  const { user: authUser } = useSelector((state) => state.auth);
  const { dashboardStats, activities } = useSelector(
    (state) => state.userProfile
  );
  const apiKeys = useSelector(selectApiKeys);
  const { twoFactorEnabled } = useSelector((state) => state.twoFactor);

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Extract OAuth providers from user data (new structure)
  const linkedProviders = useMemo(() => {
    if (!authUser) return {};

    const providers = {};

    // Check git providers
    if (authUser.gitProviders) {
      providers.github = authUser.gitProviders.github?.isConnected || false;
      providers.gitlab = authUser.gitProviders.gitlab?.isConnected || false;
      providers.azureDevOps =
        authUser.gitProviders.azureDevOps?.isConnected || false;
      providers.bitbucket =
        authUser.gitProviders.bitbucket?.isConnected || false;
    }

    // Check Google OAuth
    if (authUser.googleId) {
      providers.google = true;
    }
    if (authUser.githubId) {
      providers.github = true;
    }

    return providers;
  }, [authUser]);

  // Load overview data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.allSettled([
          // Load recent activities instead of notifications
          dispatch(fetchUserActivity({ page: 1, limit: 5 })),
          dispatch(fetchDashboardStats()),
          dispatch(fetchApiKeys()),
        ]);
      } catch (error) {
        console.error("Error loading overview data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
  }, [dispatch]);
  // Calculate security score using utility
  const securityScore = useMemo(() => {
    return calculateSecurityScore({
      authUser,
      twoFactorEnabled,
      apiKeys,
      linkedProviders,
    });
  }, [authUser, apiKeys, linkedProviders, twoFactorEnabled]);

  // Calculate profile completion dynamically based on new structure
  const profileComplete = useMemo(() => {
    if (!authUser) return false;

    const requiredFields = ["firstName", "lastName", "email", "bio"];
    const completedFields = requiredFields.filter(
      (field) => authUser[field] && authUser[field].trim() !== ""
    );

    // Check if profile image exists
    const hasProfileImage = authUser.profileImage;

    // Calculate completion percentage
    const fieldCompletion = completedFields.length / requiredFields.length;
    const imageBonus = hasProfileImage ? 0.1 : 0;

    return fieldCompletion + imageBonus >= 0.8; // 80% completion threshold
  }, [authUser]);
  // Calculate activity metrics from recent activities
  const activityMetrics = useMemo(() => {
    if (!activities || activities.length === 0) return null;

    const now = new Date();
    const last7Days = activities.filter(
      (activity) =>
        new Date(activity.createdAt || activity.timestamp) >=
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    );

    const actionDistribution = last7Days.reduce((acc, activity) => {
      const actionType = activity.action?.split(".")[0] || "unknown";
      acc[actionType] = (acc[actionType] || 0) + 1;
      return acc;
    }, {});

    return {
      totalThisWeek: last7Days.length,
      securityEvents:
        (actionDistribution.auth || 0) + (actionDistribution.security || 0),
      avgDaily: Math.round(last7Days.length / 7),
      mostActiveType: Object.entries(actionDistribution).reduce(
        (max, [type, count]) => (count > max.count ? { type, count } : max),
        { type: "none", count: 0 }
      ).type,
    };
  }, [activities]);
  const getSecurityScoreColorClasses = (score) => {
    if (score >= 80) return "text-green-400 bg-green-500/20";
    if (score >= 60) return "text-yellow-400 bg-yellow-500/20";
    return "text-red-400 bg-red-500/20";
  };
  const quickActions = useMemo(() => {
    const baseActions = [
      {
        label: "Edit Profile Information",
        icon: FaUser,
        color: "bg-blue-500/20 text-blue-400",
        href: "/dashboard/profile?tab=profile&section=profile-information",
      },
      {
        label: "Manage Passwords",
        icon: FaKey,
        color: "bg-green-500/20 text-green-400",
        href: "/dashboard/profile?tab=security&section=security-password",
      },
      {
        label: "Two-Factor Authentication",
        icon: FaShieldAlt,
        color: "bg-red-500/20 text-red-400",
        href: "/dashboard/profile?tab=security&section=security-2fa",
      },
      {
        label: "API Keys Management",
        icon: FaKey,
        color: "bg-purple-500/20 text-purple-400",
        href: "/dashboard/profile?tab=security&section=security-api-keys",
      },
      {
        label: "Active Sessions",
        icon: FaCog,
        color: "bg-indigo-500/20 text-indigo-400",
        href: "/dashboard/profile?tab=sessions",
      },
      {
        label: "Activity Analytics",
        icon: FaChartLine,
        color: "bg-blue-500/20 text-blue-400",
        href: "/dashboard/profile?tab=analytics&section=analytics-activity-pattern",
      },
      {
        label: "Notification Settings",
        icon: FaBell,
        color: "bg-orange-500/20 text-orange-400",
        href: "/dashboard/profile?tab=notifications",
      },
    ];

    // Add Admin Panel for admin users
    if (authUser?.role === "admin") {
      baseActions.unshift({
        label: "Admin Panel",
        icon: FaShieldAlt,
        color: "bg-red-600/30 text-red-300 border border-red-500/30",
        href: "/admin",
      });
    }

    return baseActions;
  }, [authUser?.role]);
  const recommendations = useMemo(() => {
    const items = [];

    // Dynamic recommendations based on current state
    // Check if user needs to set a password (OAuth-only users)
    if (!authUser?.hasPassword) {
      items.push({
        title: "Set Account Password",
        description: "Set a password to enable email/password login option",
        action: "Set Password",
        priority: "high",
        icon: FaKey,
        href: "/dashboard/profile?tab=security&section=security-password",
      });
    }

    if (!authUser?.twoFactorEnabled) {
      items.push({
        title: "Enable Two-Factor Authentication",
        description: "Secure your account with 2FA for enhanced protection",
        action: "Enable 2FA",
        priority: "high",
        icon: FaShieldAlt,
        href: "/dashboard/profile?tab=security&section=security-2fa",
      });
    }

    if (!profileComplete) {
      items.push({
        title: "Complete Your Profile",
        description:
          "Add more information to your profile for better experience",
        action: "Update Profile",
        priority: "medium",
        icon: FaUser,
        href: "/dashboard/profile?tab=profile&section=profile-information",
      });
    }

    if (activityMetrics?.securityEvents > 5) {
      items.push({
        title: "Review Security Events",
        description:
          "You have multiple security events this week - check your analytics",
        action: "View Analytics",
        priority: "high",
        icon: FaExclamationTriangle,
        href: "/dashboard/profile?tab=analytics&section=analytics-activity-pattern",
      });
    }

    // New recommendations based on security features
    if (!apiKeys || apiKeys.length === 0) {
      items.push({
        title: "Generate API Keys",
        description: "Create API keys for secure application access",
        action: "Create API Key",
        priority: "medium",
        icon: FaKey,
        href: "/dashboard/profile?tab=security&section=security-api-keys",
      });
    }

    const oauthConnections = linkedProviders
      ? Object.values(linkedProviders).filter(Boolean).length
      : 0;

    if (oauthConnections === 0) {
      items.push({
        title: "Connect OAuth Providers",
        description: "Link your accounts for enhanced security and convenience",
        action: "Connect Accounts",
        priority: "medium",
        icon: FaShieldAlt,
        href: "/dashboard/profile?tab=security&section=security-oauth",
      });
    }

    if (
      authUser?.lastPasswordChange &&
      new Date() - new Date(authUser.lastPasswordChange) >
        90 * 24 * 60 * 60 * 1000
    ) {
      items.push({
        title: "Update Password",
        description:
          "Your password is older than 90 days - consider updating it",
        action: "Change Password",
        priority: "medium",
        icon: FaKey,
        href: "/dashboard/profile?tab=security&section=security-password",
      });
    }
    return items;
  }, [authUser, activityMetrics, apiKeys, linkedProviders, profileComplete]);
  // Show loading state during initial load
  if (isInitialLoading) {
    return (
      <div className="space-y-8">
        <StatsGridSkeleton columns={3} />
        <ProfileCardSkeleton />
        <StatsGridSkeleton columns={2} />
      </div>
    );
  }

  return (
    <ProfileErrorBoundary fallbackMessage="Failed to load overview">
      <div className="space-y-6">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8"
        >
          <div className="flex items-center gap-6">
            {" "}
            <div className="relative">
              <img
                src={
                  authUser?.profileImage ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    authUser?.username || "User"
                  )}&background=4F46E5&color=ffffff&size=120`
                }
                alt="Profile"
                className={`w-24 h-24 rounded-full border-4 ${
                  authUser?.role === "admin"
                    ? "border-red-500/50 ring-4 ring-red-500/20"
                    : "border-white/20"
                }`}
              />
              {/* Admin Shield Badge */}
              {authUser?.role === "admin" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-neutral-900"
                  title="Admin User"
                >
                  <FaShieldAlt className="w-4 h-4 text-white" />
                </motion.div>
              )}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-neutral-900"></div>
            </div>{" "}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-bold text-white">
                  Welcome back,{" "}
                  {authUser?.firstName || authUser?.username || "Developer"}!
                </h2>
                {authUser?.role === "admin" && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="px-3 py-1 text-sm font-medium text-red-300 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2"
                  >
                    <FaShieldAlt className="w-3 h-3" />
                    Admin
                  </motion.div>
                )}
              </div>
              <p className="text-blue-200 mb-2">
                {authUser?.email || "user@example.com"}
              </p>{" "}
              <p className="text-white/80">
                {authUser?.bio ||
                  "Full-stack developer passionate about DevOps and automation."}
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm text-white/60">
                <div className="flex items-center gap-1">
                  <FaCalendarAlt />
                  Member since{" "}
                  {new Date(
                    authUser?.createdAt || Date.now()
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>{" "}
                <div className="flex items-center gap-1">
                  <FaRocket />
                  {dashboardStats?.projects?.total || 0} Projects
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 p-6 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Security Score</p>
                <p className="text-2xl font-bold text-white">
                  {securityScore}%
                </p>
              </div>{" "}
              <div
                className={`p-3 rounded-full ${getSecurityScoreColorClasses(
                  securityScore
                )}`}
              >
                <FaShieldAlt className="text-xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 p-6 rounded-xl"
          >
            <div className="flex items-center justify-between">
              {" "}
              <div>
                <p className="text-sm text-gray-400">Deployments</p>
                <p className="text-2xl font-bold text-white">
                  {dashboardStats?.deployments?.total || 0}
                </p>
              </div>
              <FaRocket className="text-2xl text-blue-400" />
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-green-400">
                {dashboardStats?.deployments?.successful || 0} successful
              </span>
              <span className="text-red-400">
                {dashboardStats?.deployments?.failed || 0} failed
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 p-6 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Activity (7d)</p>
                <p className="text-2xl font-bold text-white">
                  {activityMetrics?.totalThisWeek || 0}
                </p>
              </div>
              <FaChartLine className="text-2xl text-purple-400" />
            </div>
            {activityMetrics && (
              <div className="mt-2 text-xs text-gray-400">
                Avg {activityMetrics.avgDaily}/day
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 p-6 rounded-xl"
          >
            <div className="flex items-center justify-between">
              {" "}
              <div>
                <p className="text-sm text-gray-400">Uptime</p>
                <p className="text-2xl font-bold text-white">
                  {dashboardStats?.uptime || "99.9%"}
                </p>
              </div>
              <FaServer className="text-2xl text-green-400" />
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Quick Actions
          </h3>{" "}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className={`flex flex-col items-center gap-3 p-4 rounded-lg border border-neutral-700/50 hover:border-neutral-600/50 transition-all group ${
                  action.label === "Admin Panel"
                    ? "bg-red-500/10 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/20"
                    : ""
                }`}
              >
                <div
                  className={`p-3 rounded-full ${action.color} group-hover:scale-110 transition-transform`}
                >
                  <action.icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-sm transition-colors ${
                    action.label === "Admin Panel"
                      ? "text-red-300 group-hover:text-red-200"
                      : "text-white group-hover:text-blue-400"
                  }`}
                >
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recommendations */}
          {recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Recommendations
              </h3>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      rec.priority === "high"
                        ? "border-red-500/30 bg-red-500/10"
                        : "border-yellow-500/30 bg-yellow-500/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          rec.priority === "high"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        <rec.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1">
                          {rec.title}
                        </h4>{" "}
                        <p className="text-sm text-gray-400 mb-3">
                          {rec.description}
                        </p>
                        <Link
                          to={rec.href}
                          className={`inline-flex items-center gap-2 px-3 py-1 text-sm rounded-lg transition-colors ${
                            rec.priority === "high"
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "bg-yellow-600 text-white hover:bg-yellow-700"
                          }`}
                        >
                          {rec.action}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Recent Activity
              </h3>{" "}
              <Link
                to="/dashboard/profile?tab=activity"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View All
              </Link>
            </div>{" "}
            <div className="space-y-3">
              {(activities || []).length > 0 ? (
                (activities || []).slice(0, 5).map((activity, index) => (
                  <div
                    key={activity._id || index}
                    className="flex items-center gap-3 p-3 hover:bg-neutral-800/50 rounded-lg transition-colors"
                  >
                    <div
                      className={`p-2 rounded-full ${
                        activity.action?.startsWith("security.") ||
                        activity.action?.startsWith("auth.")
                          ? "bg-red-500/20 text-red-400"
                          : activity.action?.startsWith("deployment.")
                          ? "bg-blue-500/20 text-blue-400"
                          : activity.action?.startsWith("project.")
                          ? "bg-green-500/20 text-green-400"
                          : activity.action?.startsWith("apikey.")
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-purple-500/20 text-purple-400"
                      }`}
                    >
                      {activity.action?.startsWith("security.") ||
                      activity.action?.startsWith("auth.") ? (
                        <FaShieldAlt className="w-4 h-4" />
                      ) : activity.action?.startsWith("deployment.") ? (
                        <FaRocket className="w-4 h-4" />
                      ) : activity.action?.startsWith("apikey.") ? (
                        <FaKey className="w-4 h-4" />
                      ) : (
                        <FaClock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">
                        {activity.description || activity.action}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(
                          activity.createdAt || activity.timestamp
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FaBell className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No recent activity</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Your recent activities will appear here
                  </p>
                </div>
              )}
            </div>{" "}
          </motion.div>
        </div>
      </div>
    </ProfileErrorBoundary>
  );
};

export default OverviewTab;
