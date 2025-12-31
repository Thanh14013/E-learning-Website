import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import toastService from "../../services/toastService";
import { Button } from "../../components/common/Button";
import styles from "./CourseAnalytics.module.css";

const CourseAnalytics = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [days, setDays] = useState(30);

    useEffect(() => {
        if (user?.role !== "teacher" && user?.role !== "admin") {
            toastService.error("You do not have access");
            navigate("/teacher/dashboard");
            return;
        }
        fetchAnalytics(days);
    }, [courseId, days]);

    const fetchAnalytics = async (range) => {
        try {
            setLoading(true);
            const res = await api.get(`/teacher/analytics/course/${courseId}`, {
                params: { days: range },
            });
            setAnalytics(res.data?.data || res.data);
        } catch (error) {
            console.error("[CourseAnalytics] fetch error", error);
            toastService.error("Unable to load course analytics");
        } finally {
            setLoading(false);
        }
    };

    const trendData = useMemo(() => {
        const trend = analytics?.trend || {};
        const dates = trend.dates || [];
        return dates.map((d, idx) => ({
            date: new Date(d).toLocaleDateString("en-US"),
            totalStudents: trend.totalStudents?.[idx] ?? 0,
            activeStudents: trend.activeStudents?.[idx] ?? 0,
            completionRate: trend.completionRate?.[idx] ?? 0,
            completedLessons: trend.completedLessons?.[idx] ?? 0,
        }));
    }, [analytics]);

    const current = analytics?.current || {};
    const growth = analytics?.growth || {};

    if (loading) {
        return <div className={styles.loading}>Loading analytics...</div>;
    }

    if (!analytics) {
        return (
            <div className={styles.errorState}>
                <p>No analytics found for this course.</p>
                <Button onClick={() => navigate(-1)}>Back</Button>
            </div>
        );
    }

    const summaryCards = [
        { label: "Total students", value: current.totalStudents ?? 0 },
        { label: "Active (7d)", value: current.activeStudents ?? 0 },
        { label: "Completion rate", value: `${current.completionRate ?? 0}%` },
        { label: "Average watch time", value: `${current.averageWatchTime ?? 0}m` },
        { label: "Total lessons", value: current.totalLessons ?? 0 },
        { label: "Completed lessons", value: current.completedLessons ?? 0 },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Course Analytics</h1>
                    <p className={styles.subheading}>Course ID: {courseId}</p>
                </div>
                <div className={styles.headerActions}>
                    <label className={styles.rangeLabel}>
                        Range
                        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                        </select>
                    </label>
                    <Button variant="secondary" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </div>
            </div>

            <div className={styles.summaryGrid}>
                {summaryCards.map((card) => (
                    <div key={card.label} className={styles.summaryCard}>
                        <span className={styles.cardLabel}>{card.label}</span>
                        <span className={styles.cardValue}>{card.value}</span>
                    </div>
                ))}
            </div>

            <div className={styles.growthGrid}>
                <div className={styles.growthCard}>
                    <h3>Student growth</h3>
                    <p className={styles.growthValue}>{Math.round((growth.studentsGrowth ?? 0) * 10) / 10}%</p>
                    <span className={styles.growthHint}>vs previous period</span>
                </div>
                <div className={styles.growthCard}>
                    <h3>Active students</h3>
                    <p className={styles.growthValue}>{Math.round((growth.activeStudentsGrowth ?? 0) * 10) / 10}%</p>
                    <span className={styles.growthHint}>vs previous period</span>
                </div>
                <div className={styles.growthCard}>
                    <h3>Completion rate</h3>
                    <p className={styles.growthValue}>{Math.round((growth.completionRateGrowth ?? 0) * 10) / 10}%</p>
                    <span className={styles.growthHint}>vs previous period</span>
                </div>
            </div>

            <div className={styles.chartSection}>
                <div className={styles.chartHeader}>
                    <h3>Enrollment & Engagement</h3>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={trendData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="totalStudents" name="Total students" stroke="#6366f1" strokeWidth={2} />
                        <Line type="monotone" dataKey="activeStudents" name="Active" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className={styles.chartSection}>
                <div className={styles.chartHeader}>
                    <h3>Completion rate</h3>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={trendData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="completion" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="completionRate" stroke="#8b5cf6" fillOpacity={1} fill="url(#completion)" name="Completion %" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CourseAnalytics;
