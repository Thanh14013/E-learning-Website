import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiscussions } from '../../contexts/DiscussionContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './DiscussionList.module.css';

// Helper function: Format time ago
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

// Discussion Card Component
const DiscussionCard = ({ discussion, onSelect }) => {
  const { user } = useAuth();
  const { toggleLikeDiscussion, updateDiscussion, deleteDiscussion } = useDiscussions();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editTitle, setEditTitle] = useState(discussion.title);
  const [editContent, setEditContent] = useState(discussion.content);

  // Handle MongoDB ObjectId comparison - convert both to strings
  const isOwner = user?._id === discussion.userId?._id;
  const isTeacher = user?.role === 'teacher';
  const canEdit = isOwner || isTeacher;

  const handleLike = (e) => {
    e.stopPropagation();
    toggleLikeDiscussion(discussion._id);
  };

  const handleEdit = async (e) => {
    e.stopPropagation();
    if (!editTitle.trim() || !editContent.trim()) return;
    try {
      await updateDiscussion(discussion._id, { title: editTitle.trim(), content: editContent.trim() });
      setShowEditForm(false);
    } catch (error) {
      console.error('Edit failed:', error);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      await deleteDiscussion(discussion._id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div
      className={`${styles.discussionCard} ${discussion.isPinned ? styles.pinned : ''}`}
      onClick={() => !showEditForm && onSelect(discussion._id)}
    >
      {discussion.isPinned && (
        <div className={styles.pinnedBadge}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" />
          </svg>
          Pinned
        </div>
      )}

      <div className={styles.cardHeader}>
        <h4 className={styles.title}>{discussion.title}</h4>
        {canEdit && (
          <div className={styles.actionIcons}>
            <button
              className={styles.iconButton}
              onClick={(e) => { e.stopPropagation(); setShowEditForm(!showEditForm); }}
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              className={styles.iconButton}
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {!showEditForm ? (
        <div className={styles.cardContent}>
          <p className={styles.excerpt}>
            {discussion.content.substring(0, 120)}
            {discussion.content.length > 120 && '...'}
          </p>
        </div>
      ) : (
        <div className={styles.editForm} onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className={styles.editInput}
            placeholder="Title"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className={styles.editTextarea}
            placeholder="Content"
            rows="3"
          />
          <div className={styles.editActions}>
            <button className={styles.saveBtn} onClick={handleEdit}>Save</button>
            <button className={styles.cancelBtn} onClick={(e) => { e.stopPropagation(); setShowEditForm(false); setEditTitle(discussion.title); setEditContent(discussion.content); }}>Cancel</button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className={styles.deleteConfirm} onClick={(e) => e.stopPropagation()}>
          <p>Delete this discussion?</p>
          <div>
            <button className={styles.confirmBtn} onClick={handleDelete}>Delete</button>
            <button className={styles.cancelBtn} onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}>Cancel</button>
          </div>
        </div>
      )}

      <div className={styles.cardFooter}>
        <div className={styles.author}>
          <div className={styles.avatar}>
            {discussion.userId?.fullName?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className={styles.authorInfo}>
            <span className={styles.authorName}>{discussion.userId?.fullName || 'Anonymous'}</span>
            <span className={styles.authorRole}>
              {discussion.userId?.role === 'teacher' ? 'Teacher' : 'Student'}
            </span>
          </div>
          <span className={styles.time}>{formatTimeAgo(discussion.createdAt)}</span>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{discussion.commentCount}</span>
          </div>

          <div className={styles.statItem}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>{discussion.views}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component: Discussions List
const DiscussionsList = ({ courseId, onViewAll, limit = 5 }) => {
  const { discussions, loading, fetchDiscussionsByCourse } = useDiscussions();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchDiscussionsByCourse(courseId, { limit });
    }
  }, [courseId, fetchDiscussionsByCourse, limit]);

  const handleSelectDiscussion = (discussionId) => {
    navigate(`/discussions/${discussionId}`);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading discussions...</p>
      </div>
    );
  }

  return (
    <div className={styles.discussionsContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3>Course Discussions</h3>
          <span className={styles.count}>
            {discussions.length} {discussions.length === 1 ? 'discussion' : 'discussions'}
          </span>
        </div>
        <div className={styles.headerRight}>
          <button
            className="btn btn-primary-student"
            onClick={() => setShowCreateForm(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Discussion
          </button>
        </div>
      </div>

      {discussions.length === 0 ? (
        <div className={styles.emptyState}>
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <h4>No discussions yet</h4>
          <p>Be the first to start a discussion in this course!</p>
          <button
            className="btn btn-primary-student"
            onClick={() => setShowCreateForm(true)}
          >
            Create First Discussion
          </button>
        </div>
      ) : (
        <>
          <div className={styles.discussionsList}>
            {discussions.map(discussion => (
              <DiscussionCard
                key={discussion._id}
                discussion={discussion}
                onSelect={handleSelectDiscussion}
              />
            ))}
          </div>

          {onViewAll && (
            <div className={styles.viewAllContainer}>
              <button
                className="btn btn-outline"
                onClick={onViewAll}
              >
                View All Discussions
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DiscussionsList;