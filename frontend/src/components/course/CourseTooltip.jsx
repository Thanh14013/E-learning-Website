import styles from '../../pages/courses/course.module.css';

const CourseTooltip = ({ course }) => {
  // Kiểm tra an toàn: Đảm bảo highlights là một mảng trước khi map
  const hasHighlights = course.highlights && Array.isArray(course.highlights);

  return (
    <div className={styles.tooltipContainer}>
      <h4>{course.name}</h4>
      {course.bestseller && <span className={`${styles.tag} ${styles.bestsellerTag}`}>Bestseller</span>}
      <p className={styles.tooltipMeta}>
        <span>{course.metadata?.totalHours || 20} total hours</span> • 
        <span> {course.metadata?.level || 'All Levels'}</span> • 
        <span> Subtitles</span>
      </p>
      <p className={styles.tooltipSummary}>{course.summary}</p>
      
      {}
      {/* Dùng .map() để lặp qua mảng highlights và render từng mục */}
      {hasHighlights && (
        <ul className={styles.tooltipChecklist}>
          {course.highlights.map((highlight, index) => (
            <li key={index}>✓ {highlight}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CourseTooltip;