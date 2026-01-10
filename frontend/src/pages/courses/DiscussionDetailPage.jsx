import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDiscussions } from '../../contexts/DiscussionContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import CommentItem from '../../components/course/CommentItem.jsx';
import CommentForm from '../../components/course/CommentForm.jsx';
import styles from './DiscussionDetail.module.css';
import extraStyles from './DiscussionDetailExtra.module.css';

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

const DiscussionDetailPage = ({ discussionId: propId }) => {
  const navigate = useNavigate();
  const { discussionId: paramId } = useParams();
  const discussionId = propId || paramId;

  const { user } = useAuth();
  const {
    currentDiscussion,
    loading,
    fetchDiscussionDetail,
    toggleLikeDiscussion,
    updateDiscussion,
    deleteDiscussion,
    createComment
  } = useDiscussions();

  const [isLiked, setIsLiked] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (discussionId) {
      fetchDiscussionDetail(discussionId);
    }
  }, [discussionId, fetchDiscussionDetail]);

  useEffect(() => {
    if (currentDiscussion?.discussion && user) {
      setIsLiked(currentDiscussion.discussion.likes?.includes(user._id) || false);
      setEditTitle(currentDiscussion.discussion.title || '');
      setEditContent(currentDiscussion.discussion.content || '');
    }
  }, [currentDiscussion, user]);

  const handleLike = () => {
    toggleLikeDiscussion(discussionId);
    setIsLiked(!isLiked);
  };

  const handleEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    try {
      await updateDiscussion(discussionId, { title: editTitle.trim(), content: editContent.trim() });
      setShowEditForm(false);
      fetchDiscussionDetail(discussionId);
    } catch (error) {
      console.error('Edit failed:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDiscussion(discussionId);
      navigate(-1);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleCommentSubmit = async (content) => {
    try {
      await createComment(discussionId, content);
      // No need to fetchDiscussionDetail - optimistic UI handles it
    } catch (error) {
      console.error('Comment failed:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading discussion...</p>
      </div>
    );
  }

  if (!currentDiscussion?.discussion) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  const { discussion, comments, totalComments } = currentDiscussion;
  const isOwner = user?.id === discussion.userId._id;
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  const canEdit = isOwner || isTeacher;
  const canDelete = isOwner || isTeacher || isAdmin;

  return (
    <div className={styles.discussionDetailPage}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Discussions
      </button>

      <div className={styles.discussionContainer}>
        <article className={styles.discussionContent}>
          <div className={styles.discussionHeader}>
            {discussion.isPinned && (
              <div className={styles.pinnedBadge}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" />
                </svg>
                Pinned by Teacher
              </div>
            )}

            <h1 className={styles.discussionTitle}>{discussion.title}</h1>

            <div className={styles.authorSection}>
              <div className={styles.avatar}>
                {discussion.userId?.fullName?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className={styles.authorInfo}>
                <div className={styles.authorName}>
                  {discussion.userId?.fullName || 'Anonymous'}
                  {discussion.userId?.role === 'teacher' && (
                    <span className={styles.teacherBadge}>Teacher</span>
                  )}
                </div>
                <div className={styles.postMeta}>
                  Posted {formatTimeAgo(discussion.createdAt)}
                  {discussion.updatedAt !== discussion.createdAt && (
                    <span> • Edited {formatTimeAgo(discussion.updatedAt)}</span>
                  )}
                </div>
              </div>

              <div className={styles.actions}>
                {canEdit && (
                  <button className="btn btn-ghost" title="Edit" onClick={() => setShowEditForm(!showEditForm)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button className="btn btn-ghost text-error" title="Delete" onClick={() => setShowDeleteConfirm(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>

          {!showEditForm ? (
            <div className={styles.discussionBody}>
              <div className="prose-content">
                {discussion.content.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          ) : (
            <div className={extraStyles.editForm}>
              <div className={extraStyles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={extraStyles.editInput}
                />
              </div>
              <div className={extraStyles.formGroup}>
                <label>Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className={extraStyles.editTextarea}
                  rows="8"
                />
              </div>
              <div className={extraStyles.editActions}>
                <button className="btn btn-primary" onClick={handleEdit}>Save Changes</button>
                <button className="btn btn-outline" onClick={() => {
                  setShowEditForm(false);
                  setEditTitle(discussion.title);
                  setEditContent(discussion.content);
                }}>Cancel</button>
              </div>
            </div>
          )}

          <div className={styles.discussionFooter}>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span>{discussion.views} views</span>
              </div>
              <div className={styles.stat}>
                <span>{totalComments} replies</span>
              </div>
            </div>

            <button className={`${styles.likeButton} ${isLiked ? styles.liked : ''}`} onClick={handleLike}>
              {isLiked ? 'Liked' : 'Like'} ({discussion.likesCount})
            </button>
          </div>
        </article>

        <div className={styles.commentsSection}>
          <h2 className={styles.commentsTitle}>{totalComments} Replies</h2>
          <CommentForm onSubmit={handleCommentSubmit} />
          <div className={styles.commentsList}>
            {comments.length === 0 ? (
              <div className={styles.noComments}><p>No replies yet.</p></div>
            ) : (
              comments.map(comment => (
                <CommentItem key={comment._id} comment={comment} discussionId={discussionId} />
              ))
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <h3>Delete Discussion</h3>
            <p>Are you sure?</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary-admin" onClick={handleDelete} style={{ flex: 1 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionDetailPage;