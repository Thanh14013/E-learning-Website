import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "../../services/toastService";
import axios from "axios";
import styles from "./ProfileModal.module.css";

const ProfileModal = ({ isOpen, onClose, user, onUserUpdate }) => {
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    // Profile form state
    const [profileData, setProfileData] = useState({
        fullName: "",
        email: "",
        avatar: "",
    });

    // Password form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                fullName: user.fullName || "",
                email: user.email || "",
                avatar: user.avatar || "",
            });
        }
    }, [user]);

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        setUploadingAvatar(true);

        try {
            const token = localStorage.getItem("accessToken");
            const formData = new FormData();
            formData.append("avatar", file);

            const res = await axios.post("/api/users/avatar", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (res.data.success) {
                toast.success("Avatar updated successfully!");
                const updatedAvatar = res.data.data.avatar;
                setProfileData({ ...profileData, avatar: updatedAvatar });

                // Update user object and localStorage
                const updatedUser = { ...user, avatar: updatedAvatar };
                localStorage.setItem("user", JSON.stringify(updatedUser));

                if (onUserUpdate) {
                    onUserUpdate(updatedUser);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to upload avatar");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.put(
                "/api/users/profile",
                {
                    fullName: profileData.fullName,
                    email: profileData.email,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (res.data) {
                toast.success("Profile updated successfully!");

                // Update user object and localStorage
                const updatedUser = {
                    ...user,
                    fullName: profileData.fullName,
                    email: profileData.email
                };
                localStorage.setItem("user", JSON.stringify(updatedUser));

                if (onUserUpdate) {
                    onUserUpdate(updatedUser);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match!");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters!");
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.put(
                "/api/users/change-password",
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (res.data.success) {
                toast.success("Password changed successfully!");
                setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    // Don't render anything if modal is not open
    if (!isOpen) return null;

    // Render modal into document.body using portal
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className={styles.backdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className={styles.modal}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className={styles.header}>
                            <h2>Profile Settings</h2>
                            <button className={styles.closeBtn} onClick={onClose}>
                                ✕
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tab} ${activeTab === "profile" ? styles.active : ""}`}
                                onClick={() => setActiveTab("profile")}
                            >
                                👤 Profile Info
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === "password" ? styles.active : ""}`}
                                onClick={() => setActiveTab("password")}
                            >
                                🔒 Change Password
                            </button>
                        </div>

                        {/* Content */}
                        <div className={styles.content}>
                            {activeTab === "profile" ? (
                                <form onSubmit={handleProfileSubmit} className={styles.form}>
                                    {/* Avatar Display with Upload */}
                                    <div className={styles.avatarSection}>
                                        <div className={styles.avatarWrapper}>
                                            <img
                                                src={profileData.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(profileData.fullName || "User") + "&background=3b82f6&color=fff&size=200"}
                                                alt="User Avatar"
                                                className={styles.avatarImage}
                                                onError={(e) => {
                                                    e.target.src = "https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff&size=200";
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className={styles.avatarUploadBtn}
                                                onClick={handleAvatarClick}
                                                disabled={uploadingAvatar}
                                            >
                                                {uploadingAvatar ? "🔄" : "📷"}
                                            </button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                                style={{ display: "none" }}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={profileData.fullName}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profileData.email}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className={styles.submitBtn}
                                        disabled={loading}
                                    >
                                        {loading ? "Updating..." : "Update Profile"}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handlePasswordSubmit} className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <label>Current Password</label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Confirm New Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className={styles.submitBtn}
                                        disabled={loading}
                                    >
                                        {loading ? "Changing..." : "Change Password"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ProfileModal;
