import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCourses } from '../../contexts/CoursesContext';
import styles from './Courses.module.css';
import CourseTooltip from '../../components/course/CourseTooltip.jsx';

const CoursesPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { myCourses } = useCourses(); // Chỉ lấy myCourses để kiểm tra đã ghi danh chưa

    const [displayedCourses, setDisplayedCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Đọc các giá trị filter ban đầu từ URL để khởi tạo state
    const initialUrlParams = new URLSearchParams(location.search);
    const [filters, setFilters] = useState({
        category: initialUrlParams.get('category') || '',
        level: initialUrlParams.get('level') || '',
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        // Cập nhật URL khi người dùng thay đổi bộ lọc
        const params = new URLSearchParams(location.search);
        if (value) {
            params.set(name, value);
        } else {
            params.delete(name);
        }
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    };

    // useEffect sẽ chạy mỗi khi URL (location.search) thay đổi
    useEffect(() => {
        // Cập nhật lại state của filter từ URL (để giữ đồng bộ khi người dùng back/forward)
        const params = new URLSearchParams(location.search);
        setFilters({
            category: params.get('category') || '',
            level: params.get('level') || ''
        });

        const fetchCourses = async () => {
            setLoading(true);
            try {
                // Gửi toàn bộ query string của URL đến backend
                const res = await api.get(`/courses${location.search}`);
                setDisplayedCourses(res.data);
            } catch (error) {
                console.error("Failed to fetch courses:", error);
                setDisplayedCourses([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [location.search]); // Dependency chính là location.search

    const myCourseIds = Array.isArray(myCourses) ? myCourses.map(course => course._id) : [];

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.pageTitle}>Explore Courses</h1>
            <div className={styles.filterBar}>
                <div className="form-group">
                    <label className="form-label">Category</label>
                    <select name="category" value={filters.category} onChange={handleFilterChange}  className="form-select">
                        <option value="">All Categories</option>
                        <option value="Speaking">Speaking</option>
                        <option value="Writing">Writing</option>
                        <option value="Listening">Listening</option>
                        <option value="Reading">Reading</option>
                        <option value="Grammar">Grammar</option>
                        <option value="Vocabulary">Vocabulary</option>
                        {/* Thêm các option khác */}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Level</label>
                    <select name="level" value={filters.level} onChange={handleFilterChange} className="form-select">
                        <option value="">All</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <p className={styles.loadingText}>Loading...</p>
            ) : displayedCourses.length === 0 ? (
                <p className={styles.noCoursesText}>No courses found matching your criteria.</p>
            ) : (
                <div className={styles.courseGrid}>
                    {displayedCourses.map(course => {
                        const isEnrolled = user && user.role === 'student' && myCourseIds.includes(course._id);
                        const isMyTeachingCourse = user && user.role === 'teacher' && course.teacher?._id === user.id;

                        return (
                            <Link to={`/courses/${course._id}`} key={course._id} className={styles.cardLink}>
                                <div className={styles.courseCardContainer}>
                                    <div className={styles.courseCard}>
                                        <div className={styles.cardImage} style={{ backgroundColor: course.color }}>
                                        </div>
                                        <div className={styles.cardContent}>
                                            <h4>{course.name}</h4>
                                                  <div className={styles.cardMeta}>
                                                    {course.bestseller && (
                                                      <span className={styles.bestsellerTag}>
                                                        Bestseller
                                                      </span>
                                                    )}
                                                  </div>
                                            <p className={styles.teacherName}>Taught by: {course.teacher?.name || '...'}</p>

                                            {user && user.role === 'student' && (isEnrolled ? (
                                                <div className={`${styles.btn} ${styles.btnUnenroll}`}>You have already enrolled in this course</div>
                                            ) : (
                                                <div className={`${styles.btn} ${styles.btnEnroll}`}>View Details</div>
                                            ))}
                                            {user && isMyTeachingCourse && <span className={styles.tag}>You are teaching this course</span>}
                                        </div>
                                    </div>
                                    {<CourseTooltip course={course} />}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CoursesPage;