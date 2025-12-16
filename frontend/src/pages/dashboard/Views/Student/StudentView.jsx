import { useRef, useState, useEffect, useCallback } from 'react';
import styles from './studentView.module.css';
import { useCourses } from '../../../../contexts/CoursesContext.jsx'; 

const CourseCard = ({ course }) => (
  <div className={styles.courseCard}>
    <div
      className={styles.courseCardImage}
      style={{ backgroundColor: course.color || 'var(--color-gray-200)' }}
    ></div>
    <div className={styles.courseCardContent}>
      <h4><a href="#">{course.name}</a></h4>
    </div>
  </div>
);

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
  }, []); 

  const handleScroll = useCallback((direction) => {
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
          {courses.map(course => (
            <CourseCard key={course._id} course={course} />
          ))}
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
  
  if (loading) {
    return <p>Loading your courses...</p>;
  }

  return (
    <div>
      <h3>My Enrolled Courses ({myCourses?.length || 0})</h3>
      {myCourses && myCourses.length > 0 ? (
        <CourseCarousel courses={myCourses} />
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
