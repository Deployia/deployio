import {
  FaBell,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaRocket,
  FaShieldAlt,
  FaTimes,
} from "react-icons/fa";

const COLOR_CLASSES = {
  green: "border-emerald-500/40 bg-emerald-950/40",
  red: "border-red-500/40 bg-red-950/40",
  blue: "border-blue-500/40 bg-blue-950/40",
  yellow: "border-amber-500/40 bg-amber-950/40",
  orange: "border-orange-500/40 bg-orange-950/40",
  gray: "border-neutral-600/40 bg-neutral-900/90",
};

const ICON_BY_NAME = {
  bell: FaBell,
  rocket: FaRocket,
  "check-circle": FaCheckCircle,
  "x-circle": FaExclamationTriangle,
  "shield-alert": FaShieldAlt,
  key: FaShieldAlt,
  heart: FaInfoCircle,
};

function NotificationToast({ notification, onDismiss }) {
  const color = notification.ui?.color || "blue";
  const iconName = notification.ui?.icon || "bell";
  const Icon = ICON_BY_NAME[iconName] || FaBell;
  const borderClass = COLOR_CLASSES[color] || COLOR_CLASSES.blue;

  const handleAction = () => {
    if (notification.action?.url) {
      window.location.href = notification.action.url;
    }
    onDismiss?.();
  };

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex w-[min(100vw-2rem,22rem)] gap-3 rounded-lg border p-4 shadow-xl backdrop-blur-sm ${borderClass}`}
    >
      <div className="mt-0.5 shrink-0 text-neutral-200">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {notification.title}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-neutral-300">
          {notification.message}
        </p>
        {notification.action?.url && (
          <button
            type="button"
            onClick={handleAction}
            className="mt-2 text-xs font-medium text-blue-400 hover:text-blue-300"
          >
            {notification.action.label || "View"}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
        aria-label="Dismiss notification"
      >
        <FaTimes className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default NotificationToast;
