import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toastService from '../../services/toastService';
import api from '../../services/api';
import { useConfirm } from '../../contexts/ConfirmDialogContext';
import styles from './CourseApproval.module.css';

/**
 * Admin Courses Page
 * View and manage all courses with filters
 */
const CourseApproval = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { confirm } = useConfirm();

    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // Default to all
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 5;

    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');

    useEffect(() => {
        if (user?.role !== 'admin') {
            toastService.error('You do not have access');
            navigate('/dashboard');
            return;
        }

        loadCourses();
    }, [user, navigate, filter, page]);

    const loadCourses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/courses', {
                params: { status: filter, page, limit },
            });
            if (response.data.success) {
                setCourses(response.data.data || []);
                if (response.data.stats) {
                    setStats(response.data.stats);
                }
                if (response.data.pagination) {
                    setTotalPages(response.data.pagination.totalPages);
                }
            } else {
                setCourses([]);
            }
        } catch (error) {
            console.error('[CourseApproval] Error loading:', error);
            toastService.error('Unable to load course list');
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    // Removed redundant filteredCourses logic. We trust the API to return filtered data.

    const handleReview = (course) => {
        setSelectedCourse(course);
        setReviewNotes('');
        setShowReviewModal(true);
    };

    const handleApprove = async () => {
        try {
            const response = await api.put(`/admin/courses/${selectedCourse._id}/approve`, { notes: reviewNotes });
            if (response.data.success) {
                toastService.success(`Course "${selectedCourse.title}" has been approved`);
                loadCourses(); // Refresh list
            }
            setShowReviewModal(false);
            setSelectedCourse(null);
        } catch (error) {
            console.error('[CourseApproval] Error approving:', error);
            toastService.error('Unable to approve course');
        }
    };

    const handleReject = async () => {
        if (!reviewNotes.trim()) {
            toastService.error('Please provide a reason for rejection');
            return;
        }

        try {
            const response = await api.put(`/admin/courses/${selectedCourse._id}/reject`, { notes: reviewNotes });
            if (response.data.success) {
                toastService.success(`Course "${selectedCourse.title}" has been rejected`);
                loadCourses(); // Refresh list
            }
            setShowReviewModal(false);
            setSelectedCourse(null);
        } catch (error) {
            console.error('[CourseApproval] Error rejecting:', error);
            toastService.error('Unable to reject course');
        }
    };

    const handleDeleteCourse = async (courseId, courseTitle) => {
        const isConfirmed = await confirm(
            `Are you sure you want to delete the course "${courseTitle}"? This action cannot be undone.`,
            {
                type: 'danger',
                title: 'Delete Course',
                confirmText: 'Delete',
            }
        );

        if (!isConfirmed) return;

        try {
            await api.delete(`/courses/${courseId}`);
            toastService.success('Course deleted successfully');
            loadCourses();
        } catch (error) {
            console.error('[CourseApproval] Delete error:', error);
            toastService.error(error.response?.data?.message || 'Failed to delete course');
        }
    };

    const handleViewCourse = (courseId) => {
        navigate(`/admin/courses/${courseId}`);
    };

    const handleFilterClick = (newFilter) => {
        // Toggle filter: if clicking the current valid filter, revert to 'all'
        if (filter === newFilter) {
            setFilter('all');
        } else {
            setFilter(newFilter);
        }
        setPage(1); // Reset to first page on filter change
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
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

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading filter...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>All Courses</h1>
                    <p className={styles.subtitle}>
                        Manage and review all courses
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                <div className={styles.statCard} onClick={() => handleFilterClick('pending')} style={{ cursor: 'pointer' }}>
                    <div className={styles.statValue}>{stats.pending}</div>
                    <div className={styles.statLabel}>Pending Review</div>
                </div>
                <div className={styles.statCard} onClick={() => handleFilterClick('approved')} style={{ cursor: 'pointer' }}>
                    <div className={styles.statValue}>{stats.approved}</div>
                    <div className={styles.statLabel}>Approved</div>
                </div>
                <div className={styles.statCard} onClick={() => handleFilterClick('rejected')} style={{ cursor: 'pointer' }}>
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
                    onClick={() => handleFilterClick('pending')}
                >
                    Pending ({stats.pending})
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'approved' ? styles.filterActive : ''}`}
                    onClick={() => handleFilterClick('approved')}
                >
                    Approved ({stats.approved})
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'rejected' ? styles.filterActive : ''}`}
                    onClick={() => handleFilterClick('rejected')}
                >
                    Rejected ({stats.rejected})
                </button>
            </div>

            {/* Courses List */}
            <div className={styles.coursesList}>
                {courses.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No courses found for this filter.</p>
                        {filter !== 'all' && (
                            <button className={styles.viewBtn} onClick={() => setFilter('all')}>
                                Show All Courses
                            </button>
                        )}
                    </div>
                ) : (
                    courses.map(course => {
                        const status = course.approvalStatus || course.status || 'pending';
                        const statusBadge = getStatusBadge(status);
                        const teacher = course.teacher || course.teacherId || {};
                        const key = course._id || course.id;
                        return (
                            <div key={key} className={styles.courseCard}>
                                <div className={styles.courseHeader}>
                                    <div className={styles.courseInfo}>
                                        <h3 className={styles.courseTitle}>{course.title}</h3>
                                        <p className={styles.courseTeacher}>
                                            by {teacher.fullName || teacher.name || 'Unknown'}
                                        </p>
                                    </div>
                                    <span className={`${styles.statusBadge} ${statusBadge.className}`}>
                                        {statusBadge.label}
                                    </span>
                                </div>

                                <p className={styles.courseDesc}>{course.description}</p>

                                <div className={styles.courseMeta}>
                                    <span className={styles.metaItem}>
                                        📊 {course.level || 'N/A'}
                                    </span>
                                    <span className={styles.metaItem}>
                                        🏷️ {course.category || 'Uncategorized'}
                                    </span>
                                    <span className={styles.metaItem}>
                                        📢 {course.isPublished ? 'Published' : 'Not Published'}
                                    </span>
                                    <span className={styles.metaItem}>
                                        👥 {course.enrolledStudents?.length || 0} learners
                                    </span>
                                </div>

                                <div className={styles.courseFooter}>
                                    <div className={styles.courseDate}>
                                        Submitted: {formatDate(course.submittedAt || course.createdAt)}
                                        {course.approvedAt && (
                                            <> • Approved: {formatDate(course.approvedAt)}</>
                                        )}
                                    </div>
                                    <div className={styles.courseActions}>
                                        <button
                                            className={styles.viewBtn}
                                            onClick={() => handleViewCourse(course._id || course.id)}
                                        >
                                            View Details
                                        </button>
                                        {status === 'pending' && (
                                            <button
                                                className={styles.reviewBtn}
                                                onClick={() => handleReview(course)}
                                            >
                                                Review
                                            </button>
                                        )}
                                        <button
                                            className={styles.rejectBtn}
                                            style={{ marginLeft: '8px', padding: '8px 16px', fontSize: '0.9rem' }}
                                            onClick={() => handleDeleteCourse(course._id || course.id, course.title)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        className={styles.pageBtn}
                        disabled={page === 1}
                        onClick={() => handlePageChange(page - 1)}
                    >
                        Previous
                    </button>
                    <span className={styles.pageInfo}>
                        Page {page} of {totalPages}
                    </span>
                    <button
                        className={styles.pageBtn}
                        disabled={page === totalPages}
                        onClick={() => handlePageChange(page + 1)}
                    >
                        Next
                    </button>
                </div>
            )}

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
                                <p>by {(selectedCourse.teacher || selectedCourse.teacherId)?.fullName}</p>
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
