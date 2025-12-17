import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCourses } from '../../contexts/CoursesContext';
import styles from './Courses.module.css';

const CoursesPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { myCourses } = useCourses(); // Chỉ lấy myCourses để kiểm tra đã ghi danh chưa

    const [displayedCourses, setDisplayedCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const coursesPerPage = 8;

    // Đọc các giá trị filter ban đầu từ URL để khởi tạo state
    const initialUrlParams = new URLSearchParams(location.search);
    const [filters, setFilters] = useState({
        category: initialUrlParams.get('category') || '',
        level: initialUrlParams.get('level') || '',
        search: initialUrlParams.get('search') || '',
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
        const searchFromUrl = params.get('search') || '';
        setFilters({
            category: params.get('category') || '',
            level: params.get('level') || '',
            search: searchFromUrl,
        });
        setSearchQuery(searchFromUrl);

        const fetchCourses = async () => {
            setLoading(true);
            try {
                // Fetch with maximum allowed limit
                const separator = location.search ? '&' : '?';
                const res = await api.get(`/courses${location.search}${separator}limit=100`);
                const courses = res.data?.data || res.data?.courses || res.data || [];
                console.log('📚 Fetched courses:', courses);
                setDisplayedCourses(Array.isArray(courses) ? courses : []);
            } catch (error) {
                console.error("Failed to fetch courses:", error);
                setDisplayedCourses([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [location.search]); // Dependency chính là location.search

    // Handle search - only trigger on button click
    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams(location.search);
        const searchTerm = searchQuery.trim();

        if (searchTerm) {
            params.set('search', searchTerm);
        } else {
            params.delete('search');
        }

        // Reset to page 1 when searching
        setCurrentPage(1);
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    };

    // Pagination - no local filtering, backend handles search
    const indexOfLastCourse = currentPage * coursesPerPage;
    const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
    const currentCourses = displayedCourses.slice(indexOfFirstCourse, indexOfLastCourse);
    const totalPages = Math.ceil(displayedCourses.length / coursesPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const myCourseIds = Array.isArray(myCourses) ? myCourses.map(course => course._id) : [];

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.pageTitle}>Explore Courses</h1>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className={styles.searchBar}>
                <input
                    type="text"
                    placeholder="🔍 Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
                <button type="submit" className={styles.searchButton}>
                    Search
                </button>
            </form>

            <div className={styles.filterBar}>
                <div className="form-group">
                    <label className="form-label">Category</label>
                    <select name="category" value={filters.category} onChange={handleFilterChange} className="form-select">
                        <option value="">All Categories</option>
                        <option value="Programming">Programming</option>
                        <option value="Frontend">Frontend</option>
                        <option value="Backend">Backend</option>
                        <option value="Full Stack">Full Stack</option>
                        <option value="DevOps">DevOps</option>
                        <option value="Cloud Computing">Cloud Computing</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Machine Learning">Machine Learning</option>
                        <option value="Mobile Development">Mobile Development</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                        <option value="Nodejs">Node.js</option>
                        <option value="Reactjs">React.js</option>
                        <option value="Java">Java</option>
                        <option value="Python">Python</option>
                        <option value="C++">C++</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Level</label>
                    <select name="level" value={filters.level} onChange={handleFilterChange} className="form-select">
                        <option value="">All Levels</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <p className={styles.loadingText}>Loading...</p>
            ) : currentCourses.length === 0 ? (
                <p className={styles.noCoursesText}>No courses found matching your criteria.</p>
            ) : (
                <>
                    <div className={styles.courseGrid}>
                        {currentCourses.map(course => {
                            const isEnrolled = user && user.role === 'student' && myCourseIds.includes(course._id);
                            const isMyTeachingCourse = user && user.role === 'teacher' && course.teacher?._id === user._id;

                            return (
                                <Link to={`/courses/${course._id}`} key={course._id} className={styles.cardLink}>
                                    <div className={styles.courseCard}>
                                        {/* Course Thumbnail */}
                                        <div className={styles.cardImageWrapper}>
                                            <img
                                                src={course.thumbnail || "https://via.placeholder.com/400x250?text=Course"}
                                                alt={course.title}
                                                className={styles.cardImage}
                                                onError={(e) => {
                                                    e.target.src = "https://via.placeholder.com/400x250?text=Course";
                                                }}
                                            />
                                            {course.isPublished && (
                                                <span className={styles.publishedBadge}>Published</span>
                                            )}
                                        </div>

                                        <div className={styles.cardContent}>
                                            {/* Category and Level */}
                                            <div className={styles.cardMeta}>
                                                <span className={styles.categoryBadge}>{course.category}</span>
                                                <span className={styles.levelBadge}>{course.level}</span>
                                            </div>

                                            {/* Title */}
                                            <h4 className={styles.courseTitle}>{course.title}</h4>

                                            {/* Description */}
                                            <p className={styles.courseDescription}>
                                                {course.description?.substring(0, 100)}
                                                {course.description?.length > 100 ? '...' : ''}
                                            </p>

                                            {/* Teacher Info */}
                                            <p className={styles.teacherName}>
                                                <span className={styles.teacherIcon}>👨‍🏫</span>
                                                {course.teacherId?.fullName || 'Unknown Teacher'}
                                            </p>

                                            {/* Course Stats */}
                                            <div className={styles.courseStats}>
                                                <div className={styles.statItem}>
                                                    <span className={styles.statIcon}>⭐</span>
                                                    <span>{course.rating?.toFixed(1) || '0.0'}</span>
                                                    <span className={styles.statLabel}>({course.totalReviews || 0})</span>
                                                </div>
                                                <div className={styles.statItem}>
                                                    <span className={styles.statIcon}>👥</span>
                                                    <span>{course.enrolledStudents?.length || 0}</span>
                                                    <span className={styles.statLabel}>students</span>
                                                </div>
                                            </div>

                                            {/* Enrollment Status */}
                                            {user && user.role === 'student' && (
                                                isEnrolled ? (
                                                    <div className={`${styles.statusBtn} ${styles.enrolled}`}>
                                                        ✅ Enrolled
                                                    </div>
                                                ) : (
                                                    <div className={`${styles.statusBtn} ${styles.available}`}>
                                                        View Details →
                                                    </div>
                                                )
                                            )}

                                            {user && isMyTeachingCourse && (
                                                <div className={`${styles.statusBtn} ${styles.teaching}`}>
                                                    🏛️ Your Course
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={styles.paginationBtn}
                            >
                                ← Previous
                            </button>

                            <div className={styles.pageNumbers}>
                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index + 1}
                                        onClick={() => handlePageChange(index + 1)}
                                        className={`${styles.pageNumber} ${currentPage === index + 1 ? styles.active : ''}`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={styles.paginationBtn}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CoursesPage;