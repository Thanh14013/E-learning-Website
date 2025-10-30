import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../../components/lesson/VideoPlayer';
import LessonSidebar from '../../components/lesson/LessonSidebar';
import LessonResources from '../../components/lesson/LessonResources';
import ProgressBar from '../../components/lesson/ProgressBar';
import { mockLessonData, mockCourseStructure } from '../../mock/lessonMockData';
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

    /**
     * Fetch lesson data from mock data (would be API call in production)
     */
    const loadLessonData = async () => {
        try {
            setLoading(true);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Load mock data
            const lesson = mockLessonData[lessonId] || mockLessonData['lesson-1'];
            const structure = mockCourseStructure[courseId] || mockCourseStructure['course-1'];

            // Update course structure with progress from localStorage
            const updatedStructure = updateCourseStructureWithProgress(structure);

            setCurrentLesson(lesson);
            setCourseStructure(updatedStructure);

            // Calculate overall course progress
            const progressStats = calculateCourseProgress(updatedStructure);
            setCourseProgress(progressStats);

            // Load saved progress from localStorage
            const savedProgress = localStorage.getItem(`lesson-progress-${lessonId}`);
            if (savedProgress) {
                const { progress: savedProg, watchedTime: savedTime, completed } = JSON.parse(savedProgress);
                setProgress(savedProg);
                setWatchedTime(savedTime);
                setIsCompleted(completed);
            } else {
                // Reset progress for new lesson
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

                        {/* Resources section */}
                        {currentLesson.resources && currentLesson.resources.length > 0 && (
                            <LessonResources resources={currentLesson.resources} />
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
