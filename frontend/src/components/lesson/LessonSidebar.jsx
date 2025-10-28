import { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './LessonSidebar.module.css';

/**
 * LessonSidebar Component
 * Displays course structure with chapters and lessons
 * Allows navigation between lessons
 */
const LessonSidebar = ({ courseStructure, currentLessonId, onLessonSelect }) => {
    // State for collapsed/expanded chapters
    const [expandedChapters, setExpandedChapters] = useState(() => {
        // Auto-expand chapter containing current lesson
        const initialExpanded = {};
        courseStructure.chapters.forEach((chapter, index) => {
            const hasCurrentLesson = chapter.lessons.some(lesson => lesson.id === currentLessonId);
            initialExpanded[index] = hasCurrentLesson;
        });
        return initialExpanded;
    });

    /**
     * Toggle chapter expansion
     * @param {number} chapterIndex - Index of chapter to toggle
     */
    const toggleChapter = (chapterIndex) => {
        setExpandedChapters(prev => ({
            ...prev,
            [chapterIndex]: !prev[chapterIndex]
        }));
    };

    /**
     * Handle lesson click
     * @param {string} lessonId - ID of lesson to navigate to
     * @param {boolean} isLocked - Whether lesson is locked
     */
    const handleLessonClick = (lessonId, isLocked) => {
        if (isLocked) {
            alert('This lesson is locked. Please complete previous lessons first.');
            return;
        }

        if (onLessonSelect) {
            onLessonSelect(lessonId);
        }
    };

    /**
     * Calculate total lessons and completed lessons
     */
    const getTotalProgress = () => {
        let total = 0;
        let completed = 0;

        courseStructure.chapters.forEach(chapter => {
            chapter.lessons.forEach(lesson => {
                total++;
                if (lesson.completed) completed++;
            });
        });

        return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
    };

    const progress = getTotalProgress();

    return (
        <div className={styles.sidebarContainer}>
            {/* Course header */}
            <div className={styles.courseHeader}>
                <h2 className={styles.courseTitle}>{courseStructure.title}</h2>
                <p className={styles.courseInfo}>
                    {courseStructure.instructor && `By ${courseStructure.instructor}`}
                </p>

                {/* Overall progress */}
                <div className={styles.overallProgress}>
                    <div className={styles.progressInfo}>
                        <span className={styles.progressText}>
                            {progress.completed} / {progress.total} lessons completed
                        </span>
                        <span className={styles.progressPercentage}>
                            {Math.round(progress.percentage)}%
                        </span>
                    </div>
                    <div className={styles.progressBarContainer}>
                        <div
                            className={styles.progressBarFill}
                            style={{ width: `${progress.percentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Chapters and lessons list */}
            <div className={styles.chaptersContainer}>
                {courseStructure.chapters.map((chapter, chapterIndex) => (
                    <div key={chapter.id} className={styles.chapterBlock}>
                        {/* Chapter header */}
                        <button
                            className={styles.chapterHeader}
                            onClick={() => toggleChapter(chapterIndex)}
                            aria-expanded={expandedChapters[chapterIndex]}
                        >
                            <div className={styles.chapterInfo}>
                                <span className={styles.chapterIcon}>
                                    {expandedChapters[chapterIndex] ? '▼' : '▶'}
                                </span>
                                <div className={styles.chapterDetails}>
                                    <h3 className={styles.chapterTitle}>
                                        {chapter.order}. {chapter.title}
                                    </h3>
                                    <span className={styles.chapterMeta}>
                                        {chapter.lessons.length} lessons
                                        {chapter.duration && ` • ${chapter.duration}`}
                                    </span>
                                </div>
                            </div>
                        </button>

                        {/* Lessons list */}
                        {expandedChapters[chapterIndex] && (
                            <div className={styles.lessonsContainer}>
                                {chapter.lessons.map((lesson, lessonIndex) => {
                                    const isCurrent = lesson.id === currentLessonId;
                                    const isCompleted = lesson.completed;
                                    const isLocked = lesson.locked;

                                    return (
                                        <button
                                            key={lesson.id}
                                            className={`${styles.lessonItem} ${isCurrent ? styles.currentLesson : ''} ${isLocked ? styles.lockedLesson : ''}`}
                                            onClick={() => handleLessonClick(lesson.id, isLocked)}
                                            disabled={isLocked}
                                            aria-current={isCurrent ? 'page' : undefined}
                                        >
                                            {/* Lesson status icon */}
                                            <span className={styles.lessonIcon}>
                                                {isLocked ? '🔒' : isCompleted ? '✓' : lessonIndex + 1}
                                            </span>

                                            {/* Lesson info */}
                                            <div className={styles.lessonInfo}>
                                                <span className={styles.lessonTitle}>
                                                    {lesson.title}
                                                </span>
                                                <span className={styles.lessonMeta}>
                                                    {lesson.type === 'video' && '🎥'}
                                                    {lesson.type === 'quiz' && '📝'}
                                                    {lesson.type === 'reading' && '📖'}
                                                    {lesson.duration && ` ${lesson.duration}`}
                                                </span>
                                            </div>

                                            {/* Current indicator */}
                                            {isCurrent && (
                                                <span className={styles.currentIndicator}>▶</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Course actions */}
            <div className={styles.sidebarFooter}>
                <button className={styles.footerButton}>
                    📊 View Course Stats
                </button>
                <button className={styles.footerButton}>
                    💬 Discussion Forum
                </button>
            </div>
        </div>
    );
};

LessonSidebar.propTypes = {
    courseStructure: PropTypes.shape({
        title: PropTypes.string.isRequired,
        instructor: PropTypes.string,
        chapters: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.string.isRequired,
                title: PropTypes.string.isRequired,
                order: PropTypes.number.isRequired,
                duration: PropTypes.string,
                lessons: PropTypes.arrayOf(
                    PropTypes.shape({
                        id: PropTypes.string.isRequired,
                        title: PropTypes.string.isRequired,
                        type: PropTypes.string,
                        duration: PropTypes.string,
                        completed: PropTypes.bool,
                        locked: PropTypes.bool
                    })
                ).isRequired
            })
        ).isRequired
    }).isRequired,
    currentLessonId: PropTypes.string.isRequired,
    onLessonSelect: PropTypes.func.isRequired
};

export default LessonSidebar;
