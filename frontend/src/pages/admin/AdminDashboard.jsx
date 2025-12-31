import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toastService from '../../services/toastService';
import api from '../../services/api';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import styles from './AdminDashboard.module.css';

/**
 * Admin Dashboard
 * System overview and monitoring for administrators
 */
const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [systemHealth, setSystemHealth] = useState({
        status: 'healthy',
        uptime: '99.8%',
        storageUsed: 65,
        storageUsedGB: 650,
        totalStorageGB: 1000,
        avgResponseTime: 145,
        activeConnections: 342
    });

    const [platformStats, setPlatformStats] = useState({
        totalUsers: 12543,
        totalCourses: 456,
        totalLessons: 3421,
        totalQuizzes: 892,
        activeUsers: 1247,
        activeUsersChange: 12.5,
        newUsersToday: 45,
        coursesPublished: 423,
        revenue: 125430
    });

    const [userStats, setUserStats] = useState({
        total: 12543,
        students: 11234,
        teachers: 1287,
        admins: 22,
        activeToday: 1247,
        pending: 156,
        verified: 12387
    });

    const [liveActivities, setLiveActivities] = useState([
        {
            id: 1,
            type: 'user_register',
            description: 'New user registered',
            user: { name: 'John Doe', email: 'john@example.com' },
            timestamp: new Date(Date.now() - 2 * 60 * 1000),
            ip: '192.168.1.1'
        },
        {
            id: 2,
            type: 'course_published',
            description: 'Course published: Advanced React Patterns',
            user: { name: 'Jane Smith', email: 'jane@example.com' },
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            ip: '192.168.1.2'
        },
        {
            id: 3,
            type: 'payment_completed',
            description: 'Payment completed: $99.00',
            user: { name: 'Bob Wilson', email: 'bob@example.com' },
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            ip: '192.168.1.3'
        },
        {
            id: 4,
            type: 'user_login',
            description: 'User logged in',
            user: { name: 'Alice Brown', email: 'alice@example.com' },
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            ip: '192.168.1.4'
        },
        {
            id: 5,
            type: 'discussion_post',
            description: 'New discussion post created',
            user: { name: 'Charlie Davis', email: 'charlie@example.com' },
            timestamp: new Date(Date.now() - 20 * 60 * 1000),
            ip: '192.168.1.5'
        }
    ]);

    const [userGrowthData, setUserGrowthData] = useState([
        { month: 'Jan', users: 8500 },
        { month: 'Feb', users: 9200 },
        { month: 'Mar', users: 9800 },
        { month: 'Apr', users: 10400 },
        { month: 'May', users: 11100 },
        { month: 'Jun', users: 11800 },
        { month: 'Jul', users: 12543 }
    ]);

    const [courseStats] = useState([
        { name: 'Active', value: 423, color: '#10B981' },
        { name: 'Draft', value: 23, color: '#F59E0B' },
        { name: 'Archived', value: 10, color: '#6B7280' }
    ]);

    const [recentAdminActions] = useState([
        {
            id: 1,
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            admin: 'Admin User',
            action: 'User Role Changed',
            target: 'john@example.com',
            ip: '192.168.1.100'
        },
        {
            id: 2,
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
            admin: 'Admin User',
            action: 'Course Approved',
            target: 'Advanced React Patterns',
            ip: '192.168.1.100'
        },
        {
            id: 3,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            admin: 'Admin User',
            action: 'User Banned',
            target: 'spam@example.com',
            ip: '192.168.1.100'
        }
    ]);

    useEffect(() => {
        if (user?.role !== 'admin') {
            toastService.error('You do not have access');
            navigate('/dashboard');
            return;
        }

        loadDashboardData();
    }, [user, navigate]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/analytics/dashboard');
            if (response.data.success && response.data.data) {
                const data = response.data.data;
                if (data.platformStats) {
                    setPlatformStats(prev => ({ ...prev, ...data.platformStats }));
                }
                if (data.userStats) {
                    setUserStats(prev => ({ ...prev, ...data.userStats }));
                }
                if (data.systemHealth) {
                    setSystemHealth(prev => ({ ...prev, ...data.systemHealth }));
                }
                if (data.activities) {
                    setLiveActivities(data.activities);
                }
                if (data.userGrowth) {
                    setUserGrowthData(data.userGrowth);
                }
            }
        } catch (error) {
            console.error('[AdminDashboard] Error loading data:', error);
            toastService.error('Unable to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    const getActivityIcon = (type) => {
        const icons = {
            user_register: '👤',
            course_published: '📚',
            payment_completed: '💰',
            user_login: '🔐',
            discussion_post: '💬'
        };
        return icons[type] || '📝';
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            {/* Header Banner */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div>
                        <h1 className={styles.title}>System Administration</h1>
                        <p className={styles.subtitle}>
                            Managing {platformStats.totalUsers.toLocaleString()} users across{' '}
                            {platformStats.totalCourses} courses
                        </p>
                    </div>
                    <div className={styles.headerStats}>
                        <div className={styles.systemStatus}>
                            <span className={`${styles.statusDot} ${styles[systemHealth.status]}`}></span>
                            <div>
                                <div className={styles.statusValue}>{systemHealth.status}</div>
                                <div className={styles.statusLabel}>System Status</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Metrics */}
            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ backgroundColor: '#DBEAFE' }}>
                        👥
                    </div>
                    <div className={styles.metricContent}>
                        <div className={styles.metricValue}>{platformStats.activeUsers.toLocaleString()}</div>
                        <div className={styles.metricLabel}>Active Users</div>
                        <div className={styles.metricTrend}>
                            <span className={styles.trendUp}>↑ {platformStats.activeUsersChange}%</span>
                            <span className={styles.trendText}>vs last week</span>
                        </div>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ backgroundColor: '#D1FAE5' }}>
                        🗄️
                    </div>
                    <div className={styles.metricContent}>
                        <div className={styles.metricValue}>{systemHealth.storageUsed}%</div>
                        <div className={styles.metricLabel}>Storage Used</div>
                        <div className={styles.metricDetail}>
                            {systemHealth.storageUsedGB}GB / {systemHealth.totalStorageGB}GB
                        </div>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ backgroundColor: '#FEF3C7' }}>
                        ⚡
                    </div>
                    <div className={styles.metricContent}>
                        <div className={styles.metricValue}>{systemHealth.avgResponseTime}ms</div>
                        <div className={styles.metricLabel}>API Response</div>
                        <div className={styles.metricDetail}>Average last 24h</div>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ backgroundColor: '#E0E7FF' }}>
                        🔗
                    </div>
                    <div className={styles.metricContent}>
                        <div className={styles.metricValue}>{systemHealth.activeConnections}</div>
                        <div className={styles.metricLabel}>Active Connections</div>
                        <div className={styles.metricDetail}>Real-time</div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className={styles.mainGrid}>
                {/* Live Activity Feed */}
                <div className={styles.activitySection}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Live Activity Feed</h2>
                            <button className={styles.refreshBtn} onClick={loadDashboardData}>
                                🔄 Refresh
                            </button>
                        </div>
                        <div className={styles.activityList}>
                            {liveActivities.map((activity) => (
                                <div key={activity.id} className={styles.activityItem}>
                                    <div className={styles.activityIcon}>
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className={styles.activityContent}>
                                        <p className={styles.activityDescription}>{activity.description}</p>
                                        <div className={styles.activityMeta}>
                                            <span className={styles.activityTime}>
                                                {formatTimeAgo(activity.timestamp)}
                                            </span>
                                            <span className={styles.activityUser}>{activity.user.fullName}</span>
                                            <span className={styles.activityIP}>IP: {activity.ip}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className={styles.statsSection}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>User Statistics</h2>
                        </div>
                        <div className={styles.statsList}>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Total Users</span>
                                <span className={styles.statValue}>{userStats.total.toLocaleString()}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Students</span>
                                <span className={styles.statValue}>{userStats.students.toLocaleString()}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Teachers</span>
                                <span className={styles.statValue}>{userStats.teachers.toLocaleString()}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Pending Verification</span>
                                <span className={styles.statValue}>{userStats.pending}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Quick Actions</h2>
                        </div>
                        <div className={styles.quickActions}>
                            <button
                                className={styles.actionBtn}
                                onClick={() => navigate('/admin/users')}
                            >
                                👥 Manage Users
                            </button>
                            <button
                                className={styles.actionBtn}
                                onClick={() => navigate('/admin/courses/approval')}
                            >
                                📚 Manage Courses
                            </button>
                            <button
                                className={styles.actionBtn}
                                onClick={() => navigate('/admin/moderation')}
                            >
                                🚨 Content Moderation
                            </button>
                            <button
                                className={styles.actionBtn}
                                onClick={() => navigate('/admin/settings')}
                            >
                                ⚙️ System Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className={styles.chartsGrid}>
                {/* User Growth Chart */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>User Growth</h2>
                    </div>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={userGrowthData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="users"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    dot={{ fill: '#3B82F6' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Course Distribution */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Course Status Distribution</h2>
                    </div>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={courseStats}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {courseStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Admin Actions */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Recent Admin Actions</h2>
                </div>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Admin</th>
                                <th>Action</th>
                                <th>Target</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentAdminActions.map((action) => (
                                <tr key={action.id}>
                                    <td>{formatTimeAgo(action.timestamp)}</td>
                                    <td>{action.admin}</td>
                                    <td>{action.action}</td>
                                    <td>{action.target}</td>
                                    <td>{action.ip}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
