import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import ToastContainer from "../components/common/ToastContainer.jsx";
import toastService from "../services/toastService.js";

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

const defaultDuration = 4000;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = (id, reason = "manual") => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    console.log(`[ToastProvider] dismiss toast ${id} (${reason})`);
  };

  useEffect(() => {
    const unsubscribe = toastService.subscribe((payload) => {
      const id =
        payload.id ||
        `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const duration =
        typeof payload.duration === "number" && payload.duration >= 0
          ? payload.duration
          : defaultDuration;

      const toast = {
        id,
        type: payload.type || "info",
        title: payload.title,
        message: payload.message || "Notification",
        duration,
      };

      console.log("[ToastProvider] enqueue toast", toast);

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => {
          removeToast(id, "auto");
        }, duration);
      }
    });

    return () => {
      unsubscribe();
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      toasts,
      dismiss: removeToast,
    }),
    [toasts]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

