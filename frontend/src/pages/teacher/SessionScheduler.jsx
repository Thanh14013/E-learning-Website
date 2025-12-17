import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toastService from '../../services/toastService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import styles from './SessionScheduler.module.css';

/**
 * Live Session Scheduler
 * Allows teachers to schedule live video sessions
 */
export default function SessionScheduler() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [sessions, setSessions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingSession, setEditingSession] = useState(null);

    useEffect(() => {
        if (user?.role !== 'teacher' && user?.role !== 'admin') {
            toastService.error('Bạn không có quyền truy cập');
            navigate('/dashboard');
            return;
        }

        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch teacher's courses
            const coursesResponse = await api.get('/courses/my-courses');
            setCourses(coursesResponse.data.data || []);

            // Fetch sessions
            const sessionsResponse = await api.get('/sessions/my-sessions');
            setSessions(sessionsResponse.data.data || []);

        } catch (error) {
            console.error('Error fetching data:', error);
            toastService.error('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = () => {
        setEditingSession(null);
        setShowCreateModal(true);
    };

    const handleEditSession = (session) => {
        setEditingSession(session);
        setShowCreateModal(true);
    };

    const handleDeleteSession = async (sessionId) => {
        if (!window.confirm('Bạn có chắc muốn xóa buổi học này?')) {
            return;
        }

        try {
            await api.delete(`/sessions/${sessionId}`);
            setSessions(prev => prev.filter(s => s._id !== sessionId));
            toastService.success('Đã xóa buổi học');
        } catch (error) {
            console.error('Error deleting session:', error);
            toastService.error('Không thể xóa buổi học');
        }
    };

    const handleStartSession = async (sessionId) => {
        try {
            await api.put(`/sessions/${sessionId}/start`);
            toastService.success('Đã bắt đầu buổi học');

            // Navigate to video room
            navigate(`/sessions/${sessionId}`);
        } catch (error) {
            console.error('Error starting session:', error);
            toastService.error('Không thể bắt đầu buổi học');
        }
    };

    const handleEndSession = async (sessionId) => {
        if (!window.confirm('Bạn có chắc muốn kết thúc buổi học?')) {
            return;
        }

        try {
            await api.put(`/sessions/${sessionId}/end`);
            toastService.success('Đã kết thúc buổi học');
            fetchData();
        } catch (error) {
            console.error('Error ending session:', error);
            toastService.error('Không thể kết thúc buổi học');
        }
    };

    const filterSessionsByStatus = (status) => {
        const now = new Date();

        return sessions.filter(session => {
            const scheduledAt = new Date(session.scheduledAt);

            switch (status) {
                case 'upcoming':
                    return session.status === 'scheduled' && scheduledAt > now;
                case 'live':
                    return session.status === 'live';
                case 'past':
                    return session.status === 'ended' || (session.status === 'scheduled' && scheduledAt < now);
                default:
                    return true;
            }
        });
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.sessionScheduler}>
            <div className={styles.header}>
                <h2>📅 Lịch Buổi Học Trực Tuyến</h2>
                <Button onClick={handleCreateSession}>+ Tạo buổi học mới</Button>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <Tab label="Sắp diễn ra" sessions={filterSessionsByStatus('upcoming')} />
                <Tab label="Đang diễn ra" sessions={filterSessionsByStatus('live')} status="live" />
                <Tab label="Đã kết thúc" sessions={filterSessionsByStatus('past')} />
            </div>

            {/* Sessions Grid */}
            <SessionsView
                sessions={sessions}
                onEdit={handleEditSession}
                onDelete={handleDeleteSession}
                onStart={handleStartSession}
                onEnd={handleEndSession}
            />

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <SessionModal
                    session={editingSession}
                    courses={courses}
                    onSave={() => {
                        setShowCreateModal(false);
                        fetchData();
                    }}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </div>
    );
}

function Tab({ label, sessions, status }) {
    return (
        <div className={`${styles.tab} ${status === 'live' ? styles.tabLive : ''}`}>
            <span>{label}</span>
            <span className={styles.tabCount}>{sessions.length}</span>
        </div>
    );
}

