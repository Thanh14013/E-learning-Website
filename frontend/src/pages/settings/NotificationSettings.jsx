import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import notificationService from '../../services/notificationService';
import toastService from '../../services/toastService';
import styles from './NotificationSettings.module.css';

/**
 * Notification Settings Page
 * 
 * Features:
 * - Toggle email notifications on/off
 * - Toggle in-app notifications
 * - Select notification types
 * - Set notification frequency
 * - Save preferences
 */

// Default preferences structure
const DEFAULT_PREFERENCES = {
  email: {
    enabled: true,
    frequency: 'instant', // 'instant' | 'daily' | 'weekly' | 'never'
    types: {
      courseUpdates: true,
      newDiscussion: true,
      quizReminders: true,
      liveSessionReminders: true,
      comments: true,
      announcements: true,
    },
  },
  inApp: {
    enabled: true,
    types: {
      courseUpdates: true,
      newDiscussion: true,
      quizReminders: true,
      liveSessionReminders: true,
      comments: true,
      announcements: true,
    },
  },
  push: {
    enabled: false,
  },
};

// Notification type labels (Vietnamese)
const NOTIFICATION_TYPE_LABELS = {
  courseUpdates: 'Cập nhật khóa học',
  newDiscussion: 'Thảo luận mới',
  quizReminders: 'Nhắc nhở bài kiểm tra',
  liveSessionReminders: 'Nhắc nhở phiên học trực tiếp',
  comments: 'Bình luận & phản hồi',
  announcements: 'Thông báo chung',
};

// Frequency options
const FREQUENCY_OPTIONS = [
  { value: 'instant', label: 'Ngay lập tức' },
  { value: 'daily', label: 'Tổng hợp hàng ngày' },
  { value: 'weekly', label: 'Tổng hợp hàng tuần' },
  { value: 'never', label: 'Không bao giờ' },
];

