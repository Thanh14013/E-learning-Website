import styles from "./ToastContainer.module.css";

const typeConfig = {
  success: { icon: "✅", label: "Success" },
  error: { icon: "❌", label: "Error" },
  warning: { icon: "⚠️", label: "Warning" },
  info: { icon: "ℹ️", label: "Info" },
};

const ToastContainer = ({ toasts = [], onDismiss }) => {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => {
        const config = typeConfig[toast.type] || typeConfig.info;

        return (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.type] || styles.info}`}
          >
            <div className={styles.toastBody}>
              <span className={styles.toastIcon}>{config.icon}</span>
              <div className={styles.toastContent}>
                <p className={styles.toastTitle}>
                  {toast.title || config.label}
                </p>
                <p className={styles.toastMessage}>{toast.message}</p>
              </div>
            </div>
            <button
              className={styles.closeButton}
              onClick={() => onDismiss(toast.id)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;