function SessionsView({ sessions, onEdit, onDelete, onStart, onEnd }) {
    const now = new Date();

    if (sessions.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>📭 Chưa có buổi học nào được tạo</p>
            </div>
        );
    }

    return (
        <div className={styles.sessionsGrid}>
            {sessions.map(session => {
                const scheduledAt = new Date(session.scheduledAt);
                const isUpcoming = session.status === 'scheduled' && scheduledAt > now;
                const isLive = session.status === 'live';
                const isPast = session.status === 'ended';

                return (
                    <div key={session._id} className={`${styles.sessionCard} ${isLive ? styles.sessionLive : ''}`}>
                        {isLive && <div className={styles.liveBadge}>🔴 LIVE</div>}

                        <div className={styles.sessionHeader}>
                            <h3>{session.title}</h3>
                            <span className={styles.sessionCourse}>
                                📚 {session.courseId?.title || 'N/A'}
                            </span>
                        </div>

                        <p className={styles.sessionDescription}>{session.description}</p>

                        <div className={styles.sessionMeta}>
                            <div className={styles.metaItem}>
                                <span className={styles.metaIcon}>📅</span>
                                <span>{formatDate(session.scheduledAt)}</span>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaIcon}>⏰</span>
                                <span>{formatTime(session.scheduledAt)}</span>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaIcon}>👥</span>
                                <span>{session.participants?.length || 0} tham gia</span>
                            </div>
                        </div>

                        <div className={styles.sessionActions}>
                            {isUpcoming && (
                                <>
                                    <Button size="small" onClick={() => onStart(session._id)}>
                                        Bắt đầu
                                    </Button>
                                    <Button size="small" variant="secondary" onClick={() => onEdit(session)}>
                                        Sửa
                                    </Button>
                                    <Button size="small" variant="danger" onClick={() => onDelete(session._id)}>
                                        Xóa
                                    </Button>
                                </>
                            )}

                            {isLive && (
                                <>
                                    <Button size="small" onClick={() => window.open(`/sessions/${session._id}`, '_blank')}>
                                        Vào phòng
                                    </Button>
                                    <Button size="small" variant="danger" onClick={() => onEnd(session._id)}>
                                        Kết thúc
                                    </Button>
                                </>
                            )}

                            {isPast && (
                                <Button size="small" variant="secondary" disabled>
                                    Đã kết thúc
                                </Button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function SessionModal({ session, courses, onSave, onClose }) {
    const [formData, setFormData] = useState({
        courseId: session?.courseId?._id || '',
        title: session?.title || '',
        description: session?.description || '',
        scheduledAt: session?.scheduledAt ? formatDateTimeForInput(session.scheduledAt) : ''
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.courseId || !formData.title || !formData.scheduledAt) {
            toastService.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        const scheduledDate = new Date(formData.scheduledAt);
        if (scheduledDate <= new Date()) {
            toastService.error('Thời gian phải trong tương lai');
            return;
        }

        try {
            setSaving(true);

            if (session) {
                await api.put(`/sessions/${session._id}`, formData);
                toastService.success('Đã cập nhật buổi học');
            } else {
                await api.post('/sessions', formData);
                toastService.success('Đã tạo buổi học mới');
            }

            onSave();
        } catch (error) {
            console.error('Error saving session:', error);
            toastService.error('Không thể lưu buổi học');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose}>
            <div className={styles.sessionModal}>
                <h3>{session ? 'Chỉnh sửa buổi học' : 'Tạo buổi học mới'}</h3>

                <div className={styles.formGroup}>
                    <label>Khóa học *</label>
                    <select
                        value={formData.courseId}
                        onChange={(e) => handleChange('courseId', e.target.value)}
                        className={styles.select}
                    >
                        <option value="">-- Chọn khóa học --</option>
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>
                                {course.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Tiêu đề *</label>
                    <Input
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="Ví dụ: Buổi ôn tập giữa kỳ"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Mô tả</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Mô tả ngắn về buổi học..."
                        rows="3"
                        className={styles.textarea}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Thời gian *</label>
                    <Input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => handleChange('scheduledAt', e.target.value)}
                    />
                </div>

                <div className={styles.modalActions}>
                    <Button variant="secondary" onClick={onClose}>Hủy</Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTimeForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
}
