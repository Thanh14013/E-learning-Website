import { useRef, useState, useEffect } from 'react';
import styles from './teacherView.module.css';

// Dữ liệu mẫu cho giáo viên (nhiều hơn 5 để test)
const teacherCourses = [
    { id: '1', name: 'Các hệ thống phân tán', color: '#bfdbfe' },
    { id: '2', name: 'Advanced Algorithms', color: '#fde68a' },
    { id: '3', name: 'Software Engineering', color: '#a7f3d0' },
    { id: '4', name: 'Computer Graphics', color: '#ddd6fe' },
    { id: '5', name: 'Operating Systems', color: '#fed7aa' },
    { id: '6', name: 'Database Design', color: '#fbcfe8' },
];

const CourseCard = ({ course }) => (
    <div className={styles.courseCard}>
      <div className={styles.courseCardImage} style={{ backgroundColor: course.color }}></div>
      <div className={styles.courseCardContent}>
        <h4><a href="#">{course.name}</a></h4>
      </div>
    </div>
);

// Component Carousel (tương tự StudentView)
const CourseCarousel = () => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const CARD_WIDTH_PX = 280;
  const GAP_PX = 24;
  const SCROLL_PAGE_SIZE = 4;

  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (el) {
      // Chỉ cho phép cuộn phải nếu tổng chiều rộng lớn hơn chiều rộng nhìn thấy
      const isScrollable = el.scrollWidth > el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 0);
      // Kiểm tra chính xác hơn để tránh một khoảng trống ở cuối
      setCanScrollRight(isScrollable && el.scrollLeft < (el.scrollWidth - el.clientWidth));
    }
  };
  const handleScroll = (direction) => {
    const el = scrollContainerRef.current;
    if (el) {
      // Tính toán khoảng cách cuộn chính xác
      const scrollAmount = (CARD_WIDTH_PX + GAP_PX) * SCROLL_PAGE_SIZE;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };
  // useEffect để kiểm tra khả năng cuộn khi component được mount hoặc thay đổi kích thước
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Sử dụng ResizeObserver để theo dõi sự thay đổi kích thước (tốt hơn event 'resize')
    const observer = new ResizeObserver(() => checkScrollability());
    observer.observe(el);

    el.addEventListener('scroll', checkScrollability);
    checkScrollability(); // Kiểm tra lần đầu

    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', checkScrollability);
    };
  }, []);

  if (teacherCourses.length <= 3) {
    return (
      <div className={styles.courseList}>
        {teacherCourses.map(course => <CourseCard key={course.id} course={course} />)}
      </div>
    );
  }

  return (
    <div className={styles.carouselContainer}>
      <button className={`${styles.navButton} ${styles.left}`} onClick={() => handleScroll('left')} disabled={!canScrollLeft}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
      </button>
      <div className={styles.scrollWrapper} ref={scrollContainerRef}>
        <div className={styles.courseList}>
          {teacherCourses.map(course => <CourseCard key={course.id} course={course} />)}
        </div>
      </div>
      <button className={`${styles.navButton} ${styles.right}`} onClick={() => handleScroll('right')} disabled={!canScrollRight}>
        <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
      </button>
    </div>
  );
};


const TeacherView = () => (
  <div>
    <h3>Courses you’re teaching</h3>
    <CourseCarousel />
  </div>
);

export default TeacherView;
