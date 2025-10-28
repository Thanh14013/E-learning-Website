import PropTypes from 'prop-types';
import styles from './ProgressBar.module.css';

/**
 * ProgressBar Component
 * Bottom fixed progress bar showing lesson completion status
 * Displays progress percentage and completion state
 */
const ProgressBar = ({ progress = 0, isCompleted = false }) => {
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
    
    return `${roundedProgress}% Completed`;
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
        {/* Progress text */}
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
  isCompleted: PropTypes.bool
};

export default ProgressBar;
