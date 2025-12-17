import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useDiscussions } from '../../contexts/DiscussionContext.jsx';
import CommentForm from './CommentForm.jsx';
import styles from './CommentItem.module.css';

// Helper: Format time ago
const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const CommentItem = ({ comment, discussionId, depth = 0 }) => {
  const { user } = useAuth();
  const { toggleLikeComment, deleteComment, updateComment, createComment, fetchDiscussionDetail } = useDiscussions();
  
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.likes?.includes(user?._id) || false);

  const isOwner = user?._id === comment.userId._id;
  const isTeacher = user?.role === 'teacher';
  const canEdit = isOwner;
  const canDelete = isOwner || isTeacher;
  const maxDepth = 3; // Maximum nesting level
  const canReply = depth < maxDepth;

  const handleLike = () => {
    toggleLikeComment(comment._id);
    setIsLiked(!isLiked);
  };

  const handleReply = async (content) => {
    try {
      await createComment(discussionId, content, comment._id);
      setShowReplyForm(false);
      // Optimistic UI handles the update automatically
    } catch (error) {
      console.error('Reply failed:', error);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await updateComment(comment._id, editContent.trim());
      setShowEditForm(false);
      fetchDiscussionDetail(discussionId);
    } catch (error) {
      console.error('Edit failed:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteComment(comment._id);
      setShowDeleteConfirm(false);
      // Refresh discussion
      fetchDiscussionDetail(discussionId);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className={`${styles.commentItem} ${depth > 0 ? styles.nested : ''}`} style={{ '--depth': depth }}>
      <div className={styles.commentMain}>
        {/* Avatar */}
        <div className={styles.avatar}>
          {comment.userId?.fullName?.charAt(0).toUpperCase() || 'A'}
        </div>

        {/* Comment Content */}
        <div className={styles.commentContent}>
          {/* Header */}
          <div className={styles.commentHeader}>
            <div className={styles.authorInfo}>
              <span className={styles.authorName}>{comment.userId?.fullName || 'Anonymous'}</span>
              {comment.userId?.role === 'teacher' && (
                <span className={styles.teacherBadge}>Teacher</span>
              )}
              <span className={styles.dot}>•</span>
              <span className={styles.time}>{formatTimeAgo(comment.createdAt)}</span>
            </div>
            
            <div className={styles.actionIcons}>
              {canEdit && (
                <button 
                  className={styles.iconButton}
                  onClick={() => setShowEditForm(!showEditForm)}
                  title="Edit comment"
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
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete comment"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          {!showEditForm ? (
            <div className={styles.commentBody}>
              <p>{comment.content}</p>
            </div>
          ) : (
            <div className={styles.editForm}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={styles.editTextarea}
                rows="3"
              />
              <div className={styles.editActions}>
                <button className={styles.saveBtn} onClick={handleEdit}>Save</button>
                <button className={styles.cancelBtn} onClick={() => {
                  setShowEditForm(false);
                  setEditContent(comment.content);
                }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className={styles.commentFooter}>
            <button 
              className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
              onClick={handleLike}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M7 22V11M2 13v6c0 1.1.9 2 2 2h2.4c.5 0 .9-.2 1.2-.6l5.2-6.3c.5-.6.3-1.6-.4-2-.7-.4-1.5-.2-1.9.4L8 16V6c0-1.1.9-2 2-2h.5c.8 0 1.5.7 1.5 1.5v3.4c0 .5.2.9.6 1.2l3.4 2.6c.8.6 1 1.8.4 2.6l-3.9 5.2c-.3.4-.8.5-1.2.5H4c-1.1 0-2-.9-2-2z"/>
              </svg>
              <span>{comment.likesCount > 0 ? comment.likesCount : 'Like'}</span>
            </button>

            {canReply && user && (
              <button 
                className={styles.actionButton}
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Reply</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className={styles.replyFormContainer}>
              <CommentForm 
                onSubmit={handleReply}
                onCancel={() => setShowReplyForm(false)}
                parentId={comment._id}
                placeholder={`Reply to ${comment.userId.fullName}...`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className={styles.replies}>
          {comment.replies.map(reply => (
            <CommentItem 
              key={reply._id}
              comment={reply}
              discussionId={discussionId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3>Delete Comment</h3>
            <p>Are you sure you want to delete this comment? {comment.replies?.length > 0 && 'This will also delete all replies.'}</p>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-3)' }}>
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button className="btn btn-primary-admin" onClick={handleDelete} style={{ flex: 1 }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentItem;