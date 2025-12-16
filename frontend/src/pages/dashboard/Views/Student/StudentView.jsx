import { useRef, useState, useEffect } from 'react';
import styles from './studentView.module.css';
import { useCourses } from '../../../../contexts/CoursesContext.jsx'; 

const CourseCard = ({ course }) => (
    <div className={styles.courseCard}>
      <div className={styles.courseCardImage} style={{ backgroundColor: course.color }}></div>
      <div className={styles.courseCardContent}>
        <h4><a href="#">{course.name}</a></h4>
      </div>
    </div>
);

const CourseCarousel = ({ courses }) => { 
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const CARD_WIDTH_PX = 280;
  const GAP_PX = 24;
  const SCROLL_PAGE_SIZE = 4;

  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const isScrollable = el.scrollWidth > el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(isScrollable && el.scrollLeft < (el.scrollWidth - el.clientWidth));
    }
  };
  
  const handleScroll = (direction) => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = (CARD_WIDTH_PX + GAP_PX) * SCROLL_PAGE_SIZE;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(checkScrollability);
    observer.observe(el);
    el.addEventListener('scroll', checkScrollability);
    checkScrollability();
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', checkScrollability);
    };
  }, [courses]);

  if (!Array.isArray(courses)) {
    return null;
  }

  if (courses.length <= 4) { // Điều kiện dựa trên dữ liệu thật
    return (
      <div className={styles.courseList}>
        {courses.map(course => <CourseCard key={course._id} course={course} />)}
      </div>
    )
  }

  return (
    <div className={styles.carouselContainer}>
      <button className={`${styles.navButton} ${styles.left}`} onClick={() => handleScroll('left')} disabled={!canScrollLeft}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
      </button>

      <div className={styles.scrollWrapper} ref={scrollContainerRef}>
        <div className={styles.courseList}>
          {courses.map(course => <CourseCard key={course._id} course={course} />)}
        </div>
      </div>

      <button className={`${styles.navButton} ${styles.right}`} onClick={() => handleScroll('right')} disabled={!canScrollRight}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
      </button>
    </div>
  );
};

// --- Component chính: StudentView ---
const StudentView = () => {
  const { myCourses, loading } = useCourses(); 
  
  if (loading) {
    return <p>Loading your courses...</p>;
  }

  return (
    <div>
      <h3>My Enrolled Courses ({myCourses.length})</h3>
      {myCourses && myCourses.length > 0 ? (
         <CourseCarousel courses={myCourses} />
      ) : (
        <p>You haven't enrolled in any courses yet. <a href="/courses">Browse courses now!</a></p>
      )}
    </div>
  );
};

export default StudentView;