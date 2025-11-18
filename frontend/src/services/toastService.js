/**
 * Toast Notification Service
 * Acts as an event bus for the custom Toast system.
 */

import { formatErrorMessage } from "../utils/errorHandler";

const listeners = new Set();

const notify = (payload) => {
  const toastPayload =
    typeof payload === "string" ? { message: payload } : payload || {};

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

const buildToast = (type) => (message, options = {}) => {
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
