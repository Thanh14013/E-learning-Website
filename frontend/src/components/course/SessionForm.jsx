import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toastService from '../../services/toastService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import styles from './SessionForm.module.css';

/**
 * SessionForm Component
 * Modal for creating or editing a live session.
 * 
 * @param {Object} session - (Optional) Session object to edit
 * @param {string} courseId - (Optional) Pre-selected course ID
 * @param {Function} onSuccess - Callback on successful save
 * @param {Function} onCancel - Callback on cancel
 */
const SessionForm = ({ session, courseId, onSuccess, onCancel }) => {
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({
        courseId: session?.courseId?._id || courseId || '',
        title: session?.title || '',
        description: session?.description || '',
        scheduledAt: session?.scheduledAt ? formatDateTimeForInput(session.scheduledAt) : ''
    });
    const [saving, setSaving] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);

    useEffect(() => {
        // If courseId is not provided, fetch teacher's courses to allow selection
        if (!courseId && !session) {
            fetchCourses();
        }
    }, [courseId, session]);

    const fetchCourses = async () => {
        try {
            setLoadingCourses(true);
            const response = await api.get('/teacher/courses');
            setCourses(response.data.data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            toastService.error('Unable to load courses');
        } finally {
            setLoadingCourses(false);
        }
    };

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

            // Use /api/teacher/sessions endpoints
            if (session) {
                await api.put(`/teacher/sessions/${session._id}`, formData);
                toastService.success('Session updated');
            } else {
                await api.post('/teacher/sessions', formData);
                toastService.success('Session created');
            }

            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error saving session:', error);
            const msg = error.response?.data?.message || 'Unable to save session';
            toastService.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onCancel}>
            <div className={styles.sessionModal}>
                <h3>{session ? 'Edit Session' : 'Schedule Live Session'}</h3>

                {/* Only show course selector if courseId is NOT provided */}
                {!courseId && (
                    <div className={styles.formGroup}>
                        <label>Course *</label>
                        {loadingCourses ? (
                            <p>Loading courses...</p>
                        ) : (
                            <select
                                value={formData.courseId}
                                onChange={(e) => handleChange('courseId', e.target.value)}
                                className={styles.select}
                                disabled={!!session} // Cannot change course when editing
                            >
                                <option value="">-- Select course --</option>
                                {courses.map(course => (
                                    <option key={course._id} value={course._id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                <div className={styles.formGroup}>
                    <label>Title *</label>
                    <Input
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="e.g., Weekly Q&A Session"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Brief description of what will be covered..."
                        rows="3"
                        className={styles.textarea}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Date & Time *</label>
                    <Input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => handleChange('scheduledAt', e.target.value)}
                    />
                </div>

                <div className={styles.modalActions}>
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Saving...' : 'Schedule'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

function formatDateTimeForInput(dateString) {
    const date = new Date(dateString);
    // Format to YYYY-MM-DDThh:mm for datetime-local input
    // Adjust for local timezone offset if needed, but ISO string is usually safest base
    // Here getting local ISO string part
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date - offset)).toISOString().slice(0, 16);
    return localISOTime;
}

export default SessionForm;
