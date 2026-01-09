import React, { useEffect, useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
    LineChart,
    Line
} from "recharts";
import { FaUsers, FaBook, FaUserGraduate, FaClipboardList } from "react-icons/fa";
import analyticsService from "../../services/analyticsService";
import styles from "./AdminAnalytics.module.css";
import toastService from "../../services/toastService";

const AdminAnalytics = () => {
    const formatDateLabel = (label) => {
        if (!label) return '';
        if (typeof label === 'string') {
            // YYYY-MM-DD -> DD/MM/YYYY
            if (label.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = label.split('-');
                return `${day}/${month}/${year}`;
            }
            // YYYY-MM -> MM/YYYY
            if (label.match(/^\d{4}-\d{2}$/)) {
                const [year, month] = label.split('-');
                return `${month}/${year}`;
            }
        }
        return label;
    };

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await analyticsService.getDashboardAnalytics();
                if (response.success) {
                    setStats(response.data);
                } else {
                    toastService.error("Failed to load analytics data");
                }
            } catch (error) {
                console.error("Error fetching analytics:", error);
                toastService.error("Error loading analytics");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className={styles.container}>
                <div className={styles.errorMessage}>
                    Failed to load analytics data. Please try again later.
                </div>
            </div>
        );
    }

    // --- Chart Colors ---
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
    const STATUS_COLORS = {
        Active: "#10B981",
        Pending: "#F59E0B",
        Rejected: "#EF4444"
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Analytics Dashboard</h1>
                <p>Overview of platform performance and key metrics.</p>
            </header>

            {/* KPI Cards */}
            <div className={styles.statsGrid}>
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={<FaUsers color="#3B82F6" />}
                />
                <StatCard
                    title="Total Courses"
                    value={stats.totalCourses}
                    icon={<FaBook color="#8B5CF6" />}
                />
                <StatCard
                    title="Total Enrollments"
                    value={stats.totalEnrollments}
                    icon={<FaUserGraduate color="#10B981" />}
                />
                <StatCard
                    title="Pending Approvals"
                    value={stats.pendingCourseApprovals}
                    icon={<FaClipboardList color="#F59E0B" />}
                />
            </div>

            {/* Charts Grid */}
            <div className={styles.chartsGrid}>

                {/* Enrollment Growth */}
                <div className={`${styles.chartCard} ${styles.fullWidth}`}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>Enrollment Growth (Last 6 Months)</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={stats.enrollmentGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#000' }}
                                itemStyle={{ color: '#000' }}
                                labelStyle={{ color: '#000' }}
                                labelFormatter={formatDateLabel}
                            />
                            <Area
                                type="monotone"
                                dataKey="enrollments"
                                stroke="#3B82F6"
                                fill="#DBEAFE"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* User Growth */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>New Users (Last 6 Months)</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.userGrowth}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                            <Tooltip
                                cursor={{ fill: '#F3F4F6' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#000' }}
                                itemStyle={{ color: '#000' }}
                                labelStyle={{ color: '#000' }}
                                labelFormatter={formatDateLabel}
                            />
                            <Bar dataKey="users" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Course Status Distribution */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>Course Status Distribution</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stats.courseDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stats.courseDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#000' }}
                                itemStyle={{ color: '#000' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* User Roles Distribution */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>User Roles Distribution</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stats.userDistribution}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {stats.userDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#000' }}
                                itemStyle={{ color: '#000' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>



                {/* Learning Frequency (Last 30 Days) */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>Video Call Frequency (Last 30 Days)</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.dailyLearningActivity} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="date"
                                stroke="#9CA3AF"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(str) => str.slice(5)} // Show MM-DD
                            />
                            <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#000' }}
                                itemStyle={{ color: '#000' }}
                                labelStyle={{ color: '#000' }}
                                labelFormatter={(label) => `Date: ${formatDateLabel(label)}`}
                            />
                            <Line type="monotone" dataKey="activities" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Courses */}
                <div className={`${styles.chartCard} ${styles.fullWidth}`}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>Top 5 Popular Courses</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={stats.topCourses}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                            <XAxis type="number" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                            <YAxis type="category" dataKey="title" width={150} stroke="#4B5563" tick={{ fontSize: 12 }} />
                            <Tooltip
                                cursor={{ fill: '#F3F4F6' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#000' }}
                                itemStyle={{ color: '#000' }}
                                labelStyle={{ color: '#000' }}
                            />
                            <Bar dataKey="students" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Rating Distribution */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>Course Ratings (Votes)</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.ratingDistribution}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#000' }}
                                itemStyle={{ color: '#000' }}
                                labelStyle={{ color: '#000' }}
                            />
                            <Bar dataKey="value" fill="#FBBF24" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Lesson Progress Distribution */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>Lesson Completion Status</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stats.lessonProgressDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stats.lessonProgressDistribution?.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#000' }}
                                itemStyle={{ color: '#000' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Course Levels */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>Course Levels</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stats.levelDistribution}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {stats.levelDistribution?.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#000' }}
                                itemStyle={{ color: '#000' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Course Categories */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>Top Categories</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stats.categoryDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                fill="#82ca9d"
                                dataKey="value"
                                label={({ name }) => name}
                            >
                                {stats.categoryDistribution?.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#000' }}
                                itemStyle={{ color: '#000' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

            </div>
        </div >
    );
};

const StatCard = ({ title, value, icon }) => (
    <div className={styles.statsCard}>
        <div className={styles.statsHeader}>
            <span className={styles.statsTitle}>{title}</span>
            <div className={styles.statsIcon} style={{ background: '#F3F4F6' }}>
                {icon}
            </div>
        </div>
        <span className={styles.statsValue}>{value}</span>
    </div>
);

export default AdminAnalytics;
