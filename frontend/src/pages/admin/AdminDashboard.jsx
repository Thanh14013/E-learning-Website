import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toastService from '../../services/toastService';
import api from '../../services/api';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        totalUsers: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalCourses: 0,
        totalEnrollments: 0,
        activeUsers: 0,
        userGrowth: [],
        enrollmentGrowth: [],
        userDistribution: [],
        topCourses: []
    });

    useEffect(() => {
        if (user?.role !== 'admin') {
            toastService.error('Access Denied');
            navigate('/dashboard');
            return;
        }
        fetchDashboardData();
    }, [user, navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/analytics/dashboard');
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch admin stats:', error);
            toastService.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Welcome back, {user?.fullName?.split(' ')[0]} 👋</h1>
                    <p className={styles.subtitle}>Here is what's happening on your platform today.</p>
                </div>
            </div>

            {/* Metric Cards */}
            <div className={styles.metricsGrid}>
                <MetricCard
                    title="Total Users"
                    value={data.totalUsers.toLocaleString()}
                    icon="👥"
                    color="#6366f1"
                    trend={data.userGrowth}
                    trendKey="users"
                />
                <MetricCard
                    title="Active Students"
                    value={data.activeUsers.toLocaleString()}
                    icon="⚡"
                    color="#10b981"
                    subtitle="Last 30 days"
                />
                <MetricCard
                    title="Total Enrollments"
                    value={data.totalEnrollments.toLocaleString()}
                    icon="🎓"
                    color="#f59e0b"
                    trend={data.enrollmentGrowth}
                    trendKey="enrollments"
                />
                <MetricCard
                    title="Total Courses"
                    value={data.totalCourses.toLocaleString()}
                    icon="📚"
                    color="#ec4899"
                />
            </div>

            {/* Charts Section */}
            <div className={styles.chartsGrid}>
                {/* Main Growth Chart */}
                <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Platform Growth</h2>
                    </div>
                    <div className={styles.chartContainer} style={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.userGrowth}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="users"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorUsers)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Secondary Charts Row */}
                <div className={styles.chartCard}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>User Distribution</h2>
                    </div>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.userDistribution}
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.userDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Courses List */}
                <div className={styles.listCard}>
                    <div className={styles.listHeader}>
                        <h2 className={styles.cardTitle}>Top Performing Courses</h2>
                    </div>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Course Name</th>
                                    <th>Students</th>
                                    <th>Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.topCourses.map((course) => (
                                    <tr key={course.courseId}>
                                        <td style={{ fontWeight: 500 }}>{course.title}</td>
                                        <td>{course.students.toLocaleString()}</td>
                                        <td>
                                            <span style={{ color: '#fbbf24' }}>★</span> {course.rating.toFixed(1)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mini Component for Metric Cards
const MetricCard = ({ title, value, icon, color, subtitle, trend, trendKey }) => (
    <div className={styles.metricCard}>
        <div className={styles.metricContent} style={{ width: '100%' }}>
            <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>{title}</span>
                <div className={styles.metricIcon} style={{ color: color }}>
                    {icon}
                </div>
            </div>
            <div className={styles.metricValue}>{value}</div>
            {subtitle && <div className={styles.metricDetail}>{subtitle}</div>}

            {/* Tiny Trend Chart Area */}
            {trend && trend.length > 0 && (
                <div style={{ height: 40, marginTop: 10 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend}>
                            <Area type="monotone" dataKey={trendKey} stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    </div>
);

export default AdminDashboard;
