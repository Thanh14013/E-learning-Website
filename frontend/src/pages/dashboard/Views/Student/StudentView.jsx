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

// --- Component Carousel (SỬA LỖI Ở ĐÂY) ---
// Nó phải nhận 'courses' như một prop
const CourseCarousel = ({ courses }) => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const isScrollable = el.scrollWidth > el.clientWidth;
      const isAtStart = el.scrollLeft <= 0;
      const isAtEnd = Math.abs(el.scrollWidth - el.clientWidth - el.scrollLeft) <= 1;

      setCanScrollLeft(!isAtStart);
      setCanScrollRight(isScrollable && !isAtEnd);
    }
  };
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.8;
      el.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let timeoutId;
    const handleScrollDebounced = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(checkScrollability, 100);
    };

    const observer = new ResizeObserver(checkScrollability);
    observer.observe(el);
    el.addEventListener('scroll', handleScrollDebounced);

    checkScrollability();

    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', handleScrollDebounced);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [courses, checkScrollability]);

  if (!Array.isArray(courses)) return null;

  if (courses.length <= 4) {
    return (
      <div className={styles.courseList}>
        {courses.map(course => (
          <CourseCard key={course._id} course={course} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.carouselContainer}>
      <button
        className={`${styles.navButton} ${styles.left}`}
        onClick={() => handleScroll('left')}
        disabled={!canScrollLeft}
        aria-label="Scroll left"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>

      <div className={styles.scrollWrapper} ref={scrollContainerRef}>
        <div className={styles.courseList}>
          {/* SỬA LỖI: Dùng prop `courses` và key={course._id} */}
          {courses.map(course => <CourseCard key={course._id} course={course} />)}
        </div>
      </div>

      <button
        className={`${styles.navButton} ${styles.right}`}
        onClick={() => handleScroll('right')}
        disabled={!canScrollRight}
        aria-label="Scroll right"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
};

const StudentView = () => {
  const { myCourses, loading } = useCourses();
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 4;

  if (loading) {
    return <p>Loading your courses...</p>;
  }

  // Pagination logic
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = myCourses?.slice(indexOfFirstCourse, indexOfLastCourse) || [];
  const totalPages = Math.ceil((myCourses?.length || 0) / coursesPerPage);

  return (
    <div>
      <h3>My Enrolled Courses ({myCourses?.length || 0})</h3>
      {myCourses && myCourses.length > 0 ? (
        <>
          <div className={styles.coursesGrid}>
            {currentCourses.map(course => (
              <CourseCard key={course._id} course={course} />
            ))}
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
