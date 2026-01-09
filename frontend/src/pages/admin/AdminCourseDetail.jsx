import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toastService from '../../services/toastService';
import api from '../../services/api';
import { useConfirm } from '../../contexts/ConfirmDialogContext';
import DiscussionModal from '../../components/discussion/DiscussionModal';
import styles from './AdminCourseDetail.module.css';

const AdminCourseDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { confirm } = useConfirm();

    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [activeTab, setActiveTab] = useState('content');
    const [expandedLessons, setExpandedLessons] = useState({});
    const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);

    // For Review/Reject logic
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        if (user?.role !== 'admin') {
            toastService.error('Access denied');
            navigate('/dashboard');
            return;
        }
        fetchCourseDetail();
    }, [id, user, navigate]);

    const fetchCourseDetail = async () => {
        try {
            setLoading(true);
            // Use the teacher endpoint to get full access (including quizzes/answers)
            const response = await api.get(`/teacher/courses/${id}`);
            if (response.data.success) {
                setCourse(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching course:', error);
            toastService.error('Unable to load course details');
            navigate('/admin/courses');
        } finally {
            setLoading(false);
        }
    };

    const toggleLesson = (chapterId, lessonId) => {
        setExpandedLessons(prev => ({
            ...prev,
            [`${chapterId}-${lessonId}`]: !prev[`${chapterId}-${lessonId}`]
        }));
    };

    const handleApprove = async () => {
        if (!window.confirm('Are you sure you want to approve this course?')) return;
        try {
            const response = await api.put(`/admin/courses/${id}/approve`);
            if (response.data.success) {
                toastService.success('Course approved successfully');
                fetchCourseDetail();
            }
        } catch (error) {
            console.error('Error approving course:', error);
            toastService.error('Failed to approve course');
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toastService.error('Please provide a rejection reason');
            return;
        }
        try {
            const response = await api.put(`/admin/courses/${id}/reject`, { notes: rejectReason });
            if (response.data.success) {
                toastService.success('Course rejected');
                setShowRejectModal(false);
                setRejectReason('');
                fetchCourseDetail();
            }
        } catch (error) {
            console.error('Error rejecting course:', error);
            toastService.error('Failed to reject course');
        }
    };

    const handleDelete = async () => {
        const isConfirmed = await confirm(
            `Are you sure you want to delete the course "${course.title}"? This action cannot be undone.`,
            {
                type: 'danger',
                title: 'Delete Course',
                confirmText: 'Delete',
            }
        );

        if (!isConfirmed) return;

        try {
            await api.delete(`/courses/${id}`);
            toastService.success('Course deleted successfully');
            navigate('/admin/courses');
        } catch (error) {
            console.error('Error deleting course:', error);
            toastService.error('Failed to delete course');
        }
    };

    const handleDeleteDiscussion = async (discussionId, e) => {
        e.stopPropagation();
        const isConfirmed = await confirm(
            'Are you sure you want to delete this discussion?',
            {
                type: 'danger',
                title: 'Delete Discussion',
                confirmText: 'Delete',
            }
        );

        if (!isConfirmed) return;

        try {
            await api.delete(`/discussions/${discussionId}`);
            toastService.success('Discussion deleted successfully');
            fetchCourseDetail();
        } catch (error) {
            console.error('Error deleting discussion:', error);
            toastService.error('Failed to delete discussion');
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            pending: { label: 'Pending Review', class: styles.statusPending },
            approved: { label: 'Approved', class: styles.statusApproved },
            rejected: { label: 'Rejected', class: styles.statusRejected },
        };
        const item = map[status] || map.pending;
        return <span className={`${styles.statusBadge} ${item.class}`}>{item.label}</span>;
    };

    if (loading) return <div className={styles.loading}><div className={styles.spinner}></div></div>;
    if (!course) return null;

    return (
        <div className={styles.container}>
            <button className={styles.backBtn} onClick={() => navigate('/admin/courses')}>
                ← Back to Courses
            </button>

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <div>
                        <h1 className={styles.title}>{course.title}</h1>
                        <div className={styles.teacherInfo}>
                            By <strong>{course.teacherId?.fullName}</strong> • {course.category} • {course.level}
                        </div>
                    </div>
                    {getStatusBadge(course.approvalStatus)}
                </div>

                <p style={{ color: '#4b5563', lineHeight: '1.6', marginBottom: '24px' }}>
                    {course.description}
                </p>

                <div className={styles.actionButtons}>
                    {course.approvalStatus === 'pending' && (
                        <>
                            <button className={styles.approveBtn} onClick={handleApprove}>
                                Approve Course
                            </button>
                            <button
                                className={styles.rejectBtn}
                                onClick={() => setShowRejectModal(true)}
                            >
                                Reject Course
                            </button>
                        </>
                    )}
                    <button
                        className={styles.rejectBtn}
                        onClick={handleDelete}
                    >
                        Delete Course
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'content' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('content')}
                >
                    Course Content
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'discussions' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('discussions')}
                >
                    Discussions ({course.discussions?.length || 0})
                </button>
            </div>

            {/* Content Tab */}
            {activeTab === 'content' && (
                <div className={styles.section}>
                    {course.chapters?.map((chapter) => (
                        <div key={chapter._id} className={styles.chapter}>
                            <div className={styles.chapterHeader}>
                                {chapter.title}
                            </div>
                            <div className={styles.lessons}>
                                {chapter.lessons?.map((lesson) => {
                                    const isExpanded = expandedLessons[`${chapter._id}-${lesson._id}`];
                                    return (
                                        <div key={lesson._id} className={styles.lesson}>
                                            <div
                                                className={styles.lessonHeader}
                                                onClick={() => toggleLesson(chapter._id, lesson._id)}
                                            >
                                                <div className={styles.lessonTitle}>
                                                    {isExpanded ? '▼' : '▶'} {lesson.title}
                                                    <span className={styles.lessonType}>{lesson.type || 'Lesson'}</span>
                                                </div>
                                                <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                                                    {lesson.duration}
                                                </span>
                                            </div>

                                            {isExpanded && (
                                                <div className={styles.lessonContent}>
                                                    {/* Video */}
                                                    {lesson.videoUrl && (
                                                        <div className={styles.videoWrapper}>
                                                            <video
                                                                controls
                                                                className={styles.video}
                                                                src={lesson.videoUrl}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Content Text */}
                                                    <div className={styles.lessonDescription} dangerouslySetInnerHTML={{ __html: lesson.content }} />

                                                    {/* Quiz Content */}
                                                    {lesson.quiz && (
                                                        <div className={styles.quizContainer}>
                                                            <div className={styles.quizHeader}>
                                                                <h3 style={{ margin: '0 0 8px' }}>Quiz: {lesson.quiz.title}</h3>
                                                                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                                                    Passing Score: {lesson.quiz.passingScore}% •
                                                                    Attempts: {lesson.quiz.attemptsAllowed} •
                                                                    Questions: {lesson.quiz.questions?.length || 0}
                                                                </div>
                                                            </div>
                                                            {lesson.quiz.questions?.map((q, idx) => (
                                                                <div key={q._id} className={styles.questionItem}>
                                                                    <div className={styles.questionText}>
                                                                        {idx + 1}. {q.questionText}
                                                                    </div>
                                                                    <div className={styles.optionsList}>
                                                                        {q.options?.map((opt, optIdx) => (
                                                                            <div
                                                                                key={optIdx}
                                                                                className={`${styles.option} ${optIdx === q.correctOption ? styles.correctOption : ''}`}
                                                                            >
                                                                                <div className={styles.optionMarker}>
                                                                                    {String.fromCharCode(65 + optIdx)}
                                                                                </div>
                                                                                {opt}
                                                                                {optIdx === q.correctOption && (
                                                                                    <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>✓ Correct</span>
                                                                                )}
                                                                            </div>
                                                                        ))}

                                                                        {/* True/False Handling */}
                                                                        {q.type === 'true_false' && (
                                                                            <>
                                                                                <div className={`${styles.option} ${q.correctBoolean === true ? styles.correctOption : ''}`}>
                                                                                    True {q.correctBoolean === true && '✓'}
                                                                                </div>
                                                                                <div className={`${styles.option} ${q.correctBoolean === false ? styles.correctOption : ''}`}>
                                                                                    False {q.correctBoolean === false && '✓'}
                                                                                </div>
                                                                            </>
                                                                        )}

                                                                        {/* Fill Blank Handling */}
                                                                        {q.type === 'fill_blank' && (
                                                                            <div className={`${styles.option} ${styles.correctOption}`}>
                                                                                Correct Answer: <strong>{q.correctText}</strong>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {q.explanation && (
                                                                        <div style={{ marginTop: '16px', fontSize: '14px', color: '#4b5563', fontStyle: 'italic' }}>
                                                                            Explanation: {q.explanation}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Discussions Tab */}
            {activeTab === 'discussions' && (
                <div className={styles.section} style={{ padding: '24px' }}>
                    {course.discussions?.length === 0 ? (
                        <p style={{ color: '#6b7280', textAlign: 'center' }}>No discussions yet.</p>
                    ) : (
                        course.discussions.map(d => (
                            <div
                                key={d._id}
                                style={{
                                    borderBottom: '1px solid #e5e7eb',
                                    paddingBottom: '16px',
                                    marginBottom: '16px',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                                onClick={() => setSelectedDiscussionId(d._id)}
                                className={styles.discussionItem}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                                        <strong style={{ color: '#111827' }}>{d.userId?.fullName || 'Anonymous'}</strong>
                                        <span style={{ color: '#9ca3af' }}>{new Date(d.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteDiscussion(d._id, e)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            borderRadius: '4px'
                                        }}
                                        title="Delete Discussion"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                                <h4 style={{ margin: '0 0 4px', color: '#374151' }}>{d.title}</h4>
                                <p style={{ margin: 0, color: '#4b5563' }}>{d.content}</p>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Discussion Modal */}
            {selectedDiscussionId && (
                <DiscussionModal
                    discussionId={selectedDiscussionId}
                    isOpen={true}
                    onClose={() => {
                        setSelectedDiscussionId(null);
                        fetchCourseDetail(); // Refresh to show updates if any
                    }}
                    isEnrolled={true} // Admin can view everything
                    isReadOnly={true} // Admin views as read-only in modal
                    courseTeacherId={course.teacherId?._id}
                />
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className={styles.modalOverlay} onClick={() => setShowRejectModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Reject Course</h2>
                        <textarea
                            className={styles.textarea}
                            rows={4}
                            placeholder="Enter reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowRejectModal(false)}>Cancel</button>
                            <button className={styles.confirmRejectBtn} onClick={handleReject}>Confirm Rejection</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCourseDetail;
