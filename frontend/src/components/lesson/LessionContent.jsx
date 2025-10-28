import PropTypes from 'prop-types';
import styles from './LessonContent.module.css';

/**
 * LessonContent Component (Legacy - kept for backward compatibility)
 * This component displays lesson content in a formatted way
 * Note: Main lesson functionality is now in LessonPlayer page
 */
const LessonContent = ({ content }) => {
  if (!content) {
    return (
      <div className={styles.emptyState}>
        <p>No content available for this lesson.</p>
      </div>
    );
  }

  return (
    <div className={styles.lessonContent}>
      <div 
        className={styles.contentBody}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

LessonContent.propTypes = {
  content: PropTypes.string
};

export default LessonContent;
