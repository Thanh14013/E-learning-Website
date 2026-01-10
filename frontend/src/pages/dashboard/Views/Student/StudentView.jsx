import { useRef, useState, useEffect, useCallback } from 'react';
import styles from './studentView.module.css';
import { useCourses } from '../../../../contexts/CoursesContext.jsx';

const CourseCard = ({ course }) => (
  <div className={styles.courseCard}>
    <div className={styles.courseCardImage}>
      {course.thumbnail ? (
        <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ backgroundColor: '#667eea', width: '100%', height: '100%' }}></div>
      )}
    </div>
    <div className={styles.courseCardContent}>
      <h4><a href={`/courses/${course._id}`}>{course.title}</a></h4>
      <div className={styles.courseRating}>
        <span className={styles.starIcon}>⭐</span>
        <span>{course.rating?.toFixed(1) || '0.0'}</span>
        <span className={styles.reviewCount}>({course.totalReviews || 0} reviews)</span>
      </div>
    </div>
  </div>
);

const StudentView = () => {
  const { myCourses, loading } = useCourses();
  const [currentPage, setCurrentPage] = useState(1);
  const [courseProgress, setCourseProgress] = useState({});
  const coursesPerPage = 4;

  // Extract progress from myCourses (already included from backend)
  useEffect(() => {
    if (myCourses && myCourses.length > 0) {
      const progressData = {};
      myCourses.forEach(course => {
        if (course.progress) {
          progressData[course._id] = {
            completedLessons: course.progress.completedLessons || 0,
            totalLessons: course.progress.totalLessons || 0,
            progressPercentage: course.progress.percentage || 0
          };
        } else {
          // Fallback nếu progress không có
          progressData[course._id] = {
            completedLessons: 0,
            totalLessons: 0,
            progressPercentage: 0
          };
        }
      });
      setCourseProgress(progressData);
    }
  }, [myCourses]);

  if (loading) {
    return <p>Loading your courses...</p>;
  }

  // Pagination logic
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = myCourses?.slice(indexOfFirstCourse, indexOfLastCourse) || [];
  const totalPages = Math.ceil((myCourses?.length || 0) / coursesPerPage);

      return (
        <div className={styles.enrolledSection}>
            <div className={styles.sectionHeader}>
              <h3>My Enrolled Courses
                <span className={styles.courseCount}>
                  ({myCourses?.length || 0})
                </span>
              </h3>
            </div>
          {myCourses && myCourses.length > 0 ? (<>
              <div className={styles.coursesGridWrapper}>
                <div className={styles.coursesGrid}>
                  {currentCourses.map(course => {
                    const progress = courseProgress[course._id] || {
                      completedLessons: 0,
                      totalLessons: 0,
                      progressPercentage: 0,
                    };
                    return (
                      <div key={course._id} className={styles.courseCard}>
                        <div className={styles.courseCardImage}>
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover',}}/>
                          ) : (
                            <div
                              style={{backgroundColor: '#667eea', width: '100%', height: '100%',}}/>
                          )}
                        </div>
                        <div className={styles.courseCardContent}>
                          <h4>
                            <a href={`/courses/${course._id}`}>
                              {course.title}
                            </a>
                          </h4>

                          <div className={styles.courseRating}>
                            <span className={styles.starIcon}>⭐</span>
                            <span>{course.rating?.toFixed(1) || '0.0'}</span>
                            <span className={styles.reviewCount}>
                              ({course.totalReviews || 0} reviews)
                            </span>
                          </div>

                          <div className={styles.progressSection}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressText}>
                                {progress.completedLessons} / {progress.totalLessons} lessons
                              </span>
                              <span className={styles.progressPercent}>
                                {progress.progressPercentage}%
                              </span>
                            </div>

                            <div className={styles.progressBar}>
                              <div
                                className={styles.progressFill}
                                style={{
                                  width: `${progress.progressPercentage}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={styles.paginationBtn}
              >
                ← Previous
              </button>
              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={styles.paginationBtn}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <p>
          You haven't enrolled in any courses yet.{' '}
          <a href="/courses">Browse courses now!</a>
        </p>
      )}
    </div>
  );
};

export default StudentView;
