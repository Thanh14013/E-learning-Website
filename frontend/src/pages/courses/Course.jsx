import { useCourses } from '../../contexts/CoursesContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './Courses.module.css';

function CoursesPage() {
  const { user } = useAuth();
  const { allCourses, myCourses, loading, enrollCourse } = useCourses();

  // Xử lý trạng thái Loading trước tiên
  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <p className={styles.loadingText}>Loading available courses...</p>
      </div>
    );
  }

  // Luôn đảm bảo myCourseIds là một mảng an toàn
  const myCourseIds = user && Array.isArray(myCourses) 
    ? myCourses.map(course => course._id) 
    : [];

  // --- SỬA LỖI Ở ĐÂY: Thêm lớp bảo vệ cuối cùng ---
  // Kiểm tra xem allCourses có thực sự là một mảng và có phần tử hay không
  const hasCourses = Array.isArray(allCourses) && allCourses.length > 0;

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Explore Courses</h1>
      <p className={styles.pageSubtitle}>Find your next learning opportunity.</p>

      {/* Sử dụng biến `hasCourses` để quyết định render */}
      {!hasCourses ? (
        <p className={styles.noCoursesText}>There are no courses available at the moment. Please check back later!</p>
      ) : (
        <div className={styles.courseGrid}>
          {allCourses.map(course => { // Bây giờ dòng này luôn an toàn
            const isEnrolled = user && user.role === 'student' && myCourseIds.includes(course._id);
            const isMyTeachingCourse = user && user.role === 'teacher' && course.teacher?._id === user.id;

            return (
              <div key={course._id} className={styles.courseCard}>
                <div className={styles.cardImage} style={{ backgroundColor: course.color }}></div>
                <div className={styles.cardContent}>
                  <h4>{course.name}</h4>
                  <p className={styles.teacherName}>Taught by: {course.teacher?.name || 'N/A'}</p>
                  
                  {user && user.role === 'student' && (
                    isEnrolled ? (
                      <button className={`${styles.btn} ${styles.btnUnenroll}`} disabled>
                        ✓ Enrolled
                      </button>
                    ) : (
                      <button 
                        className={`${styles.btn} ${styles.btnEnroll}`} 
                        onClick={() => enrollCourse(course._id)}
                      >
                        Enroll Now
                      </button>
                    )
                  )}

                  {user && isMyTeachingCourse && (
                    <span className={styles.tag}>You are teaching this course</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CoursesPage;