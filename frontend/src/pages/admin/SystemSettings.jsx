import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toastService from '../../services/toastService';
import styles from './SystemSettings.module.css';

/**
 * System Settings Page
 * Platform configuration and feature toggles for administrators
 */
const SystemSettings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    const [settings, setSettings] = useState({
        // General Settings
        general: {
            siteName: 'MasterDev',
            siteDescription: 'Online Learning Platform for IELTS Preparation',
            supportEmail: 'support@ieltshub.com',
            timezone: 'Asia/Ho_Chi_Minh',
            language: 'vi',
            maintenanceMode: false,
            registrationEnabled: true
        },
        // Feature Toggles
        features: {
            liveVideoSessions: true,
            discussionForum: true,
            quizSystem: true,
            certificateGeneration: true,
            courseRatings: true,
            socialSharing: true,
            aiAssistant: false,
            gamification: false,
            multiLanguage: false
        },
        // Security Settings
        security: {
            maxLoginAttempts: 5,
            sessionTimeout: 30, // minutes
            passwordMinLength: 8,
            requireStrongPassword: true,
            enable2FA: false,
            ipWhitelist: [],
            ipBlacklist: []
        },
        // Email Settings
        email: {
            provider: 'sendgrid',
            fromName: 'MasterDev',
            fromEmail: 'noreply@ieltshub.com',
            replyToEmail: 'support@ieltshub.com',
            enableEmailNotifications: true,
            dailyDigestEnabled: true
        },
        // Storage Settings
        storage: {
            maxFileSize: 100, // MB
            allowedVideoFormats: ['mp4', 'webm', 'mov'],
            allowedDocumentFormats: ['pdf', 'doc', 'docx', 'ppt', 'pptx'],
            allowedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            storageQuotaPerUser: 1000 // MB
        },
        // Payment Settings
        payment: {
            currency: 'VND',
            enablePayments: true,
            paymentGateways: {
                stripe: false,
                paypal: false,
                vnpay: true,
                momo: true
            },
            taxRate: 10 // percentage
        }
    });

    useEffect(() => {
        if (user?.role !== 'admin') {
            toastService.error('You do not have access');
            navigate('/dashboard');
            return;
        }

        loadSettings();
    }, [user, navigate]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            // TODO: Tạo API endpoint /admin/settings ở backend
            // const response = await api.get('/admin/settings');
            // if (response.data.success) {
            //     setSettings(response.data.data);
            // }

            // Tạm thời giữ lại default settings vì chưa có API
            console.warn('[SystemSettings] API chưa được implement');
        } catch (error) {
            console.error('[SystemSettings] Error loading:', error);
            toastService.error('Unable to load system settings');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            // TODO: Tạo API endpoint /admin/settings ở backend
            // const response = await api.put('/admin/settings', settings);
            // if (response.data.success) {
            //     toastService.success('Cài đặt đã được lưu');
            // }

            toastService.warning('This feature is not connected to the backend');
        } catch (error) {
            console.error('[SystemSettings] Error saving:', error);
            toastService.error('Unable to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = (section, key) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: !prev[section][key]
            }
        }));
    };

    const handleChange = (section, key, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    const handlePaymentGatewayToggle = (gateway) => {
        setSettings(prev => ({
            ...prev,
            payment: {
                ...prev.payment,
                paymentGateways: {
                    ...prev.payment.paymentGateways,
                    [gateway]: !prev.payment.paymentGateways[gateway]
                }
            }
        }));
    };

    const tabs = [
        { id: 'general', label: 'General', icon: '⚙️' },
        { id: 'features', label: 'Features', icon: '🔧' },
        { id: 'security', label: 'Security', icon: '🔒' },
        { id: 'email', label: 'Email', icon: '📧' },
        { id: 'storage', label: 'Storage', icon: '💾' },
        { id: 'payment', label: 'Payment', icon: '💳' }
    ];

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>System Settings</h1>
                    <p className={styles.subtitle}>
                        Configure platform settings and features
                    </p>
                </div>
            </div>

            <div className={styles.layout}>
                {/* Tabs Navigation */}
                <div className={styles.sidebar}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className={styles.tabIcon}>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className={styles.content}>
                    {activeTab === 'general' && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>General Settings</h2>

                            <div className={styles.field}>
                                <label className={styles.label}>Site Name</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={settings.general.siteName}
                                    onChange={(e) => handleChange('general', 'siteName', e.target.value)}
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Site Description</label>
                                <textarea
                                    className={styles.textarea}
                                    rows={3}
                                    value={settings.general.siteDescription}
                                    onChange={(e) => handleChange('general', 'siteDescription', e.target.value)}
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Support Email</label>
                                <input
                                    type="email"
                                    className={styles.input}
                                    value={settings.general.supportEmail}
                                    onChange={(e) => handleChange('general', 'supportEmail', e.target.value)}
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Timezone</label>
                                <select
                                    className={styles.select}
                                    value={settings.general.timezone}
                                    onChange={(e) => handleChange('general', 'timezone', e.target.value)}
                                >
                                    <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (GMT+7)</option>
                                    <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                                    <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                                    <option value="UTC">UTC (GMT+0)</option>
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Default Language</label>
                                <select
                                    className={styles.select}
                                    value={settings.general.language}
                                    onChange={(e) => handleChange('general', 'language', e.target.value)}
                                >
                                    <option value="vi">Tiếng Việt</option>
                                    <option value="en">English</option>
                                </select>
                            </div>

                            <div className={styles.toggleField}>
                                <div>
                                    <div className={styles.toggleLabel}>Maintenance Mode</div>
                                    <div className={styles.toggleDesc}>
                                        Temporarily disable access for non-admin users
                                    </div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={settings.general.maintenanceMode}
                                        onChange={() => handleToggle('general', 'maintenanceMode')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.toggleField}>
                                <div>
                                    <div className={styles.toggleLabel}>Registration Enabled</div>
                                    <div className={styles.toggleDesc}>
                                        Allow new users to register
                                    </div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={settings.general.registrationEnabled}
                                        onChange={() => handleToggle('general', 'registrationEnabled')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>


                        </div>
                    )}

                    {activeTab === 'features' && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Feature Toggles</h2>
                            <p className={styles.sectionDesc}>
                                Enable or disable platform features
                            </p>

                            {Object.entries(settings.features).map(([key, value]) => (
                                <div key={key} className={styles.toggleField}>
                                    <div>
                                        <div className={styles.toggleLabel}>
                                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </div>
                                    </div>
                                    <label className={styles.switch}>
                                        <input
                                            type="checkbox"
                                            checked={value}
                                            onChange={() => handleToggle('features', key)}
                                        />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Security Settings</h2>

                            <div className={styles.field}>
                                <label className={styles.label}>Max Login Attempts</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={settings.security.maxLoginAttempts}
                                    onChange={(e) => handleChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                                    min="3"
                                    max="10"
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Session Timeout (minutes)</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={settings.security.sessionTimeout}
                                    onChange={(e) => handleChange('security', 'sessionTimeout', parseInt(e.target.value))}
                                    min="15"
                                    max="120"
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Password Minimum Length</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={settings.security.passwordMinLength}
                                    onChange={(e) => handleChange('security', 'passwordMinLength', parseInt(e.target.value))}
                                    min="6"
                                    max="20"
                                />
                            </div>

                            <div className={styles.toggleField}>
                                <div>
                                    <div className={styles.toggleLabel}>Require Strong Password</div>
                                    <div className={styles.toggleDesc}>
                                        Require uppercase, lowercase, numbers, and special characters
                                    </div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={settings.security.requireStrongPassword}
                                        onChange={() => handleToggle('security', 'requireStrongPassword')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.toggleField}>
                                <div>
                                    <div className={styles.toggleLabel}>Enable 2FA</div>
                                    <div className={styles.toggleDesc}>
                                        Enable two-factor authentication for all users
                                    </div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={settings.security.enable2FA}
                                        onChange={() => handleToggle('security', 'enable2FA')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'email' && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Email Settings</h2>

                            <div className={styles.field}>
                                <label className={styles.label}>Email Provider</label>
                                <select
                                    className={styles.select}
                                    value={settings.email.provider}
                                    onChange={(e) => handleChange('email', 'provider', e.target.value)}
                                >
                                    <option value="sendgrid">SendGrid</option>
                                    <option value="smtp">SMTP</option>
                                    <option value="mailgun">Mailgun</option>
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>From Name</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={settings.email.fromName}
                                    onChange={(e) => handleChange('email', 'fromName', e.target.value)}
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>From Email</label>
                                <input
                                    type="email"
                                    className={styles.input}
                                    value={settings.email.fromEmail}
                                    onChange={(e) => handleChange('email', 'fromEmail', e.target.value)}
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Reply-To Email</label>
                                <input
                                    type="email"
                                    className={styles.input}
                                    value={settings.email.replyToEmail}
                                    onChange={(e) => handleChange('email', 'replyToEmail', e.target.value)}
                                />
                            </div>

                            <div className={styles.toggleField}>
                                <div>
                                    <div className={styles.toggleLabel}>Enable Email Notifications</div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={settings.email.enableEmailNotifications}
                                        onChange={() => handleToggle('email', 'enableEmailNotifications')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.toggleField}>
                                <div>
                                    <div className={styles.toggleLabel}>Daily Digest Enabled</div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={settings.email.dailyDigestEnabled}
                                        onChange={() => handleToggle('email', 'dailyDigestEnabled')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'storage' && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Storage Settings</h2>

                            <div className={styles.field}>
                                <label className={styles.label}>Max File Size (MB)</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={settings.storage.maxFileSize}
                                    onChange={(e) => handleChange('storage', 'maxFileSize', parseInt(e.target.value))}
                                    min="1"
                                    max="500"
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Storage Quota Per User (MB)</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={settings.storage.storageQuotaPerUser}
                                    onChange={(e) => handleChange('storage', 'storageQuotaPerUser', parseInt(e.target.value))}
                                    min="100"
                                    max="10000"
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Allowed Video Formats</label>
                                <div className={styles.tagList}>
                                    {settings.storage.allowedVideoFormats.map(format => (
                                        <span key={format} className={styles.tag}>{format}</span>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Allowed Document Formats</label>
                                <div className={styles.tagList}>
                                    {settings.storage.allowedDocumentFormats.map(format => (
                                        <span key={format} className={styles.tag}>{format}</span>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Allowed Image Formats</label>
                                <div className={styles.tagList}>
                                    {settings.storage.allowedImageFormats.map(format => (
                                        <span key={format} className={styles.tag}>{format}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Payment Settings</h2>

                            <div className={styles.field}>
                                <label className={styles.label}>Currency</label>
                                <select
                                    className={styles.select}
                                    value={settings.payment.currency}
                                    onChange={(e) => handleChange('payment', 'currency', e.target.value)}
                                >
                                    <option value="VND">VND - Vietnamese Dong</option>
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="EUR">EUR - Euro</option>
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Tax Rate (%)</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={settings.payment.taxRate}
                                    onChange={(e) => handleChange('payment', 'taxRate', parseInt(e.target.value))}
                                    min="0"
                                    max="100"
                                />
                            </div>

                            <div className={styles.toggleField}>
                                <div>
                                    <div className={styles.toggleLabel}>Enable Payments</div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={settings.payment.enablePayments}
                                        onChange={() => handleToggle('payment', 'enablePayments')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            <div className={styles.subsection}>
                                <h3 className={styles.subsectionTitle}>Payment Gateways</h3>
                                {Object.entries(settings.payment.paymentGateways).map(([gateway, enabled]) => (
                                    <div key={gateway} className={styles.toggleField}>
                                        <div>
                                            <div className={styles.toggleLabel}>
                                                {gateway.charAt(0).toUpperCase() + gateway.slice(1)}
                                            </div>
                                        </div>
                                        <label className={styles.switch}>
                                            <input
                                                type="checkbox"
                                                checked={enabled}
                                                onChange={() => handlePaymentGatewayToggle(gateway)}
                                            />
                                            <span className={styles.slider}></span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Save Button */}
            <div className={styles.footer}>
                <button
                    className={styles.saveBtn}
                    onClick={saveSettings}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
                <button
                    className={styles.cancelBtn}
                    onClick={loadSettings}
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default SystemSettings;
