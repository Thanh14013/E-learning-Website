import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCourses } from '../../contexts/CoursesContext';
import api from '../../services/api';
import styles from './courseDetail.module.css';
import CourseContentAccordion from '../../components/course/CourseContentAccordion'; //thêm nội dung khóa học


// --- Các Icon SVG ---
const CheckIcon = () => <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>;
const VideoIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z"/></svg>;
const CertificateIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="m8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293l6-6zM3 8.207V13.5A.5.5 0 0 0 3.5 14h9a.5.5 0 0 0 .5-.5V8.207l-5-5-4 4z"/></svg>;
const StarIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.868 2.884c.321-.662 1.215-.662 1.536 0l1.681 3.468 3.82 1.226c.72.231.956 1.141.432 1.658l-2.932 2.862.923 4.14c.143.642-.647 1.13-1.233.82l-3.56-1.872-3.56 1.872c-.586.31-1.376-.178-1.233-.82l.923-4.14-2.932-2.862c-.524-.517-.288-1.427.432-1.658l3.82-1.226 1.681-3.468z" clipRule="evenodd" /></svg>;

// --- COMPONENT CON CHO SIDEBAR ---
const CourseSidebar = ({ course, isEnrolled, onEnroll }) => {
    const { user } = useAuth();

    return (
        <div className={styles.sidebarCard}>
            <div style={{backgroundColor: course.color}} className={styles.sidebarImage} />
            <div className={styles.sidebarContent}>
                {user && user.role === 'student' ? (
                    isEnrolled ? (
                        <button className={styles.enrolledButton} disabled>✓ Đã ghi danh</button>
                    ) : (
                        <button className={`btn btn-primary-student ${styles.enrollButton}`} onClick={() => onEnroll(course._id)}>
                            Tham gia khóa học
                        </button>
                    )
                ) : (
                    <p className="text-center">Đăng nhập để ghi danh khóa học.</p>
                )}
                
                <h4 className={styles.includesTitle}>Khóa học này bao gồm:</h4>
                <ul className={styles.includesList}>
                    <li><VideoIcon /> {course.metadata?.totalHours || 0} giờ học video</li>
                    {course.metadata?.hasCertificate && <li><CertificateIcon /> Giấy chứng nhận hoàn thành</li>}
                </ul>
            </div>
        </div>
    );
};

// --- COMPONENT CHÍNH ---
const CourseDetailPage = () => {
  const { courseId } = useParams();
  const { myCourses, enrollCourse } = useCourses();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      try {
        const [courseRes, contentRes] = await Promise.all([
            api.get(`/courses/${courseId}`),
            api.get(`/courses/${courseId}/content`)
        ]);
        setCourse(courseRes.data);
        setModules(contentRes.data);
    } catch (error) {
        console.error("Failed to fetch course data", error);
    } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [courseId]);

  const isEnrolled = myCourses.some(c => c._id === courseId);

  if (loading) return <div className="container" style={{padding: 'var(--spacing-5)'}}>Đang tải...</div>;
  if (!course) return <div className="container" style={{padding: 'var(--spacing-5)'}}>Không tìm thấy khóa học.</div>;

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.headerContainer}>
        <div className={styles.headerContent}>
          <h1>{course.name}</h1>
          <p>{course.description}</p>
          <div className={styles.metaInfo}>
            {course.bestseller && <span className="badge badge-warning">Bestseller</span>}
            <div className={styles.ratingInfo}>
              <span className={styles.avg}>{course.rating.average.toFixed(1)}</span>
              <StarIcon />
              <span className={styles.count}>({course.rating.count} ratings)</span>
            </div>
            <span>Dạy bởi {course.teacher?.name}</span>
          </div>
        </div>
      </header>

      <div className={styles.pageLayout}>
        <main className={styles.mainContent}>
          <div className={styles.sectionBox}>
            <h3>Bạn sẽ học được gì?</h3>
            <ul className={styles.highlightsGrid}>
              {course.highlights?.map((item, index) => (
                <li key={index}><CheckIcon /> <span>{item}</span></li>
              ))}
            </ul>
          </div>

          <div className={styles.sectionBox}>
            <h3>Nội dung khóa học</h3>
            <CourseContentAccordion modules={modules} />
          </div>
        </main>

        <aside className={styles.sidebar}>
          <CourseSidebar course={course} isEnrolled={isEnrolled} onEnroll={enrollCourse} />
        </aside>
      </div>
    </div>
  );
};

export default CourseDetailPage;