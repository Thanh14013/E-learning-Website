import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toastService from '../../services/toastService';
import { Button } from '../../components/common/Button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './StudentAnalytics.module.css';

/**
 * Student Analytics Page
 * Detailed analytics for a specific student in a course (Teacher view)
 */
export default function StudentAnalytics() {
    const { courseId, studentId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [timeRange, setTimeRange] = useState('30'); // days

    useEffect(() => {
        if (user?.role !== 'teacher' && user?.role !== 'admin') {
            toastService.error('You do not have access');
            navigate('/teacher/dashboard');
            return;
        }

        fetchStudentAnalytics();
    }, [courseId, studentId, timeRange]);

    const fetchStudentAnalytics = async () => {
        try {
            setLoading(true);

            // Fetch analytics from backend
            const response = await api.get(`/teacher/analytics/student/${studentId}`, {
                params: { courseId }
            });
            const data = response.data;

            setStudent(data.student);
            setAnalytics(data);

        } catch (error) {
            console.error('Error fetching student analytics:', error);
            toastService.error('Unable to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US');
    };

    if (loading) {
        return <div className={styles.loading}>Loading data...</div>;
    }

    if (!student || !analytics) {
        return <div className={styles.error}>No data found</div>;
    }

    return (
        <div className={styles.studentAnalytics}>
            {/* Header */}
            <div className={styles.header}>
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    ← Back
                </Button>
                <div className={styles.timeRangeSelector}>
                    <label>Time range:</label>
                    <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="all">All</option>
                    </select>
                </div>
            </div>

            {/* Student Info Card */}
            <div className={styles.studentCard}>
                <div className={styles.studentAvatar}>
                    {student.avatar ? (
                        <img src={student.avatar} alt={student.fullName} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {student.fullName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className={styles.studentInfo}>
                    <h2>{student.fullName}</h2>
                    <p>{student.email}</p>
                    <p className={styles.enrolledDate}>
                        Enrolled: {formatDate(student.enrolledAt)}
                    </p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>📊</div>
                    <div className={styles.statContent}>
                        <h3>{analytics.progress.completionRate}%</h3>
                        <p>Completion rate</p>
                        <span className={styles.statDetail}>
                            {analytics.progress.completedLessons}/{analytics.progress.totalLessons} lessons
                        </span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>⏱️</div>
                    <div className={styles.statContent}>
                        <h3>{formatTime(analytics.progress.totalWatchTime)}</h3>
                        <p>Total watch time</p>
                        <span className={styles.statDetail}>
                            Avg: {analytics.progress.averageWatchTime}m/lesson
                        </span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>📝</div>
                    <div className={styles.statContent}>
                        <h3>{analytics.quizzes.averageScore}%</h3>
                        <p>Average score</p>
                        <span className={styles.statDetail}>
                            {analytics.quizzes.completedQuizzes}/{analytics.quizzes.totalQuizzes} quiz
                        </span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>💬</div>
                    <div className={styles.statContent}>
                        <h3>{analytics.discussions.totalPosts}</h3>
                        <p>Discussions</p>
                        <span className={styles.statDetail}>
                            {analytics.discussions.totalComments} comments
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress Over Time Chart */}
            <div className={styles.chartSection}>
                <h3>Progress Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.progressOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="completion"
                            stroke="#7c3aed"
                            strokeWidth={2}
                            name="Progress (%)"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Quiz Scores Chart */}
            <div className={styles.chartSection}>
                <h3>Quiz Scores</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.quizScoresOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="quiz" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="score" fill="#7c3aed" name="Score (%)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Quiz Attempts Table */}
            <div className={styles.tableSection}>
                <h3>Quiz Details</h3>
                <table className={styles.quizTable}>
                    <thead>
                        <tr>
                            <th>Quiz</th>
                            <th>Score</th>
                            <th>Attempts</th>
                            <th>Completed Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {analytics.quizzes.attempts.map((attempt, index) => (
                            <tr key={index}>
                                <td>{attempt.quizTitle}</td>
                                <td>
                                    <span className={getScoreClass(attempt.score)}>
                                        {attempt.score}%
                                    </span>
                                </td>
                                <td>{attempt.attempts} attempts</td>
                                <td>{formatDate(attempt.completedAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Export Button */}
            <div className={styles.exportSection}>
                <Button onClick={() => exportToCSV(student, analytics)}>
                    📥 Export CSV
                </Button>
            </div>
        </div>
    );
}

function getScoreClass(score) {
    if (score >= 80) return styles.scoreHigh;
    if (score >= 60) return styles.scoreMedium;
    return styles.scoreLow;
}

function exportToCSV(student, analytics) {
    // Simple CSV export
    const csvContent = [
        ['Student Analytics Report'],
        ['Student Name', student.fullName],
        ['Email', student.email],
        ['Enrolled Date', student.enrolledAt],
        [],
        ['Progress Summary'],
        ['Total Lessons', analytics.progress.totalLessons],
        ['Completed Lessons', analytics.progress.completedLessons],
        ['Completion Rate', `${analytics.progress.completionRate}%`],
        ['Total Watch Time (minutes)', analytics.progress.totalWatchTime],
        [],
        ['Quiz Summary'],
        ['Total Quizzes', analytics.quizzes.totalQuizzes],
        ['Completed Quizzes', analytics.quizzes.completedQuizzes],
        ['Average Score', `${analytics.quizzes.averageScore}%`],
        [],
        ['Quiz Details'],
        ['Quiz Title', 'Score', 'Attempts', 'Completed Date'],
        ...analytics.quizzes.attempts.map(a => [
            a.quizTitle, `${a.score}%`, a.attempts, a.completedAt
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `student_analytics_${student.fullName}_${Date.now()}.csv`;
    link.click();

    toastService.success('Report exported successfully');
}
