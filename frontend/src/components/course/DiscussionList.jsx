import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiscussions } from '../../contexts/DiscussionContext.jsx';
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
  const { toggleLikeDiscussion } = useDiscussions();
  
  const handleLike = (e) => {
    e.stopPropagation();
    toggleLikeDiscussion(discussion._id);
  };

  return (
    <div 
      className={`${styles.discussionCard} ${discussion.isPinned ? styles.pinned : ''}`}
      onClick={() => onSelect(discussion._id)}
    >
      {discussion.isPinned && (
        <div className={styles.pinnedBadge}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
          </svg>
          Pinned
        </div>
      )}
      
      <div className={styles.cardHeader}>
        <h4 className={styles.title}>{discussion.title}</h4>
      </div>
      
      <div className={styles.cardContent}>
        <p className={styles.excerpt}>
          {discussion.content.substring(0, 120)}
          {discussion.content.length > 120 && '...'}
        </p>
      </div>
      
      <div className={styles.cardFooter}>
        <div className={styles.author}>
          <div className={styles.avatar}>
            {discussion.userId.fullName.charAt(0).toUpperCase()}
          </div>
          <div className={styles.authorInfo}>
            <span className={styles.authorName}>{discussion.userId.fullName}</span>
            <span className={styles.authorRole}>
              {discussion.userId.role === 'teacher' ? 'Teacher' : 'Student'}
            </span>
          </div>
          <span className={styles.time}>{formatTimeAgo(discussion.createdAt)}</span>
        </div>
        
        <div className={styles.stats}>
          <button 
            className={styles.statItem}
            onClick={handleLike}
            title="Like"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 22V11M2 13v6c0 1.1.9 2 2 2h2.4c.5 0 .9-.2 1.2-.6l5.2-6.3c.5-.6.3-1.6-.4-2-.7-.4-1.5-.2-1.9.4L8 16V6c0-1.1.9-2 2-2h.5c.8 0 1.5.7 1.5 1.5v3.4c0 .5.2.9.6 1.2l3.4 2.6c.8.6 1 1.8.4 2.6l-3.9 5.2c-.3.4-.8.5-1.2.5H4c-1.1 0-2-.9-2-2z"/>
            </svg>
            <span>{discussion.likesCount}</span>
          </button>
          
          <div className={styles.statItem}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{discussion.commentCount}</span>
          </div>
          
          <div className={styles.statItem}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
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
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Discussion
          </button>
        </div>
      </div>

      {discussions.length === 0 ? (
        <div className={styles.emptyState}>
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
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
                  <path d="M5 12h14M12 5l7 7-7 7"/>
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