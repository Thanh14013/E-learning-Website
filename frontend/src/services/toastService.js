/**
 * Toast Notification Service
 * Acts as an event bus for the custom Toast system.
 */

import { formatErrorMessage } from "../utils/errorHandler";

const listeners = new Set();

// Simple de-duplication cache to prevent duplicate toasts from flooding the UI
const recentToasts = new Map(); // key -> timestamp
const DEDUPE_WINDOW_MS = 3000; // 3 seconds

const shouldEmit = (type, message, options = {}) => {
  if (options.force) return true;
  const key = `${type}::${message}`;
  const now = Date.now();
  const last = recentToasts.get(key) || 0;
  if (now - last < DEDUPE_WINDOW_MS) {
    // Too soon — suppress
    return false;
  }
  recentToasts.set(key, now);
  // Clean old entries periodically (lazy)
  if (recentToasts.size > 1000) {
    for (const [k, t] of recentToasts.entries()) {
      if (now - t > DEDUPE_WINDOW_MS * 10) recentToasts.delete(k);
    }
  }
  return true;
};

const notify = (payload) => {
  const toastPayload =
    typeof payload === "string" ? { message: payload } : payload || {};

  // Default type
  const type = toastPayload.type || "info";
  const message = toastPayload.message || toastPayload.msg || "Notification";

  if (!shouldEmit(type, message, toastPayload)) {
    if (import.meta.env.DEV) {
      console.debug("[toastService] suppressed duplicate toast", {
        type,
        message,
      });
    }
    return;
  }

  console.log("[toastService] emit toast", toastPayload);
  listeners.forEach((listener) => {
    try {
      listener(toastPayload);
    } catch (error) {
      console.error("[toastService] listener error", error);
    }
  });
};

const subscribe = (listener) => {
  if (typeof listener !== "function") {
    throw new Error("toastService.subscribe expects a function listener");
  }

  listeners.add(listener);
  console.log("[toastService] listener subscribed. total:", listeners.size);

  return () => {
    listeners.delete(listener);
    console.log("[toastService] listener unsubscribed. total:", listeners.size);
  };
};

const buildToast =
  (type) =>
  (message, options = {}) => {
    const payload =
      typeof message === "object"
        ? { ...message }
        : { message: message ?? "Notification" };

    notify({
      type,
      ...payload,
      ...options,
    });
  };

const toastService = {
  success: buildToast("success"),
  error: (error, options = {}) => {
    const message = formatErrorMessage(error);
    notify({
      type: "error",
      message,
      ...options,
    });
  },
  warning: buildToast("warning"),
  info: buildToast("info"),
  custom: (payload) => notify(payload),
  subscribe,
};

export default toastService;
