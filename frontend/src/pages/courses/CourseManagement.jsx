import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCourses } from '../../contexts/CoursesContext';
import api from '../../services/api';
import toastService from '../../services/toastService';
import styles from './CourseManagement.module.css';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    published: {
      label: 'Published',
      className: styles.statusPublished,
      icon: '✓',
    },
    pending: {
      label: 'Pending Review',
      className: styles.statusPending,
      icon: '⏳',
    },
    rejected: {
      label: 'Rejected',
      className: styles.statusRejected,
      icon: '❌',
    },
    draft: {
      label: 'Draft',
      className: styles.statusDraft,
      icon: '📝',
    },
    unpublished: {
      label: 'Unpublished',
      className: styles.statusUnpublished,
      icon: '⏸',
    },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={`${styles.statusBadge} ${config.className}`}>
      <span className={styles.statusIcon}>{config.icon}</span>
      {config.label}
    </span>
  );
};

// Course Card Component
const CourseManagementCard = ({ course, user, onEdit, onDelete, onAnalytics, onPreview }) => {
  const studentCount = course.enrolledStudents?.length || 0;

  let status = 'draft';
  if (course.isPublished) status = 'published';
  else if (course.approvalStatus === 'pending') status = 'pending';
  else if (course.approvalStatus === 'rejected') status = 'rejected';

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm(`Are you sure you want to delete the course "${course.title || course.name}"?`)) {
      try {
        await api.delete(`/teacher/courses/${course._id || course.id}`);
        toastService.success('Course deleted successfully');
        onDelete?.(course._id || course.id);
      } catch (error) {
        console.error('Failed to delete course:', error);
        toastService.error('Unable to delete course. Please try again.');
      }
    }
  };

  return (
    <div className={styles.courseCard}>


      {/* Course Image */}
      <div
        className={styles.cardImage}
        style={{ backgroundColor: course.color || '#ddd6fe' }}
      >
        {course.thumbnail && (
          <img src={course.thumbnail} alt={course.title || course.name} />
        )}
        <div className={styles.cardOverlay}>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Course Content */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>
          {course.title || course.name}
        </h3>

        {course.description && (
          <p className={styles.cardDescription}>
            {course.description.length > 100
              ? `${course.description.substring(0, 100)}...`
              : course.description}
          </p>
        )}

        {/* Course Stats */}
        <div className={styles.cardStats}>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>👥</span>
            {course.approvalStatus === 'pending' ? (
              <span className={styles.statValue} style={{ fontSize: '1rem', color: '#f59e0b' }}>Pending</span>
            ) : (
              <>
                <span className={styles.statValue}>{studentCount}</span>
                <span className={styles.statLabel}>Students</span>
              </>
            )}
          </div>
          {/* Rating Display Fixed */}
          {(course.rating > 0 || course.totalReviews > 0) && (
            <div className={styles.statItem}>
              <span className={styles.statIcon}>⭐</span>
              <span className={styles.statValue}>
                {typeof course.rating === 'number' ? course.rating.toFixed(1) : '0.0'}
              </span>
              <span className={styles.statLabel}>
                ({course.totalReviews || 0} reviews)
              </span>
            </div>
          )}
        </div>

        {/* Course Meta */}
        <div className={styles.cardMeta}>
          {course.category && (
            <span className={styles.metaTag}>{course.category}</span>
          )}
          {course.level && (
            <span className={styles.metaTag}>{course.level}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.cardActions}>
          {!course.isPublished && (
            <button
              className={`${styles.actionBtn} ${styles.editBtn}`}
              onClick={(e) => {
                e.preventDefault();
                onEdit?.(course);
              }}
              title="Edit"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}

          {course.isPublished && (
            <button
              className={`${styles.actionBtn} ${styles.analyticsBtn}`}
              onClick={(e) => {
                e.preventDefault();
                onAnalytics?.(course);
              }}
              title="Analytics"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </button>
          )}

          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={handleDelete}
            title={course.approvalStatus === 'approved' && user?.role !== 'admin' ? "Cannot delete approved course" : "Delete"}
            disabled={course.approvalStatus === 'approved' && user?.role !== 'admin'}
            style={{
              opacity: (course.approvalStatus === 'approved' && user?.role !== 'admin') ? 0.5 : 1,
              cursor: (course.approvalStatus === 'approved' && user?.role !== 'admin') ? 'not-allowed' : 'pointer',
              display: (course.approvalStatus === 'approved' && user?.role !== 'admin') ? 'none' : 'flex'
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
const CourseManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { myCourses, loading: coursesLoading } = useCourses();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [loading, setLoading] = useState(false);


  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    if (!Array.isArray(myCourses)) return [];

    let filtered = [...myCourses];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          (course.title || course.name || '').toLowerCase().includes(term) ||
          (course.description || '').toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((course) => {
        if (statusFilter === 'published') return course.isPublished === true;
        if (statusFilter === 'pending') return course.approvalStatus === 'pending';
        if (statusFilter === 'rejected') return course.approvalStatus === 'rejected';
        if (statusFilter === 'draft') return !course.isPublished && !course.approvalStatus;
        return true;
      });
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(
        (course) => course.category === categoryFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'students': {
          const aCount = a.enrolledStudents?.length || 0;
          const bCount = b.enrolledStudents?.length || 0;
          return bCount - aCount;
        }
        case 'rating': {
          const aRating = typeof a.rating === 'number' ? a.rating : (a.rating?.average || 0);
          const bRating = typeof b.rating === 'number' ? b.rating : (b.rating?.average || 0);
          return bRating - aRating;
        }
        case 'title':
          return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [myCourses, searchTerm, statusFilter, categoryFilter, sortBy]);

  // Get unique categories from courses
  const categories = useMemo(() => {
    if (!Array.isArray(myCourses)) return [];
    const cats = new Set();
    myCourses.forEach((course) => {
      if (course.category) cats.add(course.category);
    });
    return Array.from(cats).sort();
  }, [myCourses]);

  // Handle course actions
  const handleEdit = (course) => {
    navigate(`/teacher/courses/${course._id || course.id}/edit`);
  };

  const handleAnalytics = (course) => {
    navigate(`/teacher/courses/${course._id || course.id}/analytics`);
  };

  const handlePreview = (course) => {
    window.open(`/courses/${course._id || course.id}`, '_blank');
  };

  const handleDelete = () => {
    // Course will be removed from context automatically
    // Force refresh if needed
    window.location.reload();
  };



  // Check if user is a teacher
  useEffect(() => {
    if (user && user.role !== 'teacher' && user.role !== 'admin') {
      toastService.error('Only teachers can access this page');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Early return if not a teacher
  if (user && user.role !== 'teacher' && user.role !== 'admin') {
    return null;
  }



  const handleCreateCourse = () => {
    navigate('/teacher/courses/create');
  };

  // Loading state
  if (coursesLoading || loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Course Management</h1>
          <p className={styles.pageSubtitle}>
            Manage and track your courses
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.createBtn}
            onClick={handleCreateCourse}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create new course
          </button>
        </div>
      </div>



      {/* Filters & Search */}
      <div className={styles.filtersBar}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>



        <div className={styles.filtersGroup}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            className={styles.filterSelect}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="updated">Recently updated</option>
            <option value="created">Created date</option>
            <option value="students">Students</option>
            <option value="rating">Rating</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Course Stats Summary */}
      <div className={styles.statsSummary}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📚</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{myCourses?.length || 0}</div>
            <div className={styles.statLabel}>Total courses</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✓</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {myCourses?.filter((c) => c.isPublished).length || 0}
            </div>
            <div className={styles.statLabel}>Published</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {myCourses?.filter((c) => c.approvalStatus === 'pending').length || 0}
            </div>
            <div className={styles.statLabel}>Pending</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {myCourses?.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0) || 0}
            </div>
            <div className={styles.statLabel}>Total students</div>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <h3 className={styles.emptyTitle}>
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'No courses found'
              : 'No courses yet'}
          </h3>
          <p className={styles.emptyDescription}>
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try changing filters or search keywords'
              : 'Start by creating your first course now'}
          </p>
          {(!searchTerm && statusFilter === 'all' && categoryFilter === 'all') && (
            <button className={styles.emptyActionBtn} onClick={handleCreateCourse}>
              Create new course
            </button>
          )}
        </div>
      ) : (
        <div className={styles.courseGrid}>
          {filteredCourses.map((course) => (
            <CourseManagementCard
              key={course._id || course.id}
              course={course}
              user={user}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAnalytics={handleAnalytics}
              onPreview={handlePreview}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseManagement;

