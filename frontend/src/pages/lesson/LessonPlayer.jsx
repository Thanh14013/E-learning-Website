import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../../components/lesson/VideoPlayer';
import VideoProgressBar from '../../components/lesson/VideoProgressBar';
import LessonSidebar from '../../components/lesson/LessonSidebar';
import LessonResources from '../../components/lesson/LessonResources';
import ProgressBar from '../../components/lesson/ProgressBar';
import { CourseNotes } from '../../components/lesson/CourseNotes';
import api from '../../services/api';
import {
    calculateCourseProgress,
    updateCourseStructureWithProgress,
    saveLessonProgress,
    markLessonAsCompleted
} from '../../utils/progressTracker';
import styles from './LessonPlayer.module.css';

/**
 * LessonPlayer Page Component
 * Main page for displaying lesson video content with sidebar navigation
 * Handles video playback, lesson navigation, and progress tracking
 */
const LessonPlayer = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();

    // State management
    const [currentLesson, setCurrentLesson] = useState(null);
    const [courseStructure, setCourseStructure] = useState(null);
    const [progress, setProgress] = useState(0);
    const [watchedTime, setWatchedTime] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [courseProgress, setCourseProgress] = useState(null);
    const [activeTab, setActiveTab] = useState('content'); // 'content' | 'notes'
    const [currentVideoTime, setCurrentVideoTime] = useState(0);
    const videoPlayerRef = useRef(null);

    const [watchedSegments, setWatchedSegments] = useState(new Set());
    const [quizzes, setQuizzes] = useState([]);

    /**
     * Fetch lesson data from backend API
     */
    const loadLessonData = async () => {
        try {
            setLoading(true);

            // Fetch lesson data from backend
            const lessonRes = await api.get(`/lessons/${lessonId}`);
            const lesson = lessonRes.data.data || lessonRes.data.lesson || lessonRes.data;

            // Fetch quizzes for this lesson
            const quizzesRes = await api.get(`/quizzes/lesson/${lessonId}`);
            const quizzesData = quizzesRes.data.data || [];

            // Check pass status for each quiz
            const quizzesWithStatus = await Promise.all(quizzesData.map(async (quiz) => {
                try {
                    const attemptsRes = await api.get(`/quizzes/${quiz._id}/attempts`);
                    const attempts = attemptsRes.data.attempts || [];
                    const isPassed = attempts.some(a => a.isPassed);
                    return { ...quiz, isPassed };
                } catch (err) {
                    return { ...quiz, isPassed: false };
                }
            }));
            setQuizzes(quizzesWithStatus);

            // Fetch course structure (chapters and lessons)
            const courseRes = await api.get(`/courses/${courseId}`);
            const courseData = courseRes.data.data || courseRes.data;

            // Fetch user's progress for this course
            const progressRes = await api.get(`/progress/course/${courseId}`);
            const progressData = progressRes.data;

            setCurrentLesson(lesson);
            setCourseStructure(courseData);

            // Calculate overall course progress
            if (progressData) {
                setCourseProgress({
                    totalLessons: progressData.totalLessons || 0,
                    completedLessons: progressData.completedLessons || 0,
                    progressPercentage: progressData.progressPercentage || 0
                });
            }

            // Load user's progress for this lesson
            const lessonProgress = progressData?.lessonProgress?.find(lp => lp.lessonId === lessonId);
            if (lessonProgress) {
                setProgress(lessonProgress.videoProgressPercent || 0);
                setWatchedTime(lessonProgress.watchedDuration || 0);
                setIsCompleted(lessonProgress.completed || false);

                // If we have previous segment data, we could load it here. 
                // For now, we'll start fresh or assume progressPercentage is a decent fallback.
            } else {
                setProgress(0);
                setWatchedTime(0);
                setIsCompleted(false);
                setWatchedSegments(new Set());
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading lesson:', error);
            setLoading(false);
        }
    };

    /**
     * Load lesson data when component mounts or lessonId changes
     */
    useEffect(() => {
        loadLessonData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lessonId, courseId]);

    /**
     * Handle video progress updates
     * @param {number} currentTime - Current playback time in seconds
     * @param {number} duration - Total video duration in seconds
     */
    const handleVideoProgress = (currentTime, duration) => {
        if (duration > 0) {
            setCurrentVideoTime(currentTime);

            // Segment tracking (5s intervals)
            const segment = Math.floor(currentTime / 5);
            if (!watchedSegments.has(segment)) {
                const newSegments = new Set(watchedSegments);
                newSegments.add(segment);
                setWatchedSegments(newSegments);

                const totalSegments = Math.ceil(duration / 5);
                const watchedCount = newSegments.size;
                const realPercent = Math.min(100, Math.round((watchedCount / totalSegments) * 100));

                // If real progress increased, update state and sync to backend soon
                if (realPercent > progress) {
                    setProgress(realPercent);
                    setWatchedTime(currentTime);

                    // Throttled backend sync
                    if (realPercent === 100 || realPercent % 5 === 0) {
                        saveProgressToBackend(realPercent, currentTime);
                    }
                }
            }

            // Time-based periodic save (backup)
            if (Math.floor(currentTime) % 15 === 0 && Math.floor(currentTime) !== Math.floor(watchedTime)) {
                saveProgressToBackend(progress, currentTime);
            }
        }
    };

    /**
     * Sync progress to backend API
     */
    const saveProgressToBackend = async (percent, time) => {
        try {
            const res = await api.put(`/progress/lesson/${lessonId}`, {
                watchedDuration: time,
                videoProgressPercent: percent
            });

            const updatedProgress = res.data.progress;
            if (updatedProgress.isCompleted && !isCompleted) {
                setIsCompleted(true);
                // Trigger any course-wide progress recalculation if needed
                loadLessonData();
            }
        } catch (error) {
            console.error('Error saving progress to backend:', error);
        }
    };

    // Persistence for watched segments
    useEffect(() => {
        if (lessonId && watchedSegments.size > 0) {
            localStorage.setItem(`watched-segments-${lessonId}`, JSON.stringify(Array.from(watchedSegments)));
        }
    }, [watchedSegments, lessonId]);

    useEffect(() => {
        if (lessonId) {
            const saved = localStorage.getItem(`watched-segments-${lessonId}`);
            if (saved) {
                setWatchedSegments(new Set(JSON.parse(saved)));
            } else {
                setWatchedSegments(new Set());
            }
        }
    }, [lessonId]);

    /**
     * Manual marking - still goes through backend validation
     */
    const markLessonComplete = async () => {
        try {
            const res = await api.post(`/progress/complete/${lessonId}`);
            if (res.data.success || res.status === 200) {
                setIsCompleted(true);
                loadLessonData();
            }
        } catch (error) {
            console.error('Error marking lesson as complete:', error);
            alert("Requirements not met: Watch 100% video and pass all quizzes.");
        }
    };

    /**
     * Update overall course progress
     */
    const updateCourseProgress = () => {
        // This is now handled by loadLessonData which fetches from backend
        console.log('Course progress updated via sync');
    };

    /**
     * Navigate to a different lesson
     * @param {string} newLessonId - ID of the lesson to navigate to
     */
    const handleLessonChange = (newLessonId) => {
        navigate(`/courses/${courseId}/lessons/${newLessonId}`);
    };

    /**
     * Navigate to next lesson
     */
    const handleNextLesson = () => {
        if (courseStructure) {
            const allLessons = [];
            courseStructure.chapters.forEach(chapter => {
                allLessons.push(...chapter.lessons);
            });

            const currentIndex = allLessons.findIndex(l => l.id === lessonId);
            if (currentIndex < allLessons.length - 1) {
                handleLessonChange(allLessons[currentIndex + 1].id);
            }
        }
    };

    /**
     * Navigate to previous lesson
     */
    const handlePreviousLesson = () => {
        if (courseStructure) {
            const allLessons = [];
            courseStructure.chapters.forEach(chapter => {
                allLessons.push(...chapter.lessons);
            });

            const currentIndex = allLessons.findIndex(l => l.id === lessonId);
            if (currentIndex > 0) {
                handleLessonChange(allLessons[currentIndex - 1].id);
            }
        }
    };

    /**
     * Toggle sidebar visibility
     */
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Loading state
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading lesson...</p>
            </div>
        );
    }

    // Error state - no lesson data
    if (!currentLesson) {
        return (
            <div className={styles.errorContainer}>
                <h2>Lesson not found</h2>
                <button onClick={() => navigate(-1)} className={styles.backButton}>
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className={styles.lessonPlayerContainer}>
            {/* Main content area */}
            <div className={styles.mainContent}>
                {/* Video player section */}
                <div className={styles.videoSection}>
                    <VideoPlayer
                        videoUrl={currentLesson.videoUrl}
                        title={currentLesson.title}
                        onProgress={handleVideoProgress}
                        startTime={watchedTime}
                        videoQualities={currentLesson.qualities}
                    />

                    {/* Persistent Video Progress Bar */}
                    <VideoProgressBar progress={progress} isCompleted={isCompleted} />

                    {/* Lesson information */}
                    <div className={styles.lessonInfo}>
                        <div className={styles.lessonHeader}>
                            <h1 className={styles.lessonTitle}>{currentLesson.title}</h1>
                            {isCompleted && (
                                <span className={styles.completedBadge}>✓ Completed</span>
                            )}
                        </div>

                        {/* Quizzes Section */}
                        {quizzes.length > 0 && (
                            <div className={styles.quizzesSection}>
                                <h3 className={styles.sectionTitle}>Lesson Quizzes</h3>
                                <div className={styles.quizzesList}>
                                    {quizzes.map(quiz => (
                                        <div key={quiz._id} className={styles.quizCard}>
                                            <div className={styles.quizInfo}>
                                                <span className={styles.quizIcon}>📝</span>
                                                <div className={styles.quizDetails}>
                                                    <span className={styles.quizTitle}>{quiz.title}</span>
                                                    <span className={styles.quizMeta}>
                                                        Passing score: {quiz.passingScore}% • Attempts allowed: {quiz.attemptsAllowed}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={styles.quizAction}>
                                                {quiz.isPassed ? (
                                                    <span className={styles.passedBadge}>✓ Passed</span>
                                                ) : (
                                                    <button
                                                        className={styles.startQuizButton}
                                                        onClick={() => navigate(`/quizzes/${quiz._id}`)}
                                                    >
                                                        Start Quiz
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.lessonMeta}>
                            <span className={styles.metaItem}>
                                📚 {courseStructure?.title || 'Course'}
                            </span>
                            <span className={styles.metaItem}>
                                ⏱️ {Math.floor(currentLesson.duration / 60)} min
                            </span>
                            <span className={styles.metaItem}>
                                👁️ {currentLesson.views || 0} views
                            </span>
                        </div>

                        {/* Lesson description */}
                        <div className={styles.lessonDescription}>
                            <h3>About this lesson</h3>
                            <p>{currentLesson.description}</p>
                        </div>

                        {/* Lesson content */}
                        <div className={styles.lessonContent}>
                            <h3>What you'll learn</h3>
                            <div
                                className={styles.contentBody}
                                dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                            />
                        </div>

                        {/* Tabs for Content/Notes */}
                        <div className={styles.tabsContainer}>
                            <button
                                className={`${styles.tab} ${activeTab === 'content' ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab('content')}
                            >
                                📄 Lesson Content
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'notes' ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab('notes')}
                            >
                                📝 My Notes
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'content' && (
                            <>
                                {/* Resources section */}
                                {currentLesson.resources && currentLesson.resources.length > 0 && (
                                    <LessonResources resources={currentLesson.resources} />
                                )}
                            </>
                        )}

                        {activeTab === 'notes' && (
                            <div className={styles.notesSection}>
                                <CourseNotes lessonId={lessonId} videoTimestamp={currentVideoTime} />
                            </div>
                        )}

                        {/* Navigation buttons */}
                        <div className={styles.navigationButtons}>
                            <button
                                onClick={handlePreviousLesson}
                                className={styles.navButton}
                                disabled={!courseStructure}
                            >
                                ← Previous Lesson
                            </button>

                            <button
                                onClick={handleNextLesson}
                                className={styles.navButton}
                            >
                                Next Lesson →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarClosed : ''}`}>
                <button
                    className={styles.sidebarToggle}
                    onClick={toggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    {isSidebarOpen ? '→' : '←'}
                </button>

                {isSidebarOpen && courseStructure && (
                    <LessonSidebar
                        courseStructure={courseStructure}
                        currentLessonId={lessonId}
                        onLessonSelect={handleLessonChange}
                    />
                )}
            </div>

            {/* Bottom progress bar */}
            <ProgressBar
                progress={progress}
                isCompleted={isCompleted}
                courseProgress={courseProgress}
                timeSpent={watchedTime}
            />
        </div>
    );
};

export default LessonPlayer;
