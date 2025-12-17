import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDiscussions } from '../../contexts/DiscussionContext';
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

const DiscussionModal = ({ discussionId, isEnrolled, onClose, onEnroll }) => {
    const { user } = useAuth();
    const { currentDiscussion, fetchDiscussionDetail, createComment, loading: contextLoading } = useDiscussions();
    const [commentContent, setCommentContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (discussionId) {
            fetchDiscussionDetail(discussionId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [discussionId]);

    const discussion = currentDiscussion?.discussion;
    const comments = currentDiscussion?.comments || [];
    const loading = contextLoading;

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
                                <div className={styles.authorName}>{discussion.userId?.fullName || 'Anonymous'}</div>
                                <div className={styles.timestamp}>{formatTimeAgo(discussion.createdAt)}</div>
                            </div>
                        </div>
                        {discussion.isPinned && (
                            <span className={styles.pinnedBadge}>📌 Pinned</span>
                        )}
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
                                {comments.map((comment) => (
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
                                                    </div>
                                                    <div className={styles.commentTimestamp}>
                                                        {formatTimeAgo(comment.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.commentContent}>{comment.content}</div>
                                    </div>
                                ))}
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
                                <button onClick={onEnroll} className="btn btn-primary-student">
                                    Enroll Now
                                </button>
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
