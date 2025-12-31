import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "../../services/toastService";
import api from "../../services/api";
import styles from "./Profile.module.css";

export default function Profile() {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    // Profile form state
    const [profileData, setProfileData] = useState({
        fullName: "",
        email: "",
        avatar: "",
        bio: "",
        phoneNumber: "",
        dateOfBirth: "",
        address: "",
        city: "",
        country: "",
        expertise: "",
        qualifications: "",
        socialLinks: { facebook: "", twitter: "", linkedin: "" },
    });

    // Password form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [activeTab, setActiveTab] = useState("profile");

    useEffect(() => {
        if (user) {
            // Parse address if it's a combined string
            const addressParts = (user.profile?.address || "").split(", ");

            setProfileData({
                fullName: user.fullName || "",
                email: user.email || "",
                avatar: user.avatar || "",
                bio: user.profile?.bio || "",
                phoneNumber: user.profile?.phone || "",
                dateOfBirth: user.profile?.dateOfBirth ? user.profile.dateOfBirth.split('T')[0] : "",
                address: addressParts[0] || "",
                city: addressParts[1] || "",
                country: addressParts[2] || "",
                expertise: user.profile?.expertise || "",
                qualifications: user.profile?.qualifications || "",
                socialLinks: {
                    facebook: user.profile?.socialLinks?.facebook || "",
                    twitter: user.profile?.socialLinks?.twitter || "",
                    linkedin: user.profile?.socialLinks?.linkedin || "",
                },
            });
        }
    }, [user]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith("social_")) {
            const socialField = name.split("_")[1];
            setProfileData(prev => ({
                ...prev,
                socialLinks: {
                    ...prev.socialLinks,
                    [socialField]: value
                }
            }));
        } else {
            setProfileData({ ...profileData, [name]: value });
        }
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

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        setUploadingAvatar(true);

        try {
            const formData = new FormData();
            formData.append("avatar", file);

            const res = await api.post("/users/avatar", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (res.data.success) {
                toast.success("Avatar updated successfully!");
                const updatedAvatar = res.data.data.avatar;
                setProfileData({ ...profileData, avatar: updatedAvatar });

                const updatedUser = { ...user, avatar: updatedAvatar };
                localStorage.setItem("user", JSON.stringify(updatedUser));

                if (setUser) {
                    setUser(updatedUser);
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
            const res = await api.put("/users/profile", {
                fullName: profileData.fullName,
                email: profileData.email,
                bio: profileData.bio,
                phone: profileData.phoneNumber,
                dateOfBirth: profileData.dateOfBirth,
                dateOfBirth: profileData.dateOfBirth,
                address: `${profileData.address}${profileData.city ? ', ' + profileData.city : ''}${profileData.country ? ', ' + profileData.country : ''}`,
                expertise: profileData.expertise,
                qualifications: profileData.qualifications,
                socialLinks: profileData.socialLinks,
            });

            if (res.data) {
                toast.success("Profile updated successfully!");

                // Update user with response data
                const updatedUser = {
                    ...user,
                    fullName: profileData.fullName,
                    email: profileData.email,
                    profile: {
                        ...user.profile,
                        bio: profileData.bio,
                        phone: profileData.phoneNumber,
                        dateOfBirth: profileData.dateOfBirth,
                        address: `${profileData.address}${profileData.city ? ', ' + profileData.city : ''}${profileData.country ? ', ' + profileData.country : ''}`,
                    },
                };
                localStorage.setItem("user", JSON.stringify(updatedUser));

                if (setUser) {
                    setUser(updatedUser);
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
            const res = await api.put("/users/change-password", {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });

            if (res.data) {
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

    return (
        <div className={styles.container}>
            <div className={styles.profileContent}>
                {/* Avatar Section */}
                <div className={styles.avatarSection}>
                    <div className={styles.avatarWrapper}>
                        <img
                            src={
                                profileData.avatar ||
                                "https://ui-avatars.com/api/?name=" +
                                encodeURIComponent(profileData.fullName || "User") +
                                "&background=667eea&color=fff&size=200"
                            }
                            alt="User Avatar"
                            className={styles.avatarImage}
                            onError={(e) => {
                                e.target.src =
                                    "https://ui-avatars.com/api/?name=User&background=667eea&color=fff&size=200";
                            }}
                        />
                        <button
                            type="button"
                            className={styles.avatarUploadBtn}
                            onClick={handleAvatarClick}
                            disabled={uploadingAvatar}
                        >
                            {uploadingAvatar ? "⏳" : "📷"}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            style={{ display: "none" }}
                        />
                    </div>
                    <div className={styles.avatarInfo}>
                        <h2>{profileData.fullName || "User"}</h2>
                        <p>{user?.email || ""}</p>
                        <span className={styles.roleBadge}>{user?.role || "student"}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === "profile" ? styles.active : ""}`}
                        onClick={() => setActiveTab("profile")}
                    >
                        👤 Profile Information
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === "password" ? styles.active : ""}`}
                        onClick={() => setActiveTab("password")}
                    >
                        🔒 Change Password
                    </button>
                </div>

                {/* Tab Content */}
                <div className={styles.tabContent}>
                    {activeTab === "profile" && (
                        <form onSubmit={handleProfileSubmit} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Full Name *</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={profileData.fullName}
                                        onChange={handleProfileChange}
                                        required
                                        disabled={user?.role === 'teacher'}
                                        title={user?.role === 'teacher' ? "Name cannot be changed" : ""}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleProfileChange}
                                        required
                                        disabled={user?.role === 'teacher'}
                                        title={user?.role === 'teacher' ? "Email cannot be changed" : ""}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={profileData.phoneNumber}
                                        onChange={handleProfileChange}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={profileData.dateOfBirth}
                                        onChange={handleProfileChange}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={profileData.city}
                                        onChange={handleProfileChange}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={profileData.country}
                                        onChange={handleProfileChange}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={profileData.address}
                                    onChange={handleProfileChange}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Bio</label>
                                <textarea
                                    name="bio"
                                    rows="4"
                                    value={profileData.bio}
                                    onChange={handleProfileChange}
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            {user?.role === 'teacher' && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label>Expertise</label>
                                        <input
                                            type="text"
                                            name="expertise"
                                            value={profileData.expertise}
                                            onChange={handleProfileChange}
                                            placeholder="E.g. Web Development, Data Science"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Qualifications</label>
                                        <textarea
                                            name="qualifications"
                                            rows="3"
                                            value={profileData.qualifications}
                                            onChange={handleProfileChange}
                                            placeholder="Your degrees and certifications..."
                                        />
                                    </div>
                                </>
                            )}

                            <div className={styles.formGroup}>
                                <label>Social Links</label>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <input
                                        type="url"
                                        name="social_facebook"
                                        value={profileData.socialLinks.facebook}
                                        onChange={handleProfileChange}
                                        placeholder="Facebook URL"
                                    />
                                    <input
                                        type="url"
                                        name="social_twitter"
                                        value={profileData.socialLinks.twitter}
                                        onChange={handleProfileChange}
                                        placeholder="Twitter/X URL"
                                    />
                                    <input
                                        type="url"
                                        name="social_linkedin"
                                        value={profileData.socialLinks.linkedin}
                                        onChange={handleProfileChange}
                                        placeholder="LinkedIn URL"
                                    />
                                </div>
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? "Updating..." : "💾 Save Changes"}
                            </button>
                        </form>
                    )}

                    {activeTab === "password" && (
                        <form onSubmit={handlePasswordSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Current Password *</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>New Password *</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Confirm New Password *</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? "Changing..." : "🔐 Change Password"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
