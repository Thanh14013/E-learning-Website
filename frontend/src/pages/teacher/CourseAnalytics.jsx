import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import toastService from "../../services/toastService";
import { Button } from "../../components/common/Button";
import styles from "./CourseAnalytics.module.css";
import StudentAnalyticsModal from "./StudentAnalyticsModal";
import DiscussionModal from "../../components/discussion/DiscussionModal";
import { useConfirm } from "../../contexts/ConfirmDialogContext";

const CourseAnalytics = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { confirm } = useConfirm();

    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [days, setDays] = useState(30);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Pagination & Discussions
    const [discussions, setDiscussions] = useState([]);
    const [discussionsLoading, setDiscussionsLoading] = useState(false);
    const [studentPage, setStudentPage] = useState(1);
    const [discussionPage, setDiscussionPage] = useState(1);
    const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        if (user?.role !== "teacher" && user?.role !== "admin") {
            toastService.error("You do not have access");
            navigate("/teacher/dashboard");
            return;
        }
        fetchAnalytics(days);
        fetchDiscussions();
    }, [courseId, days]);

    const fetchDiscussions = async () => {
        try {
            setDiscussionsLoading(true);
            const res = await api.get(`/discussions/course/${courseId}`);
            setDiscussions(res.data?.data?.discussions || []);
        } catch (error) {
            console.error("[CourseAnalytics] fetch discussions error", error);
        } finally {
            setDiscussionsLoading(false);
        }
    };

    const handleDeleteDiscussion = async (discussionId, e) => {
        e.stopPropagation();
        const isConfirmed = await confirm("Are you sure you want to delete this discussion?", {
            type: 'danger',
            title: 'Delete Discussion',
            confirmText: 'Delete'
        });

        if (!isConfirmed) return;

        try {
            await api.delete(`/discussions/${discussionId}`);
            toastService.success("Discussion deleted successfully");
            setDiscussions(prev => prev.filter(d => d._id !== discussionId));
        } catch (error) {
            console.error(error);
            toastService.error(error.response?.data?.message || "Failed to delete discussion");
        }
    };

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
            date: new Date(d).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
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
        { label: "Completion rate", value: `${current.completionRate ?? 0}%` },
        { label: "Avg Rating", value: current.averageRating ? Number(current.averageRating).toFixed(1) : "0.0" },
        { label: "Total lessons", value: current.totalLessons ?? 0 },
    ];

    const students = analytics?.students || [];

    // Pagination logic
    const paginatedStudents = students.slice((studentPage - 1) * ITEMS_PER_PAGE, studentPage * ITEMS_PER_PAGE);
    const totalStudentPages = Math.ceil(students.length / ITEMS_PER_PAGE);

    const paginatedDiscussions = discussions.slice((discussionPage - 1) * ITEMS_PER_PAGE, discussionPage * ITEMS_PER_PAGE);
    const totalDiscussionPages = Math.ceil(discussions.length / ITEMS_PER_PAGE);

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
                            <option value={60}>Last 60 days</option>
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
                    <p className={styles.growthValue}>
                        {(growth.studentsGrowth > 0 ? '+' : '')}{growth.studentsGrowth ?? 0}
                    </p>
                    <span className={styles.growthHint}>vs previous period</span>
                </div>
                <div className={styles.growthCard}>
                    <h3>Active students</h3>
                    <p className={styles.growthValue}>{growth.activeStudentsGrowth ?? 0}</p>
                </div>
            </div>

            <div className={styles.chartSection}>
                <div className={styles.chartHeader}>
                    <h3>Enrollment & Engagement</h3>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={trendData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />

                        <Line
                            type="monotone"
                            dataKey="totalStudents"
                            name="Total students"
                            stroke="#6366f1"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                        />
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
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                            formatter={(value) => [`${value}%`, 'Completion']}
                        />
                        <Area
                            type="monotone"
                            dataKey="completionRate"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#completion)"
                            name="Completion %"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Student List Section */}
            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    Students Progress ({students.length})
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Email</th>
                            <th>Progress</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedStudents.length > 0 ? (
                            paginatedStudents.map((student) => (
                                <tr key={student.id}>
                                    <td>
                                        <div className={styles.studentCell}>
                                            {student.avatar ? (
                                                <img src={student.avatar} alt="" className={styles.avatar} />
                                            ) : (
                                                <div className={styles.avatar}>
                                                    {student.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span>{student.name}</span>
                                        </div>
                                    </td>
                                    <td>{student.email}</td>
                                    <td>
                                        <div className={styles.progressWrapper}>
                                            <div className={styles.progressBar}>
                                                <div
                                                    className={styles.progressFill}
                                                    style={{ width: `${student.progress}%` }}
                                                ></div>
                                            </div>
                                            <span className={styles.progressText}>{student.progress}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            className={styles.viewDetailBtn}
                                            onClick={() => navigate(`/teacher/courses/${courseId}/students/${student.id}/analytics`)}
                                        >
                                            View Detail
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                                    No students enrolled yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {/* Student Pagination */}
                {totalStudentPages > 1 && (
                    <div className={styles.pagination}>
                        <Button
                            variant="secondary"
                            disabled={studentPage === 1}
                            onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                        >
                            Previous
                        </Button>
                        <span className={styles.pageInfo}>Page {studentPage} of {totalStudentPages}</span>
                        <Button
                            variant="secondary"
                            disabled={studentPage === totalStudentPages}
                            onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>

            {/* Discussions List Section */}
            <div className={styles.tableContainer} style={{ marginTop: '2rem' }}>
                <div className={styles.tableHeader}>
                    Discussions ({discussions.length})
                </div>
                {discussionsLoading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Loading discussions...</div>
                ) : (
                    <>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Topic</th>
                                    <th>Context</th>
                                    <th>Author</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedDiscussions.length > 0 ? (
                                    paginatedDiscussions.map((disc) => (
                                        <tr
                                            key={disc._id}
                                            onClick={() => setSelectedDiscussionId(disc._id)}
                                            style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                                            className={styles.discussionRow}
                                        >
                                            <td style={{ maxWidth: '300px' }}>
                                                <div style={{ fontWeight: 500, color: '#f3f4f6' }}>{disc.title}</div>
                                            </td>
                                            <td>
                                                {disc.lessonId ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span style={{ fontSize: '0.85rem', color: '#e5e7eb', fontWeight: 500 }}>
                                                            Lesson {disc.lessonId.order}: {disc.lessonId.title || 'Lesson'}
                                                        </span>
                                                        {disc.lessonId.chapterId && (
                                                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                                Chapter {disc.lessonId.chapterId.order}: {disc.lessonId.chapterId.title}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            padding: '2px 8px',
                                                            borderRadius: '999px',
                                                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                                            color: '#34d399'
                                                        }}
                                                    >
                                                        General Course
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className={styles.studentCell}>
                                                    {disc.userId?.avatar ? (
                                                        <img src={disc.userId.avatar} alt="" className={styles.avatar} />
                                                    ) : (
                                                        <div className={styles.avatar}>
                                                            {disc.userId?.fullName?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                    )}
                                                    <span>{disc.userId?.fullName || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td>{new Date(disc.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button
                                                    onClick={(e) => handleDeleteDiscussion(disc._id, e)}
                                                    title="Delete Discussion"
                                                    style={{
                                                        padding: '6px',
                                                        borderRadius: '4px',
                                                        color: '#ef4444',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                                            No discussions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Discussion Pagination */}
                        {totalDiscussionPages > 1 && (
                            <div className={styles.pagination}>
                                <Button
                                    variant="secondary"
                                    disabled={discussionPage === 1}
                                    onClick={() => setDiscussionPage(p => Math.max(1, p - 1))}
                                >
                                    Previous
                                </Button>
                                <span className={styles.pageInfo}>Page {discussionPage} of {totalDiscussionPages}</span>
                                <Button
                                    variant="secondary"
                                    disabled={discussionPage === totalDiscussionPages}
                                    onClick={() => setDiscussionPage(p => Math.min(totalDiscussionPages, p + 1))}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedStudent && (
                <StudentAnalyticsModal
                    courseId={courseId}
                    student={selectedStudent}
                    days={days}
                    onClose={() => setSelectedStudent(null)}
                />
            )}

            {selectedDiscussionId && (
                <DiscussionModal
                    discussionId={selectedDiscussionId}
                    isEnrolled={true}
                    onClose={() => setSelectedDiscussionId(null)}
                    courseTeacherId={user?._id}
                />
            )}
        </div>
    );
};

export default CourseAnalytics;
