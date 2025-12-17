import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import { AvatarUpload } from '../../components/profile/AvatarUpload';
import api from '../../services/api';
import toastService from '../../services/toastService';
import './Profile.css';

const Profile = () => {
    const { user, setUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('info'); // info, courses, activity, certificates
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        fullName: user?.fullName || user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        bio: user?.bio || '',
    });

    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Vui lòng nhập họ tên';
        }

        if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const response = await api.put('/users/profile', formData);

            // Update user in context
            const updatedUser = { ...user, ...formData };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            toastService.success('Cập nhật thông tin thành công!');
            setIsEditing(false);
        } catch (error) {
            toastService.error(error.message || 'Cập nhật thông tin thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            fullName: user?.fullName || user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            address: user?.address || '',
            bio: user?.bio || '',
        });
        setErrors({});
        setIsEditing(false);
    };

    const renderInfoTab = () => (
        <div className="profile-info">
            <div className="profile-field">
                <label className="profile-label">Họ và tên</label>
                {isEditing ? (
                    <Input
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        error={errors.fullName}
                        placeholder="Nhập họ và tên"
                    />
                ) : (
                    <p className="profile-value">{formData.fullName || 'Chưa cập nhật'}</p>
                )}
            </div>

            <div className="profile-field">
                <label className="profile-label">Email</label>
                <p className="profile-value">{formData.email}</p>
            </div>

            <div className="profile-field">
                <label className="profile-label">Vai trò</label>
                <p className="profile-value">
                    <span className={`badge badge-primary-${user?.role || 'student'}`}>
                        {user?.role === 'student' ? 'Học viên' : user?.role === 'teacher' ? 'Giảng viên' : 'Quản trị viên'}
                    </span>
                </p>
            </div>

            <div className="profile-field">
                <label className="profile-label">Số điện thoại</label>
                {isEditing ? (
                    <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        error={errors.phone}
                        placeholder="Nhập số điện thoại"
                    />
                ) : (
                    <p className="profile-value">{formData.phone || 'Chưa cập nhật'}</p>
                )}
            </div>

            <div className="profile-field">
                <label className="profile-label">Địa chỉ</label>
                {isEditing ? (
                    <Input
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Nhập địa chỉ"
                    />
                ) : (
                    <p className="profile-value">{formData.address || 'Chưa cập nhật'}</p>
                )}
            </div>

            <div className="profile-field">
                <label className="profile-label">Giới thiệu</label>
                {isEditing ? (
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Viết vài dòng về bản thân"
                        className="form-input profile-bio-input"
                        rows="4"
                    />
                ) : (
                    <p className="profile-value">{formData.bio || 'Chưa cập nhật'}</p>
                )}
            </div>

            <div className="profile-actions">
                {isEditing ? (
                    <>
                        <Button variant="primary" onClick={handleSave} disabled={loading}>
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                        <Button variant="secondary" onClick={handleCancel} disabled={loading}>
                            Hủy
                        </Button>
                    </>
                ) : (
                    <Button variant="primary" onClick={() => setIsEditing(true)}>
                        Chỉnh sửa thông tin
                    </Button>
                )}
            </div>
        </div>
    );

    const renderCoursesTab = () => (
        <div className="profile-tab-content">
            <p className="empty-state">Chức năng đang phát triển</p>
        </div>
    );

    const renderActivityTab = () => (
        <div className="profile-tab-content">
            <p className="empty-state">Chức năng đang phát triển</p>
        </div>
    );

    const renderCertificatesTab = () => (
        <div className="profile-tab-content">
            <p className="empty-state">Chưa có chứng chỉ nào</p>
        </div>
    );

    if (!user) {
        return <Loading fullScreen text="Loading thông tin..." />;
    }

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-layout">
                    {/* Left Sidebar - Profile Summary */}
                    <aside className="profile-sidebar">
                        <Card>
                            <div className="profile-summary">
                                <div className="profile-avatar-wrapper">
                                    <img
                                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.name || 'User')}&size=200&background=4f46e5&color=fff`}
                                        alt="Avatar"
                                        className="profile-avatar"
                                    />
                                    <button
                                        className="profile-avatar-edit-btn"
                                        onClick={() => setIsAvatarModalOpen(true)}
                                        aria-label="Change avatar"
                                    >
                                        📷
                                    </button>
                                </div>
                                <h2 className="profile-name">{user.fullName || user.name}</h2>
                                <p className="profile-email">{user.email}</p>
                                <span className={`badge badge-primary-${user.role || 'student'}`}>
                                    {user.role === 'student' ? 'Học viên' : user.role === 'teacher' ? 'Giảng viên' : 'Quản trị viên'}
                                </span>
                            </div>
                        </Card>
                    </aside>

                    {/* Main Content */}
                    <main className="profile-main">
                        <Card>
                            <div className="profile-tabs">
                                <button
                                    className={`profile-tab ${activeTab === 'info' ? 'profile-tab--active' : ''}`}
                                    onClick={() => setActiveTab('info')}
                                >
                                    Thông tin
                                </button>
                                <button
                                    className={`profile-tab ${activeTab === 'courses' ? 'profile-tab--active' : ''}`}
                                    onClick={() => setActiveTab('courses')}
                                >
                                    Khóa học
                                </button>
                                <button
                                    className={`profile-tab ${activeTab === 'activity' ? 'profile-tab--active' : ''}`}
                                    onClick={() => setActiveTab('activity')}
                                >
                                    Hoạt động
                                </button>
                                <button
                                    className={`profile-tab ${activeTab === 'certificates' ? 'profile-tab--active' : ''}`}
                                    onClick={() => setActiveTab('certificates')}
                                >
                                    Chứng chỉ
                                </button>
                            </div>

                            <div className="profile-tab-content">
                                {activeTab === 'info' && renderInfoTab()}
                                {activeTab === 'courses' && renderCoursesTab()}
                                {activeTab === 'activity' && renderActivityTab()}
                                {activeTab === 'certificates' && renderCertificatesTab()}
                            </div>
                        </Card>
                    </main>
                </div>
            </div>

            {/* Avatar Upload Modal */}
            <AvatarUpload isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} />
        </div>
    );
};

export default Profile;
