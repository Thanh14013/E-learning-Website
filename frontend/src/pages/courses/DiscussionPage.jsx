import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiscussions } from '../../contexts/DiscussionContext.jsx';
import DiscussionForm from '../../components/course/DiscussionForm.jsx';
import styles from './DiscussionPage.module.css';

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

// Discussion Row Component
const DiscussionRow = ({ discussion, onClick }) => {
  const { toggleLikeDiscussion } = useDiscussions();

  const handleLike = (e) => {
    e.stopPropagation();
    toggleLikeDiscussion(discussion._id);
  };

  return (
    <div 
      className={`${styles.discussionRow} ${discussion.isPinned ? styles.pinned : ''}`}
      onClick={() => onClick(discussion._id)}
    >
      <div className={styles.mainContent}>
        <div className={styles.topLine}>
          {discussion.isPinned && (
            <span className={styles.pinnedBadge}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
              </svg>
              Pinned
            </span>
          )}
          <h3 className={styles.discussionTitle}>{discussion.title}</h3>
        </div>
        
        <p className={styles.discussionExcerpt}>
          {discussion.content.substring(0, 150)}
          {discussion.content.length > 150 && '...'}
        </p>
        
        <div className={styles.metadata}>
          <div className={styles.author}>
            <div className={styles.avatar}>
              {discussion.userId.fullName.charAt(0).toUpperCase()}
            </div>
            <span className={styles.authorName}>{discussion.userId.fullName}</span>
            {discussion.userId.role === 'teacher' && (
              <span className={styles.teacherBadge}>Teacher</span>
            )}
            <span className={styles.dot}>•</span>
            <span className={styles.time}>{formatTimeAgo(discussion.createdAt)}</span>
          </div>
        </div>
      </div>
      
      <div className={styles.stats}>
        <button 
          className={`${styles.statButton} ${styles.likeButton}`}
          onClick={handleLike}
          title="Like"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 22V11M2 13v6c0 1.1.9 2 2 2h2.4c.5 0 .9-.2 1.2-.6l5.2-6.3c.5-.6.3-1.6-.4-2-.7-.4-1.5-.2-1.9.4L8 16V6c0-1.1.9-2 2-2h.5c.8 0 1.5.7 1.5 1.5v3.4c0 .5.2.9.6 1.2l3.4 2.6c.8.6 1 1.8.4 2.6l-3.9 5.2c-.3.4-.8.5-1.2.5H4c-1.1 0-2-.9-2-2z"/>
          </svg>
          <span>{discussion.likesCount}</span>
        </button>
        
        <div className={styles.statItem}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>{discussion.commentCount}</span>
        </div>
        
        <div className={styles.statItem}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>{discussion.views}</span>
        </div>
      </div>
    </div>
  );
};

// Main Discussions Page Component
const DiscussionsPage = ({ courseId, courseName }) => {
  const { discussions, loading, pagination, fetchDiscussionsByCourse } = useDiscussions();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (courseId) {
      fetchDiscussionsByCourse(courseId, {
        page: currentPage,
        limit: 15,
        search: searchQuery,
        sortBy,
        order: sortOrder
      });
    }
  }, [courseId, currentPage, searchQuery, sortBy, sortOrder, fetchDiscussionsByCourse]);

  const handleNavigateToDiscussion = (discussionId) => {
    navigate(`/discussions/${discussionId}`);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchDiscussionsByCourse(courseId, { page: 1, limit: 15 });
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  return (
    <div className={styles.discussionsPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <div>
            <h1>Discussions</h1>
            {courseName && <p className={styles.courseName}>{courseName}</p>}
          </div>
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

        {/* Search & Filters */}
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              type="text"
              className="form-input"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className={styles.filters}>
            <button 
              className={`${styles.filterButton} ${sortBy === 'createdAt' ? styles.active : ''}`}
              onClick={() => handleSortChange('createdAt')}
            >
              Latest
              {sortBy === 'createdAt' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={sortOrder === 'desc' ? 'M7 10l5 5 5-5' : 'M7 14l5-5 5 5'}/>
                </svg>
              )}
            </button>
            
            <button 
              className={`${styles.filterButton} ${sortBy === 'likesCount' ? styles.active : ''}`}
              onClick={() => handleSortChange('likesCount')}
            >
              Popular
              {sortBy === 'likesCount' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={sortOrder === 'desc' ? 'M7 10l5 5 5-5' : 'M7 14l5-5 5 5'}/>
                </svg>
              )}
            </button>
            
            <button 
              className={`${styles.filterButton} ${sortBy === 'views' ? styles.active : ''}`}
              onClick={() => handleSortChange('views')}
            >
              Most Viewed
              {sortBy === 'views' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={sortOrder === 'desc' ? 'M7 10l5 5 5-5' : 'M7 14l5-5 5 5'}/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <DiscussionForm 
              courseId={courseId}
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {/* Discussions List */}
      <div className={styles.discussionsList}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading discussions...</p>
          </div>
        ) : discussions.length === 0 ? (
          <div className={styles.emptyState}>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h3>No discussions found</h3>
            <p>
              {searchQuery 
                ? `No results for "${searchQuery}". Try a different search term.`
                : 'Be the first to start a discussion!'
              }
            </p>
            {!searchQuery && (
              <button 
                className="btn btn-primary-student"
                onClick={() => setShowCreateForm(true)}
              >
                Create First Discussion
              </button>
            )}
          </div>
        ) : (
          <>
            {discussions.map(discussion => (
              <DiscussionRow 
                key={discussion._id}
                discussion={discussion}
                onClick={handleNavigateToDiscussion}
              />
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button 
                  className="btn btn-outline"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button 
                  className="btn btn-outline"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DiscussionsPage;