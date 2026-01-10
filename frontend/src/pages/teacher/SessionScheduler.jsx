import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toastService from '../../services/toastService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import SessionHistoryModal from '../../components/session/SessionHistoryModal';
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
    const [viewingHistoryId, setViewingHistoryId] = useState(null);

    useEffect(() => {
        if (user?.role !== 'teacher' && user?.role !== 'admin') {
            toastService.error('You do not have access');
            navigate('/teacher/dashboard');
            return;
        }

        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch teacher's courses
            const coursesResponse = await api.get('/teacher/courses');
            setCourses(coursesResponse.data.data || []);

            // Fetch sessions
            const sessionsResponse = await api.get('/teacher/sessions');
            setSessions(sessionsResponse.data.data || []);

        } catch (error) {
            console.error('Error fetching data:', error);
            toastService.error('Unable to load data');
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
        if (!window.confirm('Are you sure you want to delete this session?')) {
            return;
        }

        try {
            await api.delete(`/teacher/sessions/${sessionId}`);
            setSessions(prev => prev.filter(s => s._id !== sessionId));
            toastService.success('Session deleted');
        } catch (error) {
            console.error('Error deleting session:', error);
            toastService.error('Unable to delete session');
        }
    };

    const handleStartSession = async (sessionId) => {
        try {
            await api.put(`/teacher/sessions/${sessionId}/start`);
            toastService.success('Session started');

            // Navigate to video room
            navigate(`/sessions/${sessionId}`);
        } catch (error) {
            console.error('Error starting session:', error);
            toastService.error('Unable to start session');
        }
    };

    const handleEndSession = async (sessionId) => {
        if (!window.confirm('Are you sure you want to end this session?')) {
            return;
        }

        try {
            await api.put(`/teacher/sessions/${sessionId}/end`);
            toastService.success('Session ended');
            fetchData();
        } catch (error) {
            console.error('Error ending session:', error);
            toastService.error('Unable to end session');
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

    const [activeTab, setActiveTab] = useState('upcoming');

    // ... existing fetchData ...

    // Helper to get sessions for the currrent view
    const getCurrentSessions = () => {
        return filterSessionsByStatus(activeTab);
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.sessionScheduler}>
            <div className={styles.header}>
                <h2>📅 Online Session Schedule</h2>
                <Button onClick={handleCreateSession}>+ Create session</Button>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <Tab
                    label="Upcoming"
                    count={filterSessionsByStatus('upcoming').length}
                    isActive={activeTab === 'upcoming'}
                    onClick={() => setActiveTab('upcoming')}
                />
                <Tab
                    label="Live"
                    count={filterSessionsByStatus('live').length}
                    isActive={activeTab === 'live'}
                    onClick={() => setActiveTab('live')}
                    variant="danger"
                />
                <Tab
                    label="Past"
                    count={filterSessionsByStatus('past').length}
                    isActive={activeTab === 'past'}
                    onClick={() => setActiveTab('past')}
                />
            </div>

            {/* Sessions Grid */}
            <SessionsView
                sessions={getCurrentSessions()}
                onEdit={handleEditSession}
                onDelete={handleDeleteSession}
                onStart={handleStartSession}
                onEnd={handleEndSession}
                onViewDetail={(sessionId) => setViewingHistoryId(sessionId)}
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

            {/* History Modal */}
            {viewingHistoryId && (
                <SessionHistoryModal
                    sessionId={viewingHistoryId}
                    onClose={() => setViewingHistoryId(null)}
                />
            )}
        </div>
    );
}

function Tab({ label, count, isActive, onClick, variant = 'primary' }) {
    return (
        <div
            className={`${styles.tab} ${isActive ? styles.tabActive : ''} ${isActive && variant === 'danger' ? styles.tabActiveDanger : ''}`}
            onClick={onClick}
        >
            <span>{label}</span>
            <span className={styles.tabCount}>{count}</span>
        </div>
    );
}

function SessionsView({ sessions, onEdit, onDelete, onStart, onEnd, onViewDetail }) {
    const now = new Date();

    if (sessions.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>📭 No sessions created yet</p>
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
                                <span>{session.participants?.length || 0} participants</span>
                            </div>
                        </div>

                        <div className={styles.sessionActions}>
                            {isUpcoming && (
                                <>
                                    <Button size="small" onClick={() => onStart(session._id)}>
                                        Start
                                    </Button>
                                    <Button size="small" variant="secondary" onClick={() => onEdit(session)}>
                                        Edit
                                    </Button>
                                    <Button size="small" variant="danger" onClick={() => onDelete(session._id)}>
                                        Delete
                                    </Button>
                                </>
                            )}

                            {isLive && (
                                <>
                                    <Button size="small" onClick={() => window.open(`/teacher/sessions/${session._id}`, '_blank')}>
                                        Join room
                                    </Button>
                                    <Button size="small" variant="danger" onClick={() => onEnd(session._id)}>
                                        End
                                    </Button>
                                </>
                            )}

                            {isPast && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button size="small" variant="secondary" disabled>
                                        Ended
                                    </Button>
                                    <Button size="small" onClick={() => onViewDetail(session._id)}>
                                        View Detail
                                    </Button>
                                </div>
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
            toastService.error('Please fill in all required fields');
            return;
        }

        const scheduledDate = new Date(formData.scheduledAt);
        if (scheduledDate <= new Date()) {
            toastService.error('Scheduled time must be in the future');
            return;
        }

        try {
            setSaving(true);

            if (session) {
                await api.put(`/teacher/sessions/${session._id}`, formData);
                toastService.success('Session updated');
            } else {
                await api.post('/teacher/sessions', formData);
                toastService.success('Session created');
            }

            onSave();
        } catch (error) {
            console.error('Error saving session:', error);
            toastService.error('Unable to save session');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={session ? 'Edit Session' : 'Create New Session'}
        >
            <div className={styles.sessionModal}>

                <div className={styles.formGroup}>
                    <label>Course *</label>
                    <select
                        value={formData.courseId}
                        onChange={(e) => handleChange('courseId', e.target.value)}
                        className={styles.select}
                    >
                        <option value="">-- Select course --</option>
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>
                                {course.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Title *</label>
                    <Input
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="e.g., Midterm review session"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Short description of the session..."
                        rows="3"
                        className={styles.textarea}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Time *</label>
                    <Input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => handleChange('scheduledAt', e.target.value)}
                    />
                </div>

                <div className={styles.modalActions}>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTimeForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
}
