import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./StudentHeader.module.css";
import avatarDefault from "../../assets/default-avatar.png";

export default function StudentHeader() {
  const { user, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    markRead,
    deleteNotification,
    refresh,
  } = useNotifications() || {};
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // 🔹 Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const typeIcon = (type) => {
    switch (type) {
      case "quiz_assigned":
        return "📝";
      case "quiz_due":
        return "⏰";
      case "quiz_submitted":
        return "📤";
      case "quiz_graded":
        return "✅";
      case "discussion":
        return "💬";
      case "session":
        return "🎥";
      case "course":
        return "📚";
      default:
        return "🔔";
    }
  };

  return (
    <nav className={styles.StudentHeader}>
      {/* Logo */}
      <NavLink to="/" className={styles.logo}>
        IELTS Hub
      </NavLink>

      {/* SearchBar */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search courses, lessons..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      {/*Bên phải */}
      <div className={styles.rightSection}>
        {/* Notification Bell */}
        {user && (
          <div className={styles.notificationWrapper} ref={notifRef}>
            <button
              className={styles.bellBtn}
              onClick={() => setNotifOpen((prev) => !prev)}
            >
              🔔
              {unreadCount > 0 && (
                <span className={styles.bellDot}>{unreadCount}</span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  className={styles.notifDropdown}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={styles.notifHeader}>
                    <p className={styles.notifTitle}>Notifications</p>
                    <button
                      className={styles.refreshBtn}
                      onClick={() => refresh && refresh()}
                      title="Refresh"
                    >
                      ⟳
                    </button>
                  </div>
                  <div className={styles.notifList}>
                    {(notifications || []).length === 0 ? (
                      <div className={styles.notifEmpty}>Không có thông báo</div>
                    ) : (
                      (notifications || [])
                        .slice(0, 8)
                        .map((n) => (
                          <div
                            key={n._id}
                            className={`${styles.notifItem} ${!n.isRead ? styles.unread : ""}`}
                          >
                            <div
                              className={styles.notifMain}
                              onClick={() => {
                                if (!n.isRead && markRead) {
                                  markRead(n._id);
                                }
                                if (n.link) {
                                  navigate(n.link);
                                  setNotifOpen(false);
                                }
                              }}
                            >
                              <span className={styles.notifIcon}>{typeIcon(n.type)}</span>
                              <div className={styles.notifContent}>
                                <div className={styles.notifTitleText}>
                                  {n.title || "Notification"}
                                </div>
                                {n.content && (
                                  <div className={styles.notifDesc}>
                                    {n.content}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className={styles.notifActions}>
                              {!n.isRead && (
                                <button
                                  className={styles.actionBtn}
                                  title="Đánh dấu đã đọc"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markRead && markRead(n._id);
                                  }}
                                >
                                  ✓
                                </button>
                              )}
                              <button
                                className={styles.actionBtn}
                                title="Xóa"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification && deleteNotification(n._id);
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                  <button
                    className={styles.viewAllBtn}
                    onClick={() => {
                      setNotifOpen(false);
                      navigate("/notifications");
                    }}
                  >
                    View all →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Profile Menu */}
        {!user ? (
          <div className={styles.links}>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </div>
        ) : (
          <div className={styles.profileMenu} ref={profileRef}>
            <button
              className={styles.avatarBtn}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <img
                src={user.avatar || avatarDefault}
                alt="user avatar"
                className={styles.avatar}
              />
              <span className={styles.userName}>
                {user.fullName?.split(" ")[0] || "User"}
              </span>
              <span className={styles.arrow}>▾</span>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className={styles.dropdown}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/profile" onClick={() => setMenuOpen(false)}>
                    Profile
                  </NavLink>
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      navigate("/");
                    }}
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </nav>
  );
}
