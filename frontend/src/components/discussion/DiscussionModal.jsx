
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDiscussions } from '../../contexts/DiscussionContext';
import { useConfirm } from '../../contexts/ConfirmDialogContext.jsx';
import toast from '../../services/toastService';
import styles from './DiscussionModal.module.css';

const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
};

const DiscussionModal = ({ discussionId, isOpen, onClose, isEnrolled, courseTeacherId, canDelete = false }) => {
    const { confirm } = useConfirm();
    const { user } = useAuth();
    const {
        currentDiscussion,
        fetchDiscussionDetail, createComment, updateComment, deleteComment, deleteDiscussion, loading: contextLoading } = useDiscussions();
    const [commentContent, setCommentContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        if (discussionId) {
            fetchDiscussionDetail(discussionId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [discussionId]);

    const discussion = currentDiscussion?.discussion;
    const comments = currentDiscussion?.comments || [];
    const loading = contextLoading;

    // Check permissions
    const isDiscussionOwner = user?._id === discussion?.userId?._id;
    const isCourseTeacher = user?._id === courseTeacherId;
    const isActiveAdmin = user?.role === 'admin';
    const canDeleteDiscussion = isDiscussionOwner || isActiveAdmin || canDelete;

    const handleDeleteDiscussion = async () => {
        const isConfirmed = await confirm('Are you sure you want to delete this discussion?', { type: 'danger', confirmText: 'Delete' });
        if (isConfirmed) {
            try {
                await deleteDiscussion(discussionId);
                onClose();
            } catch (error) {
                console.error('Failed to delete discussion:', error);
                // Toast handled in context
            }
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error('Please login to comment');
            return;
        }

        if (!isEnrolled) {
            toast.error('Please enroll in this course to comment');
            return;
        }

        if (!commentContent.trim()) {
            toast.error('Comment cannot be empty');
            return;
        }

        try {
            setSubmitting(true);
            // Use optimistic UI from context
            await createComment(discussionId, commentContent.trim());
            setCommentContent('');
        } catch (error) {
            console.error('Failed to add comment:', error);
            toast.error(error.response?.data?.message || 'Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.modalOverlay} onClick={onClose}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading discussion...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!discussion) {
        return null;
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h2>{discussion.title}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    {/* Discussion Info */}
                    <div className={styles.discussionInfo}>
                        <div className={styles.authorInfo}>
                            <div className={styles.avatar}>
                                {discussion.userId?.avatar ? (
                                    <img src={discussion.userId.avatar} alt={discussion.userId.fullName} />
                                ) : (
                                    <span>👤</span>
                                )}
                            </div>
                            <div>
                                <div className={styles.authorName}>
                                    {discussion.userId?.fullName || 'Anonymous'}
                                    {discussion.userId?._id === courseTeacherId && (
                                        <span className={styles.teacherBadge}>Teacher</span>
                                    )}
                                </div>
                                <div className={styles.timestamp}>{formatTimeAgo(discussion.createdAt)}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {canDeleteDiscussion && (
                                <button
                                    className={styles.iconButton}
                                    onClick={handleDeleteDiscussion}
                                    title="Delete Discussion"
                                    style={{ color: '#ef4444' }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            )}
                            {discussion.isPinned && (
                                <span className={styles.pinnedBadge}>📌 Pinned</span>
                            )}
                        </div>
                    </div>

                    {/* Discussion Content */}
                    <div className={styles.discussionContent}>
                        <p>{discussion.content}</p>
                    </div>

                    {/* Comments Section */}
                    <div className={styles.commentsSection}>
                        <h3>💬 {comments.length} {comments.length === 1 ? 'Reply' : 'Replies'}</h3>

                        {comments.length > 0 ? (
                            <div className={styles.commentsList}>
                                {comments.map((comment) => {
                                    const isOwner = user?._id === comment.userId?._id;
                                    const canEdit = isOwner;
                                    const canDelete = isOwner;
                                    const isEditing = editingCommentId === comment._id;

                                    return (
                                        <div key={comment._id} className={styles.commentItem}>
                                            <div className={styles.commentHeader}>
                                                <div className={styles.commentAuthor}>
                                                    <div className={styles.commentAvatar}>
                                                        {comment.userId?.avatar ? (
                                                            <img src={comment.userId.avatar} alt={comment.userId.fullName} />
                                                        ) : (
                                                            <span>👤</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className={styles.commentAuthorName}>
                                                            {comment.userId?.fullName || 'Anonymous'}
                                                            {comment.userId?._id === courseTeacherId && (
                                                                <span className={styles.teacherBadge}>Teacher</span>
                                                            )}
                                                        </div>
                                                        <div className={styles.commentTimestamp}>
                                                            {formatTimeAgo(comment.createdAt)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {(canEdit || canDelete) && (
                                                    <div className={styles.commentActions}>
                                                        {canEdit && (
                                                            <button
                                                                className={styles.iconButton}
                                                                onClick={() => {
                                                                    setEditingCommentId(comment._id);
                                                                    setEditContent(comment.content);
                                                                }}
                                                                title="Edit"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button
                                                                className={styles.iconButton}
                                                                onClick={async () => {
                                                                    const isConfirmed = await confirm('Delete this comment?');
                                                                    if (isConfirmed) {
                                                                        try {
                                                                            await deleteComment(comment._id);
                                                                            fetchDiscussionDetail(discussionId);
                                                                        } catch (error) {
                                                                            toast.error('Failed to delete comment');
                                                                        }
                                                                    }
                                                                }}
                                                                title="Delete"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {!isEditing ? (
                                                <div className={styles.commentContent}>{comment.content}</div>
                                            ) : (
                                                <div className={styles.editForm}>
                                                    <textarea
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        rows="3"
                                                    />
                                                    <div className={styles.editActions}>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await updateComment(comment._id, editContent);
                                                                    setEditingCommentId(null);
                                                                    fetchDiscussionDetail(discussionId);
                                                                    toast.success('Comment updated');
                                                                } catch (error) {
                                                                    toast.error('Failed to update comment');
                                                                }
                                                            }}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingCommentId(null)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className={styles.noComments}>No replies yet. Be the first to reply!</p>
                        )}
                    </div>

                    {/* Comment Form */}
                    {user ? (
                        isEnrolled ? (
                            <form className={styles.commentForm} onSubmit={handleCommentSubmit}>
                                <textarea
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    placeholder="Write your reply..."
                                    rows="3"
                                    disabled={submitting}
                                />
                                <button type="submit" disabled={submitting || !commentContent.trim()}>
                                    {submitting ? 'Posting...' : 'Post Reply'}
                                </button>
                            </form>
                        ) : (
                            <div className={styles.enrollPrompt}>
                                <p>You need to enroll in this course to comment</p>
                            </div>
                        )
                    ) : (
                        <div className={styles.loginPrompt}>
                            <p>Please login to comment</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscussionModal;
