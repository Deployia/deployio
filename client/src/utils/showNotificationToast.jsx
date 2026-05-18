import toast from "react-hot-toast";
import NotificationToast from "@components/notifications/NotificationToast";

export function shouldShowNotificationToast(notification, preferences) {
  if (preferences?.inApp === false) return false;
  if (notification.ui?.showToast === false) return false;
  if (notification.isWelcome || notification.isTest) return false;
  if (
    notification.source === "connection_confirmation" ||
    notification.context?.source === "connection_confirmation"
  ) {
    return false;
  }
  return true;
}

export function showNotificationToast(notification, preferences) {
  if (!shouldShowNotificationToast(notification, preferences)) {
    return;
  }

  const id =
    notification.id ||
    notification._id ||
    `notification-${Date.now()}`;

  const duration =
    notification.ui?.persist || notification.priority === "urgent"
      ? 10000
      : 5000;

  toast.custom(
    (t) => (
      <NotificationToast
        notification={notification}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ),
    {
      id: String(id),
      duration,
      position: "top-right",
    }
  );
}
