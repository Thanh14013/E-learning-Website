/**
 * Toast Notification Service
 * Wrapper around react-hot-toast for consistent notifications
 */

import toast from "react-hot-toast";
import { formatErrorMessage } from "../utils/errorHandler";

// Toast configuration
const toastConfig = {
  duration: 4000,
  position: "top-right",
  style: {
    borderRadius: "10px",
    background: "#333",
    color: "#fff",
    padding: "16px",
    maxWidth: "500px",
  },
};

/**
 * Show success toast
 * @param {string} message - Success message
 * @param {object} options - Additional options
 */
export const showSuccess = (message, options = {}) => {
  toast.success(message, {
    ...toastConfig,
    ...options,
    style: {
      ...toastConfig.style,
      background: "#10b981",
      ...options.style,
    },
    icon: "✓",
  });
};

/**
 * Show error toast
 * @param {string|object} error - Error message or error object
 * @param {object} options - Additional options
 */
export const showError = (error, options = {}) => {
  const message = formatErrorMessage(error);

  toast.error(message, {
    ...toastConfig,
    duration: 5000, // Errors stay longer
    ...options,
    style: {
      ...toastConfig.style,
      background: "#ef4444",
      ...options.style,
    },
    icon: "✕",
  });
};

/**
 * Show warning toast
 * @param {string} message - Warning message
 * @param {object} options - Additional options
 */
export const showWarning = (message, options = {}) => {
  toast(message, {
    ...toastConfig,
    ...options,
    style: {
      ...toastConfig.style,
      background: "#f59e0b",
      ...options.style,
    },
    icon: "⚠",
  });
};

/**
 * Show info toast
 * @param {string} message - Info message
 * @param {object} options - Additional options
 */
export const showInfo = (message, options = {}) => {
  toast(message, {
    ...toastConfig,
    ...options,
    style: {
      ...toastConfig.style,
      background: "#3b82f6",
      ...options.style,
    },
    icon: "ℹ",
  });
};

/**
 * Show loading toast
 * @param {string} message - Loading message
 * @param {object} options - Additional options
 * @returns {string} Toast ID for dismissal
 */
export const showLoading = (message, options = {}) => {
  return toast.loading(message, {
    ...toastConfig,
    ...options,
    style: {
      ...toastConfig.style,
      background: "#6366f1",
      ...options.style,
    },
  });
};

/**
 * Show promise toast (for async operations)
 * @param {Promise} promise - Promise to track
 * @param {object} messages - Messages for different states
 * @param {object} options - Additional options
 */
export const showPromise = (promise, messages, options = {}) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || "Đang xử lý...",
      success: messages.success || "Thành công!",
      error: (err) =>
        formatErrorMessage(err) || messages.error || "Đã xảy ra lỗi!",
    },
    {
      ...toastConfig,
      ...options,
    }
  );
};

/**
 * Dismiss a specific toast
 * @param {string} toastId - Toast ID
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAll = () => {
  toast.dismiss();
};

/**
 * Custom toast with full control
 * @param {string} message - Message to display
 * @param {object} options - Toast options
 */
export const showCustom = (message, options = {}) => {
  toast(message, {
    ...toastConfig,
    ...options,
  });
};

// Export default object with all methods
const toastService = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  promise: showPromise,
  dismiss: dismissToast,
  dismissAll,
  custom: showCustom,
};

export default toastService;