const NotificationSettings = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPreferences, setOriginalPreferences] = useState(null);

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getPreferences();
      // Merge with defaults to ensure all fields exist
      const mergedPreferences = mergeWithDefaults(data);
      setPreferences(mergedPreferences);
      setOriginalPreferences(mergedPreferences);
      console.log('[NotificationSettings] Loaded preferences:', mergedPreferences);
    } catch (error) {
      console.warn('[NotificationSettings] Failed to load preferences, using defaults:', error);
      // Use defaults if API fails (for demo/mock mode)
      setPreferences(DEFAULT_PREFERENCES);
      setOriginalPreferences(DEFAULT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  };

  // Deep merge preferences with defaults
  const mergeWithDefaults = (data) => {
    if (!data) return DEFAULT_PREFERENCES;
    
    return {
      email: {
        enabled: data.email?.enabled ?? DEFAULT_PREFERENCES.email.enabled,
        frequency: data.email?.frequency ?? DEFAULT_PREFERENCES.email.frequency,
        types: {
          ...DEFAULT_PREFERENCES.email.types,
          ...(data.email?.types || {}),
        },
      },
      inApp: {
        enabled: data.inApp?.enabled ?? DEFAULT_PREFERENCES.inApp.enabled,
        types: {
          ...DEFAULT_PREFERENCES.inApp.types,
          ...(data.inApp?.types || {}),
        },
      },
      push: {
        enabled: data.push?.enabled ?? DEFAULT_PREFERENCES.push.enabled,
      },
    };
  };

  // Check if preferences have changed
  useEffect(() => {
    if (originalPreferences) {
      const changed = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
      setHasChanges(changed);
    }
  }, [preferences, originalPreferences]);

  // Handle toggle for main switches
  const handleToggle = useCallback((category, field) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !prev[category][field],
      },
    }));
  }, []);

  // Handle toggle for notification types
  const handleTypeToggle = useCallback((category, type) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        types: {
          ...prev[category].types,
          [type]: !prev[category].types[type],
        },
      },
    }));
  }, []);

  // Handle frequency change
  const handleFrequencyChange = useCallback((value) => {
    setPreferences((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        frequency: value,
      },
    }));
  }, []);

  // Toggle all types for a category
  const toggleAllTypes = useCallback((category, enabled) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        types: Object.keys(prev[category].types).reduce((acc, key) => {
          acc[key] = enabled;
          return acc;
        }, {}),
      },
    }));
  }, []);

  // Save preferences
  const handleSave = async () => {
    setSaving(true);
    try {
      await notificationService.updatePreferences(preferences);
      setOriginalPreferences(preferences);
      setHasChanges(false);
      toastService.success('Đã lưu cài đặt thông báo');
      console.log('[NotificationSettings] Saved preferences:', preferences);
    } catch (error) {
      console.error('[NotificationSettings] Failed to save preferences:', error);
      toastService.error('Không thể lưu cài đặt. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // Reset to original
  const handleReset = () => {
    if (originalPreferences) {
      setPreferences(originalPreferences);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p>Đang tải cài đặt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>🔔</span>
            Cài đặt thông báo
          </h1>
          <p className={styles.subtitle}>
            Quản lý cách bạn nhận thông báo từ hệ thống
          </p>
        </div>
        {user && (
          <div className={styles.userBadge}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userEmail}>{user.email}</span>
          </div>
        )}
      </div>

      {/* Email Notifications Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>📧</div>
          <div className={styles.sectionInfo}>
            <h2 className={styles.sectionTitle}>Thông báo qua Email</h2>
            <p className={styles.sectionDescription}>
              Nhận thông báo quan trọng qua email
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={preferences.email.enabled}
              onChange={() => handleToggle('email', 'enabled')}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        {preferences.email.enabled && (
          <div className={styles.sectionContent}>
            {/* Email Frequency */}
            <div className={styles.frequencyGroup}>
              <label className={styles.frequencyLabel}>Tần suất gửi email:</label>
              <div className={styles.frequencyOptions}>
                {FREQUENCY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`${styles.frequencyOption} ${
                      preferences.email.frequency === option.value ? styles.frequencyActive : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="emailFrequency"
                      value={option.value}
                      checked={preferences.email.frequency === option.value}
                      onChange={(e) => handleFrequencyChange(e.target.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Email Types */}
            <div className={styles.typesGroup}>
              <div className={styles.typesHeader}>
                <span className={styles.typesLabel}>Loại thông báo:</span>
                <button
                  type="button"
                  className={styles.toggleAllBtn}
                  onClick={() => toggleAllTypes('email', true)}
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  className={styles.toggleAllBtn}
                  onClick={() => toggleAllTypes('email', false)}
                >
                  Bỏ chọn tất cả
                </button>
              </div>
              <div className={styles.typesList}>
                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([key, label]) => (
                  <label key={key} className={styles.typeItem}>
                    <input
                      type="checkbox"
                      checked={preferences.email.types[key] || false}
                      onChange={() => handleTypeToggle('email', key)}
                    />
                    <span className={styles.checkmark}></span>
                    <span className={styles.typeLabel}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* In-App Notifications Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>🔔</div>
          <div className={styles.sectionInfo}>
            <h2 className={styles.sectionTitle}>Thông báo trong ứng dụng</h2>
            <p className={styles.sectionDescription}>
              Hiển thị thông báo khi bạn đang sử dụng hệ thống
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={preferences.inApp.enabled}
              onChange={() => handleToggle('inApp', 'enabled')}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        {preferences.inApp.enabled && (
          <div className={styles.sectionContent}>
            <div className={styles.typesGroup}>
              <div className={styles.typesHeader}>
                <span className={styles.typesLabel}>Loại thông báo:</span>
                <button
                  type="button"
                  className={styles.toggleAllBtn}
                  onClick={() => toggleAllTypes('inApp', true)}
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  className={styles.toggleAllBtn}
                  onClick={() => toggleAllTypes('inApp', false)}
                >
                  Bỏ chọn tất cả
                </button>
              </div>
              <div className={styles.typesList}>
                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([key, label]) => (
                  <label key={key} className={styles.typeItem}>
                    <input
                      type="checkbox"
                      checked={preferences.inApp.types[key] || false}
                      onChange={() => handleTypeToggle('inApp', key)}
                    />
                    <span className={styles.checkmark}></span>
                    <span className={styles.typeLabel}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Push Notifications Section (Optional/Coming Soon) */}
      <section className={`${styles.section} ${styles.sectionDisabled}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>📱</div>
          <div className={styles.sectionInfo}>
            <h2 className={styles.sectionTitle}>
              Thông báo đẩy
              <span className={styles.comingSoonBadge}>Sắp ra mắt</span>
            </h2>
            <p className={styles.sectionDescription}>
              Nhận thông báo trên thiết bị di động
            </p>
          </div>
          <label className={`${styles.switch} ${styles.switchDisabled}`}>
            <input
              type="checkbox"
              checked={preferences.push.enabled}
              onChange={() => handleToggle('push', 'enabled')}
              disabled
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </section>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.resetBtn}
          onClick={handleReset}
          disabled={!hasChanges || saving}
        >
          Hoàn tác
        </button>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <>
              <span className={styles.btnSpinner}></span>
              Đang lưu...
            </>
          ) : (
            'Lưu cài đặt'
          )}
        </button>
      </div>

      {/* Unsaved changes indicator */}
      {hasChanges && (
        <div className={styles.unsavedBanner}>
          <span className={styles.unsavedIcon}>⚠️</span>
          <span>Bạn có thay đổi chưa được lưu</span>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;

