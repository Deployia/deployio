import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaList, FaSlidersH } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  updateNotificationPreferences,
  fetchNotificationPreferences,
} from "@redux/slices/userSlice";
import ProfileErrorBoundary from "./ProfileErrorBoundary";
import { NotificationPreferencesSkeleton } from "./LoadingState";
import NotificationsList from "../notifications/NotificationsList";
import NotificationsPreferences from "./NotificationsPreferences";

const NotificationsTab = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("notifications"); // 'notifications' or 'preferences'

  // Get data from Redux state
  const { notificationPreferences, loading } = useSelector(
    (state) => state.userProfile
  );
  const isLoading = loading?.updateNotificationPreferences || false;
  const isInitialLoading = loading?.notificationPreferences || false;

  // Load notification preferences on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await dispatch(fetchNotificationPreferences());
      } catch (error) {
        console.error("Error loading notification preferences:", error);
      }
    };

    if (!notificationPreferences) {
      loadData();
    }
  }, [dispatch, notificationPreferences]);

  const handleTogglePreference = async (key) => {
    if (!notificationPreferences || isLoading) return;

    const updatedPreferences = {
      ...notificationPreferences,
      [key]: !notificationPreferences[key],
    };

    try {
      await dispatch(
        updateNotificationPreferences(updatedPreferences)
      ).unwrap();
      toast.success("Notification settings updated");
    } catch {
      toast.error("Failed to update notification settings");
    }
  };

  const handleQuietHoursChange = async (newQuietHours) => {
    if (!notificationPreferences || isLoading) return;

    const updatedPreferences = {
      ...notificationPreferences,
      quietHours: newQuietHours,
    };

    try {
      await dispatch(
        updateNotificationPreferences(updatedPreferences)
      ).unwrap();
      toast.success("Quiet hours updated");
    } catch {
      toast.error("Failed to update quiet hours");
    }
  };

  const handleDigestSettingsChange = async (newDigestSettings) => {
    if (!notificationPreferences || isLoading) return;

    const updatedPreferences = {
      ...notificationPreferences,
      digestSettings: newDigestSettings,
    };

    try {
      await dispatch(
        updateNotificationPreferences(updatedPreferences)
      ).unwrap();
      toast.success("Digest settings updated");
    } catch {
      toast.error("Failed to update digest settings");
    }
  };

  // Helper functions to get current settings from Redux state
  const getCurrentQuietHours = () => {
    if (!notificationPreferences?.quietHours) {
      return {
        enabled: false,
        start: "22:00",
        end: "08:00",
        timezone: "UTC",
      };
    }

    return {
      enabled: notificationPreferences.quietHours.enabled || false,
      start:
        notificationPreferences.quietHours.start ||
        notificationPreferences.quietHours.startTime ||
        "22:00",
      end:
        notificationPreferences.quietHours.end ||
        notificationPreferences.quietHours.endTime ||
        "08:00",
      timezone: notificationPreferences.quietHours.timezone || "UTC",
    };
  };

  const getCurrentDigestSettings = () => {
    if (!notificationPreferences?.digestSettings) {
      return {
        enabled: false,
        frequency: "daily",
        time: "09:00",
        timezone: "UTC",
      };
    }

    return notificationPreferences.digestSettings;
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
  if (isInitialLoading && activeTab === "preferences") {
    return <NotificationPreferencesSkeleton categories={4} />;
  }

  // Tab configuration
  const tabs = [
    {
      id: "notifications",
      label: "Notifications",
      icon: FaList,
      description: "View and manage your notifications",
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: FaSlidersH,
      description: "Configure notification settings",
    },
  ];

  return (
    <ProfileErrorBoundary fallbackMessage="Failed to load notification settings">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 p-1 bg-neutral-800/50 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm ${
                  isActive
                    ? "bg-blue-500 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-neutral-700/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "notifications" ? (
            <NotificationsList isMobile={true} />
          ) : (
            <NotificationsPreferences
              notificationPreferences={notificationPreferences}
              isLoading={isLoading}
              handleTogglePreference={handleTogglePreference}
              handleQuietHoursChange={handleQuietHoursChange}
              handleDigestSettingsChange={handleDigestSettingsChange}
              testNotification={testNotification}
              getCurrentQuietHours={getCurrentQuietHours}
              getCurrentDigestSettings={getCurrentDigestSettings}
            />
          )}
        </div>
      </div>
    </ProfileErrorBoundary>
  );
};

export default NotificationsTab;
