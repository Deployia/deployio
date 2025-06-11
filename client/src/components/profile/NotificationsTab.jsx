import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaBell,
  FaEnvelope,
  FaMobile,
  FaDesktop,
  FaCog,
  FaVolumeOff,
  FaCalendarAlt,
  FaShieldAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  updateNotificationPreferences,
  fetchNotificationPreferences,
} from "@redux/slices/userSlice";
import ProfileErrorBoundary from "./ProfileErrorBoundary";
import LoadingState from "./LoadingState";
import activityLogger from "@/utils/activityLogger";

const NotificationsTab = () => {
  const dispatch = useDispatch();

  // Get data from Redux state
  const { notificationPreferences, loading } = useSelector(
    (state) => state.userProfile
  );
  const isLoading = loading?.updateNotificationPreferences || false;

  const [localPreferences, setLocalPreferences] = useState({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [quietHours, setQuietHours] = useState({
    enabled: false,
    startTime: "22:00",
    endTime: "08:00",
  });
  const [digestSettings, setDigestSettings] = useState({
    enabled: false,
    frequency: "weekly",
    day: "monday",
    time: "09:00",
  });

  // Load notification preferences on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await dispatch(fetchNotificationPreferences());
      } catch (error) {
        console.error("Error loading notification preferences:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
  }, [dispatch]);

  useEffect(() => {
    if (notificationPreferences) {
      setLocalPreferences(notificationPreferences);
      // Load quiet hours and digest settings if they exist
      if (notificationPreferences.quietHours) {
        setQuietHours(notificationPreferences.quietHours);
      }
      if (notificationPreferences.digestSettings) {
        setDigestSettings(notificationPreferences.digestSettings);
      }
    }
  }, [notificationPreferences]);
  const handleTogglePreference = async (key) => {
    const updatedPreferences = {
      ...localPreferences,
      [key]: !localPreferences[key],
    };

    setLocalPreferences(updatedPreferences);
    try {
      await dispatch(
        updateNotificationPreferences(updatedPreferences)
      ).unwrap();
      toast.success("Notification settings updated"); // Log activity and wait for completion
      await activityLogger.notificationSettingsChanged({
        [key]: !localPreferences[key],
      });
    } catch {
      // Revert local state on error
      setLocalPreferences(localPreferences);
      toast.error("Failed to update notification settings");
    }
  };

  const handleQuietHoursChange = async (newQuietHours) => {
    setQuietHours(newQuietHours);

    const updatedPreferences = {
      ...localPreferences,
      quietHours: newQuietHours,
    };
    try {
      await dispatch(
        updateNotificationPreferences(updatedPreferences)
      ).unwrap();
      toast.success("Quiet hours updated"); // Log activity and wait for completion
      await activityLogger.notificationSettingsChanged({
        quietHours: newQuietHours,
      });
    } catch {
      setQuietHours(quietHours);
      toast.error("Failed to update quiet hours");
    }
  };

  const handleDigestSettingsChange = async (newDigestSettings) => {
    setDigestSettings(newDigestSettings);

    const updatedPreferences = {
      ...localPreferences,
      digestSettings: newDigestSettings,
    };
    try {
      await dispatch(
        updateNotificationPreferences(updatedPreferences)
      ).unwrap();
      toast.success("Digest settings updated"); // Log activity and wait for completion
      await activityLogger.notificationSettingsChanged({
        digestSettings: newDigestSettings,
      });
    } catch {
      setDigestSettings(digestSettings);
      toast.error("Failed to update digest settings");
    }
  };

  const testNotification = () => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Deployio Test", {
          body: "This is a test notification from Deployio",
          icon: "/favicon.png",
        });
        toast.success("Test notification sent");
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("Deployio Test", {
              body: "This is a test notification from Deployio",
              icon: "/favicon.png",
            });
            toast.success("Test notification sent");
          }
        });
      } else {
        toast.error("Notifications are blocked in your browser");
      }
    } else {
      toast.error("This browser doesn't support notifications");
    }
  };

  // Show loading state during initial load
  if (isInitialLoading) {
    return <LoadingState message="Loading notification preferences..." />;
  }

  const notificationCategories = [
    {
      title: "Deployment Notifications",
      description: "Get notified about deployment status changes",
      categories: [
        {
          key: "deploymentSuccess",
          label: "Successful Deployments",
          icon: FaBell,
          description: "When deployments complete successfully",
        },
        {
          key: "deploymentFailure",
          label: "Failed Deployments",
          icon: FaShieldAlt,
          description: "When deployments fail or encounter errors",
        },
        {
          key: "deploymentStarted",
          label: "Deployment Started",
          icon: FaCog,
          description: "When new deployments begin",
        },
      ],
    },
    {
      title: "Security & Account",
      description: "Important security and account-related notifications",
      categories: [
        {
          key: "securityAlerts",
          label: "Security Alerts",
          icon: FaShieldAlt,
          description: "Login attempts, password changes, etc.",
        },
        {
          key: "accountChanges",
          label: "Account Changes",
          icon: FaCog,
          description: "Profile updates, settings changes",
        },
        {
          key: "newDeviceLogin",
          label: "New Device Logins",
          icon: FaDesktop,
          description: "When you log in from a new device",
        },
      ],
    },
    {
      title: "Communication",
      description: "Marketing and product update notifications",
      categories: [
        {
          key: "productUpdates",
          label: "Product Updates",
          icon: FaBell,
          description: "New features and improvements",
        },
        {
          key: "marketing",
          label: "Marketing Communications",
          icon: FaEnvelope,
          description: "Promotional emails and newsletters",
        },
        {
          key: "tips",
          label: "Tips & Best Practices",
          icon: FaCog,
          description: "Helpful tips and tutorials",
        },
      ],
    },
  ];

  const deliveryMethods = [
    {
      key: "email",
      label: "Email Notifications",
      icon: FaEnvelope,
      description: "Receive notifications via email",
    },
    {
      key: "inApp",
      label: "In-App Notifications",
      icon: FaBell,
      description: "Show notifications in the application",
    },
    {
      key: "push",
      label: "Push Notifications",
      icon: FaMobile,
      description: "Browser push notifications",
    },
  ];
  return (
    <ProfileErrorBoundary fallbackMessage="Failed to load notification settings">
      <div className="space-y-8">
        {/* Delivery Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Delivery Methods
              </h3>
              <p className="text-gray-400">
                Choose how you want to receive notifications
              </p>
            </div>
            <button
              onClick={testNotification}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Notification
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deliveryMethods.map(({ key, label, icon: Icon, description }) => (
              <div
                key={key}
                className="p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Icon className="text-blue-400 text-lg" />
                    <span className="font-medium text-white">{label}</span>
                  </div>{" "}
                  <button
                    onClick={() => handleTogglePreference(key)}
                    disabled={isLoading}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      localPreferences[key] ? "bg-blue-500" : "bg-neutral-600"
                    }`}
                  >
                    <div
                      className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        localPreferences[key]
                          ? "translate-x-6"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-sm text-gray-400">{description}</p>
              </div>
            ))}
          </div>
        </motion.div>
        {/* Notification Categories */}
        {notificationCategories.map((category, categoryIndex) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
          >
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                {category.title}
              </h3>
              <p className="text-gray-400">{category.description}</p>
            </div>

            <div className="space-y-4">
              {category.categories.map(
                ({ key, label, icon: Icon, description }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg hover:border-neutral-600/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{label}</h4>
                        <p className="text-sm text-gray-400">{description}</p>
                      </div>
                    </div>{" "}
                    <button
                      onClick={() => handleTogglePreference(key)}
                      disabled={isLoading}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        localPreferences[key]
                          ? "bg-green-500"
                          : "bg-neutral-600"
                      }`}
                    >
                      <div
                        className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                          localPreferences[key]
                            ? "translate-x-6"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                )
              )}
            </div>
          </motion.div>
        ))}
        {/* Quiet Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FaVolumeOff className="text-purple-400 text-xl" />
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Quiet Hours
                </h3>{" "}
                <p className="text-gray-400">
                  Set times when you don&apos;t want to receive notifications
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                handleQuietHoursChange({
                  ...quietHours,
                  enabled: !quietHours.enabled,
                })
              }
              className={`relative w-12 h-6 rounded-full transition-colors ${
                quietHours.enabled ? "bg-purple-500" : "bg-neutral-600"
              }`}
            >
              <div
                className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                  quietHours.enabled ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {quietHours.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={quietHours.startTime}
                  onChange={(e) =>
                    handleQuietHoursChange({
                      ...quietHours,
                      startTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={quietHours.endTime}
                  onChange={(e) =>
                    handleQuietHoursChange({
                      ...quietHours,
                      endTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}
        </motion.div>
        {/* Digest Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-orange-400 text-xl" />
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Notification Digest
                </h3>
                <p className="text-gray-400">
                  Receive a summary of your notifications
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                handleDigestSettingsChange({
                  ...digestSettings,
                  enabled: !digestSettings.enabled,
                })
              }
              className={`relative w-12 h-6 rounded-full transition-colors ${
                digestSettings.enabled ? "bg-orange-500" : "bg-neutral-600"
              }`}
            >
              <div
                className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                  digestSettings.enabled ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {digestSettings.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Frequency
                </label>
                <select
                  value={digestSettings.frequency}
                  onChange={(e) =>
                    handleDigestSettingsChange({
                      ...digestSettings,
                      frequency: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {digestSettings.frequency === "weekly" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Day of Week
                  </label>
                  <select
                    value={digestSettings.day}
                    onChange={(e) =>
                      handleDigestSettingsChange({
                        ...digestSettings,
                        day: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={digestSettings.time}
                  onChange={(e) =>
                    handleDigestSettingsChange({
                      ...digestSettings,
                      time: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}
        </motion.div>{" "}
      </div>
    </ProfileErrorBoundary>
  );
};

export default NotificationsTab;
