import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../../components/lesson/VideoPlayer';
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

    /**
     * Fetch lesson data from backend API
     */
    const loadLessonData = async () => {
        try {
            setLoading(true);

            // Fetch lesson data from backend
            const lessonRes = await api.get(`/lessons/${lessonId}`);
            const lesson = lessonRes.data.data || lessonRes.data.lesson || lessonRes.data;

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
                setProgress(lessonProgress.progressPercentage || 0);
                setWatchedTime(lessonProgress.lastWatchedAt || 0);
                setIsCompleted(lessonProgress.completed || false);
            } else {
                setProgress(0);
                setWatchedTime(0);
                setIsCompleted(false);
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
    }, [lessonId, courseId]);    /**
     * Handle video progress updates
     * @param {number} currentTime - Current playback time in seconds
     * @param {number} duration - Total video duration in seconds
     */
    const handleVideoProgress = (currentTime, duration) => {
        if (duration > 0) {
            const progressPercent = (currentTime / duration) * 100;
            setProgress(progressPercent);
            setWatchedTime(currentTime);

            // Auto-mark as completed when 90% watched
            if (progressPercent >= 90 && !isCompleted) {
                markLessonComplete();
            }

            // Save progress periodically (every 5 seconds)
            if (Math.floor(currentTime) % 5 === 0) {
                saveProgress(progressPercent, currentTime);
            }
        }
    };

    /**
     * Save lesson progress to localStorage
     * Uses the progressTracker utility for consistent storage
     * @param {number} prog - Progress percentage
     * @param {number} time - Watched time in seconds
     */
    const saveProgress = (prog, time) => {
        const progressData = {
            progress: prog,
            watchedTime: time,
            completed: isCompleted
        };
        saveLessonProgress(lessonId, progressData);
    };

    /**
     * Mark lesson as completed and update course progress
     * Auto-triggered when video reaches 90% completion
     */
    const markLessonComplete = () => {
        setIsCompleted(true);

        // Save completion to localStorage
        markLessonAsCompleted(lessonId, currentLesson?.duration || 0);

        // Update course structure and recalculate progress
        if (courseStructure) {
            const updatedStructure = updateCourseStructureWithProgress(courseStructure);
            setCourseStructure(updatedStructure);

            const progressStats = calculateCourseProgress(updatedStructure);
            setCourseProgress(progressStats);
        }

        // In production, this would also be an API call
        updateCourseProgress();
    };

    /**
     * Update overall course progress
     */
    const updateCourseProgress = () => {
        // In production, this would be an API call
        console.log('Course progress updated');
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

                    {/* Lesson information */}
                    <div className={styles.lessonInfo}>
                        <div className={styles.lessonHeader}>
                            <h1 className={styles.lessonTitle}>{currentLesson.title}</h1>
                            {isCompleted && (
                                <span className={styles.completedBadge}>✓ Completed</span>
                            )}
                        </div>

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
