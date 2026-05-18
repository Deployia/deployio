import toast from "react-hot-toast";

/** Shared toast chrome for app actions (save, logout, errors). */
export const APP_TOAST_STYLE = {
  background: "rgba(23, 23, 23, 0.96)",
  color: "#f5f5f5",
  border: "1px solid rgba(82, 82, 82, 0.65)",
  borderRadius: "0.75rem",
  padding: "12px 16px",
  fontSize: "0.875rem",
  lineHeight: "1.4",
  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.45)",
  maxWidth: "min(360px, calc(100vw - 2rem))",
};

const defaultOptions = {
  style: APP_TOAST_STYLE,
};

export const appToast = {
  success(message, options = {}) {
    return toast.success(message, {
      ...defaultOptions,
      duration: 3500,
      ...options,
    });
  },
  error(message, options = {}) {
    return toast.error(message, {
      ...defaultOptions,
      duration: 5000,
      ...options,
    });
  },
  loading(message, options = {}) {
    return toast.loading(message, {
      ...defaultOptions,
      ...options,
    });
  },
  dismiss(id) {
    toast.dismiss(id);
  },
};

export default appToast;
