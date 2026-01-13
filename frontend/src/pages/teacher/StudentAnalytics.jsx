import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmDialogContext.jsx';
import api from '@/services/api';
import toastService from '@/services/toastService';
import { Button } from '@/components/common/Button';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell
} from 'recharts';
import styles from './StudentAnalytics.module.css';

const StudentAnalytics = () => {
    const { courseId, studentId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('lessons'); // lessons | quizzes
    const [scoreSortDir, setScoreSortDir] = useState('desc'); // 'desc' or 'asc'

    useEffect(() => {
        fetchData();
    }, [courseId, studentId]);

    const formatDate = (dateString, includeTime = false) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (includeTime) {
            return date.toLocaleString('en-GB'); // DD/MM/YYYY, HH:mm:ss
        }
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    };
    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/analytics/course/${courseId}/student/${studentId}/detail`);
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Fetch detailed analytics error", error);
            toastService.error("Unable to load student details");
        } finally {
            setLoading(false);
        }
    };

    const { confirm } = useConfirm();

    const handleResetAttempts = async (quizId) => {
        const isConfirmed = await confirm("Are you sure you want to reset attempts for this quiz? The student will be able to retake it.", {
            title: "Reset Quiz Attempts",
            type: "warning",
            confirmText: "Reset"
        });

        if (!isConfirmed) return;

        try {
            // Updated to use the correct quiz reset endpoint
            await api.delete(`/quizzes/${quizId}/attempts/student/${studentId}`);
            toastService.success("Quiz attempts reset successfully");
            fetchData(); // Refresh data
        } catch (error) {
            console.error("Reset quiz error", error);
            toastService.error("Failed to reset quiz attempts");
        }
    };

    if (loading) return <div className={styles.loadingContainer}><div className={styles.spinner}></div> Loading details...</div>;
    if (!data) return <div className={styles.errorContainer}>Student data not found.</div>;

    const { student, overview, courseStructure, progressMap, quizzes, allAttempts } = data;

    // Helper: format duration
    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    // Sort quizzes by best score (un-attempted always last)
    const sortedQuizzes = [...quizzes].sort((a, b) => {
        // Un-attempted quizzes always go to the end
        if (a.attemptsUsed === 0 && b.attemptsUsed === 0) return 0;
        if (a.attemptsUsed === 0) return 1;
        if (b.attemptsUsed === 0) return -1;

        // Sort by best score
        const scoreA = a.bestScore ?? 0;
        const scoreB = b.bestScore ?? 0;
        return scoreSortDir === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    });

    const getActivityLog = () => {
        if (!data) return [];
        const activities = [];

        // 1. Lesson Progress
        courseStructure.forEach(chapter => {
            chapter.lessons.forEach(lesson => {
                const prog = progressMap[lesson.id];
                if (prog && prog.lastWatchedAt) {
                    activities.push({
                        id: `lesson-${lesson.id}`,
                        type: 'lesson',
                        title: lesson.title,
                        date: new Date(prog.lastWatchedAt),
                        details: prog.isCompleted ? 'Completed lesson' : `Watched ${Math.round(prog.videoProgressPercent)}%`
                    });
                }
            });
        });

        // 2. Quiz Attempts - Log EACH individual attempt
        if (allAttempts && allAttempts.length > 0) {
            allAttempts.forEach(attempt => {
                if (attempt.submittedAt || attempt.createdAt) {
                    activities.push({
                        id: `attempt-${attempt.id}`,
                        type: 'quiz',
                        title: attempt.quizTitle,
                        date: new Date(attempt.submittedAt || attempt.createdAt),
                        details: `Attempt ${attempt.attemptNumber}/${attempt.attemptsAllowed} - Score: ${attempt.percentage?.toFixed(1) ?? 0}% - ${attempt.isPassed ? 'Passed' : 'Failed'}`
                    });
                }
            });
        }

        return activities.sort((a, b) => b.date - a.date);
    };

    const activityLog = data ? getActivityLog() : [];

    return (
        <div className={styles.container}>
            {/* Header / Profile */}
            <div className={styles.header}>
                <Button variant="secondary" onClick={() => navigate(-1)} className={styles.backBtn}>
                    ←
                </Button>
                <div className={styles.profileSection}>
                    <div className={styles.avatar}>
                        {student.avatar ? <img src={student.avatar} alt={student.fullName} /> : student.fullName?.charAt(0)}
                    </div>
                    <div className={styles.profileInfo}>
                        <h1>{student.fullName}</h1>
                        <p>{student.email}</p>
                        <span className={styles.joinedDate}>
                            Enrolled: {student.enrollmentDate ? formatDate(student.enrollmentDate) : 'Unknown'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Overview Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>📊</div>
                    <div className={styles.statInfo}>
                        <label>Completion Rate</label>
                        <div className={styles.statValue}>{overview.completionRate}%</div>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${overview.completionRate}%` }}></div>
                        </div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>⏱️</div>
                    <div className={styles.statInfo}>
                        <label>Total Study Time</label>
                        <div className={styles.statValue}>{formatDuration(overview.totalWatchTime)}</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>📝</div>
                    <div className={styles.statInfo}>
                        <label>Avg Quiz Score</label>
                        <div className={styles.statValue}>{overview.avgQuizScore}%</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statInfo}>
                        <label>Lessons Completed</label>
                        <div className={styles.statValue}>{overview.completedLessons} <span className={styles.subValue}>/ {overview.totalLessons}</span></div>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className={styles.tabsContainer}>
                <div className={styles.tabsHeader}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'lessons' ? styles.active : ''}`}
                        onClick={() => setActiveTab('lessons')}
                    >
                        📚 Lesson Progress
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'quizzes' ? styles.active : ''}`}
                        onClick={() => setActiveTab('quizzes')}
                    >
                        📝 Quizzes & Performance
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'activity' ? styles.active : ''}`}
                        onClick={() => setActiveTab('activity')}
                    >
                        📈 Activity Log
                    </button>
                </div>

                <div className={styles.tabContent}>
                    {activeTab === 'lessons' && (
                        <div className={styles.lessonsView}>
                            {courseStructure.map(chapter => (
                                <div key={chapter.id} className={styles.chapterBlock}>
                                    <h3 className={styles.chapterTitle}>{chapter.title}</h3>
                                    <div className={styles.lessonsList}>
                                        {chapter.lessons.map(lesson => {
                                            const progress = progressMap[lesson.id] || { isCompleted: false, videoProgressPercent: 0 };
                                            return (
                                                <div key={lesson.id} className={styles.lessonRow}>
                                                    <div className={styles.lessonInfo}>
                                                        <span className={styles.lessonIcon}>
                                                            {progress.isCompleted ? '🟢' : '⚪'}
                                                        </span>
                                                        <span className={styles.lessonName}>{lesson.title}</span>
                                                    </div>
                                                    <div className={styles.lessonStats}>
                                                        <span className={styles.duration}>
                                                            {progress.watchedDuration ? formatDuration(progress.watchedDuration) : '0m'} watched
                                                        </span>
                                                        <div className={styles.miniProgress}>
                                                            <div
                                                                className={styles.miniFill}
                                                                style={{
                                                                    width: `${progress.videoProgressPercent || 0}%`,
                                                                    backgroundColor: progress.isCompleted ? '#10b981' : '#3b82f6'
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className={styles.percentText}>{Math.round(progress.videoProgressPercent || 0)}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'quizzes' && (
                        <div className={styles.quizzesView}>
                            <div className={styles.tableWrapper}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Quiz Title</th>
                                        <th>Status</th>
                                        <th>Attempts Used</th>
                                        <th style={{ cursor: 'pointer' }} onClick={() => setScoreSortDir(prev => prev === 'desc' ? 'asc' : 'desc')}>
                                            Best Score {scoreSortDir === 'desc' ? '↓' : '↑'}
                                        </th>
                                        <th>Last Attempt</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedQuizzes.length > 0 ? sortedQuizzes.map(quiz => (
                                        <tr key={quiz.id}>
                                            <td>{quiz.title}</td>
                                            <td>
                                                {quiz.attemptsUsed === 0 ? <span className={styles.badgeGray}>Not Attempted</span> :
                                                    quiz.isPassed ? <span className={styles.badgeGreen}>Passed</span> :
                                                        <span className={styles.badgeRed}>Failed</span>
                                                }
                                            </td>
                                            <td>
                                                <span className={`${quiz.attemptsUsed >= quiz.attemptsAllowed ? styles.textRed : ''}`}>
                                                    {quiz.attemptsUsed} / {quiz.attemptsAllowed}
                                                </span>
                                            </td>
                                            <td className={styles.scoreCell}>
                                                {quiz.bestScore !== null ? `${quiz.bestScore}%` : '-'}
                                            </td>
                                            <td>
                                                {formatDate(quiz.lastAttemptDate, true)}
                                            </td>
                                            <td>
                                                {quiz.attemptsUsed > 0 && (
                                                    <button
                                                        className={styles.resetBtn}
                                                        onClick={() => handleResetAttempts(quiz.id)}
                                                        title="Reset Attempts"
                                                    >
                                                        Reset
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6" className={styles.emptyRow}>No quizzes in this course.</td></tr>
                                    )}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    )}


                    {activeTab === 'activity' && (
                        <div className={styles.activityView}>
                            {activityLog.length > 0 ? activityLog.map(activity => (
                                <div key={activity.id} className={styles.activityRow}>
                                    <div className={styles.activityDateCol}>
                                        <div className={styles.actDate}>{formatDate(activity.date)}</div>
                                        <div className={styles.actTime}>{activity.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                    <div className={styles.activityIconCol}>
                                        <div className={styles.activityLine}></div>
                                        <div className={styles.activityIconBubble}>
                                            {activity.type === 'lesson' ? '📺' : '📝'}
                                        </div>
                                    </div>
                                    <div className={styles.activityContent}>
                                        <div className={styles.activityTitle}>{activity.title}</div>
                                        <div className={styles.activityDetails}>{activity.details}</div>
                                    </div>
                                </div>
                            )) : (
                                <div className={styles.emptyRow}>No recent activity found for this student.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentAnalytics;
