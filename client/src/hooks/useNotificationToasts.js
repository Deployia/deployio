import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addNotification,
  fetchUnreadCount,
  updateNotificationCount,
  markAllAsReadLocal,
} from "@redux";
import { fetchNotificationPreferences } from "@redux/slices/userSlice";
import useNotifications from "@hooks/useNotifications";
import { showNotificationToast } from "@utils/showNotificationToast";

/**
 * Subscribes to realtime notifications and shows top-right toasts.
 * Also updates Redux so the bell badge stays in sync when Layout mounts without NotificationBell.
 */
function useNotificationToasts() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const preferences = useSelector(
    (state) => state.userProfile?.notificationPreferences
  );
  const prefsRef = useRef(preferences);
  prefsRef.current = preferences;

  const { isConnected, addListener, removeListener } = useNotifications();

  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(fetchNotificationPreferences());
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !isConnected) return;

    const handleNewNotification = (notification) => {
      dispatch(addNotification(notification));
      dispatch(fetchUnreadCount());
      showNotificationToast(notification, prefsRef.current);
    };

    const handleCountUpdate = (data) => {
      const count = typeof data === "number" ? data : data?.count;
      if (typeof count === "number") {
        dispatch(updateNotificationCount(count));
      }
    };

    const handleAllRead = () => {
      dispatch(markAllAsReadLocal());
    };

    addListener("new_notification", handleNewNotification);
    addListener("unread_count_changed", handleCountUpdate);
    addListener("all_notifications_read", handleAllRead);

    return () => {
      removeListener("new_notification", handleNewNotification);
      removeListener("unread_count_changed", handleCountUpdate);
      removeListener("all_notifications_read", handleAllRead);
    };
  }, [
    dispatch,
    isAuthenticated,
    isConnected,
    addListener,
    removeListener,
  ]);
}

export default useNotificationToasts;
