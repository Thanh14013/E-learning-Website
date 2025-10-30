import PropTypes from 'prop-types';
import styles from './ProgressBar.module.css';

/**
 * ProgressBar Component
 * Bottom fixed progress bar showing lesson and course completion status
 * Displays lesson progress, course progress, completed lessons count, and time spent
 * Features:
 * - Current lesson progress visualization
 * - Overall course progress percentage
 * - Completed lessons count out of total
 * - Time spent on current lesson
 * - Auto-mark lesson complete at 90% watched
 */
const ProgressBar = ({
    progress = 0,
    isCompleted = false,
    courseProgress = null,
    timeSpent = 0
}) => {
    /**
     * Format time in minutes and seconds
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * Format progress percentage
     * @returns {string} Formatted progress text
     */
    const getProgressText = () => {
        const roundedProgress = Math.round(progress);

        if (isCompleted) {
            return '✓ Lesson Completed';
        }

        if (roundedProgress === 0) {
            return 'Start watching to track progress';
        }

        return `Lesson Progress: ${roundedProgress}%`;
    };

    /**
     * Get progress bar color based on percentage
     * @returns {string} CSS color class
     */
    const getProgressColor = () => {
        if (isCompleted) {
            return styles.completed;
        }

        if (progress >= 75) {
            return styles.high;
        }

        if (progress >= 50) {
            return styles.medium;
        }

        if (progress >= 25) {
            return styles.low;
        }

        return styles.minimal;
    };

    return (
        <div className={styles.progressBarContainer}>
            <div className={styles.progressContent}>
                {/* Progress statistics row */}
                <div className={styles.statsRow}>
                    {/* Lesson progress */}
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Current Lesson:</span>
                        <span className={styles.statValue}>
                            {Math.round(progress)}%
                        </span>
                    </div>

                    {/* Course progress (if provided) */}
                    {courseProgress && (
                        <>
                            <div className={styles.statDivider}>|</div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Course Progress:</span>
                                <span className={styles.statValue}>
                                    {courseProgress.completed}/{courseProgress.total} lessons
                                    ({Math.round(courseProgress.percentage)}%)
                                </span>
                            </div>
                        </>
                    )}

                    {/* Time spent */}
                    {timeSpent > 0 && (
                        <>
                            <div className={styles.statDivider}>|</div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Time Spent:</span>
                                <span className={styles.statValue}>
                                    {formatTime(timeSpent)}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Progress text and bar */}
                <div className={styles.progressSection}>
                    <div className={styles.progressTextContainer}>
                        <span className={styles.progressText}>
                            {getProgressText()}
                        </span>

                        {!isCompleted && progress > 0 && (
                            <span className={styles.progressPercentage}>
                                {Math.round(progress)}%
                            </span>
                        )}
                    </div>

                    {/* Progress bar track */}
                    <div className={styles.progressTrack}>
                        <div
                            className={`${styles.progressFill} ${getProgressColor()}`}
                            style={{ width: `${Math.min(100, progress)}%` }}
                            role="progressbar"
                            aria-valuenow={Math.round(progress)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Lesson progress: ${Math.round(progress)}%`}
                        >
                            {/* Progress shine effect */}
                            <div className={styles.progressShine} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Completion badge */}
            {isCompleted && (
                <div className={styles.completionBadge}>
                    <span className={styles.badgeIcon}>🎉</span>
                    <span className={styles.badgeText}>Great job!</span>
                </div>
            )}
        </div>
    );
};

ProgressBar.propTypes = {
    progress: PropTypes.number,
    isCompleted: PropTypes.bool,
    courseProgress: PropTypes.shape({
        completed: PropTypes.number.isRequired,
        total: PropTypes.number.isRequired,
        percentage: PropTypes.number.isRequired
    }),
    timeSpent: PropTypes.number
};

export default ProgressBar;
