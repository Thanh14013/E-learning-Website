import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toastService from '../../services/toastService';
import styles from './CourseApproval.module.css';

/**
 * Course Approval Page
 * Admin interface for reviewing and approving courses
 */
const CourseApproval = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected
    const [courses, setCourses] = useState([
        {
            id: '1',
            title: 'Advanced React Patterns',
            teacher: {
                name: 'John Doe',
                email: 'john@example.com'
            },
            description: 'Learn advanced React patterns including HOCs, Render Props, and Hooks',
            category: 'Web Development',
            level: 'Advanced',
            price: 99,
            lessons: 24,
            duration: '12 hours',
            thumbnail: '/assets/course-1.jpg',
            status: 'pending',
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            enrollments: 0
        },
        {
            id: '2',
            title: 'Coding Mastery',
            teacher: {
                name: 'Jane Smith',
                email: 'jane@example.com'
            },
            description: 'Master IELTS Speaking with AI-powered feedback',
            category: 'Language',
            level: 'Intermediate',
            price: 149,
            lessons: 30,
            duration: '15 hours',
            thumbnail: '/assets/course-2.jpg',
            status: 'pending',
            submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            enrollments: 0
        },
        {
            id: '3',
            title: 'Python for Data Science',
            teacher: {
                name: 'Bob Wilson',
                email: 'bob@example.com'
            },
            description: 'Complete Python course for data analysis and visualization',
            category: 'Data Science',
            level: 'Beginner',
            price: 79,
            lessons: 40,
            duration: '20 hours',
            thumbnail: '/assets/course-3.jpg',
            status: 'approved',
            submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            enrollments: 45
        }
    ]);

    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');

    useEffect(() => {
        if (user?.role !== 'admin') {
            toastService.error('Bạn không có quyền truy cập');
            navigate('/dashboard');
            return;
        }

        loadCourses();
    }, [user, navigate]);

    const loadCourses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/courses/pending', {
                params: { status: filter === 'all' ? undefined : filter }
            });
            if (response.data.success) {
                setCourses(response.data.data);
            }
        } catch (error) {
            console.error('[CourseApproval] Error loading:', error);
            toastService.error('Không thể tải danh sách khóa học');
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(course => {
        if (filter === 'all') return true;
        return course.status === filter;
    });

    const handleReview = (course) => {
        setSelectedCourse(course);
        setReviewNotes('');
        setShowReviewModal(true);
    };

    const handleApprove = async () => {
        try {
            const response = await api.put(`/courses/${selectedCourse._id}/approve`, { notes: reviewNotes });
            if (response.data.success) {
                setCourses(prev => prev.map(c =>
                    c._id === selectedCourse._id
                        ? { ...c, approvalStatus: 'approved', approvedAt: new Date() }
                        : c
                ));
                toastService.success(`Khóa học "${selectedCourse.title}" đã được duyệt`);
            }
            setShowReviewModal(false);
            setSelectedCourse(null);
        } catch (error) {
            console.error('[CourseApproval] Error approving:', error);
            toastService.error('Không thể duyệt khóa học');
        }
    };

    const handleReject = async () => {
        if (!reviewNotes.trim()) {
            toastService.error('Vui lòng cung cấp lý do từ chối');
            return;
        }

        try {
            const response = await api.put(`/courses/${selectedCourse._id}/reject`, { notes: reviewNotes });
            if (response.data.success) {
                setCourses(prev => prev.map(c =>
                    c._id === selectedCourse._id
                        ? { ...c, approvalStatus: 'rejected', rejectedAt: new Date(), rejectionReason: reviewNotes }
                        : c
                ));
                toastService.success(`Khóa học "${selectedCourse.title}" đã bị từ chối`);
            }
            setShowReviewModal(false);
            setSelectedCourse(null);
        } catch (error) {
            console.error('[CourseApproval] Error rejecting:', error);
            toastService.error('Không thể từ chối khóa học');
        }
    };

    const handleViewCourse = (courseId) => {
        navigate(`/courses/${courseId}`);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { label: 'Pending Review', className: styles.statusPending },
            approved: { label: 'Approved', className: styles.statusApproved },
            rejected: { label: 'Rejected', className: styles.statusRejected }
        };
        return badges[status] || badges.pending;
    };

    const stats = {
        pending: courses.filter(c => c.status === 'pending').length,
        approved: courses.filter(c => c.status === 'approved').length,
        rejected: courses.filter(c => c.status === 'rejected').length
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading courses...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Course Approval</h1>
                    <p className={styles.subtitle}>
                        Review and approve courses submitted by teachers
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.pending}</div>
                    <div className={styles.statLabel}>Pending Review</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.approved}</div>
                    <div className={styles.statLabel}>Approved</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.rejected}</div>
                    <div className={styles.statLabel}>Rejected</div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <button
                    className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Courses
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'pending' ? styles.filterActive : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    Pending ({stats.pending})
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'approved' ? styles.filterActive : ''}`}
                    onClick={() => setFilter('approved')}
                >
                    Approved ({stats.approved})
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'rejected' ? styles.filterActive : ''}`}
                    onClick={() => setFilter('rejected')}
                >
                    Rejected ({stats.rejected})
                </button>
            </div>

            {/* Courses List */}
            <div className={styles.coursesList}>
                {filteredCourses.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No courses found</p>
                    </div>
                ) : (
                    filteredCourses.map(course => {
                        const statusBadge = getStatusBadge(course.status);
                        return (
                            <div key={course.id} className={styles.courseCard}>
                                <div className={styles.courseHeader}>
                                    <div className={styles.courseInfo}>
                                        <h3 className={styles.courseTitle}>{course.title}</h3>
                                        <p className={styles.courseTeacher}>
                                            by {course.teacher.fullName}
                                        </p>
                                    </div>
                                    <span className={`${styles.statusBadge} ${statusBadge.className}`}>
                                        {statusBadge.label}
                                    </span>
                                </div>

                                <p className={styles.courseDesc}>{course.description}</p>

                                <div className={styles.courseMeta}>
                                    <span className={styles.metaItem}>
                                        📚 {course.lessons} lessons
                                    </span>
                                    <span className={styles.metaItem}>
                                        ⏱️ {course.duration}
                                    </span>
                                    <span className={styles.metaItem}>
                                        📊 {course.level}
                                    </span>
                                    <span className={styles.metaItem}>
                                        💰 ${course.price}
                                    </span>
                                </div>

                                <div className={styles.courseFooter}>
                                    <div className={styles.courseDate}>
                                        Submitted: {formatDate(course.submittedAt)}
                                        {course.approvedAt && (
                                            <> • Approved: {formatDate(course.approvedAt)}</>
                                        )}
                                    </div>
                                    <div className={styles.courseActions}>
                                        <button
                                            className={styles.viewBtn}
                                            onClick={() => handleViewCourse(course.id)}
                                        >
                                            View Details
                                        </button>
                                        {course.status === 'pending' && (
                                            <button
                                                className={styles.reviewBtn}
                                                onClick={() => handleReview(course)}
                                            >
                                                Review
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Review Modal */}
            {showReviewModal && selectedCourse && (
                <div className={styles.modalOverlay} onClick={() => setShowReviewModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Review Course</h2>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setShowReviewModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.modalContent}>
                            <div className={styles.reviewCourse}>
                                <h3>{selectedCourse.title}</h3>
                                <p>by {selectedCourse.teacher.fullName}</p>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Review Notes (Optional for approval, Required for rejection)
                                </label>
                                <textarea
                                    className={styles.textarea}
                                    rows={4}
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Enter your review notes or feedback..."
                                />
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={styles.rejectBtn}
                                onClick={handleReject}
                            >
                                Reject Course
                            </button>
                            <button
                                className={styles.approveBtn}
                                onClick={handleApprove}
                            >
                                Approve Course
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseApproval;
