import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toastService from '../../services/toastService';
import styles from './NotificationPreferences.module.css';

/**
 * Notification Preferences Page
 * Allows users to configure their notification settings
 */
const NotificationPreferences = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [preferences, setPreferences] = useState({
        // Email Notifications
        emailNotifications: {
            enabled: true,
            courseUpdates: true,
            quizAssigned: true,
            quizGraded: true,
            discussionReplies: true,
            sessionReminders: true,
            announcements: true,
            weeklyDigest: false,
            marketingEmails: false
        },
        // In-App Notifications
        inAppNotifications: {
            enabled: true,
            courseUpdates: true,
            quizAssigned: true,
            quizGraded: true,
            discussionReplies: true,
            sessionReminders: true,
            announcements: true,
            likes: true,
            mentions: true
        },
        // Push Notifications (if supported)
        pushNotifications: {
            enabled: false,
            sessionReminders: true,
            quizDeadlines: true,
            directMessages: true
        },
        // Notification Frequency
        frequency: {
            emailDigest: 'daily', // immediate, daily, weekly, never
            batchNotifications: false, // batch multiple notifications
            quietHours: {
                enabled: false,
                start: '22:00',
                end: '08:00'
            }
        },
        // Notification Channels
        channels: {
            email: user?.email || '',
            phone: '',
            enableSMS: false
        }
    });

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            setLoading(true);
            const response = await api.get('/notifications/preferences');
            if (response.data.success) {
                setPreferences(response.data.data);
            }
        } catch (error) {
            console.error('[NotificationPreferences] Error loading:', error);
            toastService.error('Không thể tải cài đặt thông báo');
        } finally {
            setLoading(false);
        }
    };

    const savePreferences = async () => {
        try {
            setSaving(true);
            const response = await api.put('/notifications/preferences', preferences);
            if (response.data.success) {
                toastService.success('Cài đặt thông báo đã được lưu');
            }
        } catch (error) {
            console.error('[NotificationPreferences] Error saving:', error);
            toastService.error('Không thể lưu cài đặt');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = (section, key) => {
        setPreferences(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: !prev[section][key]
            }
        }));
    };

    const handleFrequencyChange = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            frequency: {
                ...prev.frequency,
                [key]: value
            }
        }));
    };

    const handleQuietHoursToggle = () => {
        setPreferences(prev => ({
            ...prev,
            frequency: {
                ...prev.frequency,
                quietHours: {
                    ...prev.frequency.quietHours,
                    enabled: !prev.frequency.quietHours.enabled
                }
            }
        }));
    };

    const handleQuietHoursChange = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            frequency: {
                ...prev.frequency,
                quietHours: {
                    ...prev.frequency.quietHours,
                    [key]: value
                }
            }
        }));
    };

    const handleChannelChange = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            channels: {
                ...prev.channels,
                [key]: value
            }
        }));
    };

    const testNotification = () => {
        toastService.success('🔔 Test notification sent!');
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading preferences...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Notification Preferences</h1>
                    <p className={styles.subtitle}>
                        Manage how and when you receive notifications
                    </p>
                </div>
                <button className={styles.testBtn} onClick={testNotification}>
                    🔔 Test Notification
                </button>
            </div>

            <div className={styles.content}>
                {/* Email Notifications */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>📧</div>
                        <div>
                            <h2 className={styles.sectionTitle}>Email Notifications</h2>
                            <p className={styles.sectionDesc}>
                                Receive notifications via email
                            </p>
                        </div>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                checked={preferences.emailNotifications.enabled}
                                onChange={() => handleToggle('emailNotifications', 'enabled')}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    {preferences.emailNotifications.enabled && (
                        <div className={styles.options}>
                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Course Updates</div>
                                    <div className={styles.optionDesc}>
                                        New lessons, chapters, and course changes
                                    </div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.emailNotifications.courseUpdates}
                                        onChange={() => handleToggle('emailNotifications', 'courseUpdates')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Quiz Assigned</div>
                                    <div className={styles.optionDesc}>
                                        When a new quiz is assigned to you
                                    </div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.emailNotifications.quizAssigned}
                                        onChange={() => handleToggle('emailNotifications', 'quizAssigned')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Quiz Graded</div>
                                    <div className={styles.optionDesc}>
                                        When your quiz has been graded
                                    </div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.emailNotifications.quizGraded}
                                        onChange={() => handleToggle('emailNotifications', 'quizGraded')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Discussion Replies</div>
                                    <div className={styles.optionDesc}>
                                        When someone replies to your posts
                                    </div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.emailNotifications.discussionReplies}
                                        onChange={() => handleToggle('emailNotifications', 'discussionReplies')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Live Session Reminders</div>
                                    <div className={styles.optionDesc}>
                                        Reminders before scheduled live sessions
                                    </div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.emailNotifications.sessionReminders}
                                        onChange={() => handleToggle('emailNotifications', 'sessionReminders')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Announcements</div>
                                    <div className={styles.optionDesc}>
                                        Important platform announcements
                                    </div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.emailNotifications.announcements}
                                        onChange={() => handleToggle('emailNotifications', 'announcements')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Weekly Digest</div>
                                    <div className={styles.optionDesc}>
                                        Summary of your weekly activity
                                    </div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.emailNotifications.weeklyDigest}
                                        onChange={() => handleToggle('emailNotifications', 'weeklyDigest')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Marketing Emails</div>
                                    <div className={styles.optionDesc}>
                                        News, tips, and promotional content
                                    </div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.emailNotifications.marketingEmails}
                                        onChange={() => handleToggle('emailNotifications', 'marketingEmails')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* In-App Notifications */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>🔔</div>
                        <div>
                            <h2 className={styles.sectionTitle}>In-App Notifications</h2>
                            <p className={styles.sectionDesc}>
                                Show notifications while using the platform
                            </p>
                        </div>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                checked={preferences.inAppNotifications.enabled}
                                onChange={() => handleToggle('inAppNotifications', 'enabled')}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    {preferences.inAppNotifications.enabled && (
                        <div className={styles.options}>
                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Course Updates</div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.inAppNotifications.courseUpdates}
                                        onChange={() => handleToggle('inAppNotifications', 'courseUpdates')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Quiz Assigned</div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.inAppNotifications.quizAssigned}
                                        onChange={() => handleToggle('inAppNotifications', 'quizAssigned')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Quiz Graded</div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.inAppNotifications.quizGraded}
                                        onChange={() => handleToggle('inAppNotifications', 'quizGraded')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Discussion Replies</div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.inAppNotifications.discussionReplies}
                                        onChange={() => handleToggle('inAppNotifications', 'discussionReplies')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Likes & Reactions</div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.inAppNotifications.likes}
                                        onChange={() => handleToggle('inAppNotifications', 'likes')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Mentions</div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.inAppNotifications.mentions}
                                        onChange={() => handleToggle('inAppNotifications', 'mentions')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Push Notifications */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>📱</div>
                        <div>
                            <h2 className={styles.sectionTitle}>Push Notifications</h2>
                            <p className={styles.sectionDesc}>
                                Receive push notifications on your device
                            </p>
                        </div>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                checked={preferences.pushNotifications.enabled}
                                onChange={() => handleToggle('pushNotifications', 'enabled')}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    {preferences.pushNotifications.enabled && (
                        <div className={styles.options}>
                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Live Session Reminders</div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.pushNotifications.sessionReminders}
                                        onChange={() => handleToggle('pushNotifications', 'sessionReminders')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Quiz Deadlines</div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.pushNotifications.quizDeadlines}
                                        onChange={() => handleToggle('pushNotifications', 'quizDeadlines')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.option}>
                                <div>
                                    <div className={styles.optionLabel}>Direct Messages</div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.pushNotifications.directMessages}
                                        onChange={() => handleToggle('pushNotifications', 'directMessages')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notification Frequency */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>⏰</div>
                        <div>
                            <h2 className={styles.sectionTitle}>Notification Frequency</h2>
                            <p className={styles.sectionDesc}>
                                Control how often you receive notifications
                            </p>
                        </div>
                    </div>

                    <div className={styles.options}>
                        <div className={styles.option}>
                            <div>
                                <div className={styles.optionLabel}>Email Digest</div>
                                <div className={styles.optionDesc}>
                                    How often to receive email summaries
                                </div>
                            </div>
                            <select
                                className={styles.select}
                                value={preferences.frequency.emailDigest}
                                onChange={(e) => handleFrequencyChange('emailDigest', e.target.value)}
                            >
                                <option value="immediate">Immediate</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="never">Never</option>
                            </select>
                        </div>

                        <div className={styles.option}>
                            <div>
                                <div className={styles.optionLabel}>Batch Notifications</div>
                                <div className={styles.optionDesc}>
                                    Group multiple notifications together
                                </div>
                            </div>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={preferences.frequency.batchNotifications}
                                    onChange={() => handleFrequencyChange('batchNotifications', !preferences.frequency.batchNotifications)}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>

                        <div className={styles.option}>
                            <div>
                                <div className={styles.optionLabel}>Quiet Hours</div>
                                <div className={styles.optionDesc}>
                                    Pause notifications during specific hours
                                </div>
                            </div>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={preferences.frequency.quietHours.enabled}
                                    onChange={handleQuietHoursToggle}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>

                        {preferences.frequency.quietHours.enabled && (
                            <div className={styles.quietHoursInputs}>
                                <div className={styles.timeInput}>
                                    <label>Start Time</label>
                                    <input
                                        type="time"
                                        value={preferences.frequency.quietHours.start}
                                        onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                                    />
                                </div>
                                <div className={styles.timeInput}>
                                    <label>End Time</label>
                                    <input
                                        type="time"
                                        value={preferences.frequency.quietHours.end}
                                        onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notification Channels */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>📨</div>
                        <div>
                            <h2 className={styles.sectionTitle}>Notification Channels</h2>
                            <p className={styles.sectionDesc}>
                                Where to send your notifications
                            </p>
                        </div>
                    </div>

                    <div className={styles.options}>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Email Address</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={preferences.channels.email}
                                onChange={(e) => handleChannelChange('email', e.target.value)}
                                placeholder="your@email.com"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Phone Number (Optional)</label>
                            <input
                                type="tel"
                                className={styles.input}
                                value={preferences.channels.phone}
                                onChange={(e) => handleChannelChange('phone', e.target.value)}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        <div className={styles.option}>
                            <div>
                                <div className={styles.optionLabel}>Enable SMS Notifications</div>
                                <div className={styles.optionDesc}>
                                    Receive critical notifications via SMS
                                </div>
                            </div>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={preferences.channels.enableSMS}
                                    onChange={() => handleChannelChange('enableSMS', !preferences.channels.enableSMS)}
                                    disabled={!preferences.channels.phone}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className={styles.footer}>
                <button
                    className={styles.saveBtn}
                    onClick={savePreferences}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Preferences'}
                </button>
                <button
                    className={styles.cancelBtn}
                    onClick={loadPreferences}
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default NotificationPreferences;
