import React from 'react';
import PropTypes from 'prop-types';
import styles from './VideoProgressBar.module.css';

/**
 * VideoProgressBar Component
 * Displays the student's watch progress for a specific video.
 * @param {number} progress - The percentage of the video watched (0-100)
 * @param {boolean} isCompleted - Whether the lesson is overall completed
 */
const VideoProgressBar = ({ progress, isCompleted }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.label}>Video Progress</span>
                <span className={styles.percent}>{Math.round(progress)}%</span>
            </div>
            <div className={styles.barContainer}>
                <div
                    className={`${styles.barFill} ${progress >= 100 ? styles.completed : ''}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
            {progress < 100 && (
                <p className={styles.hint}>
                    Watch 100% of the video to complete this requirement.
                </p>
            )}
            {progress >= 100 && !isCompleted && (
                <p className={styles.successHint}>
                    ✓ Video requirement met. Pass all quizzes to complete lesson.
                </p>
            )}
        </div>
    );
};

VideoProgressBar.propTypes = {
    progress: PropTypes.number.isRequired,
    isCompleted: PropTypes.bool
};

export default VideoProgressBar;
